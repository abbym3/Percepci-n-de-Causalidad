import { ref, push } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { db } from "./firebase-init.js"; 

document.addEventListener("DOMContentLoaded", function () {  // Esperar a que todos los elementos del DOM estén completamente cargados

    if (!localStorage.getItem('currentUserId')) { location.replace('index.html'); return; }
    
    // ==============================
    // CONFIGURACIÓN Y VARIABLES
    // ==============================

    // Constantes de probabilidad
    let HUMANDIE = 6;
    let MACHINEDIE = 18;

    // Demora
    let demora = [0];
    let j = 0; // Índice de la demora actual

    // Worker
    const worker = new Worker("timerWorker.js"); // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz
    
    // Elementos DOM
    const gameScreen = document.getElementById("GameScreen");
    const shootbutton = document.getElementById("shootButton"); 
    const weaponRight = document.getElementById("weaponRight");
    const leftButton = document.getElementById("ceButtonLeft");
    const rightButton = document.getElementById("ceButtonRight");
    const pato = document.getElementById("pato");
    const testScreen = document.getElementById("TestScreen");
    const resultsScreen = document.getElementById("ResultsScreen");
    const resultsHead = document.getElementById("resultsHead");
    const resultsText = document.getElementById("resultsText");
    const instructionsScreen = document.getElementById("InstructionsScreen");
    
    // Estado del experimento
    let trainingTime = 0;           // Tiempo total de entrenamiento (s, con 3 decimales)
    let i = 0;                      // Índice del bloque de 10s actual
    let shotsPer10sInterval = [];   // Disparos por cada bloque de 10s
    let canTriggerCE = true;        // Solo si es true se pueden disparar CEI/CED nuevos

    // Contadores de interacción
    let shotCount = 0;        // Disparos en el bloque actual
    let numberClicks = 0;     // Total de clics al boton central
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

    // Marcas de tiempo / filas de guardado
    let gameStartTime = 0;
    let animationTime = 0;
    let shootingTime = ['CTR'];
    let CEDTime = ['CED'];
    let CEITime = ['CEI'];
    let answerTime = ['ANS'];
    let punishReinforceTime = ['RB'];

    // ==============================
    // TIEMPO
    // ==============================
    function getTrainingTime(){
        trainingTime = (((performance.now() - gameStartTime)-animationTime)/1000).toFixed(3);
        return trainingTime;
    }
    
    function iniciarJuego() {
        worker.postMessage('reset');
        gameStartTime = performance.now(); // Marca el inicio real del juego
        console.log("Inicio de juego:", gameStartTime)
        saveNextLine(['IDJ', new Date().toLocaleString()]);
        showScreen(gameScreen);
    }

    setTimeout(iniciarJuego, 9000); // Arranca el juego a los 9 segundos

    // ==============================
    // PROBABILIDAD
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
        if (!canTriggerCE) return;
        machineTryCount ++;
        const p = Math.floor(Math.random() * MACHINEDIE) + 1; // La probailidad de que la máquina haga un CEI es de 1/MACHINDIE
        // console.log(`Calculo p_machine: ${p}`)
        if (p === 2) { 
            CEI();
        }
    }

    function p_tick_human(){
        if (!canTriggerCE) return;
        const p = Math.floor(Math.random() * HUMANDIE) + 1; // La probailidad de que el humano provoque un CED de 1/HUMANDIE
        if (p === 1) { 
            CED();
        }
    }

    // ==============================
    // LÓGICA CEI/CED
    // ==============================

    function CEI() {
        countCEI++;
        console.log("¡Cambio de estímulo independiente activado!");
        correctColor = 'red';
        activateCE(1);
    }

    function CED() {
        countCED++;
        console.log("¡Cambio de estímulo dependiente activado!");
        correctColor = 'green';
        activateCE(0);
    }

    function activateCE(CE){
        trainingTime = getTrainingTime();
        if (CE === 0){
            CEDTime.push(trainingTime)
            saveNextLine(CEDTime);
            CEDTime = ['CED']
        }
        if (CE === 1){
            CEITime.push(trainingTime)
            saveNextLine(CEITime);
            CEITime = ['CEI']
        }
        worker.postMessage("pause");
        canTriggerCE = false;

        setTimeout(() => {
            shootbutton.disabled = true;
            pato.classList.add("fall-back"); 
         }, demora[j])
        
        //Verifica la duración de la animación y descuentala al tiempo de entrenameinto
        const onAnimEnd = (ev) => { 
            if (ev.animationName !== 'duckImpactAnimation') return;
            animationTime += ev.elapsedTime * 1000; 
            showScreen(testScreen); 
            assignRandomColors(); 
        };
        pato.addEventListener('animationend', onAnimEnd, { once: true });
    }

    function assignRandomColors() {

        leftButton.classList.remove("green", "red");
        rightButton.classList.remove("green", "red");

        buttonColorConfig = Math.random() > 0.5 ? 1 : 0;

        if (buttonColorConfig === 0) {
            leftButton.classList.add("green"); leftButton.textContent = "Yo";
            rightButton.classList.add("red"); rightButton.textContent = "Maquina";
        } else {
            leftButton.classList.add("red"); leftButton.textContent = "Maquina";
            rightButton.classList.add("green"); rightButton.textContent = "Yo";
        }
    }

    // ================================
    // TICKS DEL WORKER
    // ================================

    function handle100msTick(){
        console.log(`W:100ms|P:${getTrainingTime()}s`);//(`W:100ms|P:${getTrainingTime()}`);
        if(i > 0 && typeof shotsPer10sInterval[i - 1] === "number"){  // Para ejecutar adjustP1BasedOnClicks se debe tener registrado el número de clicks en el primer intervalo de 10s (i>0)
            adjustP1BasedOnClicks(shotsPer10sInterval[i - 1]); 
        }
        
    }

    function handle10sTick(){
        console.log(`---Intervalo ${i}: Disparos = ${shotCount}---`);
        //console.log('Han pasado 10s');
        shotsPer10sInterval[i] = shotCount; //Se guarda el número de disparos del intarvalo de 10 segundos en el indice i        
        //console.log(`Número de clics en intervalo anterior: ${shotsPer10sInterval[i]}`);
        shotCount = 0; //Reiniciamos el contador de disparos 
        i ++; //Avanzamos el indice para almacenar el numero de disparos del siguiente intervalo de 10s
    }

    // ================================
    // LÓGICA DE TICKS DEL USUARIO
    // ================================

    function handleTickClick(){
        if(i > 0 && typeof shotsPer10sInterval[i - 1] === "number"){  // Para ejecutar p_tick_human se debe tener registrado el número de clicks en el primer intervalo de 10s (i>0)
            p_tick_human();
        }
    }

    // ==============================
    // GESTIÓN DE CLIC EN TEST
    // ==============================

    function getSelectedColor(selectedButton, buttonColorConfig) { 
        const isGreen = (buttonColorConfig === 0 && selectedButton === 0) || //Si la configuración es verde izquerda y rojo derecha y pulsa izquierda (verde)
                        (buttonColorConfig === 1 && selectedButton === 1); //si la configuración es rojo izquerda y verde derecha y pulsa derecha (verde)
        return isGreen ? "green" : "red";
    }

    function isCorrectResponse(selectedButton, correctColor, buttonColorConfig) {
        const correctButton = (correctColor === 'green') ?  // ¿Es CED (verde correcto)?
            (buttonColorConfig === 0 ? 0 : 1) : // Si es CED: ¿Verde está en izquierda (0)? Si sí, correcto = 0 (izquierda), si no correcto = 1(derecha)
            (buttonColorConfig === 0 ? 1 : 0); // Si es CEI (rojo correcto): ¿Verde está en izquierda (0)? Si sí, correcto = 1 (derecha), si no correcto = 0 (izquierda) 
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

        trainingTime = getTrainingTime();

        answerTime.push(trainingTime);
        answerTime.push(lado === "left" ? "Izquierda":"Derecha");
        answerTime.push(color === "red"? "Rojo":"Verde")
        answerTime.push(isCorrect? "Acierto": "Error")
        saveNextLine(answerTime);
        answerTime = ['ANS'];

        // Sumar contados de aciertos o errores
        isCorrect ? successes++ : errors++;
        isCorrect ? reinforce() : punish();
    }

    // ==============================
    // RESULTADOS
    // ==============================

    function calculate_average(){
        score = countCED + countCEI;
        average = score > 0 ? Math.round((successes/score) * 100) : 0;
    }

    function reinforce() {
        calculate_average();
        showResults(true);
    }

    function punish() {
        calculate_average();
        showResults(false);
    }

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

    function showResults(isCorrect){
        
        // Guardado de datos
        trainingTime = getTrainingTime();
        punishReinforceTime.push(isCorrect?";R+":";BO");
        punishReinforceTime.push(trainingTime);
        saveNextLine(punishReinforceTime);
        punishReinforceTime = ['RB']

        // Preparar el botón y el pato para cuando se muestre la pantalla de juego
        shootbutton.disabled = false;
        pato.classList.remove("fall-back");

        // Ocultar la pantalla de test y mostrar la de resultados
        showScreen(resultsScreen);
        
        // Poner el texto de si es acierto o error
        resultsHead.textContent = isCorrect? "CORRECTO!":"INCORRECTO!";
        resultsHead.style.color = isCorrect? "green":"red";
        resultsText.textContent =  "";

        setTimeout(() => {
            resultsHead.textContent = "RESULTADOS";
            resultsHead.style.color = "Blue";
            resultsText.textContent = getResultText(isCorrect, average, score);
        }, 2000)

        if(score < 150){
            setTimeout(() => {
                canTriggerCE = true;
                worker.postMessage("resume");
                showScreen(gameScreen);
            }, 4500);
        } else{
            setTimeout(() => {
                saveFinalData();
                resultsText.textContent = "";
                resultsHead.textContent = "Gracias!!"
            }, 4500);
        }    
    }

    // ==============================
    // PANTALLAS Y UI
    // ==============================
    
    function guns_animation(){
        weaponRight.classList.add("retroceso_derecha");

        setTimeout(() => {
            weaponRight.classList.remove("retroceso_derecha");
        }, 100); // Duración del retroceso
    }

    function showScreen(pantalla) {
        instructionsScreen.classList.remove("ScreenOn");
        resultsScreen.classList.remove("ScreenOn");
        gameScreen.classList.remove("ScreenOn");
        testScreen.classList.remove("ScreenOn");
        pantalla.classList.add("ScreenOn");
    }

    
    // ==============================
    // ALMACENAMIENTO FB
    // ==============================

    function saveFinalData(){
        saveNextLine(['FDJ', new Date().toLocaleString()]);
        saveNextLine(['RTBC', numberClicks]); // Respuestas totales al boton central
        saveNextLine(['PTM', machineTryCount]); // Pulsos totales máquina
        saveNextLine(['A', successes]); // Aciertos
        saveNextLine(['E', errors]); // Errores
        saveNextLine(['TCED', countCED]); // Total CED
        saveNextLine(['TCEI', countCEI]); // Total CEI
        saveNextLine(['VI', leftClicks]); // Veces que eligio izquierda
        saveNextLine(['VD', rightClicks]); // Veces que eligio derecha
        saveNextLine(['VV', greenClicks]);  // Veces que eligio verde
        saveNextLine(['VR', redClicks]); // Veces que eligio rojo
        syncLocalBackups();
    }

    function backupLocally(contentArray) {
        const backups = JSON.parse(localStorage.getItem("localBackups") || "[]");
        backups.push(contentArray);
        localStorage.setItem("localBackups", JSON.stringify(backups));
    }

    function syncLocalBackups() {
        const userId = getCurrentUserId();
        if (!userId) return;

        const listRef = ref(db, `participantes/${userId}`);
        const backups = JSON.parse(localStorage.getItem("localBackups") || "[]");

        backups.forEach((entry) => {
            push(listRef, entry)
            .then(() => {
                //console.log("Backup sincronizado:", entry);
            })
            .catch((error) => {
                //console.error("Error al sincronizar backup:", error);
            });
        });

        localStorage.removeItem("localBackups"); // Limpiar después de sincronizar
    }

    function getCurrentUserId() {
        const id = localStorage.getItem("currentUserId");
        return id;
    }

    function saveNextLine(contentArray) {
        const userId = getCurrentUserId();
        if (!userId) return;
        const listRef = ref(db, `participantes/${userId}`);
        push(listRef, contentArray)
            //.then(() => console.log("Guardado con push:", contentArray))
            .catch((error) => {
                console.error("Error al guardar en Firebase:", error);
                backupLocally(contentArray); // Guardar localmente si falla
            });
    }

    // ==============================
    // EVENTOS DEL WORKER
    // ==============================

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
    // EVENTOS DE USUARIO
    // ==============================

    shootbutton.addEventListener("click", function () {
        shotCount ++;
        numberClicks ++;
        trainingTime = getTrainingTime();
        shootingTime.push(trainingTime)
        saveNextLine(shootingTime);
        shootingTime = ['CTR'];
        guns_animation();
        handleTickClick();
    });

    leftButton.addEventListener("click", () => handleCEClick(0));
    rightButton.addEventListener("click", () => handleCEClick(1));

});