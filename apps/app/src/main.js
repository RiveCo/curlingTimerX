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
  iceSpeed: 5, // Default ice speed (1-10 scale)
  shots: [], // Array of shot objects (max 8)
  speedHistory: [], // Historical ice speed data
  currentView: 'main', // 'main' or 'settings'
  adjustingPosition: false // Whether we're adjusting stone position after timing
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
  animateStone();
  
  // Update timer display every 10ms
  timerState.interval = setInterval(() => {
    timerState.elapsedTime = (Date.now() - timerState.startTime) / 1000;
    updateTimerDisplay();
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
  
  timerValue.textContent = timerState.elapsedTime.toFixed(2) + 's';
  
  if (timerState.currentMode === 'timing') {
    timerStatus.textContent = 'Timing... Press to stop';
    timerDisplay.classList.add('running');
  } else if (timerState.currentMode === 'stopped') {
    timerStatus.textContent = 'Adjust position with scroll wheel';
    timerDisplay.classList.remove('running');
  } else {
    timerStatus.textContent = 'Press side button to start';
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
  
  // Calculate sweeping recommendation
  // Faster times (shorter) = need more sweep to extend
  // Slower times (longer) = need less sweep
  
  let recommendation = '';
  let intensity = '';
  
  if (time < 3.5) {
    recommendation = 'HEAVY SWEEP NEEDED - Stone is short';
    intensity = 'heavy';
  } else if (time < 4.2) {
    recommendation = 'Moderate sweep - Stone slightly short';
    intensity = 'medium';
  } else if (time < 5.0) {
    recommendation = 'Light sweep - Good weight';
    intensity = 'light';
  } else if (time < 5.5) {
    recommendation = 'Minimal sweep - Stone is heavy';
    intensity = 'light';
  } else {
    recommendation = 'NO SWEEP - Stone too heavy';
    intensity = 'heavy';
  }
  
  // Adjust for ice speed
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

window.addEventListener('scrollUp', () => {
  if (appState.currentView === 'settings') return;
  
  if (appState.adjustingPosition) {
    // Adjust stone position
    appState.currentStonePosition = Math.min(100, appState.currentStonePosition + 5);
    updateStoneIndicator(appState.currentStonePosition);
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
    // Adjust stone position
    appState.currentStonePosition = Math.max(0, appState.currentStonePosition - 5);
    updateStoneIndicator(appState.currentStonePosition);
    updateSweepingRecommendation(appState.currentShotTime, appState.iceSpeed, appState.currentStonePosition);
  } else {
    // Adjust ice speed
    appState.iceSpeed = Math.max(1, appState.iceSpeed - 1);
    updateIceSpeedDisplay();
    saveAppData();
  }
});

window.addEventListener('sideClick', () => {
  if (appState.currentView === 'settings') return;
  
  if (appState.adjustingPosition) {
    // Confirm shot and record it
    recordShot(appState.currentShotTime, appState.currentStonePosition, appState.iceSpeed);
    resetTimer();
  } else if (timerState.currentMode === 'ready') {
    startTimer();
  } else if (timerState.currentMode === 'timing') {
    stopTimer();
  } else if (timerState.currentMode === 'stopped') {
    resetTimer();
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
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('sideClick'));
      } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('scrollUp'));
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('scrollDown'));
      }
    });
  }
  
  // Load saved data and initialize
  loadAppData();
  
  console.log('Curling Timer initialized!');
});
