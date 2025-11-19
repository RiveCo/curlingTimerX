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

// Set up callback to update calibration display when calibration is accepted
// Store original acceptCalibration method
const originalAcceptCalibration = NewTimer.acceptCalibration;
NewTimer.acceptCalibration = function(actualDistance) {
    originalAcceptCalibration.call(this, actualDistance);
    // Update display after calibration is accepted
    updateCalibrationDisplay();
};

// Set up callback to update calibration display when rock position is adjusted
// Store original setAdjustedDistance method
const originalSetAdjustedDistance = NewTimer.setAdjustedDistance;
NewTimer.setAdjustedDistance = function(distance) {
    originalSetAdjustedDistance.call(this, distance);
    // Update display after auto-calibration from adjustment
    updateCalibrationDisplay();
};

console.log('Curling Predictor (Experimental) initialized');
console.log('Calibration:', Physics.getCalibrationInfo());
