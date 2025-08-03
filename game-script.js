document.addEventListener("DOMContentLoaded", function () {     
    // Esperar a que todos los elementos del DOM estén completamente cargados

    let number_try_machine = 0;

    function calc_p_machine(shoots_interval_10s_previous) {
        let p_machine_1;

        if (shoots_interval_10s_previous === 0) {
            p_machine_1 = 0;
        } else {
            p_machine_1 = Math.floor((100 / shoots_interval_10s_previous * Math.random()) + 1);
        }

        if (p_machine_1 === 1) {
            const p_machine_2 = Math.floor(Math.random() * 18) + 1;
            number_try_machine += 1;

            if (p_machine_2 === 2) {
                CEI();
            }
        }
    }

    function CEI() {
        console.log("¡Cambio de estímulo reforzante activado!");
    }

    const shootbutton = document.getElementById("shootButton"); 
    // Obtener referencia al botón con ID 'shootButton'

    const worker = new Worker("timerWorker.js");
    // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz

    let shoots = 0;
    let shoots_interval_10s = [];
    let i = 0;
    let permission_calc_p_machine = true;

    //worker.postMessage({type:"start"});
    // Enviar mensaje al worker para indicarle que inicie su proceso

    worker.onmessage = function (e) {
        //console.log("Mensaje del Worker:", e.data); 
        // Escuchar mensajes enviados por el worker y mostrarlos en consola

        const mensaje = e.data;

        if (mensaje === "100 ms" && permission_calc_p_machine === true && i !== 0) {
            // La máquina no genera pulsos hasta los primeros 10 segundos (donde i+=1)
            //console.log('Han pasado 100 ms');
            calc_p_machine(shoots_interval_10s[i - 1]);
        }

        if (mensaje === "10 s") {
            //console.log('Han pasado 10s');
            shoots_interval_10s[i] = shoots;
            console.log(`${shoots_interval_10s[i]}`);
            shoots = 0;
            i += 1;
        }
    };

    shootbutton.addEventListener("click", function () {
        shoots += 1;
        // Registrar el evento de clic en el botón 
    });

});