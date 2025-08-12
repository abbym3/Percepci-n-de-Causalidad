
let startTime = performance.now(); // Guarda el tiempo actual en milisegundos con decimales (Cuando se ejecute new Worker("timerWorker.js"))
let blockCounter = 0; // Contador de bloques de 100 ms (útil para contar los 10 s)
let running = true; // Control de pausa
let pauseTime = null; // Almacena el momento en que se pausó
let accumulated_time_ms = 0; // Tiempo total acumulado (sin pausas)

function simulate() {

  if (!running) return; // Si no se esta ejecutando, no continuar

  const now = performance.now(); // Obtener el tiempo actual
  const elapsed = now - startTime; // Calcular cuánto tiempo ha pasado desde el último starTime

  if (elapsed >= 100) { //Frecuencia de eventos ~ 100 ms
    const blocksPassed = Math.floor(elapsed / 100); //Calcula cuantos bloques de completos de 100 ms han pasado
    blockCounter += blocksPassed;        // Solo para contar hasta 100 bloques
    accumulated_time_ms += blocksPassed * 100; // Sumar al acumulado

    for (let i = 0; i < blocksPassed; i++) {
        postMessage('100 ms');
    }

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
  switch (e.data) {
    case 'pause':
      running = false;
      pauseTime = performance.now(); // Guardar el momento en que se pausó
      break;

    case 'resume':
      if (!running && pauseTime !== null) {
        const now = performance.now();
        const pausedDuration = now - pauseTime; // Cuánto tiempo estuvo en pausa
        startTime += pausedDuration; // Ajusta el reloj para ignorar el tiempo en pausa y mantener continuidad
        pauseTime = null;
      }
      running = true;
      simulate();
      break;

    case 'get_time':
      postMessage({type: 'time', value: accumulated_time_ms});
      break;
  }
};