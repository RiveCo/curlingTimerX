/**
 * Timer Logic and Mode Management Module
 * Handles timer functionality, mode switching, and feedback calculation
 */

const Timer = {
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
    modeButtons: {},

    /**
     * Initialize the timer module
     */
    init() {
        // Get DOM elements
        this.timerDisplay = document.getElementById('timer-display');
        this.startButton = document.getElementById('start-button');
        this.feedbackDisplay = document.getElementById('feedback-display');
        
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
    }
};

// Initialize timer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Timer.init());
} else {
    Timer.init();
}
