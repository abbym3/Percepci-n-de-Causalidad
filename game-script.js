document.addEventListener("DOMContentLoaded", function () {     
    // Esperar a que todos los elementos del DOM estén completamente cargados

    const worker = new Worker("timerWorker.js"); // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz
    const shootbutton = document.getElementById("shootButton"); 
    const weaponLeft = document.getElementById("weaponLeft");
    const weaponRight = document.getElementById("weaponRight");
    const leftButton = document.getElementById("ceButtonLeft");
    const rightButton = document.getElementById("ceButtonRight");

    let machineTryCount = 0; //Número de intentos de la máquina por generar un CEI
    let shotCount = 0; //Número de disparos (clicks al boton central)
    let shotsPer10sInterval = []; //Arreglo que permite guardar el número de disparos cada 10 segundos 
    let i = 0; //i guarda la cantidad de disparos en intervalo n de 10s  
    
    let buttonColorConfig = null; // Guardará 0 (verde-izq) o 1 (verde-der)
    let correctColor = null; // 'green' o 'red' según el tipo de CE
    let greenClicks = 0, redClicks = 0, leftClicks = 0, rightClicks = 0, successes = 0, errors = 0, trainingTime = 0;

    function adjustP1BasedOnClicks(shotsPer10sInterval_previous) {
        let p1;
        if (shotsPer10sInterval_previous === 0) { 
            p1 = 0; // Si no hubo clics, no se ajusta la probabilidad
        } else {
            p1 = Math.floor((100 / shotsPer10sInterval_previous * Math.random()) + 1); //La probabilidad se ajusta al número de clics del intervalo de 10s anterior 
                                                                                       //Un número mas alto de clics aumenta las probabilidades de obtener 1 
            console.log(`Ajuste_P1: ${p1}`)
            if (p1 === 1) { 
                p_tick_machine() // Si la probabilidad ajustada da 1, se procede a calcular si la máquina hace CEI
            }
        }
    }

    function p_tick_machine(){
        let p_tck_machine = Math.floor(Math.random() * 18) + 1; // La probailidad de que la máquina haga un intento es de 1/18
        machineTryCount += 1;
        console.log(`Calculo p_machine: ${p_tck_machine}`)
        if (p_tck_machine === 2) { 
            CEI();
        }
    }

    function CEI() {
        console.log("¡Cambio de estímulo independiente activado!");
        correctColor = 'green';
        activateCE();
    }

    function CED() {
        console.log("¡Cambio de estímulo dependiente activado!");
        correctColor = 'red';
        activateCE();
    }

    function activateCE(){
        worker.postMessage("pause")
        worker.postMessage('get_time'); // Solicitar al Worker el mensaje tiempo acumulado / tiempo de entrenamiento
        
        shootbutton.disabled = true;

        pato.classList.add("fall-back");

        setTimeout(() => {
            // Cambiar pantallas
            document.getElementById("GameScreen").classList.remove("ScreenOn");
            document.getElementById("TestScreen").classList.add("ScreenOn");

            //Asignar colores aleatorios
            assignRandomColors();
        }, 1200);
    }

    function assignRandomColors() {

        // Resetear clases
        leftButton.classList.remove("green", "red");
        rightButton.classList.remove("green", "red");

        // Aleatorio: 0 o 1
        buttonColorConfig = Math.random() > 0.5 ? 1 : 0;

        if (buttonColorConfig === 0) {
            leftButton.classList.add("green");
            rightButton.classList.add("red");
        } else {
            leftButton.classList.add("red");
            rightButton.classList.add("green");
        }
    }

    function handle100msTick(){
        //console.log('Han pasado 100 ms');
        if(i > 0 && typeof shotsPer10sInterval[i - 1] === "number"){  // Para ejecutar adjust_p1_based_on_the_number_of_clicks se debe tener registrado el número de clicks en el primer intervalo de 10s (i>0)
            adjustP1BasedOnClicks(shotsPer10sInterval[i - 1]); 
        }
        
    }

    function handle10sTick(){
        console.log(`-----------Intervalo ${i}: Disparos = ${shotCount}--------------`);
        //console.log('Han pasado 10s');
        shotsPer10sInterval[i] = shotCount; //Se guarda el número de disparos del intarvalo de 10 segundos en el indice i        
        //console.log(`Número de clics en intervalo anterior: ${shotsPer10sInterval[i]}`);
        shotCount = 0; //Reiniciamos el contador de disparos 
        i += 1; //Avanzamos el indice para almacenar el numero de disparos del siguiente intervalo de 10s
    }

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

    function reinforce() {
        console.log("Refuerzo visual");
        // Volver al juego después de 2.5 segundos (Poner dentro de Blackout y Reforzar)
        setTimeout(() => {
            resetCEScreen();
        }, 2500);
    }

    function punish() {
        console.log("Castigo visual");
        // Volver al juego después de 2.5 segundos (Poner dentro de Blackout y Reforzar)
        setTimeout(() => {
            resetCEScreen();
        }, 2500);
    }

    function resetCEScreen() {
        shootbutton.disabled = false;
        pato.classList.remove("fall-back");

        document.getElementById("TestScreen").classList.remove("ScreenOn");
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

    worker.onmessage = function (e) {
        const mensaje = e.data;

        if (typeof e.data === "string") {
                if (e.data === "100 ms") handle100msTick();
                if (e.data === "10 s") handle10sTick();
        } else if (typeof e.data === "object" && e.data.type === "time") {
            trainingTime = e.data.value;
        }
    };

    shootbutton.addEventListener("click", function () {
        shotCount += 1;
        guns_animation();
    });

    leftButton.addEventListener("click", () => handleCEClick(0));
    rightButton.addEventListener("click", () => handleCEClick(1));
});

