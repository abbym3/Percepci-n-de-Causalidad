
let running = false;
let toId = null;

self.onmessage = (e) => {
  const ms = Math.max(0, +((e.data && e.data.ms) || 0));
  if (running) return;           // ya está programado; ignora nuevas órdenes
  running = true;

  if (ms === 0) {
    running = false;
    self.postMessage({ type: 'done', ms, drift: 0 });
    return;
  }

  const target = performance.now() + ms;

  // Ajustes finos (toca si quieres apretar/relajar)
  const COARSE_GUARD = 12;   // despierta ~12 ms antes de la meta
  const SPIN_MS      = 0.9;  // micro-spin final ~<1 ms

  function fire() {
    running = false;
    const fired = performance.now();
    self.postMessage({ type: 'done', ms, drift: fired - target });
  }

  function loop() {
    const remaining = target - performance.now();

    if (remaining <= 0) { fire(); return; }

    if (remaining <= SPIN_MS) {
      // Spin muy corto dentro del worker (no bloquea la UI)
      while (performance.now() < target) {}
      fire();
      return;
    }

    const next = Math.max(1, Math.min(remaining - COARSE_GUARD, 16));
    toId = setTimeout(loop, next);
  }

  toId = setTimeout(loop, Math.max(1, ms - COARSE_GUARD));
};
