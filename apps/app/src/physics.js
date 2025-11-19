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
        defaultDeceleration: 9.28, // ft/s² - calibrated so 3.6s lands on button (66 ft), will be further calibrated
        sweepingEffect: 0.05, // 5% distance increase with normal sweep
        hardSweepEffect: 0.10, // 10% distance increase with hard sweep
        // Sweep recommendation thresholds
        HARD_SWEEP_THRESHOLD_FT: 10, // Trigger hard sweep if more than 10 ft short
        SWEEP_THRESHOLD_FT: 3, // Trigger normal sweep if 3-10 ft short
        OVERSHOOT_THRESHOLD_FT: 5, // Avoid hard sweep if it would overshoot by more than 5 ft
        GOOD_RANGE_FT: 3, // Consider "good" if within 3 ft of target
    },

    // Calibration data
    calibration: {
        deceleration: 9.28, // Current deceleration constant (ft/s²) - calibrated so 3.6s lands on button
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
     * Using average velocity: v_avg = distance / time
     * Note: The rock is still moving at the back line, so we use average velocity
     * rather than assuming it decelerates to zero.
     * 
     * @param {number} time - Time from hog line to back line (seconds)
     * @returns {number} Average velocity (ft/s)
     */
    calculateVelocity(time) {
        const distance = this.DIMENSIONS.hoglineToBackline;
        // v_avg = distance / time (average velocity for hog-to-back timing)
        return distance / time;
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
     * Using: distance = v² / (2*a) for constant deceleration
     * 
     * @param {number} velocity - Average velocity (ft/s)
     * @param {number} deceleration - Deceleration constant (ft/s²), optional (uses calibrated if not provided)
     * @returns {number} Predicted distance from hog line (feet)
     */
    predictDistance(velocity, deceleration = null) {
        const a = deceleration !== null ? deceleration : this.calibration.deceleration;
        
        // Validate deceleration is positive and non-zero
        if (typeof a !== 'number' || a <= 0 || !isFinite(a)) {
            console.warn('Invalid deceleration value:', a);
            return NaN;
        }
        
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
     * Get human-readable distance description relative to zone reference point
     * 
     * @param {number} distance - Distance from hog line (feet)
     * @param {string} intendedZone - Intended zone: 'guard', 'draw', or 'takeout'
     * @returns {string} Human-readable distance description
     */
    getDistanceDescription(distance, intendedZone) {
        const zoneCenter = this.getZoneCenter(intendedZone);
        const diff = distance - zoneCenter;
        const absDiff = Math.abs(diff);
        
        let description = '';
        
        if (intendedZone === 'draw') {
            // For draw shots, reference from button
            if (absDiff < 1) {
                description = 'On button';
            } else if (diff > 0) {
                description = `${absDiff.toFixed(1)}ft past button`;
            } else {
                description = `${absDiff.toFixed(1)}ft from button`;
            }
        } else if (intendedZone === 'guard') {
            // For guard shots, reference from front of house
            const frontOfHouse = this.DIMENSIONS.hoglineToFrontOfHouse;
            const guardDiff = distance - frontOfHouse;
            const absGuardDiff = Math.abs(guardDiff);
            
            if (absGuardDiff < 1) {
                description = 'At front of house';
            } else if (guardDiff < 0) {
                description = `${absGuardDiff.toFixed(1)}ft in front of house`;
            } else {
                description = `${absGuardDiff.toFixed(1)}ft into house`;
            }
        } else if (intendedZone === 'takeout') {
            // For takeout shots, reference from back of house
            const backOfHouse = this.DIMENSIONS.hoglineToBackOfHouse;
            const takeoutDiff = distance - backOfHouse;
            const absTakeoutDiff = Math.abs(takeoutDiff);
            
            if (absTakeoutDiff < 1) {
                description = 'At back of house';
            } else if (takeoutDiff > 0) {
                description = `${absTakeoutDiff.toFixed(1)}ft past back`;
            } else {
                description = `${absTakeoutDiff.toFixed(1)}ft before back`;
            }
        }
        
        return description;
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
        const hardSweptDistance = this.predictSweptDistance(predictedDistance, 'hard');
        
        // Use named constants for thresholds
        const HARD_SWEEP_THRESHOLD = this.CONSTANTS.HARD_SWEEP_THRESHOLD_FT;
        const SWEEP_THRESHOLD = this.CONSTANTS.SWEEP_THRESHOLD_FT;
        const OVERSHOOT_THRESHOLD = this.CONSTANTS.OVERSHOOT_THRESHOLD_FT;
        const GOOD_RANGE = this.CONSTANTS.GOOD_RANGE_FT;
        
        // If predicted distance is very short of center, recommend hard sweep
        if (difference < -HARD_SWEEP_THRESHOLD) {
            return 'hard_sweep';
        }
        // If short of center but hard sweep would overshoot significantly, use normal sweep
        else if (difference < -SWEEP_THRESHOLD) {
            if (hardSweptDistance > zoneCenter + OVERSHOOT_THRESHOLD) {
                return 'sweep';
            }
            return 'hard_sweep';
        }
        // If slightly short, recommend sweep
        else if (difference < 0) {
            return 'sweep';
        }
        // If past center, recommend fast (no sweep)
        else if (difference > GOOD_RANGE) {
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
        // Validate actualFinalDistance is within reasonable bounds
        if (actualFinalDistance <= 0 || actualFinalDistance > 150) {
            console.warn('Invalid calibration distance:', actualFinalDistance, 'feet. Must be between 0 and 150 feet.');
            return;
        }
        
        // Calculate velocity at hog line
        const velocity = this.calculateVelocity(hogToBackTime);
        
        // Calculate deceleration from actual final position
        const deceleration = this.calculateDeceleration(velocity, actualFinalDistance);
        
        // Validate deceleration is reasonable
        if (!isFinite(deceleration) || deceleration <= 0) {
            console.warn('Invalid calibration deceleration:', deceleration);
            return;
        }
        
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
