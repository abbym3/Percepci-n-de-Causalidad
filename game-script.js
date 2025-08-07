document.addEventListener("DOMContentLoaded", function () {     
    // Esperar a que todos los elementos del DOM estén completamente cargados

    const worker = new Worker("timerWorker.js"); // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz
    const shootbutton = document.getElementById("shootButton"); 
    const armaIzquierda = document.getElementById("armaIzquierda");
    const armaDerecha = document.getElementById("armaDerecha");
    const leftButton = document.getElementById("ceButtonLeft");
    const rightButton = document.getElementById("ceButtonRight");

    let number_try_machine = 0; //Número de intentos de la máquina por generar un CEI
    let shoots = 0; //Número de disparos (clicks al boton central)
    let shoots_interval_10s = []; //Arreglo que permite guardar el número de disparos cada 10 segundos 
    let i = 0; //Indice que permite seleccionar la posición 0 a n, donde i guarda la cantidad de disparos en intervalo n de 10s  
    let ButtonsConfig = null; // Guardará 0 (verde-izq) o 1 (verde-der)
    let correctColor = null; // 'green' o 'red' según el tipo de CE


    function adjust_p1_based_on_clicks(shoots_interval_10s_previous) {
        let p1;
        if (shoots_interval_10s_previous === 0) { 
            p1 = 0; // Si no hubo clics, no se ajusta la probabilidad
        } else {
            p1 = Math.floor((100 / shoots_interval_10s_previous * Math.random()) + 1); //La probabilidad se ajusta al número de clics del intervalo de 10s anterior 
                                                                                       //Un número mas alto de clics aumenta las probabilidades de obtener 1 
            console.log(`Ajuste_P1: ${p1}`)
            if (p1 === 1) { 
                p_tick_machine() // Si la probabilidad ajustada da 1, se procede a calcular si la máquina hace CEI
            }
        }
    }

    function p_tick_machine(){
        let p_tck_machine = Math.floor(Math.random() * 18) + 1; // La probailidad de que la máquina haga un intento es de 1/18
        number_try_machine += 1;
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
        
        // Cambiar pantallas
        document.getElementById("GameScreen").classList.remove("ScreenOn");
        document.getElementById("TestScreen").classList.add("ScreenOn");

        //Asignar colores aleatorios
        assignRandomColors();
    }

    function assignRandomColors() {

        // Resetear clases
        leftButton.classList.remove("green", "red");
        rightButton.classList.remove("green", "red");

        // Aleatorio: 0 o 1
        ButtonsConfig = Math.random() > 0.5 ? 1 : 0;

        if (ButtonsConfig === 0) {
            leftButton.classList.add("green");
            rightButton.classList.add("red");
        } else {
            leftButton.classList.add("red");
            rightButton.classList.add("green");
        }
    }

    function handle100msTick(){
        //console.log('Han pasado 100 ms');
        if(i > 0 && typeof shoots_interval_10s[i - 1] === "number"){  // Para ejecutar adjust_p1_based_on_the_number_of_clicks se debe tener registrado el número de clicks en el primer intervalo de 10s (i>0)
            adjust_p1_based_on_clicks(shoots_interval_10s[i - 1]); 
        }
        
    }

    function handle10sTick(){
        console.log(`-----------Intervalo ${i}: Disparos = ${shoots}--------------`);
        //console.log('Han pasado 10s');
        shoots_interval_10s[i] = shoots; //Se guarda el número de disparos del intarvalo de 10 segundos en el indice i        
        //console.log(`Número de clics en intervalo anterior: ${shoots_interval_10s[i]}`);
        shoots = 0; //Reiniciamos el contador de disparos 
        i += 1; //Avanzamos el indice para almacenar el numero de disparos del siguiente intervalo de 10s
        execut = 0
    }

    function handleCEClick(selectedButton) {
        //Determinar el botón correcto
        const correctButton = (correctColor === 'green') ? // ¿Es CEI (verde correcto)?
            (ButtonsConfig === 0 ? 0 : 1) : // Si es CEI: ¿Verde está en izquierda (0)? Si sí, correcto=0, sino 1
            (ButtonsConfig === 0 ? 1 : 0);  // Si es CED (rojo correcto): ¿Verde está en izquierda (0)? 
                                        // Entonces rojo está en derecha (1)

        // Verificar si el clic fue correcto
        const isCorrect = selectedButton === correctButton;
        
        // Registrar resultado en consola
        console.log(isCorrect ? 
            `¡Correcto!` : 
            `¡Incorrecto!`);

        // Volver al juego después de 2.5 segundos
        setTimeout(() => {
            resetCEScreen();
            worker.postMessage("resume")
        }, 2500);
    }

    function resetCEScreen() {
        document.getElementById("TestScreen").classList.remove("ScreenOn");
        document.getElementById("GameScreen").classList.add("ScreenOn");
        
        permission_adjust_p1 = true;
        permission_set_number_clics = true
        correctColor = null;
        ButtonsConfig = null;
    }

    function guns_animation(){
        armaIzquierda.classList.add("retroceso_izquierda");
        armaDerecha.classList.add("retroceso_derecha");

        setTimeout(() => {
        armaIzquierda.classList.remove("retroceso_izquierda");
        armaDerecha.classList.remove("retroceso_derecha");
        }, 100); // Duración del retroceso
    }

    worker.onmessage = function (e) {
        const mensaje = e.data;

        if (mensaje === "100 ms") {
            handle100msTick();
        }

        if (mensaje === "10 s") {
            handle10sTick();
        }
    };

    shootbutton.addEventListener("click", function () {
        shoots += 1;
        guns_animation();
    });

    leftButton.addEventListener("click", () => handleCEClick(0));
    rightButton.addEventListener("click", () => handleCEClick(1));
});

