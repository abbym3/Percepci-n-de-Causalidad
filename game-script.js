document.addEventListener("DOMContentLoaded", function () {  // Esperar a que todos los elementos del DOM estén completamente cargados


    // ==============================
    // 1. CONFIGURACIÓN Y VARIABLES
    // ==============================
    
    // ---- Worker ----
    const worker = new Worker("timerWorker.js"); // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz
    
    // ---- Elementos DOM ----
    const shootbutton = document.getElementById("shootButton"); 
    const weaponLeft = document.getElementById("weaponLeft");
    const weaponRight = document.getElementById("weaponRight");
    const leftButton = document.getElementById("ceButtonLeft");
    const rightButton = document.getElementById("ceButtonRight");
    const pato = document.getElementById("pato");

    // ---- Contadores ----
    let machineTryCount = 0;      //Número de intentos de la máquina por generar un CEI
    let shotCount = 0;            //Número de disparos (clicks al boton central)
    let shotsPer10sInterval = []; //Arreglo que permite guardar el número de disparos cada 10 segundos 
    let i = 0;                    //i guarda la cantidad de disparos en intervalo n de 10s  
    
    // ---- Configuración de CE ----
    let buttonColorConfig = null;   // Guardará 0 (verde-izq) o 1 (verde-der)
    let correctColor = null;        // 'green' o 'red' según el tipo de CE
    
    // ---- Métricas ----
    let greenClicks = 0, redClicks = 0; 
    let leftClicks = 0, rightClicks = 0; 
    let successes = 0, errors = 0;
    let number_clicks = 0, countCED = 0, countCEI = 0;
    let  score = 0, average=0;
    let trainingTime = 0;
    let resultText = "";

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
        const p = Math.floor(Math.random() * 18) + 1; // La probailidad de que la máquina haga un CEI es de 1/18
        machineTryCount ++;
        console.log(`Calculo p_machine: ${p}`)
        if (p === 2) { 
            CEI();
        }
    }

    function p_tick_human(){
        const p = Math.floor(Math.random() * 6) + 1; // La probailidad de que el humano provoque un CED de 1/6
        number_clicks ++;
        console.log(`Calculo p_human: ${p}`)
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
        activateCE();
    }

    function CED() {
        countCED++;
        console.log("¡Cambio de estímulo dependiente activado!");
        correctColor = 'red';
        activateCE();
    }

    function activateCE(){
        worker.postMessage("pause")
        worker.postMessage('get_time'); // Solicitar al Worker el tiempo de entrenamiento
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
        // console.log(`-----------Intervalo ${i}: Disparos = ${shotCount}--------------`);
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

    function handleCEClick(selectedButton) {
        
        // Lado y color que el jugador pulsó
        const lado = selectedButton === 0 ? "left" : "right";
        const color = (buttonColorConfig === 0 && selectedButton === 0) || //Si la configuración es verde izquerda y rojo derecha y pulsa izquierda (verde)
                      (buttonColorConfig === 1 && selectedButton === 1) //O si la configuración es rojo izquerda y verde derecha y pulsa derecha (verde)
        ? "green" : "red";

        // Sumar contadores de color y lado
        color === "green"? greenClicks++ : redClicks++;
        lado === "left"? leftClicks++ :rightClicks++;

        // Determinar el botón correcto
        const correctButton = (correctColor === 'green') ? // ¿Es CEI (verde correcto)?
            (buttonColorConfig === 0 ? 0 : 1) : // Si es CEI: ¿Verde está en izquierda (0)? Si sí, correcto = 0 (izquierda), si no correcto = 1(derecha)
            (buttonColorConfig === 0 ? 1 : 0);  // Si es CED (rojo correcto): ¿Verde está en izquierda (0)? Si sí, correcto = 1 (derecha), si no correcto = 0 (izquierda) 

        // Determinar acierto o error
        const isCorrect = selectedButton === correctButton;

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

    function showResultsScreen(isCorrect){
        //Preparar el botón y el pato para cuando se muestre la pantalla de juego
        shootbutton.disabled = false;
        pato.classList.remove("fall-back");

        // Ocultar la pantalla de test y mostrar la de resultados
        document.getElementById("TestScreen").classList.remove("ScreenOn");
        document.getElementById("ResultsScreen").classList.add("ScreenOn");

        // Poner el texto del resultado
        if (average === 100 || average === 0){
            resultText = ("Tienes un " + average + "% de aciertos")
        }
        else{
            resultText = isCorrect ? 
            "Tu porcentaje de aciertos aumentó al "+ average + "% ":
            "Tu porcentaje de aciertos bajó al "+ average + "% ";
        }

        document.getElementById("resultsText").textContent = resultText;

        if(score < 150)
            setTimeout(showGameScreen, 3500);
        else{
            setTimeout(() => {
                resultText = "Tu porcentaje de aciertos total fue del "+ average +"% "
                document.getElementById("resultsText").textContent = resultText;
                document.getElementById("resultHead").textContent = "Gracias!!"
            }, 3500);
        }    
    }

    function showGameScreen() {
        document.getElementById("ResultsScreen").classList.remove("ScreenOn");
        document.getElementById("GameScreen").classList.add("ScreenOn");
        correctColor = null;
        buttonColorConfig = null;
        worker.postMessage("resume")
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
    // 8. EVENTOS DEL WORKER
    // ==============================

    worker.onmessage = function (e) {
        if (typeof e.data === "string") {
                if (e.data === "100 ms") handle100msTick();
                if (e.data === "10 s") handle10sTick();
        } else if (typeof e.data === "object" && e.data.type === "time") {
            trainingTime = e.data.value;
        }
    };

    // ==============================
    // 9. EVENTOS DE USUARIO
    // ==============================

    shootbutton.addEventListener("click", function () {
        shotCount ++;
        guns_animation();
        handleTickClick();
    });

    leftButton.addEventListener("click", () => handleCEClick(0));
    rightButton.addEventListener("click", () => handleCEClick(1));
});

