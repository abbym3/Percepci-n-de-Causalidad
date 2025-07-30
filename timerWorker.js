let startTime = null;
let tickCount = 0;

onmessage = function (e) {
  if (e.data === 'start') {
    startTime = Date.now();
    tick();
  }
};

function tick() {
  tickCount++;
  const now = Date.now();
  const targetTime = startTime + tickCount * 1000; // tiempo ideal del tick actual
  const drift = now - targetTime; // cuánto nos desviamos
  const elapsed = Math.floor((now - startTime) / 1000);

  postMessage(`Han pasado ${elapsed} s (deriva: ${drift} ms)`);

  setTimeout(tick, 1000 - drift); // compensamos el retraso
}


//Verión anterior (sin deriva)
// let startTime = null;

// self.onmessage = function (e) {
//   if (e.data === 'start') {
//     startTime = Date.now();
//     tick();
//   }
// };

// function tick() {
//   const now = Date.now();
//   const elapsed = (now - startTime)/1000;
//   postMessage(`Han pasado ${elapsed} s`);
//   setTimeout(tick, 1000);
// }