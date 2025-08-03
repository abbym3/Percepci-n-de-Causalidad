let startTime = performance.now();
// Guarda el tiempo actual en milisegundos con decimales (Cuando se ejecute new Worker("timerWorker.js"))

function simulate() {
  const now = performance.now();
  // Obtener el tiempo actual

  const elapsed = now - startTime;
  // Calcular cuánto tiempo ha pasado desde el último reinicio

  if (elapsed >= 100) {
    const blocksPassed = Math.floor(elapsed / 100);
    //Calcula cuantos bloques de completos de 100 ms han pasado

    console.log(`Pasaron ${elapsed.toFixed(2)} ms`);
    // Enviar mensaje al hilo principal

    startTime += blocksPassed * 100;
    // Avanza el startTime exactamente la cantidad de tiempo ya procesado
  }

  setTimeout(simulate, 1);
  // Repetir la función cada 1 ms
}

simulate();
// Iniciar la simulación
