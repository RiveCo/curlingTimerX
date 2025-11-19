/**
 * Storage Management Module
 * Handles localStorage operations for timer settings
 */

export const Storage = {
    // Default values in milliseconds (back-to-hog timing)
    DEFAULTS: {
        buttonTime: 3000,  // 3.0s - typical draw weight (back to hog)
        guardTime: 3300,   // 3.3s - guard weight (lighter/slower) 
        takeoutTime: 2700, // 2.7s - takeout weight (faster)
        threshold: 100,    // 0.1s tolerance
        maxRocks: 8
    },

    // Storage keys
    KEYS: {
        buttonTime: 'curling_button_time',
        guardTime: 'curling_guard_time',
        takeoutTime: 'curling_takeout_time',
        threshold: 'curling_threshold',
        maxRocks: 'curling_max_rocks'
    },

    /**
     * Initialize storage with default values if not already set
     */
    init() {
        if (localStorage.getItem(this.KEYS.buttonTime) === null) {
            this.saveButtonTime(this.DEFAULTS.buttonTime);
        }
        if (localStorage.getItem(this.KEYS.guardTime) === null) {
            this.saveGuardTime(this.DEFAULTS.guardTime);
        }
        if (localStorage.getItem(this.KEYS.takeoutTime) === null) {
            this.saveTakeoutTime(this.DEFAULTS.takeoutTime);
        }
        if (localStorage.getItem(this.KEYS.threshold) === null) {
            this.saveThreshold(this.DEFAULTS.threshold);
        }
        if (localStorage.getItem(this.KEYS.maxRocks) === null) {
            this.saveMaxRocks(this.DEFAULTS.maxRocks);
        }
    },

    /**
     * Get Button mode default time
     * @returns {number} Time in milliseconds
     */
    getButtonTime() {
        const value = localStorage.getItem(this.KEYS.buttonTime);
        return value !== null ? parseInt(value, 10) : this.DEFAULTS.buttonTime;
    },

    /**
     * Save Button mode default time
     * @param {number} time - Time in milliseconds
     */
    saveButtonTime(time) {
        localStorage.setItem(this.KEYS.buttonTime, time.toString());
    },

    /**
     * Get Guard mode default time
     * @returns {number} Time in milliseconds
     */
    getGuardTime() {
        const value = localStorage.getItem(this.KEYS.guardTime);
        return value !== null ? parseInt(value, 10) : this.DEFAULTS.guardTime;
    },

    /**
     * Save Guard mode default time
     * @param {number} time - Time in milliseconds
     */
    saveGuardTime(time) {
        localStorage.setItem(this.KEYS.guardTime, time.toString());
    },

    /**
     * Get Takeout mode default time
     * @returns {number} Time in milliseconds
     */
    getTakeoutTime() {
        const value = localStorage.getItem(this.KEYS.takeoutTime);
        return value !== null ? parseInt(value, 10) : this.DEFAULTS.takeoutTime;
    },

    /**
     * Save Takeout mode default time
     * @param {number} time - Time in milliseconds
     */
    saveTakeoutTime(time) {
        localStorage.setItem(this.KEYS.takeoutTime, time.toString());
    },

    /**
     * Get threshold value
     * @returns {number} Threshold in milliseconds
     */
    getThreshold() {
        const value = localStorage.getItem(this.KEYS.threshold);
        return value !== null ? parseInt(value, 10) : this.DEFAULTS.threshold;
    },

    /**
     * Save threshold value
     * @param {number} threshold - Threshold in milliseconds
     */
    saveThreshold(threshold) {
        localStorage.setItem(this.KEYS.threshold, threshold.toString());
    },

    /**
     * Get max rocks value
     * @returns {number} Maximum number of rocks to display
     */
    getMaxRocks() {
        const value = localStorage.getItem(this.KEYS.maxRocks);
        return value !== null ? parseInt(value, 10) : this.DEFAULTS.maxRocks;
    },

    /**
     * Save max rocks value
     * @param {number} maxRocks - Maximum number of rocks to display (1-8)
     */
    saveMaxRocks(maxRocks) {
        // Clamp between 1 and 8
        const clamped = Math.max(1, Math.min(8, maxRocks));
        localStorage.setItem(this.KEYS.maxRocks, clamped.toString());
    },

    /**
     * Get all settings
     * @returns {Object} All settings
     */
    getAllSettings() {
        return {
            buttonTime: this.getButtonTime(),
            guardTime: this.getGuardTime(),
            takeoutTime: this.getTakeoutTime(),
            threshold: this.getThreshold(),
            maxRocks: this.getMaxRocks()
        };
    },

    /**
     * Reset all settings to defaults
     */
    resetToDefaults() {
        this.saveButtonTime(this.DEFAULTS.buttonTime);
        this.saveGuardTime(this.DEFAULTS.guardTime);
        this.saveTakeoutTime(this.DEFAULTS.takeoutTime);
        this.saveThreshold(this.DEFAULTS.threshold);
        this.saveMaxRocks(this.DEFAULTS.maxRocks);
    }
};

// Initialize storage on load
Storage.init();
