let startTime = performance.now();
// Guarda el tiempo actual en milisegundos con decimales (Cuando se ejecute new Worker("timerWorker.js"))
let blocks_100_ms = null

function simulate() {
  const now = performance.now();
  // Obtener el tiempo actual

  const elapsed = now - startTime;
  // Calcular cuánto tiempo ha pasado desde el último reinicio

  if (elapsed >= 100) {
    // Si han pasado al menos 100 ms...

    blocks_100_ms += 1
    postMessage(`Tiempo: ${Math.floor(elapsed)} ms`);
    // Enviar mensaje al hilo principal

    startTime = performance.now();
    // Nuevo punto de referencia que marca el momento en que se imprimió el último mensaje

    if(blocks_100_ms == 100){
      postMessage(`han pasado 100 bloques de 100 ms`);
      blocks_100_ms = 0
    }
  }

  setTimeout(simulate, 1);
  // Repetir la función cada 1 ms
}

simulate();
// Iniciar la simulación
