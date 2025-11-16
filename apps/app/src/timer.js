/**
 * Timer Logic and Mode Management Module
 * Handles timer functionality, mode switching, and feedback calculation
 */

import { Storage } from './storage.js';

export const Timer = {
    // Timer state
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    animationFrameId: null,
    
    // Current mode
    currentMode: 'button', // 'button', 'guard', or 'takeout'
    
    // DOM elements (will be set on init)
    timerDisplay: null,
    startButton: null,
    feedbackDisplay: null,
    rockIcon: null,
    modeButtons: {},

    /**
     * Initialize the timer module
     */
    init() {
        // Get DOM elements
        this.timerDisplay = document.getElementById('timer-display');
        this.startButton = document.getElementById('start-button');
        this.feedbackDisplay = document.getElementById('feedback-display');
        this.rockIcon = document.getElementById('rock-icon');
        
        this.modeButtons = {
            button: document.getElementById('mode-button'),
            guard: document.getElementById('mode-guard'),
            takeout: document.getElementById('mode-takeout')
        };

        // Set up event listeners
        this.setupEventListeners();
        
        // Set initial mode
        this.setMode('button');
        
        // Update display
        this.updateDisplay();
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Mode selection buttons
        this.modeButtons.button.addEventListener('click', () => this.setMode('button'));
        this.modeButtons.guard.addEventListener('click', () => this.setMode('guard'));
        this.modeButtons.takeout.addEventListener('click', () => this.setMode('takeout'));

        // Start button - touch events
        this.startButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startTimer();
        });
        
        this.startButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopTimer();
        });
        
        this.startButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.stopTimer();
        });

        // Start button - mouse events (for desktop compatibility)
        this.startButton.addEventListener('mousedown', () => {
            this.startTimer();
        });
        
        this.startButton.addEventListener('mouseup', () => {
            this.stopTimer();
        });
        
        this.startButton.addEventListener('mouseleave', () => {
            if (this.isRunning) {
                this.stopTimer();
            }
        });

        // Rabbit R1 device side button support
        // longPressStart event is triggered when the side button is pressed
        window.addEventListener('longPressStart', () => {
            this.startTimer();
        });
        
        // longPressEnd event is triggered when the side button is released
        window.addEventListener('longPressEnd', () => {
            if (this.isRunning) {
                this.stopTimer();
            }
        });

        // Keyboard fallback for development (Space bar = device button)
        this.setupKeyboardFallback();
    },

    /**
     * Setup keyboard fallback for development
     * Space bar simulates the Rabbit R1 side button
     */
    setupKeyboardFallback() {
        let spacePressed = false;
        
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                event.preventDefault();
                if (!spacePressed) {
                    spacePressed = true;
                    this.startTimer();
                }
            }
        });
        
        window.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                if (spacePressed) {
                    spacePressed = false;
                    if (this.isRunning) {
                        this.stopTimer();
                    }
                }
            }
        });
    },

    /**
     * Set the current mode
     * @param {string} mode - 'button', 'guard', or 'takeout'
     */
    setMode(mode) {
        if (!['button', 'guard', 'takeout'].includes(mode)) {
            return;
        }
        
        this.currentMode = mode;
        
        // Update button states
        Object.keys(this.modeButtons).forEach(key => {
            if (key === mode) {
                this.modeButtons[key].classList.add('active');
            } else {
                this.modeButtons[key].classList.remove('active');
            }
        });
        
        // Clear feedback when mode changes
        this.clearFeedback();
    },

    /**
     * Start the timer
     */
    startTimer() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        
        // Clear previous feedback
        this.clearFeedback();
        
        // Add active state to button
        this.startButton.classList.add('active');
        
        // Start animation loop
        this.updateTimer();
    },

    /**
     * Stop the timer
     */
    stopTimer() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Remove active state from button
        this.startButton.classList.remove('active');
        
        // Calculate and show feedback
        this.showFeedback();
    },

    /**
     * Update timer display (called on each animation frame)
     */
    updateTimer() {
        if (!this.isRunning) {
            return;
        }
        
        this.elapsedTime = performance.now() - this.startTime;
        this.updateDisplay();
        this.updateRockPosition();
        
        // Continue animation loop
        this.animationFrameId = requestAnimationFrame(() => this.updateTimer());
    },

    /**
     * Update the timer display
     */
    updateDisplay() {
        const timeInSeconds = (this.elapsedTime / 1000).toFixed(3);
        this.timerDisplay.textContent = `${timeInSeconds}s`;
    },

    /**
     * Update the rock position based on elapsed time
     * Rock visualization logic:
     * - Rock shows where the stone will land if released now (without sweeping)
     * - When time is LOW (fast): rock is beyond the backline (top, static position)
     * - When time is in VALID range: rock moves from backline toward hogline
     * - When time is HIGH (slow/light): rock is beyond hogline (bottom, static position)
     */
    updateRockPosition() {
        if (!this.rockIcon) return;
        
        const defaultTime = this.getCurrentModeDefaultTime();
        const elapsed = this.elapsedTime;
        
        // Calculate rock position
        // The rink visual is 100px tall with:
        // - backline at top (0px)
        // - hogline at bottom (100px)
        
        const rinkHeight = 100; // px
        const rockSize = 24; // approximate emoji size
        const beyondBacklinePos = -12; // Position beyond backline (above rink)
        const beyondHoglinePos = 100 + 12; // Position beyond hogline (below rink)
        
        let rockTopPosition;
        
        if (elapsed < defaultTime * 0.7) {
            // Time is very low - rock would be beyond the backline (too fast)
            rockTopPosition = beyondBacklinePos;
        } else if (elapsed > defaultTime * 1.5) {
            // Time is very high - rock would be beyond the hogline (too light/slow)
            rockTopPosition = beyondHoglinePos;
        } else {
            // Time is in valid range - interpolate position between backline and hogline
            // At defaultTime * 0.7: rock should be at backline (0px)
            // At defaultTime: rock should be at optimal position (closer to hogline)
            // At defaultTime * 1.5: rock should be at hogline (100px)
            
            const minTime = defaultTime * 0.7;
            const maxTime = defaultTime * 1.5;
            const timeRange = maxTime - minTime;
            const timeProgress = (elapsed - minTime) / timeRange;
            
            // Map time progress to position (0 = backline/top, 1 = hogline/bottom)
            rockTopPosition = timeProgress * rinkHeight;
            
            // Clamp to rink bounds
            rockTopPosition = Math.max(0, Math.min(rinkHeight, rockTopPosition));
        }
        
        // Apply position
        this.rockIcon.style.top = `${rockTopPosition}px`;
    },

    /**
     * Get the default time for the current mode
     * @returns {number} Default time in milliseconds
     */
    getCurrentModeDefaultTime() {
        const settings = Storage.getAllSettings();
        switch (this.currentMode) {
            case 'button':
                return settings.buttonTime;
            case 'guard':
                return settings.guardTime;
            case 'takeout':
                return settings.takeoutTime;
            default:
                return 0;
        }
    },

    /**
     * Calculate and show feedback based on elapsed time
     */
    showFeedback() {
        const defaultTime = this.getCurrentModeDefaultTime();
        const threshold = Storage.getThreshold();
        const elapsed = this.elapsedTime;
        
        let feedbackType = '';
        let feedbackText = '';
        
        if (this.currentMode === 'takeout') {
            // Special rule for Takeout: time <= default is Perfect, otherwise sweeping needed
            if (elapsed <= defaultTime) {
                feedbackType = 'perfect';
                feedbackText = 'Perfect!';
            } else {
                feedbackType = 'slow';
                feedbackText = 'Sweeping Needed';
            }
        } else {
            // Button and Guard modes
            const difference = Math.abs(elapsed - defaultTime);
            
            if (difference <= threshold) {
                feedbackType = 'perfect';
                feedbackText = 'Perfect!';
            } else if (elapsed > defaultTime) {
                feedbackType = 'slow';
                feedbackText = 'Slow';
            } else {
                feedbackType = 'fast';
                feedbackText = 'Fast';
            }
        }
        
        // Update feedback display
        this.feedbackDisplay.textContent = feedbackText;
        this.feedbackDisplay.className = 'feedback-display ' + feedbackType;
        this.feedbackDisplay.style.display = 'block';
    },

    /**
     * Clear feedback display
     */
    clearFeedback() {
        this.feedbackDisplay.textContent = '';
        this.feedbackDisplay.className = 'feedback-display';
        this.feedbackDisplay.style.display = 'none';
        this.elapsedTime = 0;
        this.updateDisplay();
        this.updateRockPosition();
    }
};

// Initialize timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Timer.init());
} else {
    Timer.init();
}
