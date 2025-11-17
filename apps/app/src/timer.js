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
    
    // Rock trail tracking
    thrownRocks: [], // Array of {position: number} objects
    
    // DOM elements (will be set on init)
    timerDisplay: null,
    startButton: null,
    feedbackDisplay: null,
    rockIcon: null,
    rinkElement: null,
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
        this.rinkElement = document.querySelector('.rink');
        
        this.modeButtons = {
            button: document.getElementById('mode-button'),
            guard: document.getElementById('mode-guard'),
            takeout: document.getElementById('mode-takeout')
        };

        // Set up event listeners
        this.setupEventListeners();
        
        // Set initial mode
        this.setMode('button');
        
        // Update mode button times from storage
        this.updateModeButtonTimes();
        
        // Update display
        this.updateDisplay();
        
        // Initialize rock trail
        this.renderRockTrail();
    },

    /**
     * Update mode button times to show actual default values from storage
     */
    updateModeButtonTimes() {
        const settings = Storage.getAllSettings();
        
        // Update Button mode time
        const buttonTimeSpan = this.modeButtons.button.querySelector('.mode-time');
        if (buttonTimeSpan) {
            buttonTimeSpan.textContent = `${(settings.buttonTime / 1000).toFixed(2)}s`;
        }
        
        // Update Guard mode time
        const guardTimeSpan = this.modeButtons.guard.querySelector('.mode-time');
        if (guardTimeSpan) {
            guardTimeSpan.textContent = `${(settings.guardTime / 1000).toFixed(2)}s`;
        }
        
        // Update Takeout mode time
        const takeoutTimeSpan = this.modeButtons.takeout.querySelector('.mode-time');
        if (takeoutTimeSpan) {
            takeoutTimeSpan.textContent = `${(settings.takeoutTime / 1000).toFixed(2)}s`;
        }
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
        // sideClick event is triggered when the side button is pressed (toggle behavior)
        window.addEventListener('sideClick', () => {
            if (this.isRunning) {
                this.stopTimer();
            } else {
                this.startTimer();
            }
        });

        // Listen for settings updates to refresh mode button times
        window.addEventListener('settingsUpdated', () => {
            this.updateModeButtonTimes();
        });

        // R1 physical scroll wheel support for time adjustment
        window.addEventListener('scrollUp', () => {
            if (!this.isRunning) {
                this.adjustCurrentModeTime(50); // Increase by 50ms
            }
        });

        window.addEventListener('scrollDown', () => {
            if (!this.isRunning) {
                this.adjustCurrentModeTime(-50); // Decrease by 50ms
            }
        });

        // Keyboard fallback for development (Space bar = device button, Arrow keys = scroll wheel)
        this.setupKeyboardFallback();
    },

    /**
     * Adjust the current mode's time using scroll wheel
     * @param {number} delta - Change in milliseconds (positive or negative)
     */
    adjustCurrentModeTime(delta) {
        const settings = Storage.getAllSettings();
        let currentTime;
        
        switch (this.currentMode) {
            case 'button':
                currentTime = settings.buttonTime;
                break;
            case 'guard':
                currentTime = settings.guardTime;
                break;
            case 'takeout':
                currentTime = settings.takeoutTime;
                break;
            default:
                return;
        }
        
        // Calculate new time (constrain between 1.0s and 10.0s)
        const newTime = Math.max(1000, Math.min(10000, currentTime + delta));
        
        // Save the new time
        switch (this.currentMode) {
            case 'button':
                Storage.saveButtonTime(newTime);
                break;
            case 'guard':
                Storage.saveGuardTime(newTime);
                break;
            case 'takeout':
                Storage.saveTakeoutTime(newTime);
                break;
        }
        
        // Update the mode button display
        this.updateModeButtonTimes();
    },

    /**
     * Setup keyboard fallback for development
     * Space bar simulates the Rabbit R1 side button (toggle behavior)
     * Arrow Up/Down simulate the scroll wheel
     */
    setupKeyboardFallback() {
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                event.preventDefault();
                // Dispatch sideClick event to simulate the physical button
                const sideClickEvent = new CustomEvent('sideClick');
                window.dispatchEvent(sideClickEvent);
            }
            
            // Arrow keys simulate scroll wheel
            if (event.code === 'ArrowUp' && !event.repeat) {
                event.preventDefault();
                const scrollUpEvent = new CustomEvent('scrollUp');
                window.dispatchEvent(scrollUpEvent);
            }
            
            if (event.code === 'ArrowDown' && !event.repeat) {
                event.preventDefault();
                const scrollDownEvent = new CustomEvent('scrollDown');
                window.dispatchEvent(scrollDownEvent);
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
        
        // Record the rock position
        this.recordRockPosition();
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
     * - When time is in VALID range: rock position depends on shot type
     * - When time is HIGH (slow/light): rock is beyond hogline (bottom, static position)
     * 
     * Shot-specific positioning at perfect timing:
     * - Takeout: Rock near backline (powerful throw to clear house)
     * - Button: Rock at house center (accurate placement)
     * - Guard: Rock between house and hogline (protective position)
     */
    updateRockPosition() {
        if (!this.rockIcon) return;
        
        const defaultTime = this.getCurrentModeDefaultTime();
        const elapsed = this.elapsedTime;
        
        // Calculate rock position
        // The rink visual is 180px tall (backline to hogline section)
        // - backline at top (0px)
        // - house center at ~63px (35% from backline)
        // - hogline at bottom (180px)
        
        const rinkHeight = 180; // px - reduced from 240px for better screen fit
        const beyondBacklinePos = -10; // Position beyond backline (above rink)
        const beyondHoglinePos = 180 + 10; // Position beyond hogline (below rink)
        const houseCenter = rinkHeight * 0.35; // ~63px - house center position
        
        let rockTopPosition;
        
        if (elapsed < defaultTime * 0.7) {
            // Time is very low - rock would be beyond the backline (too fast)
            rockTopPosition = beyondBacklinePos;
        } else if (elapsed > defaultTime * 1.5) {
            // Time is very high - rock would be beyond the hogline (too light/slow)
            rockTopPosition = beyondHoglinePos;
        } else {
            // Time is in valid range - calculate position based on mode and timing
            const minTime = defaultTime * 0.7;
            const maxTime = defaultTime * 1.5;
            const timeRange = maxTime - minTime;
            const timeProgress = (elapsed - minTime) / timeRange;
            
            // Define target positions for perfect timing (at defaultTime) for each mode
            // timeProgress at defaultTime = (defaultTime - 0.7*defaultTime) / (0.8*defaultTime) = 0.375
            let targetPosition;
            
            if (this.currentMode === 'takeout') {
                // Takeout: Powerful throw - rock at or near backline (past the circles)
                // A takeout should be positioned very close to the backline
                targetPosition = rinkHeight * 0.05; // ~9px - at/near backline
            } else if (this.currentMode === 'button') {
                // Button: Accurate placement - rock stops at house center (35% of rink)
                targetPosition = houseCenter; // ~63px
            } else if (this.currentMode === 'guard') {
                // Guard: Protective position - rock stops between house and hogline (55% of rink)
                // This puts it in the guard zone, closer to hogline than house
                targetPosition = rinkHeight * 0.55; // ~99px
            } else {
                targetPosition = houseCenter; // fallback
            }
            
            // Interpolate from backline (0px) to beyond hogline (rinkHeight)
            // At perfect timing (timeProgress = 0.375), we want the rock at targetPosition
            // We need to scale the entire range so that 0.375 maps to our target
            
            // Simple linear interpolation weighted to hit target at perfect timing
            if (timeProgress <= 0.375) {
                // Before perfect timing: interpolate from backline (0) to target
                rockTopPosition = (timeProgress / 0.375) * targetPosition;
            } else {
                // After perfect timing: interpolate from target to hogline
                const remainingProgress = (timeProgress - 0.375) / (1 - 0.375);
                rockTopPosition = targetPosition + remainingProgress * (rinkHeight - targetPosition);
            }
            
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
    },

    /**
     * Record the current rock position when timer stops
     */
    recordRockPosition() {
        const maxRocks = Storage.getMaxRocks();
        
        // Get the current rock position from the DOM
        const rockTop = parseFloat(this.rockIcon.style.top || '0');
        
        // Add the current rock to thrown rocks
        this.thrownRocks.push({ position: rockTop });
        
        // If we exceed maxRocks, reset the trail
        if (this.thrownRocks.length >= maxRocks) {
            this.thrownRocks = [];
        }
        
        // Render the updated trail
        this.renderRockTrail();
    },

    /**
     * Render the rock trail on the rink
     */
    renderRockTrail() {
        // Remove existing trail rocks
        const existingTrailRocks = this.rinkElement.querySelectorAll('.trail-rock');
        existingTrailRocks.forEach(rock => rock.remove());
        
        // Render each thrown rock
        this.thrownRocks.forEach((rock, index) => {
            const trailRock = document.createElement('div');
            trailRock.className = 'rock trail-rock';
            trailRock.textContent = '🥌';
            trailRock.style.top = `${rock.position}px`;
            this.rinkElement.appendChild(trailRock);
        });
    }
};

// Initialize timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Timer.init());
} else {
    Timer.init();
}
