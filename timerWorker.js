let startTime = performance.now();
// Guarda el tiempo actual en milisegundos con decimales (Cuando se ejecute new Worker("timerWorker.js"))

function simulate() {
  const now = performance.now();
  // Obtener el tiempo actual

  const elapsed = now - startTime;
  // Calcular cuánto tiempo ha pasado desde el último reinicio

  if (elapsed >= 100) {
    // Si han pasado al menos 100 ms...

    postMessage(`Tiempo: ${Math.floor(elapsed)} ms`);
    // Enviar mensaje al hilo principal

    startTime = performance.now();
    // Nuevo punto de referencia que marca el momento en que se imprimió el último mensaje
  }

  setTimeout(simulate, 5);
  // Repetir la función cada 5 ms
}

simulate();
// Iniciar la simulación
