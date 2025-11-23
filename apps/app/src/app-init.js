/**
 * Application Initialization
 * Handles both home screen and advanced screen initialization and navigation
 */

// Import styles
import './new-style.css';
import './home-style.css';

// Import modules
import { Physics } from './physics.js';
import { SharedState } from './shared-state.js';
import { NewTimer } from './new-timer.js';
import { HomeTimer } from './home-timer.js';
import { TimerBackend } from './timer-backend.js';
import pttHandler from './lib/ptt-handler.js';

// Initialize PTT handler to prevent voice assistant activation
pttHandler.init();

// Initialize physics model (shared between both screens)
Physics.init();

// Initialize shared state
SharedState.init();

// Screen state
let currentScreen = 'home'; // 'home' or 'advanced'

/**
 * Switch to home screen
 */
function switchToHome() {
    const homeScreen = document.getElementById('home-screen');
    const advancedScreen = document.getElementById('new-main-screen');
    
    homeScreen.style.display = 'flex';
    advancedScreen.style.display = 'none';
    currentScreen = 'home';
    
    // Re-register HomeTimer's callback for real-time updates
    TimerBackend.onTick = (elapsedSeconds) => {
        HomeTimer.updateDisplay(elapsedSeconds);
    };
    
    // Update home screen with current state from SharedState
    HomeTimer.updatePositions();
    HomeTimer.updateSweepPercentage();
    HomeTimer.updateDisplay();
}

/**
 * Switch to advanced screen
 */
function switchToAdvanced() {
    const homeScreen = document.getElementById('home-screen');
    const advancedScreen = document.getElementById('new-main-screen');
    
    homeScreen.style.display = 'none';
    advancedScreen.style.display = 'flex';
    currentScreen = 'advanced';
    
    // Re-register NewTimer's callback for real-time updates
    TimerBackend.onTick = (elapsedSeconds) => {
        NewTimer.updateTimerDisplay(elapsedSeconds);
    };
    
    // Update advanced screen rendering with current state from SharedState
    NewTimer.updateDisplay();
    NewTimer.renderRink();
    NewTimer.updateSweepRecommendation();
    NewTimer.updateScoreIndicator();
}

/**
 * Update calibration info display
 */
function updateCalibrationDisplay() {
    const calInfo = Physics.getCalibrationInfo();
    const calSamplesElement = document.getElementById('cal-samples');
    if (calSamplesElement) {
        calSamplesElement.textContent = calInfo.sampleCount;
    }
}

// Expose updateCalibrationDisplay globally for reset button
window.updateCalibrationDisplay = updateCalibrationDisplay;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function init() {
    // Initialize both screens
    NewTimer.init();
    HomeTimer.init();
    
    // Set up navigation buttons
    const navToHome = document.getElementById('nav-to-home');
    const navToAdvanced = document.getElementById('nav-to-advanced');
    
    if (navToHome) {
        navToHome.addEventListener('click', switchToHome);
    }
    
    if (navToAdvanced) {
        navToAdvanced.addEventListener('click', switchToAdvanced);
    }
    
    // Update calibration display
    updateCalibrationDisplay();
    
    // Start on home screen
    switchToHome();
}

// Set up callback to update calibration display when calibration is accepted
const originalAcceptCalibration = NewTimer.acceptCalibration;
NewTimer.acceptCalibration = function(actualDistance) {
    originalAcceptCalibration.call(this, actualDistance);
    updateCalibrationDisplay();
    HomeTimer.updateCalibrationDisplay();
};

// Set up callback to update calibration display when timer starts
const originalStartTimer = NewTimer.startTimer;
NewTimer.startTimer = function() {
    originalStartTimer.call(this);
    updateCalibrationDisplay();
};

// Set up callback to update home calibration display when SharedState reports calibration changes
SharedState.addListener((event) => {
    if (event === 'calibrationAdded' || event === 'calibrationReset') {
        updateCalibrationDisplay();
        HomeTimer.updateCalibrationDisplay();
    }
});

console.log('Curling Timer X initialized');
console.log('Calibration:', Physics.getCalibrationInfo());
