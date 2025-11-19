/**
 * New Main Entry Point for Experimental UI
 * Initializes physics model and new timer
 */

// Import styles
import './new-style.css';

// Import modules
import { Physics } from './physics.js';
import { NewTimer } from './new-timer.js';
import pttHandler from './lib/ptt-handler.js';

// Initialize PTT handler to prevent voice assistant activation
pttHandler.init();

// Initialize physics model
Physics.init();

// Initialize new timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        NewTimer.init();
        updateCalibrationDisplay();
    });
} else {
    NewTimer.init();
    updateCalibrationDisplay();
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

// Update calibration display periodically
setInterval(updateCalibrationDisplay, 2000);

console.log('Curling Predictor (Experimental) initialized');
console.log('Calibration:', Physics.getCalibrationInfo());
