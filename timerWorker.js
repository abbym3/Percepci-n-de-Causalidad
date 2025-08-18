let startTime = performance.now(); //- 60; // Guarda el tiempo actual en milisegundos con decimales (Cuando se ejecute new Worker("timerWorker.js")) - un delay de arranque 
let blockCounter = 0; // Contador de bloques de 20 ms (útil para contar los 100 ms y los 10 s)
let running = true; // Control de pausa
let pauseTime = null; // Almacena el momento en que se pausó
let accumulated_time_ms = 0; // Tiempo total acumulado en bloques de 20 ms

function simulate() {

  //console.log("tick", performance.now());

  if (!running) {
    setTimeout(simulate, 4); //El loop se mantiene activo sin calculos
    return;
  }
  const now = performance.now(); // Obtener el tiempo actual
  const elapsed = now - startTime; // Calcular cuánto tiempo ha pasado desde el último starTime

  if (elapsed >= 20) { //Frecuencia de eventos ~ 20 ms
    const blocksPassed = Math.floor(elapsed / 20); //Calcula cuantos bloques de completos de 20 ms han pasado
    for (let i = 0; i < blocksPassed; i++) {
      accumulated_time_ms += 20; // Sumar 20 ms por cada bloque
      blockCounter++; // Contar cada bloque de 20 ms

      if (blockCounter % 5 === 0) {
          postMessage('100 ms'); // Cada 5 bloques = 100 ms
      }

      if (blockCounter >= 500) {
          postMessage('10 s'); // Cada 500 bloques = 10 s
          blockCounter = 0;
      }
    }
    startTime += blocksPassed * 20; // Avanza startTime la cantidad de tiempo procesado
  }
  setTimeout(simulate, 4); // Repetir la función cada 4 ms
}

simulate(); // Iniciar la simulación

onmessage = function (e) {
  switch (typeof e.data === "object" ? e.data.type : e.data) {
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
      break;

    case 'get_time':
      const timeToSend = accumulated_time_ms 
      postMessage({ type: 'time', value: timeToSend });
      break;

    case 'reset':
      startTime = performance.now() - offset_calibrado;
      offset_aplicado = true;
      blockCounter = 0;
      accumulated_time_ms = 0;
      break;
  }
};