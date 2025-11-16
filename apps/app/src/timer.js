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
    timeAdjuster: null,
    timeAdjusterWheel: null,
    
    // Time adjuster state
    timeAdjusterVisible: false,
    currentTimeOptions: [],
    currentTimeIndex: 0,

    /**
     * Initialize the timer module
     */
    init() {
        // Get DOM elements
        this.timerDisplay = document.getElementById('timer-display');
        this.startButton = document.getElementById('start-button');
        this.feedbackDisplay = document.getElementById('feedback-display');
        this.rockIcon = document.getElementById('rock-icon');
        this.timeAdjuster = document.getElementById('time-adjuster');
        this.timeAdjusterWheel = document.getElementById('time-adjuster-wheel');
        
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

        // Listen for settings updates to refresh mode button times
        window.addEventListener('settingsUpdated', () => {
            this.updateModeButtonTimes();
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
        
        // Show time adjuster for selected mode
        this.showTimeAdjuster();
    },

    /**
     * Show the time adjuster wheel for the current mode
     */
    showTimeAdjuster() {
        if (!this.timeAdjuster || !this.timeAdjusterWheel) return;
        
        // Show the time adjuster
        this.timeAdjuster.style.display = 'block';
        this.timeAdjusterVisible = true;
        
        // Get current mode's time
        const currentTime = this.getCurrentModeDefaultTime();
        
        // Create time options (1.0s to 10.0s in 0.05s increments)
        this.currentTimeOptions = [];
        for (let time = 1000; time <= 10000; time += 50) {
            this.currentTimeOptions.push(time);
        }
        
        // Find current index
        this.currentTimeIndex = this.currentTimeOptions.indexOf(currentTime);
        if (this.currentTimeIndex === -1) {
            this.currentTimeIndex = Math.round(this.currentTimeOptions.length / 2);
        }
        
        // Build the wheel
        this.buildTimeAdjusterWheel();
    },

    /**
     * Hide the time adjuster wheel
     */
    hideTimeAdjuster() {
        if (!this.timeAdjuster) return;
        
        this.timeAdjuster.style.display = 'none';
        this.timeAdjusterVisible = false;
    },

    /**
     * Build the time adjuster wheel interface
     */
    buildTimeAdjusterWheel() {
        if (!this.timeAdjusterWheel) return;
        
        // Clear existing content
        this.timeAdjusterWheel.innerHTML = '';
        
        // Create wheel structure
        const wheelWrapper = document.createElement('div');
        wheelWrapper.className = 'wheel-wrapper';
        
        const wheelList = document.createElement('div');
        wheelList.className = 'wheel-list';
        
        // Create wheel items
        this.currentTimeOptions.forEach(time => {
            const item = document.createElement('div');
            item.className = 'wheel-item';
            item.dataset.value = time;
            item.textContent = `${(time / 1000).toFixed(2)}s`;
            wheelList.appendChild(item);
        });
        
        wheelWrapper.appendChild(wheelList);
        this.timeAdjusterWheel.appendChild(wheelWrapper);
        
        // Set initial position
        this.scrollTimeAdjusterToIndex(this.currentTimeIndex, false);
        
        // Add touch/scroll event listeners
        this.addTimeAdjusterEventListeners(wheelList);
    },

    /**
     * Add event listeners to time adjuster wheel
     * @param {HTMLElement} wheelList - The wheel list element
     */
    addTimeAdjusterEventListeners(wheelList) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        const itemHeight = 30; // Height of each item in pixels
        
        const handleStart = (e) => {
            isDragging = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            currentY = startY;
            wheelList.style.transition = 'none';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const deltaY = currentY - startY;
            
            // Calculate new index based on drag distance
            const indexChange = Math.round(-deltaY / itemHeight);
            let newIndex = this.currentTimeIndex + indexChange;
            
            // Clamp index
            newIndex = Math.max(0, Math.min(this.currentTimeOptions.length - 1, newIndex));
            
            // Update transform
            const offset = -newIndex * itemHeight + (this.timeAdjusterWheel.offsetHeight / 2) - (itemHeight / 2);
            wheelList.style.transform = `translateY(${offset}px)`;
            
            // Update active item
            this.updateTimeAdjusterActiveItem(wheelList, newIndex);
        };
        
        const handleEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            wheelList.style.transition = 'transform 0.3s ease';
            
            const deltaY = currentY - startY;
            const indexChange = Math.round(-deltaY / itemHeight);
            let newIndex = this.currentTimeIndex + indexChange;
            
            // Clamp index
            newIndex = Math.max(0, Math.min(this.currentTimeOptions.length - 1, newIndex));
            
            // Update current index
            this.currentTimeIndex = newIndex;
            
            // Snap to position
            this.scrollTimeAdjusterToIndex(newIndex, true);
            
            // Save new time value
            const newTime = this.currentTimeOptions[newIndex];
            this.saveCurrentModeTime(newTime);
            
            // Update mode button display
            this.updateModeButtonTimes();
            
            // Reset start position
            startY = 0;
        };
        
        // Touch events
        wheelList.addEventListener('touchstart', handleStart, { passive: false });
        wheelList.addEventListener('touchmove', handleMove, { passive: false });
        wheelList.addEventListener('touchend', handleEnd);
        
        // Mouse events
        wheelList.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    },

    /**
     * Scroll time adjuster wheel to specific index
     * @param {number} index - Index to scroll to
     * @param {boolean} animate - Whether to animate
     */
    scrollTimeAdjusterToIndex(index, animate) {
        if (!this.timeAdjusterWheel) return;
        
        const wheelList = this.timeAdjusterWheel.querySelector('.wheel-list');
        if (!wheelList) return;
        
        const itemHeight = 30;
        const offset = -index * itemHeight + (this.timeAdjusterWheel.offsetHeight / 2) - (itemHeight / 2);
        
        if (animate) {
            wheelList.style.transition = 'transform 0.3s ease';
        } else {
            wheelList.style.transition = 'none';
        }
        
        wheelList.style.transform = `translateY(${offset}px)`;
        
        // Update active item
        this.updateTimeAdjusterActiveItem(wheelList, index);
    },

    /**
     * Update active item styling in time adjuster
     * @param {HTMLElement} wheelList - The wheel list element
     * @param {number} activeIndex - Index of active item
     */
    updateTimeAdjusterActiveItem(wheelList, activeIndex) {
        const items = wheelList.querySelectorAll('.wheel-item');
        items.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    /**
     * Save the current mode's time
     * @param {number} time - Time in milliseconds
     */
    saveCurrentModeTime(time) {
        switch (this.currentMode) {
            case 'button':
                Storage.saveButtonTime(time);
                break;
            case 'guard':
                Storage.saveGuardTime(time);
                break;
            case 'takeout':
                Storage.saveTakeoutTime(time);
                break;
        }
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
        
        // Hide time adjuster while timer is running
        this.hideTimeAdjuster();
        
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
        // The rink visual is 180px tall (updated for new layout)
        // - backline at top (0px)
        // - hogline at bottom (180px)
        
        const rinkHeight = 180; // px - updated for new layout
        const rockSize = 24; // approximate emoji size
        const beyondBacklinePos = -10; // Position beyond backline (above rink)
        const beyondHoglinePos = 180 + 10; // Position beyond hogline (below rink)
        
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
            // At defaultTime * 1.5: rock should be at hogline (180px)
            
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
        
        // Show time adjuster again after clearing feedback
        if (!this.isRunning) {
            this.showTimeAdjuster();
        }
    }
};

// Initialize timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Timer.init());
} else {
    Timer.init();
}
