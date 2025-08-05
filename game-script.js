document.addEventListener("DOMContentLoaded", function () {     
    // Esperar a que todos los elementos del DOM estén completamente cargados

    const worker = new Worker("timerWorker.js");
    // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz

    const shootbutton = document.getElementById("shootButton"); 
    // Obtener referencia al botón con ID 'shootButton'

    let number_try_machine = 0;
    //Número de intentos de la máquina por generar un CEI

    let shoots = 0;
    //Número de disparos (clicks al boton central)

    let shoots_interval_10s = [];
    //Arreglo que permite guardar el número de disparos cada 10 segundos 

    let i = 0;
    //Indice que permite seleccionar la posición 0 a n, donde i guarda la cantidad de disparos en intervalo n de 10s  

    let permission_calc_p_machine = true;
     // Flag para habilitar o bloquear el cálculo de probabilidad de la máquina

    function adjust_p1_based_on_clicks(shoots_interval_10s_previous) {
        let p1;
        if (shoots_interval_10s_previous === 0) { 
            p1 = 0; // Si no hubo clics, no se ajusta la probabilidad
        } else {
            p1 = Math.floor((100 / shoots_interval_10s_previous * Math.random()) + 1); //La probabilidad se ajusta al número de clics del intervalo de 10s anterior 
                                                                                       //Un número mas alto de clics aumenta las probabilidades de obtener 1 
            console.log(`Ajuste_P1: ${p1}`)

            // Si la probabilidad ajustada da 1, se procede a calcular si la máquina hace CEI
            if (p1 === 1) {
                p_tick_machine()
            }
        }
    }

    function p_tick_machine(){
        let p_tck_machine = Math.floor(Math.random() * 18) + 1;
        //La probailidad de que la máquina haga un intento es de 1/18
        number_try_machine += 1;
        console.log(`Calculo p_machine: ${p_machine}`)
        if (p_tck_machine === 2) {
            CEI();
        }
    }

    function CEI() {
        console.log("¡Cambio de estímulo independiente activado!");
    }

    function handle100msTick(){
        //console.log('Han pasado 100 ms');

        if(i > 0 && typeof shoots_interval_10s[i - 1] === "number"){ 
            adjust_p1_based_on_clicks(shoots_interval_10s[i - 1]); 
        }
        // Una de las condiciones para ejecutar adjust_p1_based_on_the_number_of_clicks es que se tenga registrado el número de clicks en el primer intervalo de 10s (i>0)
    }

    function handle10sTick(){
        //console.log('Han pasado 10s');

        shoots_interval_10s[i] = shoots;
        //Se guarda el número de disparos del intarvalo de 10 segundos en el indice i
        //console.log(`Número de clics en intervalo anterior: ${shoots_interval_10s[i]}`);
        
        shoots = 0;
        i += 1;
        //Reiniciamos el contador de disparos y configuramos el indice
    }

    worker.onmessage = function (e) {
        const mensaje = e.data;

        if (mensaje === "100 ms" && permission_calc_p_machine === true) {
            handle100msTick();
        }

        if (mensaje === "10 s") {
            handle10sTick();
        }
    };

    shootbutton.addEventListener("click", function () {
        shoots += 1;
        // Registrar el evento de clic en el botón 
    });

});

