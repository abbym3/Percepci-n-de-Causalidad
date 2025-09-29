let running = false;
let toId = null;

const CONFIG = {
  maxCalibrationSamples: 15,
  calibrationRange: { min: 10, max: 1000 },
  maxOverhead: 3,
  smoothingFactor: 0.15,
  baseSpinThreshold: 1.0,
  pureSpinThreshold: 0.5,
  yieldInterval: 0.1,
  guards: {
    short:  { max: 50,  percent: 0.10, min: 3 },
    medium: { max: 200, percent: 0.05, min: 8 },
    long:   { percent: 0.02, min: 12, max: 15 }
  }
};

let calibration = {
  overhead: 0,
  samples: [],
  posRuns: 0,
  negRuns: 0,
  totalRuns: 0,
  reset() {
    if (this.overhead > CONFIG.maxOverhead * 0.9) {
      this.overhead *= 0.5;
      this.samples = this.samples.slice(-5);
      this.posRuns = Math.floor(this.posRuns * 0.5);
      this.negRuns = Math.floor(this.negRuns * 0.5);
    }
  },
  getBias() {
    const total = this.posRuns + this.negRuns;
    return total === 0 ? 0 : (this.posRuns - this.negRuns) / total;
  }
};

self.onmessage = (e) => {
  const { type, ms: inputMs } = e.data || {};
  if (type === 'cancel') { cancelTimer(); return; }

  const ms = Math.max(0, +(inputMs || 0));
  if (running) return;
  running = true;

  if (ms === 0) {
    running = false;
    self.postMessage({ type: 'done', ms, drift: 0, overhead: calibration.overhead, actualMs: 0 });
    return;
  }

  const startTime = performance.now();
  const target = startTime + ms;

  const adaptiveGuard = getAdaptiveGuard(ms);
  const spinThreshold = getSpinThreshold();

  function fire() {
    if (!running) return;
    running = false;
    const fired = performance.now();
    const drift = fired - target;
    updateCalibration(drift, ms);
    self.postMessage({ type: 'done', ms, drift, overhead: calibration.overhead, actualMs: fired - startTime });
  }

  function precisionLoop() {
    if (!running) return;

    const now = performance.now();
    const remaining = target - now;

    if (remaining <= 0) { fire(); return; }

    if (remaining <= spinThreshold) {
      if (remaining <= CONFIG.pureSpinThreshold) {
        while (running && performance.now() < target) {}
        if (!running) return;
        fire();
        return;
      }

      let lastYield = performance.now();

      function hybridSpin() {
        while (running) {
          const t = performance.now();
          if (t >= target) { fire(); return; }
          const rem = target - t;
          if (rem <= CONFIG.pureSpinThreshold) {
            while (running && performance.now() < target) {}
            if (!running) return;
            fire();
            return;
          }
          if (t - lastYield >= CONFIG.yieldInterval) {
            lastYield = t;
            if (toId) clearTimeout(toId);
            toId = setTimeout(hybridSpin, 0);
            return;
          }
        }
      }

      hybridSpin();
      return;
    }

    const nextDelay = calculateNextDelay(remaining, adaptiveGuard);
    if (toId) clearTimeout(toId);
    toId = setTimeout(precisionLoop, nextDelay);
  }

  const initialDelayRaw = ms - adaptiveGuard - calibration.overhead;
  const initialDelay = initialDelayRaw <= 0.5 ? 0 : Math.max(1, Math.floor(initialDelayRaw));

  if (initialDelay === 0) {
    precisionLoop();
  } else {
    if (toId) clearTimeout(toId);
    toId = setTimeout(precisionLoop, initialDelay);
  }
};

function cancelTimer() {
  if (toId) { clearTimeout(toId); toId = null; }
  running = false;
  self.postMessage({ type: 'cancelled' });
}

function getAdaptiveGuard(targetMs) {
  const { guards } = CONFIG;
  const bias = calibration.getBias();

  let baseGuard;
  if (targetMs < guards.short.max) {
    baseGuard = Math.max(guards.short.min, targetMs * guards.short.percent);
  } else if (targetMs < guards.medium.max) {
    baseGuard = Math.max(guards.medium.min, targetMs * guards.medium.percent);
  } else {
    baseGuard = Math.max(guards.long.min, Math.min(guards.long.max, targetMs * guards.long.percent));
  }

  const biasAdjust = bias > 0.2 ? 0.3 : (bias < -0.2 ? -0.2 : 0);
  return Math.max(0, baseGuard + biasAdjust);
}

function getSpinThreshold() {
  const { baseSpinThreshold } = CONFIG;
  const overhead = calibration.overhead || 0;
  const bias = calibration.getBias();

  let thr = baseSpinThreshold + (overhead * 0.4);
  if (bias > 0.2) thr += 0.2;
  else if (bias < -0.2) thr -= 0.1;

  return Math.max(0.4, Math.min(2, thr));
}

function calculateNextDelay(remaining, guard) {
  const safe = remaining - guard;
  if (safe <= 2)  return 0;
  if (safe <= 6)  return Math.max(0, Math.floor(safe * 0.4));
  if (safe <= 12) return Math.max(1, Math.floor(safe * 0.55));
  return Math.min(12, Math.floor(safe * 0.75));
}

function updateCalibration(drift, targetMs) {
  const { calibrationRange, maxCalibrationSamples, smoothingFactor, maxOverhead } = CONFIG;
  if (targetMs < calibrationRange.min || targetMs > calibrationRange.max) return;

  calibration.totalRuns++;
  if (drift > 0.4) calibration.posRuns++;
  else if (drift < -0.3) calibration.negRuns++;

  calibration.samples.push(Math.abs(drift));
  if (calibration.samples.length > maxCalibrationSamples) calibration.samples.shift();

  if (calibration.samples.length >= 5) {
    const sorted = [...calibration.samples].sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const newOverhead = p75 * 0.55;

    calibration.overhead = calibration.overhead === 0
      ? newOverhead
      : (1 - smoothingFactor) * calibration.overhead + smoothingFactor * newOverhead;

    calibration.overhead = Math.max(0, Math.min(maxOverhead, calibration.overhead));
  }

  if (calibration.totalRuns % 25 === 0) calibration.reset();
}
