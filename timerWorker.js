
let startTime = performance.now(); // Guarda el tiempo actual en milisegundos con decimales (Cuando se ejecute new Worker("timerWorker.js"))
let blockCounter = 0; // Contador de bloques de 100 ms para detectar 10 s
let running = true; // Control de pausa
let pauseTime = null; //Almacena el momento en que se pausó

function simulate() {

  if (!running) return; // Si no se esta ejecutando, no continuar

  const now = performance.now(); // Obtener el tiempo actual
  const elapsed = now - startTime; // Calcular cuánto tiempo ha pasado desde el último starTime

  if (elapsed >= 100) { //Frecuencia de eventos ~ 100 ms
    const blocksPassed = Math.floor(elapsed / 100); //Calcula cuantos bloques de completos de 100 ms han pasado
    blockCounter += blocksPassed;        // Solo para contar hasta 100 bloques

    postMessage('100 ms') // Enviar mensaje al hilo principal

    if (blockCounter >= 100) { // Si se acumulan 100 bloques (de 100 ms) entonces accumulatedMs = 100*100 = 10000 Ms
      postMessage('10 s')
      blockCounter = 0; // Reiniciar contador
    }

    startTime += blocksPassed * 100; // Avanza el startTime exactamente la cantidad de tiempo ya procesado (Bloques de 100 ms)
  }
  setTimeout(simulate, 4); // Repetir la función cada 4 ms
}

simulate(); // Iniciar la simulación

onmessage = function (e) {
  if (e.data === 'pause') {
    running = false;
    pauseTime = performance.now(); // Guardar el momento en que se pausó
  } 
  if (e.data === 'resume') {
    if (!running && pauseTime !== null) {
      const now = performance.now();
      const pausedDuration = now - pauseTime; // Cuánto tiempo estuvo en pausa
      startTime += pausedDuration; // Ajusta el reloj para ignorar el tiempo en pausa y mantener continuidad
      pauseTime = null;
    }
    running = true;
    simulate(); // Retomar la simulación
  }
};