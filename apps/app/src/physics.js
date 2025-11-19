/**
 * Physics Model Module
 * Handles rock physics, velocity calculations, and position predictions
 */

export const Physics = {
    // Curling rink dimensions (in feet, per WCF rules)
    DIMENSIONS: {
        hoglineToBackline: 126, // feet - distance from hog line to back line
        hoglineToTee: 66, // feet - distance from hog line to center of house (tee line)
        hoglineToFrontOfHouse: 54, // feet - distance from hog line to front 12-foot circle
        hoglineToBackOfHouse: 78, // feet - distance from hog line to back 12-foot circle
        guardZoneStart: 0, // feet from hog line - guards are before house
        guardZoneEnd: 54, // feet from hog line - up to front of house
        drawZoneStart: 54, // feet from hog line - front of house
        drawZoneEnd: 78, // feet from hog line - back of house
        takeoutZoneStart: 78, // feet from hog line - beyond house
        takeoutZoneEnd: 126, // feet from hog line - to backline
    },

    // Physics constants
    CONSTANTS: {
        defaultDeceleration: 0.15, // ft/s² - initial guess, will be calibrated
        sweepingEffect: 0.05, // 5% distance increase with normal sweep
        hardSweepEffect: 0.10, // 10% distance increase with hard sweep
    },

    // Calibration data
    calibration: {
        deceleration: 0.15, // Current deceleration constant (ft/s²)
        samples: [], // Array of calibration samples: {time, distance, velocity, deceleration}
        maxSamples: 10, // Keep last 10 calibration throws
    },

    /**
     * Initialize physics model
     */
    init() {
        // Load calibration data from storage if available
        this.loadCalibration();
    },

    /**
     * Calculate velocity from hog-to-backline time
     * Using: distance = average_velocity * time
     * For constant deceleration: v_avg = (v0 + v_final) / 2
     * Assuming v_final ≈ 0, v_avg ≈ v0 / 2
     * So: distance = (v0 / 2) * time => v0 = 2 * distance / time
     * 
     * @param {number} time - Time from hog line to back line (seconds)
     * @returns {number} Initial velocity at hog line (ft/s)
     */
    calculateVelocity(time) {
        const distance = this.DIMENSIONS.hoglineToBackline;
        // v0 = 2 * distance / time (for constant deceleration to ~0)
        return (2 * distance) / time;
    },

    /**
     * Calculate deceleration from velocity and distance
     * Using: v² = v0² - 2*a*d => a = (v0² - v²) / (2*d)
     * Assuming final velocity v ≈ 0: a = v0² / (2*d)
     * 
     * @param {number} velocity - Initial velocity (ft/s)
     * @param {number} distance - Distance traveled (feet)
     * @returns {number} Deceleration (ft/s²)
     */
    calculateDeceleration(velocity, distance) {
        return (velocity * velocity) / (2 * distance);
    },

    /**
     * Predict final resting distance from hog line
     * Using: distance = v0² / (2*a)
     * 
     * @param {number} velocity - Initial velocity at hog line (ft/s)
     * @param {number} deceleration - Deceleration constant (ft/s²), optional (uses calibrated if not provided)
     * @returns {number} Predicted distance from hog line (feet)
     */
    predictDistance(velocity, deceleration = null) {
        const a = deceleration !== null ? deceleration : this.calibration.deceleration;
        return (velocity * velocity) / (2 * a);
    },

    /**
     * Predict distance with sweeping effect
     * 
     * @param {number} baseDistance - Base predicted distance without sweeping (feet)
     * @param {string} sweepIntensity - 'normal' or 'hard'
     * @returns {number} Distance with sweeping (feet)
     */
    predictSweptDistance(baseDistance, sweepIntensity = 'normal') {
        const effect = sweepIntensity === 'hard' 
            ? this.CONSTANTS.hardSweepEffect 
            : this.CONSTANTS.sweepingEffect;
        return baseDistance * (1 + effect);
    },

    /**
     * Classify throw into zone based on predicted distance
     * 
     * @param {number} distance - Predicted distance from hog line (feet)
     * @returns {string} Zone: 'guard', 'draw', or 'takeout'
     */
    classifyZone(distance) {
        if (distance < this.DIMENSIONS.drawZoneStart) {
            return 'guard';
        } else if (distance <= this.DIMENSIONS.drawZoneEnd) {
            return 'draw';
        } else {
            return 'takeout';
        }
    },

    /**
     * Get center position for a zone
     * 
     * @param {string} zone - Zone name: 'guard', 'draw', or 'takeout'
     * @returns {number} Center position in feet from hog line
     */
    getZoneCenter(zone) {
        switch (zone) {
            case 'guard':
                // Center of guard zone (midpoint between hogline and front of house)
                return (this.DIMENSIONS.guardZoneStart + this.DIMENSIONS.guardZoneEnd) / 2; // ~27 feet
            case 'draw':
                // Center of house (tee line/button)
                return this.DIMENSIONS.hoglineToTee; // 66 feet
            case 'takeout':
                // Backline (perfect takeout weight)
                return this.DIMENSIONS.takeoutZoneEnd; // 126 feet (backline)
            default:
                return this.DIMENSIONS.hoglineToTee;
        }
    },

    /**
     * Determine sweeping recommendation based on predicted distance and intended zone
     * 
     * @param {number} predictedDistance - Predicted distance without sweeping (feet)
     * @param {string} intendedZone - Intended zone: 'guard', 'draw', or 'takeout'
     * @returns {string} Recommendation: 'hard_sweep', 'sweep', 'fast', or 'good'
     */
    getSweepRecommendation(predictedDistance, intendedZone) {
        const zoneCenter = this.getZoneCenter(intendedZone);
        const difference = predictedDistance - zoneCenter;
        
        // Calculate what would happen with sweeping
        const normalSweptDistance = this.predictSweptDistance(predictedDistance, 'normal');
        const hardSweptDistance = this.predictSweptDistance(predictedDistance, 'hard');
        
        // If predicted distance is very short of center, recommend hard sweep
        if (difference < -10) { // More than 10 feet short
            return 'hard_sweep';
        }
        // If short of center but hard sweep would overshoot significantly, use normal sweep
        else if (difference < -3) { // 3-10 feet short
            if (hardSweptDistance > zoneCenter + 5) {
                return 'sweep';
            }
            return 'hard_sweep';
        }
        // If slightly short, recommend sweep
        else if (difference < 0) { // 0-3 feet short
            return 'sweep';
        }
        // If past center, recommend fast (no sweep)
        else if (difference > 3) { // More than 3 feet past
            return 'fast';
        }
        // Otherwise, it's good
        else {
            return 'good';
        }
    },

    /**
     * Check if predicted distance will score (inside the house)
     * 
     * @param {number} distance - Predicted distance from hog line (feet)
     * @returns {boolean} True if stone will be inside the house
     */
    willScore(distance) {
        return distance >= this.DIMENSIONS.hoglineToFrontOfHouse && 
               distance <= this.DIMENSIONS.hoglineToBackOfHouse;
    },

    /**
     * Add a calibration sample and update deceleration
     * 
     * @param {number} hogToBackTime - Time from hog to back line (seconds)
     * @param {number} actualFinalDistance - Actual final distance from hog line (feet)
     */
    addCalibrationSample(hogToBackTime, actualFinalDistance) {
        // Calculate velocity at hog line
        const velocity = this.calculateVelocity(hogToBackTime);
        
        // Calculate deceleration from actual final position
        const deceleration = this.calculateDeceleration(velocity, actualFinalDistance);
        
        // Add sample
        const sample = {
            time: hogToBackTime,
            distance: actualFinalDistance,
            velocity: velocity,
            deceleration: deceleration,
            timestamp: Date.now()
        };
        
        this.calibration.samples.push(sample);
        
        // Keep only last N samples
        if (this.calibration.samples.length > this.calibration.maxSamples) {
            this.calibration.samples.shift();
        }
        
        // Update deceleration using weighted average (more recent = more weight)
        this.updateDeceleration();
        
        // Save to storage
        this.saveCalibration();
    },

    /**
     * Update deceleration constant using weighted average of samples
     * More recent samples have higher weight
     */
    updateDeceleration() {
        if (this.calibration.samples.length === 0) {
            this.calibration.deceleration = this.CONSTANTS.defaultDeceleration;
            return;
        }
        
        // Use weighted average with linear weights (most recent = highest weight)
        let weightedSum = 0;
        let totalWeight = 0;
        
        this.calibration.samples.forEach((sample, index) => {
            const weight = index + 1; // 1, 2, 3, ... (most recent has highest weight)
            weightedSum += sample.deceleration * weight;
            totalWeight += weight;
        });
        
        this.calibration.deceleration = weightedSum / totalWeight;
    },

    /**
     * Save calibration data to localStorage
     */
    saveCalibration() {
        try {
            localStorage.setItem('curling_calibration', JSON.stringify({
                deceleration: this.calibration.deceleration,
                samples: this.calibration.samples
            }));
        } catch (e) {
            console.error('Failed to save calibration:', e);
        }
    },

    /**
     * Load calibration data from localStorage
     */
    loadCalibration() {
        try {
            const data = localStorage.getItem('curling_calibration');
            if (data) {
                const parsed = JSON.parse(data);
                this.calibration.deceleration = parsed.deceleration || this.CONSTANTS.defaultDeceleration;
                this.calibration.samples = parsed.samples || [];
            } else {
                this.calibration.deceleration = this.CONSTANTS.defaultDeceleration;
            }
        } catch (e) {
            console.error('Failed to load calibration:', e);
            this.calibration.deceleration = this.CONSTANTS.defaultDeceleration;
        }
    },

    /**
     * Reset calibration to defaults
     */
    resetCalibration() {
        this.calibration.deceleration = this.CONSTANTS.defaultDeceleration;
        this.calibration.samples = [];
        this.saveCalibration();
    },

    /**
     * Get current calibration info
     * @returns {Object} Calibration information
     */
    getCalibrationInfo() {
        return {
            deceleration: this.calibration.deceleration,
            sampleCount: this.calibration.samples.length,
            samples: this.calibration.samples
        };
    }
};

// Initialize on load
Physics.init();
