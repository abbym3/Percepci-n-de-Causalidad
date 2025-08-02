document.addEventListener("DOMContentLoaded", function () {     
    // Esperar a que todos los elementos del DOM estén completamente cargados

    const shootbutton = document.getElementById("shootButton"); 
    // Obtener referencia al botón con ID 'shootButton'

    const worker = new Worker("timerWorker.js");
    // Crear un Web Worker para ejecutar tareas en segundo plano sin bloquear la interfaz

    worker.postMessage({type:"start"});
    // Enviar mensaje al worker para indicarle que inicie su proceso

    worker.onmessage = function (e) {
        console.log("Mensaje del Worker:", e.data); 
        // Escuchar mensajes enviados por el worker y mostrarlos en consola
    };

    shootbutton .addEventListener("click", function () {
        // Registrar el evento de clic en el botón (acción por definir)
    });

});

