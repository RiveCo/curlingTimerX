/**
 * Shared State Module
 * Manages timer state shared between home and advanced screens
 * Ensures both screens display the same information
 */

import { Physics } from './physics.js';

export const SharedState = {
    // Constants
    DEFAULT_BUTTON_WEIGHT_TIME: 3.6, // Typical draw weight time to button (seconds)
    
    // Current throw data (shared between both screens)
    currentThrow: null, // Current throw being displayed
    
    // Previous throw for calibration
    previousThrow: null,
    
    // Selected zone for the throw
    selectedZone: 'draw', // 'guard', 'draw', or 'takeout'
    
    // Manual position adjustments
    adjustedPredictedDistance: null, // Manually adjusted predicted position
    adjustedSweptDistance: null, // Manually adjusted swept position
    positionAdjustedByScrollWheel: false, // Track if scroll wheel was used for adjustment
    
    // Configuration
    SCROLL_WHEEL_STEP_SIZE: 0.5, // Feet per scroll on home screen
    
    // State change listeners (for updating UIs)
    listeners: [],
    
    /**
     * Initialize the shared state
     */
    init() {
        // Create initial throw preview for 3.6s (button weight)
        this.createInitialThrowPreview();
    },
    
    /**
     * Create initial throw preview showing default button weight throw
     */
    createInitialThrowPreview() {
        const backToHogTime = this.DEFAULT_BUTTON_WEIGHT_TIME;
        const velocity = Physics.calculateVelocity(backToHogTime);
        const predictedDistance = Physics.predictDistance(velocity);
        const sweptDistance = Physics.predictSweptDistance(predictedDistance, 'normal');
        const zone = Physics.classifyZone(predictedDistance);
        const sweepRec = Physics.getSweepRecommendation(predictedDistance, this.selectedZone);
        const willScore = Physics.willScore(predictedDistance);
        
        this.currentThrow = {
            time: backToHogTime,
            velocity: velocity,
            predictedDistance: predictedDistance,
            sweptDistance: sweptDistance,
            zone: zone,
            sweepRecommendation: sweepRec,
            willScore: willScore,
            intendedZone: this.selectedZone
        };
        
        this.notifyListeners('throwUpdated');
    },
    
    /**
     * Register a listener for state changes
     * @param {Function} callback - Function to call when state changes
     */
    addListener(callback) {
        this.listeners.push(callback);
    },
    
    /**
     * Notify all listeners of a state change
     * @param {string} event - Event type that occurred
     */
    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (e) {
                console.error('Listener error:', e);
            }
        });
    },
    
    /**
     * Set the selected zone
     * @param {string} zone - 'guard', 'draw', or 'takeout'
     */
    setZone(zone) {
        if (!['guard', 'draw', 'takeout'].includes(zone)) {
            return;
        }
        
        this.selectedZone = zone;
        
        // Update current throw's intended zone if exists
        if (this.currentThrow) {
            this.currentThrow.intendedZone = zone;
            this.currentThrow.sweepRecommendation = Physics.getSweepRecommendation(
                this.getPredictedDistance(), 
                zone
            );
        }
        
        this.notifyListeners('zoneChanged');
    },
    
    /**
     * Get the current predicted distance (with manual adjustment if any)
     * @returns {number} Predicted distance in feet
     */
    getPredictedDistance() {
        if (this.adjustedPredictedDistance !== null) {
            return this.adjustedPredictedDistance;
        }
        return this.currentThrow ? this.currentThrow.predictedDistance : 147;
    },
    
    /**
     * Get the current swept distance (with manual adjustment if any)
     * @returns {number} Swept distance in feet
     */
    getSweptDistance() {
        if (this.adjustedSweptDistance !== null) {
            return this.adjustedSweptDistance;
        }
        const predicted = this.getPredictedDistance();
        return Physics.predictSweptDistance(predicted, 'normal');
    },
    
    /**
     * Set adjusted predicted distance
     * @param {number} distance - New predicted distance in feet
     * @param {boolean} fromScrollWheel - Whether adjustment was made via scroll wheel
     */
    setAdjustedPredictedDistance(distance, fromScrollWheel = false) {
        this.adjustedPredictedDistance = distance;
        // Auto-update swept distance based on new predicted
        this.adjustedSweptDistance = Physics.predictSweptDistance(distance, 'normal');
        if (fromScrollWheel) {
            this.positionAdjustedByScrollWheel = true;
        }
        this.notifyListeners('positionAdjusted');
    },
    
    /**
     * Set adjusted swept distance independently
     * @param {number} distance - New swept distance in feet
     * @param {boolean} fromScrollWheel - Whether adjustment was made via scroll wheel
     */
    setAdjustedSweptDistance(distance, fromScrollWheel = false) {
        this.adjustedSweptDistance = distance;
        if (fromScrollWheel) {
            this.positionAdjustedByScrollWheel = true;
        }
        this.notifyListeners('positionAdjusted');
    },
    
    /**
     * Check if there are any manual position adjustments
     * @returns {boolean} True if positions have been manually adjusted
     */
    hasPositionAdjustments() {
        return this.adjustedPredictedDistance !== null || 
               this.adjustedSweptDistance !== null ||
               this.positionAdjustedByScrollWheel;
    },
    
    /**
     * Record a new throw from timer
     * @param {number} time - Time in seconds
     */
    recordThrow(time) {
        // Store previous throw as calibration candidate
        if (this.currentThrow && this.currentThrow.time > 0) {
            const finalPredictedDistance = this.getPredictedDistance();
            this.previousThrow = { 
                ...this.currentThrow, 
                finalDistance: finalPredictedDistance 
            };
            
            // Auto-calibrate if position was manually adjusted (including scroll wheel)
            if (this.hasPositionAdjustments()) {
                Physics.addCalibrationSample(this.currentThrow.time, finalPredictedDistance);
                this.previousThrow = null; // Clear since we auto-calibrated
            }
        }
        
        // Create new throw record
        const velocity = Physics.calculateVelocity(time);
        const predictedDistance = Physics.predictDistance(velocity);
        const sweptDistance = Physics.predictSweptDistance(predictedDistance, 'normal');
        const zone = Physics.classifyZone(predictedDistance);
        const sweepRec = Physics.getSweepRecommendation(predictedDistance, this.selectedZone);
        const willScore = Physics.willScore(predictedDistance);
        
        this.currentThrow = {
            time: time,
            velocity: velocity,
            predictedDistance: predictedDistance,
            sweptDistance: sweptDistance,
            zone: zone,
            sweepRecommendation: sweepRec,
            willScore: willScore,
            intendedZone: this.selectedZone
        };
        
        // Clear manual adjustments for new throw
        this.adjustedPredictedDistance = null;
        this.adjustedSweptDistance = null;
        this.positionAdjustedByScrollWheel = false;
        
        this.notifyListeners('throwRecorded');
    },
    
    /**
     * Add calibration from manual adjustment
     */
    addCalibration() {
        if (this.currentThrow && this.adjustedPredictedDistance !== null) {
            Physics.addCalibrationSample(this.currentThrow.time, this.adjustedPredictedDistance);
            this.notifyListeners('calibrationAdded');
        }
    },
    
    /**
     * Reset for a new throw
     */
    reset() {
        this.currentThrow = null;
        this.adjustedPredictedDistance = null;
        this.adjustedSweptDistance = null;
        this.positionAdjustedByScrollWheel = false;
        this.createInitialThrowPreview();
        this.notifyListeners('reset');
    },
    
    /**
     * Reset calibration to defaults
     */
    resetCalibration() {
        Physics.resetCalibration();
        this.previousThrow = null;
        this.reset();
        this.notifyListeners('calibrationReset');
    }
};
