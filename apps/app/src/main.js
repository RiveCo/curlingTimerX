// Curling Timer R1 Plugin
// Tracks stone travel time from hog line to back line

// ===========================================
// State Management
// ===========================================

let timerState = {
  isRunning: false,
  startTime: null,
  elapsedTime: 0,
  currentMode: 'ready' // 'ready', 'timing', 'stopped'
};

let appState = {
  iceSpeed: 5, // Default ice speed (1-10 scale) - 5 represents medium ice
  shots: [], // Array of shot objects (max 8)
  speedHistory: [], // Historical ice speed data
  currentView: 'main', // 'main' or 'settings'
  adjustingPosition: false, // Whether we're adjusting stone position after timing
  pttPressed: false // Track PTT button state
};

// ===========================================
// Storage Functions
// ===========================================

async function saveToStorage(key, value) {
  if (window.creationStorage) {
    try {
      const encoded = btoa(JSON.stringify(value));
      await window.creationStorage.plain.setItem(key, encoded);
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

async function loadFromStorage(key) {
  if (window.creationStorage) {
    try {
      const stored = await window.creationStorage.plain.getItem(key);
      if (stored) {
        return JSON.parse(atob(stored));
      }
    } catch (e) {
      console.error('Error loading from storage:', e);
    }
  } else {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

async function loadAppData() {
  const shots = await loadFromStorage('curling_shots');
  const speedHistory = await loadFromStorage('curling_speed_history');
  const iceSpeed = await loadFromStorage('curling_ice_speed');
  
  if (shots) appState.shots = shots;
  if (speedHistory) appState.speedHistory = speedHistory;
  if (iceSpeed) appState.iceSpeed = iceSpeed;
  
  updateUI();
}

async function saveAppData() {
  await saveToStorage('curling_shots', appState.shots);
  await saveToStorage('curling_speed_history', appState.speedHistory);
  await saveToStorage('curling_ice_speed', appState.iceSpeed);
}

// ===========================================
// Timer Logic
// ===========================================

function startTimer() {
  if (timerState.isRunning) return;
  
  timerState.isRunning = true;
  timerState.startTime = Date.now();
  timerState.currentMode = 'timing';
  
  updateTimerDisplay();
  
  // Update timer display and stone position every 10ms during timing
  timerState.interval = setInterval(() => {
    timerState.elapsedTime = (Date.now() - timerState.startTime) / 1000;
    updateTimerDisplay();
    
    // Real-time stone position update during timing
    const currentPosition = calculateStonePosition(timerState.elapsedTime, appState.iceSpeed);
    updateStoneIndicator(currentPosition);
  }, 10);
}

function stopTimer() {
  if (!timerState.isRunning) return;
  
  clearInterval(timerState.interval);
  timerState.isRunning = false;
  timerState.currentMode = 'stopped';
  
  const finalTime = timerState.elapsedTime;
  
  // Calculate stone position based on time and ice speed
  const stonePosition = calculateStonePosition(finalTime, appState.iceSpeed);
  
  // Show stone at calculated position
  updateStoneIndicator(stonePosition);
  
  // Enable position adjustment mode
  appState.adjustingPosition = true;
  appState.currentStonePosition = stonePosition;
  appState.currentShotTime = finalTime;
  
  updateTimerDisplay();
  updateSweepingRecommendation(finalTime, appState.iceSpeed, stonePosition);
}

function resetTimer() {
  clearInterval(timerState.interval);
  timerState.isRunning = false;
  timerState.startTime = null;
  timerState.elapsedTime = 0;
  timerState.currentMode = 'ready';
  appState.adjustingPosition = false;
  
  updateTimerDisplay();
  hideStoneIndicator();
  clearSweepingRecommendation();
}

function calculateStonePosition(time, iceSpeed) {
  // Position calculation: faster times = shorter distance
  // Time range: ~3-6 seconds typical
  // Position range: 0 (hog line) to 100 (back of house)
  
  // Base calculation: slower ice = stone travels further
  const speedFactor = iceSpeed / 10; // 0.1 to 1.0
  const timeFactor = Math.max(0, Math.min(1, (time - 2) / 4)); // normalize 2-6s to 0-1
  
  // Position: 0 = hog line (30 in SVG), 100 = back line (270 in SVG)
  const position = timeFactor * 100 * (0.5 + speedFactor * 0.5);
  
  return Math.max(0, Math.min(100, position));
}

function calculateTimeFromPosition(position, iceSpeed) {
  // Inverse calculation: given position and ice speed, calculate time
  // This allows adjusting time when user changes stone position
  
  const speedFactor = iceSpeed / 10; // 0.1 to 1.0
  
  // Reverse the position formula: position = timeFactor * 100 * (0.5 + speedFactor * 0.5)
  const timeFactor = position / (100 * (0.5 + speedFactor * 0.5));
  
  // Reverse the time normalization: timeFactor = (time - 2) / 4
  const time = (timeFactor * 4) + 2;
  
  return Math.max(2, Math.min(6, time));
}

function getShotType(position) {
  // Position 0-100 scale
  // 0-35: Guard (short)
  // 35-75: Normal (in house)
  // 75-100: Takeout (heavy/through)
  
  if (position < 35) return 'guard';
  if (position < 75) return 'normal';
  return 'takeout';
}

// ===========================================
// UI Update Functions
// ===========================================

function updateTimerDisplay() {
  const timerValue = document.getElementById('timerValue');
  const timerStatus = document.getElementById('timerStatus');
  const timerDisplay = document.querySelector('.timer-display');
  
  // Show current shot time when adjusting, elapsed time otherwise
  const displayTime = appState.adjustingPosition ? appState.currentShotTime : timerState.elapsedTime;
  timerValue.textContent = displayTime.toFixed(2) + 's';
  
  if (timerState.currentMode === 'timing') {
    timerStatus.textContent = 'Timing... Release to stop';
    timerDisplay.classList.add('running');
  } else if (timerState.currentMode === 'stopped') {
    timerStatus.textContent = 'Adjust position with scroll wheel';
    timerDisplay.classList.remove('running');
  } else {
    timerStatus.textContent = 'Hold side button to start';
    timerDisplay.classList.remove('running');
  }
}

function updateStoneIndicator(position) {
  const stone = document.getElementById('stoneIndicator');
  
  // Map position (0-100) to SVG y coordinate (30-270)
  const y = 30 + (position / 100) * 240;
  
  stone.setAttribute('cy', y);
  stone.setAttribute('opacity', '1');
}

function hideStoneIndicator() {
  const stone = document.getElementById('stoneIndicator');
  stone.setAttribute('opacity', '0');
}

function animateStone() {
  const stone = document.getElementById('stoneIndicator');
  stone.setAttribute('cy', '30');
  stone.setAttribute('opacity', '1');
}

function updateIceSpeedDisplay() {
  const speedValue = document.getElementById('speedValue');
  speedValue.textContent = appState.iceSpeed;
}

function updateSweepingRecommendation(time, iceSpeed, position) {
  const recText = document.getElementById('recText');
  const sweepingRec = document.getElementById('sweepingRec');
  
  // Calculate sweeping recommendation based on ice speed
  // The target time varies with ice speed:
  // - Slow ice (1-3): longer times (5.0-5.5s target)
  // - Medium ice (4-7): standard times (4.5s target)
  // - Fast ice (8-10): shorter times (3.8-4.2s target)
  
  // Calculate dynamic target based on ice speed
  // Slower ice = longer target time, faster ice = shorter target time
  const baseTarget = 4.5;
  const speedOffset = (5 - iceSpeed) * 0.15; // -0.75 to +0.6 seconds
  const targetTime = baseTarget + speedOffset;
  
  // Define thresholds relative to target time
  const veryShort = targetTime - 0.7;
  const slightlyShort = targetTime - 0.3;
  const slightlyHeavy = targetTime + 0.3;
  const veryHeavy = targetTime + 0.7;
  
  let recommendation = '';
  let intensity = '';
  
  if (time < veryShort) {
    recommendation = 'HEAVY SWEEP NEEDED - Stone is short';
    intensity = 'heavy';
  } else if (time < slightlyShort) {
    recommendation = 'Moderate sweep - Stone slightly short';
    intensity = 'medium';
  } else if (time < slightlyHeavy) {
    recommendation = 'Light sweep - Good weight';
    intensity = 'light';
  } else if (time < veryHeavy) {
    recommendation = 'Minimal sweep - Stone is heavy';
    intensity = 'light';
  } else {
    recommendation = 'NO SWEEP - Stone too heavy';
    intensity = 'heavy';
  }
  
  // Add ice speed context
  if (iceSpeed < 4) {
    recommendation += ' (Slow ice)';
  } else if (iceSpeed > 7) {
    recommendation += ' (Fast ice)';
  }
  
  recText.textContent = recommendation;
  sweepingRec.className = 'sweeping-rec ' + intensity;
}

function clearSweepingRecommendation() {
  const recText = document.getElementById('recText');
  const sweepingRec = document.getElementById('sweepingRec');
  
  recText.textContent = '-';
  sweepingRec.className = 'sweeping-rec';
}

function updateShotHistory() {
  const shotList = document.getElementById('shotList');
  
  if (appState.shots.length === 0) {
    shotList.innerHTML = '<div class="empty-state">No shots recorded yet</div>';
    return;
  }
  
  shotList.innerHTML = '';
  
  // Display shots in reverse order (newest first)
  for (let i = appState.shots.length - 1; i >= 0; i--) {
    const shot = appState.shots[i];
    const shotItem = document.createElement('div');
    shotItem.className = 'shot-item';
    
    shotItem.innerHTML = `
      <span class="shot-number">Shot ${shot.number}</span>
      <span class="shot-time">${shot.time.toFixed(2)}s</span>
      <span class="shot-type ${shot.type}">${shot.type.toUpperCase()}</span>
    `;
    
    shotList.appendChild(shotItem);
  }
}

function recordShot(time, position, iceSpeed) {
  const shotType = getShotType(position);
  const shotNumber = (appState.shots.length % 8) + 1;
  
  // If we have 8 shots, remove the oldest
  if (appState.shots.length >= 8) {
    appState.shots.shift();
  }
  
  // Add new shot
  appState.shots.push({
    number: shotNumber,
    time: time,
    position: position,
    type: shotType,
    iceSpeed: iceSpeed,
    timestamp: Date.now()
  });
  
  // Record ice speed to history
  appState.speedHistory.push({
    iceSpeed: iceSpeed,
    timestamp: Date.now()
  });
  
  // Keep only last 50 speed records
  if (appState.speedHistory.length > 50) {
    appState.speedHistory.shift();
  }
  
  saveAppData();
  updateShotHistory();
  updateSettingsView();
}

// ===========================================
// Settings View Functions
// ===========================================

function showSettings() {
  document.getElementById('mainView').classList.add('hidden');
  document.getElementById('settingsView').classList.remove('hidden');
  appState.currentView = 'settings';
  updateSettingsView();
}

function showMain() {
  document.getElementById('settingsView').classList.add('hidden');
  document.getElementById('mainView').classList.remove('hidden');
  appState.currentView = 'main';
}

function updateSettingsView() {
  updateSpeedHistory();
  updateAverageTimes();
}

function updateSpeedHistory() {
  const speedHistory = document.getElementById('speedHistory');
  
  if (appState.speedHistory.length === 0) {
    speedHistory.innerHTML = '<div class="empty-state">No ice speed data yet</div>';
    return;
  }
  
  // Show last 10 speed records
  const recentSpeeds = appState.speedHistory.slice(-10).reverse();
  
  speedHistory.innerHTML = '';
  recentSpeeds.forEach((record, index) => {
    const date = new Date(record.timestamp);
    const timeStr = date.toLocaleTimeString();
    
    const speedItem = document.createElement('div');
    speedItem.className = 'speed-item';
    speedItem.innerHTML = `
      <span>${timeStr}</span>
      <span>Speed: ${record.iceSpeed}/10</span>
    `;
    speedHistory.appendChild(speedItem);
  });
}

function updateAverageTimes() {
  const avgTimes = document.getElementById('avgTimes');
  
  if (appState.shots.length === 0) {
    avgTimes.innerHTML = '<div class="empty-state">No shots recorded yet</div>';
    return;
  }
  
  // Calculate averages by shot type
  const guards = appState.shots.filter(s => s.type === 'guard');
  const normals = appState.shots.filter(s => s.type === 'normal');
  const takeouts = appState.shots.filter(s => s.type === 'takeout');
  
  const avgGuard = guards.length > 0 ? guards.reduce((sum, s) => sum + s.time, 0) / guards.length : 0;
  const avgNormal = normals.length > 0 ? normals.reduce((sum, s) => sum + s.time, 0) / normals.length : 0;
  const avgTakeout = takeouts.length > 0 ? takeouts.reduce((sum, s) => sum + s.time, 0) / takeouts.length : 0;
  const avgAll = appState.shots.reduce((sum, s) => sum + s.time, 0) / appState.shots.length;
  
  avgTimes.innerHTML = `
    <div class="avg-item">
      <span>Overall Average:</span>
      <span>${avgAll.toFixed(2)}s</span>
    </div>
    ${guards.length > 0 ? `
    <div class="avg-item">
      <span>Guard Average:</span>
      <span>${avgGuard.toFixed(2)}s (${guards.length})</span>
    </div>
    ` : ''}
    ${normals.length > 0 ? `
    <div class="avg-item">
      <span>Normal Average:</span>
      <span>${avgNormal.toFixed(2)}s (${normals.length})</span>
    </div>
    ` : ''}
    ${takeouts.length > 0 ? `
    <div class="avg-item">
      <span>Takeout Average:</span>
      <span>${avgTakeout.toFixed(2)}s (${takeouts.length})</span>
    </div>
    ` : ''}
  `;
}

function resetAllData() {
  if (confirm('Reset all curling data? This cannot be undone.')) {
    appState.shots = [];
    appState.speedHistory = [];
    appState.iceSpeed = 5;
    
    saveAppData();
    resetTimer();
    updateUI();
    updateSettingsView();
  }
}

// ===========================================
// Complete UI Update
// ===========================================

function updateUI() {
  updateTimerDisplay();
  updateIceSpeedDisplay();
  updateShotHistory();
}

// ===========================================
// Hardware Event Handlers
// ===========================================

// PTT button handlers for hold-to-start, release-to-stop behavior
window.addEventListener('longPressStart', () => {
  if (appState.currentView === 'settings') return;
  
  if (appState.adjustingPosition) {
    // Confirm shot and record it
    recordShot(appState.currentShotTime, appState.currentStonePosition, appState.iceSpeed);
    resetTimer();
  } else if (timerState.currentMode === 'ready') {
    // Start timing when button is held
    appState.pttPressed = true;
    startTimer();
  } else if (timerState.currentMode === 'stopped') {
    // Reset and start new timing
    resetTimer();
    appState.pttPressed = true;
    startTimer();
  }
});

window.addEventListener('longPressEnd', () => {
  if (appState.currentView === 'settings') return;
  
  if (appState.pttPressed && timerState.currentMode === 'timing') {
    // Stop timing when button is released
    appState.pttPressed = false;
    stopTimer();
  }
});

// Fallback to sideClick for single press actions (if longPress not available)
window.addEventListener('sideClick', () => {
  // Only handle sideClick if longPress events are not being triggered
  if (appState.currentView === 'settings') return;
  
  if (appState.adjustingPosition) {
    // Confirm shot and record it
    recordShot(appState.currentShotTime, appState.currentStonePosition, appState.iceSpeed);
    resetTimer();
  }
});

window.addEventListener('scrollUp', () => {
  if (appState.currentView === 'settings') return;
  
  if (appState.adjustingPosition) {
    // Adjust stone position and recalculate time
    appState.currentStonePosition = Math.min(100, appState.currentStonePosition + 5);
    
    // Recalculate time based on new position and current ice speed
    appState.currentShotTime = calculateTimeFromPosition(appState.currentStonePosition, appState.iceSpeed);
    
    updateStoneIndicator(appState.currentStonePosition);
    updateTimerDisplay(); // Update to show the new time
    updateSweepingRecommendation(appState.currentShotTime, appState.iceSpeed, appState.currentStonePosition);
  } else {
    // Adjust ice speed
    appState.iceSpeed = Math.min(10, appState.iceSpeed + 1);
    updateIceSpeedDisplay();
    saveAppData();
  }
});

window.addEventListener('scrollDown', () => {
  if (appState.currentView === 'settings') return;
  
  if (appState.adjustingPosition) {
    // Adjust stone position and recalculate time
    appState.currentStonePosition = Math.max(0, appState.currentStonePosition - 5);
    
    // Recalculate time based on new position and current ice speed
    appState.currentShotTime = calculateTimeFromPosition(appState.currentStonePosition, appState.iceSpeed);
    
    updateStoneIndicator(appState.currentStonePosition);
    updateTimerDisplay(); // Update to show the new time
    updateSweepingRecommendation(appState.currentShotTime, appState.iceSpeed, appState.currentStonePosition);
  } else {
    // Adjust ice speed
    appState.iceSpeed = Math.max(1, appState.iceSpeed - 1);
    updateIceSpeedDisplay();
    saveAppData();
  }
});

// ===========================================
// Button Event Handlers
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  // Menu button
  document.getElementById('menuBtn').addEventListener('click', () => {
    showSettings();
  });
  
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    showMain();
  });
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', () => {
    resetAllData();
  });
  
  // Keyboard fallback for development
  if (typeof PluginMessageHandler === 'undefined') {
    let spacePressed = false;
    
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        if (!spacePressed) {
          spacePressed = true;
          // Simulate longPressStart for hold behavior
          window.dispatchEvent(new CustomEvent('longPressStart'));
        }
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('scrollUp'));
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('scrollDown'));
      }
    });
    
    window.addEventListener('keyup', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (spacePressed) {
          spacePressed = false;
          // Simulate longPressEnd for release behavior
          window.dispatchEvent(new CustomEvent('longPressEnd'));
        }
      }
    });
  }
  
  // Load saved data and initialize
  loadAppData();
  
  console.log('Curling Timer initialized!');
});
