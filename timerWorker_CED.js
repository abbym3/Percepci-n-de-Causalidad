let timerState = null;

const CONFIG = {
  maxCalibrationSamples: 20,
  calibrationRange: { min: 5, max: 2000 },
  maxOverhead: 2.5,
  smoothingFactor: 0.2,
  baseSpinThreshold: 1.2,
  pureSpinThreshold: 0.4,
  yieldInterval: 0.08,
  guards: {
    short:  { max: 50,  percent: 0.12, min: 2.5 },
    medium: { max: 200, percent: 0.06, min: 6 },
    long:   { percent: 0.025, min: 10, max: 18 }
  },
  driftThresholds: { pos: 0.008, neg: 0.006 }
};

const calibration = {
  overhead: 0,
  samples: [],
  posRuns: 0,
  negRuns: 0,
  totalRuns: 0,
  
  reset() {
    if (this.overhead > CONFIG.maxOverhead * 0.85) {
      this.overhead *= 0.6;
      this.samples = this.samples.slice(-8);
      this.posRuns = Math.floor(this.posRuns * 0.6);
      this.negRuns = Math.floor(this.negRuns * 0.6);
    }
  },
  
  getBias() {
    const total = this.posRuns + this.negRuns;
    if (total === 0) return 0;
    return (this.posRuns - this.negRuns) / total;
  }
};

self.onmessage = (e) => {
  const { type, ms: inputMs } = e.data || {};
  
  if (type === 'cancel') {
    cancelTimer();
    return;
  }
  
  const ms = Number(inputMs);
  if (!Number.isFinite(ms) || ms < 0) {
    self.postMessage({ type: 'error', message: 'Invalid duration' });
    return;
  }
  
  if (timerState !== null) {
    return;
  }
  
  if (ms === 0) {
    self.postMessage({ 
      type: 'done', 
      ms: 0, 
      drift: 0, 
      overhead: calibration.overhead, 
      actualMs: 0 
    });
    return;
  }
  
  startTimer(ms);
};

function startTimer(ms) {
  const startTime = performance.now();
  const target = startTime + ms;
  
  timerState = {
    active: true,
    target,
    startTime,
    ms,
    timeoutId: null
  };
  
  const adaptiveGuard = getAdaptiveGuard(ms);
  const spinThreshold = getSpinThreshold();
  
  function fire() {
    if (!timerState || !timerState.active) return;
    
    const fired = performance.now();
    const drift = fired - timerState.target;
    const actualMs = fired - timerState.startTime;
    const requestedMs = timerState.ms;
    
    timerState = null;
    
    updateCalibration(drift, requestedMs);
    
    self.postMessage({ 
      type: 'done', 
      ms: requestedMs, 
      drift, 
      overhead: calibration.overhead, 
      actualMs 
    });
  }
  
  function precisionLoop() {
    if (!timerState || !timerState.active) return;
    
    const now = performance.now();
    const remaining = timerState.target - now;
    
    if (remaining <= 0) {
      fire();
      return;
    }
    
    if (remaining <= spinThreshold) {
      if (remaining <= CONFIG.pureSpinThreshold) {
        spinWait(timerState.target, fire);
        return;
      }
      
      hybridSpin(timerState.target, fire);
      return;
    }
    
    const nextDelay = calculateNextDelay(remaining, adaptiveGuard);
    timerState.timeoutId = setTimeout(precisionLoop, nextDelay);
  }
  
  const initialDelayRaw = ms - adaptiveGuard - calibration.overhead;
  const initialDelay = initialDelayRaw <= 0.5 ? 0 : Math.max(1, Math.floor(initialDelayRaw));
  
  if (initialDelay === 0) {
    precisionLoop();
  } else {
    timerState.timeoutId = setTimeout(precisionLoop, initialDelay);
  }
}

function spinWait(target, callback) {
  const checkInterval = 20;
  let iterations = 0;
  
  while (timerState && timerState.active) {
    if (performance.now() >= target) {
      callback();
      return;
    }
    
    iterations++;
    if (iterations % checkInterval === 0 && (!timerState || !timerState.active)) {
      return;
    }
  }
}

function hybridSpin(target, callback) {
  let lastYield = performance.now();
  
  function spin() {
    if (!timerState || !timerState.active) return;
    
    let iterations = 0;
    const checkInterval = 15;
    
    while (timerState && timerState.active) {
      const t = performance.now();
      
      if (t >= target) {
        callback();
        return;
      }
      
      const rem = target - t;
      if (rem <= CONFIG.pureSpinThreshold) {
        spinWait(target, callback);
        return;
      }
      
      if (t - lastYield >= CONFIG.yieldInterval) {
        lastYield = t;
        if (timerState) {
          timerState.timeoutId = setTimeout(spin, 0);
        }
        return;
      }
      
      iterations++;
      if (iterations % checkInterval === 0 && (!timerState || !timerState.active)) {
        return;
      }
    }
  }
  
  spin();
}

function cancelTimer() {
  if (timerState) {
    if (timerState.timeoutId !== null) {
      clearTimeout(timerState.timeoutId);
    }
    timerState = null;
  }
  self.postMessage({ type: 'cancelled' });
}

function getAdaptiveGuard(targetMs) {
  const { guards } = CONFIG;
  const bias = calibration.getBias();
  const overhead = calibration.overhead;
  
  let baseGuard;
  if (targetMs < guards.short.max) {
    baseGuard = Math.max(guards.short.min, targetMs * guards.short.percent);
  } else if (targetMs < guards.medium.max) {
    baseGuard = Math.max(guards.medium.min, targetMs * guards.medium.percent);
  } else {
    baseGuard = Math.max(guards.long.min, Math.min(guards.long.max, targetMs * guards.long.percent));
  }
  
  let biasAdjust = 0;
  if (bias > 0.25) biasAdjust = 0.4 + (overhead * 0.15);
  else if (bias > 0.1) biasAdjust = 0.2;
  else if (bias < -0.25) biasAdjust = -0.3;
  else if (bias < -0.1) biasAdjust = -0.15;
  
  return Math.max(0, baseGuard + biasAdjust);
}

function getSpinThreshold() {
  const { baseSpinThreshold } = CONFIG;
  const overhead = calibration.overhead || 0;
  const bias = calibration.getBias();
  
  let thr = baseSpinThreshold + (overhead * 0.3);
  
  if (bias > 0.25) thr += 0.3;
  else if (bias > 0.1) thr += 0.15;
  else if (bias < -0.25) thr -= 0.15;
  else if (bias < -0.1) thr -= 0.08;
  
  return Math.max(0.35, Math.min(2.5, thr));
}

function calculateNextDelay(remaining, guard) {
  const safe = remaining - guard;
  if (safe <= 1.5) return 0;
  if (safe <= 5)   return Math.max(0, Math.floor(safe * 0.35));
  if (safe <= 10)  return Math.max(1, Math.floor(safe * 0.5));
  if (safe <= 20)  return Math.max(1, Math.floor(safe * 0.65));
  return Math.min(15, Math.floor(safe * 0.75));
}

function updateCalibration(drift, targetMs) {
  const { calibrationRange, maxCalibrationSamples, smoothingFactor, maxOverhead, driftThresholds } = CONFIG;
  
  if (targetMs < calibrationRange.min || targetMs > calibrationRange.max) return;
  
  calibration.totalRuns++;
  
  const relativeDrift = Math.abs(drift) / targetMs;
  if (drift > 0 && relativeDrift > driftThresholds.pos) {
    calibration.posRuns++;
  } else if (drift < 0 && relativeDrift > driftThresholds.neg) {
    calibration.negRuns++;
  }
  
  calibration.samples.push(Math.abs(drift));
  if (calibration.samples.length > maxCalibrationSamples) {
    calibration.samples.shift();
  }
  
  if (calibration.samples.length >= 6) {
    const sorted = [...calibration.samples].sort((a, b) => a - b);
    const p70 = sorted[Math.floor(sorted.length * 0.70)];
    const p80 = sorted[Math.floor(sorted.length * 0.80)];
    const avgTop = (p70 + p80) / 2;
    
    const newOverhead = avgTop * 0.6;
    
    if (calibration.overhead === 0) {
      calibration.overhead = newOverhead;
    } else {
      calibration.overhead = (1 - smoothingFactor) * calibration.overhead + smoothingFactor * newOverhead;
    }
    
    calibration.overhead = Math.max(0, Math.min(maxOverhead, calibration.overhead));
  }
  
  if (calibration.totalRuns % 30 === 0) {
    calibration.reset();
  }
}