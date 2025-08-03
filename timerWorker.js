let startTime = performance.now();
// Guarda el tiempo actual en milisegundos con decimales (Cuando se ejecute new Worker("timerWorker.js"))
let blocks_100_ms = 0;

function simulate() {
  const now = performance.now();
  // Obtener el tiempo actual

  const elapsed = now - startTime;
  // Calcular cuánto tiempo ha pasado desde el último reinicio

  if (elapsed >= 100) { //Frecuencia de eventos ~ 100 ms
    const blocksPassed = Math.floor(elapsed / 100);
    //Calcula cuantos bloques de completos de 100 ms han pasado

    //console.log(`Pasaron ${elapsed.toFixed(2)} ms`);
    postMessage('100 ms')
    // Enviar mensaje al hilo principal

    /*---------------------------------*/
    blocks_100_ms += blocksPassed;
    if (blocks_100_ms >= 100) {
      postMessage('10 s')
      //console.log(`Pasaron 10 s`);
      blocks_100_ms = 0; // Reiniciar contador
    }
    /*--------------------------------*/

    startTime += blocksPassed * 100;
    // Avanza el startTime exactamente la cantidad de tiempo ya procesado (Bloques de 100 ms)
  }

  setTimeout(simulate, 4);
  // Repetir la función cada 4 ms
}

simulate();
// Iniciar la simulación
