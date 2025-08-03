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
    //Indice que permite seleccionar la posición 0 a n, donde 0 guarda la cantidad de disparos en el primer intervalo de 10s  

    let permission_calc_p_machine = true;
    // Flag que permite bloquear al calculo de probabilidad de la máquina

    function calc_p_machine(shoots_interval_10s_previous) {
        let p_machine_1;
        let p_machine_2;

        if (shoots_interval_10s_previous === 0) {
            p_machine_1 = 0;
        } else {
            p_machine_1 = Math.floor((100 / shoots_interval_10s_previous * Math.random()) + 1);
            console.log(`Calculo p_machine_1: ${p_machine_1}`)

            if (p_machine_1 === 1) {
                p_machine_2 = Math.floor(Math.random() * 18) + 1;
                number_try_machine += 1;
                //console.log(`Calculo p_machine_2: ${p_machine_2}`)

                if (p_machine_2 === 2) {
                    CEI();
                }
            }
        }
    }

    function CEI() {
        console.log("¡Cambio de estímulo independiente activado!");
    }



    worker.onmessage = function (e) {
        const mensaje = e.data;

        if (mensaje === "100 ms" && permission_calc_p_machine === true && i !== 0) {
            //console.log('Han pasado 100 ms');

            calc_p_machine(shoots_interval_10s[i - 1]); //Lo que necesito para cacular p machine son los clics del intervalo anterior
        }

        if (mensaje === "10 s") {
            //console.log('Han pasado 10s');

            shoots_interval_10s[i] = shoots;
            //Se guarda el número de disparos del intarvalo de 10 segundos en el indice i
            //console.log(`Número de clics en intervalo anterior: ${shoots_interval_10s[i]}`);
            
            shoots = 0;
            i += 1;
            //Reiniciamos el contador de disparos y configuramos el indice
        }
    };

    shootbutton.addEventListener("click", function () {
        shoots += 1;
        // Registrar el evento de clic en el botón 
    });

});