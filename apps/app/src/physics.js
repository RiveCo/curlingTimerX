/**
 * Physics Model Module
 * Handles rock physics, velocity calculations, and position predictions
 */

export const Physics = {
    // Curling rink dimensions (in feet, per WCF rules)
    DIMENSIONS: {
        backlineToHogline: 21, // feet - distance from back line to near hog line (STANDARD DELIVERY TIMING)
        hoglineToHogline: 126, // feet - distance from near hog line to far hog line
        hoglineToBackline: 153, // feet - distance from near hog line to far back line (126 + 21 + 6)
        hoglineToTee: 147, // feet - distance from near hog line to center of far house (tee line) (126 + 21)
        hoglineToFrontOfHouse: 141, // feet - distance from near hog line to front of far 12-foot circle (126 + 15)
        hoglineToBackOfHouse: 153, // feet - distance from near hog line to back of far 12-foot circle (126 + 27) - AT BACKLINE
        guardZoneStart: 126, // feet from near hog line - guards are between far hog and front of house
        guardZoneEnd: 141, // feet from near hog line - up to front of far house
        drawZoneStart: 141, // feet from near hog line - front of far house
        drawZoneEnd: 153, // feet from near hog line - back of far house (at backline)
        takeoutZoneStart: 153, // feet from near hog line - beyond far house/backline
        takeoutZoneEnd: 160, // feet from near hog line - slightly past backline for out-of-play
    },

    // Physics constants
    CONSTANTS: {
        defaultDeceleration: 0.125, // ft/s² - calibrated for typical curling ice (3.6s back-to-hog lands on button at 147ft)
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
        deceleration: 0.125, // Current deceleration constant (ft/s²) - calibrated for typical ice
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
     * Calculate velocity at hog line from back-to-hog time
     * 
     * Timing measures from back line to near hog line (21 feet).
     * For a curling stone with constant deceleration during delivery:
     * d = v0*t - 0.5*a*t²
     * Solving for v0: v0 = (d + 0.5*a*t²) / t
     * 
     * @param {number} time - Time from back line to near hog line (seconds)
     * @param {number} deceleration - Deceleration constant (ft/s²), optional (uses calibrated if not provided)
     * @returns {number} Velocity at hog line (ft/s)
     */
    calculateVelocity(time, deceleration = null) {
        const a = deceleration !== null ? deceleration : this.calibration.deceleration;
        const distance = this.DIMENSIONS.backlineToHogline;
        
        // v0 = (d + 0.5*a*t²) / t
        return (distance + 0.5 * a * time * time) / time;
    },

    /**
     * Calculate deceleration from back-to-hog time and final distance
     * 
     * From d = v0*t - 0.5*a*t² and v_final² = v0² - 2*a*d
     * We can solve for both v0 and a
     * 
     * @param {number} backToHogTime - Time from back line to near hog (seconds)
     * @param {number} finalDistance - Final resting distance from near hog line (feet)
     * @returns {number} Deceleration (ft/s²)
     */
    calculateDeceleration(backToHogTime, finalDistance) {
        const d_timing = this.DIMENSIONS.backlineToHogline; // 21 ft
        const t = backToHogTime;
        const d_final = finalDistance;
        
        // Use iterative approach to find deceleration
        let a_guess = 0.45; // Start with typical value
        for (let i = 0; i < 5; i++) {
            const v_hog = (d_timing + 0.5 * a_guess * t * t) / t;
            a_guess = (v_hog * v_hog) / (2 * d_final);
        }
        
        return a_guess;
    },

    /**
     * Predict final resting distance from hog line
     * Using: d = v0²/(2*a) for constant deceleration until stone stops
     * 
     * @param {number} velocity - Initial velocity at hog line (ft/s)
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
        
        // d = v0² / (2*a) - distance until stone stops
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
                // Center of guard zone (midpoint between far hogline and front of far house)
                return (this.DIMENSIONS.guardZoneStart + this.DIMENSIONS.guardZoneEnd) / 2; // ~133.5 feet
            case 'draw':
                // Center of house (tee line/button)
                return this.DIMENSIONS.hoglineToTee; // 147 feet
            case 'takeout':
                // Backline (perfect takeout weight)
                return this.DIMENSIONS.hoglineToBackline; // 153 feet (backline)
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
     * @param {number} backToHogTime - Time from back line to near hog line (seconds)
     * @param {number} actualFinalDistance - Actual final distance from near hog line (feet)
     */
    addCalibrationSample(backToHogTime, actualFinalDistance) {
        // Validate actualFinalDistance is within reasonable bounds
        if (actualFinalDistance <= 0 || actualFinalDistance > 150) {
            console.warn('Invalid calibration distance:', actualFinalDistance, 'feet. Must be between 0 and 150 feet.');
            return;
        }
        
        // Calculate deceleration from back-to-hog time and actual final position
        const deceleration = this.calculateDeceleration(backToHogTime, actualFinalDistance);
        
        // Validate deceleration is reasonable (0.2 to 1.0 ft/s² for curling ice)
        if (!isFinite(deceleration) || deceleration <= 0.2 || deceleration > 1.0) {
            console.warn('Invalid calibration deceleration:', deceleration, 'ft/s² (expected 0.2-1.0)');
            return;
        }
        
        // Calculate velocity for reference
        const velocity = this.calculateVelocity(backToHogTime);
        
        // Add sample
        const sample = {
            time: backToHogTime,
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
