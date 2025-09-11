let running = false;
let toId = null;
let calibration = {
  overhead: 0,
  samples: [],
  maxSamples: 10
};

self.onmessage = (e) => {
  const { type, ms: inputMs } = e.data || {};
  
  if (type === 'cancel') {
    cancelTimer();
    return;
  }
  
  const ms = Math.max(0, +(inputMs || 0));
  if (running) return;
  running = true;

  if (ms === 0) {
    running = false;
    self.postMessage({ type: 'done', ms, drift: 0, overhead: calibration.overhead });
    return;
  }

  const target = performance.now() + ms;
  
  // Ajustes adaptativos basados en calibración
  const adaptiveGuard = getAdaptiveGuard(ms);
  const spinThreshold = getSpinThreshold();
  
  function fire() {
    running = false;
    const fired = performance.now();
    const drift = fired - target;
    
    // Actualizar calibración
    updateCalibration(drift, ms);
    
    self.postMessage({ 
      type: 'done', 
      ms, 
      drift,
      overhead: calibration.overhead,
      actualMs: fired - (target - ms)
    });
  }

  function precisionLoop() {
    const now = performance.now();
    const remaining = target - now;

    if (remaining <= 0) { 
      fire(); 
      return; 
    }

    // Spin de alta precisión para los últimos microsegundos
    if (remaining <= spinThreshold) {
      const spinStart = performance.now();
      
      // Spin híbrido: yield ocasionalmente para no bloquear completamente
      while (performance.now() < target) {
        const elapsed = performance.now() - spinStart;
        // Yield cada ~100 microsegundos en spins muy largos
        if (elapsed > 0.1 && (performance.now() - spinStart) % 0.1 < 0.05) {
          setTimeout(precisionLoop, 0);
          return;
        }
      }
      fire();
      return;
    }

    // Scheduling adaptativo
    const nextDelay = calculateNextDelay(remaining, adaptiveGuard);
    toId = setTimeout(precisionLoop, nextDelay);
  }

  // Inicio con compensación de overhead
  const initialDelay = Math.max(1, ms - adaptiveGuard - calibration.overhead);
  toId = setTimeout(precisionLoop, initialDelay);
};

function cancelTimer() {
  if (toId) {
    clearTimeout(toId);
    toId = null;
  }
  running = false;
  self.postMessage({ type: 'cancelled' });
}

function getAdaptiveGuard(targetMs) {
  // Guard más agresivo para timers cortos, más relajado para largos
  if (targetMs < 50) return Math.max(3, targetMs * 0.1);
  if (targetMs < 200) return Math.max(8, targetMs * 0.05);
  return Math.min(15, targetMs * 0.02);
}

function getSpinThreshold() {
  // Threshold adaptativo basado en el overhead promedio
  const baseThreshold = 0.5;
  const overhead = calibration.overhead || 0;
  return Math.max(0.3, Math.min(2, baseThreshold + overhead * 0.5));
}

function calculateNextDelay(remaining, guard) {
  // Usar scheduling exponencial para aproximarse gradualmente
  const safeRemaining = remaining - guard;
  
  if (safeRemaining <= 1) return 1;
  if (safeRemaining <= 5) return Math.max(1, safeRemaining * 0.5);
  if (safeRemaining <= 16) return Math.max(1, safeRemaining * 0.7);
  
  // Para delays largos, usar chunks de máximo 16ms (60fps)
  return Math.min(16, safeRemaining * 0.8);
}

function updateCalibration(drift, targetMs) {
  // Solo calibrar con timers de duración media (más estables)
  if (targetMs < 10 || targetMs > 1000) return;
  
  calibration.samples.push(Math.abs(drift));
  
  if (calibration.samples.length > calibration.maxSamples) {
    calibration.samples.shift();
  }
  
  // Calcular overhead promedio (usando mediana para reducir outliers)
  const sorted = [...calibration.samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // Ajustar overhead gradualmente
  const newOverhead = median * 0.5;
  calibration.overhead = calibration.overhead 
    ? (calibration.overhead * 0.8 + newOverhead * 0.2)
    : newOverhead;
    
  // Limitar overhead a valores razonables
  calibration.overhead = Math.max(0, Math.min(5, calibration.overhead));
}