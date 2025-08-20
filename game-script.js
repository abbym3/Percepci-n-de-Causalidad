import { ref, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { db } from "./firebase-init.js"; 

document.addEventListener("DOMContentLoaded", function () {  // Esperar a que todos los elementos del DOM estén completamente cargados

    // ==============================
    // 1. CONFIGURACIÓN Y VARIABLES
    // ==============================
    
    // Worker
    const worker = new Worker("timerWorker.js"); // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz
    
    // Elementos DOM
    const shootbutton = document.getElementById("shootButton"); 
    const weaponLeft = document.getElementById("weaponLeft");
    const weaponRight = document.getElementById("weaponRight");
    const leftButton = document.getElementById("ceButtonLeft");
    const rightButton = document.getElementById("ceButtonRight");
    const pato = document.getElementById("pato");

    // Estado del experimento
    let trainingTime = 0;     // Tiempo total de entrenamiento (ms)
    let i = 0;                // Índice del bloque de 10s actual
    let shotsPer10sInterval = []; // Disparos por cada bloque de 10s

    // Contadores de interacción
    let shotCount = 0;        // Disparos en el bloque actual
    let number_clicks = 0;    // Total de clics al boton central
    let greenClicks = 0;      // Respuestas verdes totales
    let redClicks = 0;        // Respuestas rojas totales
    let leftClicks = 0;       // Respuestas izquierda totales
    let rightClicks = 0;      // Respuestas derecha totales
    let successes = 0;        // Respuestas correctas totales
    let errors = 0;           // Respuestas incorrectas totales

    // Contadores de CE
    let countCED = 0;         // Cambios de estímulo dependientes (humano)
    let countCEI = 0;         // Cambios de estímulo independientes (máquina)
    let machineTryCount = 0;  // Intentos de la máquina para generar CEI

    // Configuración de estímulo actual
    let buttonColorConfig = null; // 0 = verde-izq, 1 = verde-der
    let correctColor = null;      // 'green' o 'red' según tipo de CE

    // Métricas globales
    let score = 0;            // Total de CE (CED + CEI)
    let average = 0;          // Porcentaje de aciertos
    let resultText = "";      // Texto mostrado en resultados

    // Indice de almacenamiento 
    let currentLineNumber = 1; // Empieza en 1 porque el 0 ya está ocupado


    let gameStartTime = null;
    let shootingTime = ['Centro'];
    let CEDTime = ['CED'];
    let CEITime = ['CEI'];
    let answerTime = [];
    let punishReinforceTime = [];

    // ==============================
    // 2. FUNCIONES DE PROBABILIDAD
    // ==============================

    function adjustP1BasedOnClicks(prevShots) {
        if (prevShots === 0) { 
            return; // Si no hubo clics, no se ajusta la probabilidad
        } else {
            const p1 = Math.floor((100 / prevShots * Math.random()) + 1); //La probabilidad se ajusta al número de clics del intervalo de 10s anterior 
            // console.log(`Ajuste_P1: ${p1}`)
            if (p1 === 1) { 
                p_tick_machine() // Si la p1 = 1, se procede a calcular si la máquina hace CEI
            }
        }
    }

    function p_tick_machine(){
        machineTryCount ++;
        const p = Math.floor(Math.random() * 18) + 1; // La probailidad de que la máquina haga un CEI es de 1/18
        // console.log(`Calculo p_machine: ${p}`)
        if (p === 2) { 
            CEI();
        }
    }

    function p_tick_human(){
        const p = Math.floor(Math.random() * 6) + 1; // La probailidad de que el humano provoque un CED de 1/6
        // console.log(`Calculo p_human: ${p}`)
        if (p === 1) { 
            CED();
        }
    }

    // ==============================
    // 3. LÓGICA CEI/CED
    // ==============================

    function CEI() {
        countCEI++;
        console.log("¡Cambio de estímulo independiente activado!");
        correctColor = 'green';
        activateCE(1);
    }

    function CED() {
        countCED++;
        console.log("¡Cambio de estímulo dependiente activado!");
        correctColor = 'red';
        activateCE(0);
    }

    function activateCE(CE){
        waitUpdatedTime((trainingTime) => {
            //console.log(`W:${trainingTime}|R:${(performance.now()-gameStartTime).toFixed(1)}`);
            if (CE === 0){
                CEDTime.push((trainingTime/1000).toFixed(1))
                if(CEDTime.length === 6){
                    saveNextLine(CEDTime);
                    CEDTime = ['CED']
                }//else console.log(CEDTime)
            }
            if (CE === 1){
                CEITime.push((trainingTime/1000).toFixed(1))
                if(CEITime.length === 6){
                    saveNextLine(CEITime);
                    CEITime = ['CEI']
                }//else console.log(CEITime)
            }
        });
        worker.postMessage("pause")
        shootbutton.disabled = true;
        pato.classList.add("fall-back");

        setTimeout(() => {
            // Desactivar pantalla de juego y pasar a la pantalla de test
            document.getElementById("GameScreen").classList.remove("ScreenOn");
            document.getElementById("TestScreen").classList.add("ScreenOn");

            assignRandomColors(); //Asignar colores aleatorios
        }, 2000);
    }

    function assignRandomColors() {

        leftButton.classList.remove("green", "red");
        rightButton.classList.remove("green", "red");

        buttonColorConfig = Math.random() > 0.5 ? 1 : 0;

        if (buttonColorConfig === 0) {
            leftButton.classList.add("green"); leftButton.textContent = "Maquina";
            rightButton.classList.add("red"); rightButton.textContent = "Yo";
        } else {
            leftButton.classList.add("red"); leftButton.textContent = "Yo";
            rightButton.classList.add("green"); rightButton.textContent = "Maquina";
        }
    }

    // ================================
    // 4. LÓGICA DE TICKS DEL WORKER
    // ================================

    function handle100msTick(){
        //console.log('Han pasado 100 ms');
        if(i > 0 && typeof shotsPer10sInterval[i - 1] === "number"){  // Para ejecutar adjustP1BasedOnClicks se debe tener registrado el número de clicks en el primer intervalo de 10s (i>0)
            adjustP1BasedOnClicks(shotsPer10sInterval[i - 1]); 
        }
        
    }

    function handle10sTick(){
        console.log(`-----------Intervalo ${i}: Disparos = ${shotCount}--------------`);
        //console.log('Han pasado 10s');
        shotsPer10sInterval[i] = shotCount; //Se guarda el número de disparos del intarvalo de 10 segundos en el indice i        
        //console.log(`Número de clics en intervalo anterior: ${shotsPer10sInterval[i]}`);
        shotCount = 0; //Reiniciamos el contador de disparos 
        i ++; //Avanzamos el indice para almacenar el numero de disparos del siguiente intervalo de 10s
    }

    // ================================
    // 5. LÓGICA DE TICKS DEL USUARIO
    // ================================

    function handleTickClick(){
        if(i > 0 && typeof shotsPer10sInterval[i - 1] === "number"){  // Para ejecutar p_tick_human se debe tener registrado el número de clicks en el primer intervalo de 10s (i>0)
            p_tick_human();
        }
    }

    // ==============================
    // 6. GESTIÓN DE CLIC EN TEST
    // ==============================

    function getSelectedColor(selectedButton, buttonColorConfig) { 
        const isGreen = (buttonColorConfig === 0 && selectedButton === 0) || //Si la configuración es verde izquerda y rojo derecha y pulsa izquierda (verde)
                        (buttonColorConfig === 1 && selectedButton === 1); //si la configuración es rojo izquerda y verde derecha y pulsa derecha (verde)
        return isGreen ? "green" : "red";
    }

    function isCorrectResponse(selectedButton, correctColor, buttonColorConfig) {
        const correctButton = (correctColor === 'green') ?  // ¿Es CEI (verde correcto)?
            (buttonColorConfig === 0 ? 0 : 1) : // Si es CEI: ¿Verde está en izquierda (0)? Si sí, correcto = 0 (izquierda), si no correcto = 1(derecha)
            (buttonColorConfig === 0 ? 1 : 0); // Si es CED (rojo correcto): ¿Verde está en izquierda (0)? Si sí, correcto = 1 (derecha), si no correcto = 0 (izquierda) 
        return selectedButton === correctButton;
    }

    function handleCEClick(selectedButton) {
        // Lado y color que el jugador pulsó
        const lado = selectedButton === 0 ? "left" : "right";
        const color = getSelectedColor(selectedButton, buttonColorConfig)

        // Sumar contadores de color y lado
        color === "green"? greenClicks++ : redClicks++;
        lado === "left"? leftClicks++ :rightClicks++;

        // Determinar acierto o error
        const isCorrect = isCorrectResponse(selectedButton, correctColor, buttonColorConfig);

        waitUpdatedTime((trainingTime) => {
            //console.log(`W:${trainingTime}|R:${(performance.now()-gameStartTime).toFixed(1)}`);
            answerTime = [(trainingTime/1000).toFixed(1), lado === "left" ? "Izquierda":"Derecha" , color === "red"? "Rojo":"Verde", isCorrect? "Acierto": "Error"]
            saveNextLine(answerTime);
            answerTime = []
        });

        // Sumar contados de aciertos o errores
        isCorrect ? successes++ : errors++;
        isCorrect ? reinforce() : punish();
    }

    function calculate_average(){
        score = countCED + countCEI
        average = Math.round((successes/score)*100)
    }

    function reinforce() {
        calculate_average();
        showResultsScreen(true);
    }

    function punish() {
        calculate_average();
        showResultsScreen(false);
    }

    // ==============================
    // 7. PANTALLAS Y UI
    // ==============================

    function getResultText(isCorrect, average, score) {
        if (average === 100 || average === 0) {
            return `Tienes un ${average}% de aciertos`;
        }

        if (score >= 150) {
            return `Tu porcentaje de aciertos total fue del ${average}%`;
        }

        return isCorrect ?
            `Tu porcentaje de aciertos aumentó al ${average}%` :
            `Tu porcentaje de aciertos bajó al ${average}%`;
    }

    function showResultsScreen(isCorrect){

        waitUpdatedTime((trainingTime) => {
            //console.log(`W:${trainingTime}|R:${(performance.now()-gameStartTime).toFixed(1)}`);
            punishReinforceTime = [isCorrect?";R+":";BO",(trainingTime/1000).toFixed(1)]
            saveNextLine(punishReinforceTime);
            punishReinforceTime = []
        });

        //Preparar el botón y el pato para cuando se muestre la pantalla de juego
        shootbutton.disabled = false;
        pato.classList.remove("fall-back");

        // Ocultar la pantalla de test y mostrar la de resultados
        document.getElementById("TestScreen").classList.remove("ScreenOn");
        document.getElementById("ResultsScreen").classList.add("ScreenOn");

        // Poner el texto del resultado
        resultText = getResultText(isCorrect, average, score);

        document.getElementById("resultsText").textContent = resultText;

        if(score < 150)
            setTimeout(showGameScreen, 2500);
        else{
            setTimeout(() => {
                saveNextLine(['Respuestas totales al boton central', number_clicks]);
                saveNextLine(['Pulsos totales máquina', machineTryCount]);        
                saveNextLine(['Aciertos', successes]);
                saveNextLine(['Errores', errors]);
                saveNextLine(['Total CED', countCED]);
                saveNextLine(['Total CEI', countCEI]);
                saveNextLine(['Veces que eligio izquierda', leftClicks]);
                saveNextLine(['Veces que eligio derecha', rightClicks]);
                saveNextLine(['Veces que eligio verde', greenClicks]);
                saveNextLine(['Veces que eligio izquierda', redClicks]);
                resultText = getResultText(isCorrect, average, score);
                document.getElementById("resultsText").textContent = resultText;
                document.getElementById("resultHead").textContent = "Gracias!!"
            }, 3500);
        }    
    }

    function showGameScreen() {
        worker.postMessage("resume")
        document.getElementById("InstructionsScreen").classList.remove("ScreenOn")
        document.getElementById("ResultsScreen").classList.remove("ScreenOn");
        document.getElementById("GameScreen").classList.add("ScreenOn");
        correctColor = null;
        buttonColorConfig = null;
    }

    function guns_animation(){
        weaponLeft.classList.add("retroceso_izquierda");
        weaponRight.classList.add("retroceso_derecha");

        setTimeout(() => {
            weaponLeft.classList.remove("retroceso_izquierda");
            weaponRight.classList.remove("retroceso_derecha");
        }, 100); // Duración del retroceso
    }

    
    // ==============================
    // 8. ALMACENAMIENTO FB
    // ==============================
    function getCurrentUserId() {
        const id = localStorage.getItem("currentUserId");
        //console.log("ID del participante encontrado:", id);
        return id;
    }
    //window.getCurrentUserId = getCurrentUserId;

    function saveNextLine(contentArray) {
        const userId = getCurrentUserId();
        if (!userId) return;

        const lineRef = ref(db, `participantes/${userId}/${currentLineNumber}`);
        set(lineRef, contentArray)
            .then(() => {
                //console.log(`Renglón ${currentLineNumber} guardado:`, contentArray);
                currentLineNumber++; // Solo si se guarda correctamente
            })
            .catch((error) => console.error(`Error al guardar renglón ${currentLineNumber}:`, error));
    }

    // ==============================
    // 9. EVENTOS DEL WORKER
    // ==============================

    function waitUpdatedTime(callback) {
        const handler = (e) => {
            if (e.data.type === 'time') {
                trainingTime = e.data.value;
                worker.removeEventListener('message', handler);
                callback(trainingTime);
            }
        };
        worker.addEventListener('message', handler);
        worker.postMessage('get_time');
    }

    worker.onmessage = function (e) {
        switch (typeof e.data === "object" ? e.data.type : e.data){
            case '100 ms':
                handle100msTick();
                break;
            case '10 s':
                handle10sTick();
                break;
        }
    };

    // ==============================
    // 10. EVENTOS DE USUARIO
    // ==============================

    shootbutton.addEventListener("click", function () {
        shotCount ++;
        number_clicks ++;
        waitUpdatedTime((trainingTime) => {
            //console.log(`W:${trainingTime}|R:${(performance.now()-gameStartTime).toFixed(1)}`);
            shootingTime.push((trainingTime/1000).toFixed(1))
            if(shootingTime.length === 11){ //Cada 10 disparos guardamos los tiempos
                saveNextLine(shootingTime);
                shootingTime = ['Centro'];
            }
        });
        guns_animation();
        handleTickClick();
    });

    leftButton.addEventListener("click", () => handleCEClick(0));
    rightButton.addEventListener("click", () => handleCEClick(1));

    // ==============================
    // 11. Sincronización de relojes
    // ==============================

    function iniciarJuego() {
        worker.postMessage('reset');
        gameStartTime = performance.now(); // Marca el inicio real del juego
        saveNextLine(['Inicio del juego', Date().toString()]);
        showGameScreen('GameScreen');
    }

    //
    setTimeout(iniciarJuego, 9000); // Arranca el juego a los 9 segundos

});