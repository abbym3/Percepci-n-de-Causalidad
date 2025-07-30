let startTime = null;

self.onmessage = function (e) {
  if (e.data === 'start') {
    startTime = Date.now();
    tick();
  }
};

function tick() {
  const now = Date.now();
  const elapsed = (now - startTime)/1000;
  postMessage(`Han pasado ${elapsed} s`);
  setTimeout(tick, 1000);
}