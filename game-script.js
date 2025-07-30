document.addEventListener("DOMContentLoaded", function () {     //Ya se construyeron los elementos HTML.
    const worker = new Worker("timerWorker.js");
    worker.postMessage("start");
    worker.onmessage = function (e) {
        console.log("Mensaje del Worker:", e.data); 
    };
    
    const shootbutton = document.getElementById("shootButton");
    if (shootbutton ) {
        shootbutton .addEventListener("click", function () {
        alert('Aiuda :c')
        });
    } else {
        console.error("No se encontró el botón con id 'shootbutton '");
    }
});

