/**
 * Home Timer Module - Stopwatch Style Interface
 * Implements discrete stopwatch-like timer with essential curling information
 */

import { Physics } from './physics.js';
import { TimerBackend } from './timer-backend.js';
import { SharedState } from './shared-state.js';

export const HomeTimer = {
    
    // Dragging state
    isDraggingPredicted: false,
    isDraggingSwept: false,
    dragStartY: 0,
    dragStartPosition: 0,
    
    // DOM elements
    homeScreen: null,
    timeDisplay: null,
    sweepPercentage: null,
    touchArea: null,
    predictedPosElement: null,
    sweptPosElement: null,
    predictedPosElementRight: null,
    sweptPosElementRight: null,
    mainElement: null,
    calSamplesElement: null,
    resetButton: null,
    
    // Scale configuration
    SCALE_CONFIG: {
        topPosition: 153,    // Back line (top of scale)
        middlePosition: 141, // Front of house
        bottomPosition: 126, // Hog line (bottom of scale)
        viewportRange: 27,   // 153 - 126 = 27 feet
    },

    /**
     * Initialize the home timer module
     */
    init() {
        // Get DOM elements
        this.homeScreen = document.getElementById('home-screen');
        this.timeDisplay = document.getElementById('home-time-display');
        this.sweepPercentage = document.getElementById('home-sweep-percentage');
        this.touchArea = document.getElementById('home-timer-touch-area');
        this.predictedPosElement = document.getElementById('home-predicted-pos');
        this.sweptPosElement = document.getElementById('home-swept-pos');
        this.predictedPosElementRight = document.getElementById('home-predicted-pos-right');
        this.sweptPosElementRight = document.getElementById('home-swept-pos-right');
        this.mainElement = this.homeScreen.querySelector('.home-main');
        this.calSamplesElement = document.getElementById('home-cal-samples');
        this.resetButton = document.getElementById('home-reset-calibration');
        
        // Set up timer backend callback
        this.registerCallback();
        
        // Listen to shared state changes
        SharedState.addListener((event) => {
            this.onStateChange(event);
        });
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize display from shared state
        this.updatePositions();
        this.updateDisplay();
        this.updateCalibrationDisplay();
    },
    
    /**
     * Register timer callback for real-time updates
     */
    registerCallback() {
        TimerBackend.onTick = (elapsedSeconds) => {
            this.updateDisplay(elapsedSeconds);
        };
    },

    /**
     * Handle shared state changes
     */
    onStateChange(event) {
        switch (event) {
            case 'throwRecorded':
            case 'throwUpdated':
            case 'positionAdjusted':
            case 'reset':
                this.updatePositions();
                this.updateSweepPercentage();
                this.updateDisplay();
                break;
            case 'calibrationAdded':
            case 'calibrationReset':
                this.updateCalibrationDisplay();
                break;
            case 'zoneChanged':
                this.timeDisplay.setAttribute('data-zone', SharedState.selectedZone);
                this.updateSweepPercentage();
                break;
        }
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Reset button
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetCalibration();
            });
        }
        
        // Time display click to cycle zones
        this.timeDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cycleZone();
        });
        
        // Touch area for timer control (press anywhere to start)
        this.touchArea.addEventListener('touchstart', (e) => {
            if (!this.isDraggingPredicted && !this.isDraggingSwept) {
                e.preventDefault();
                this.startTimer();
            }
        });
        
        this.touchArea.addEventListener('touchend', (e) => {
            if (!this.isDraggingPredicted && !this.isDraggingSwept) {
                e.preventDefault();
                this.stopTimer();
            }
        });
        
        this.touchArea.addEventListener('touchcancel', (e) => {
            if (!this.isDraggingPredicted && !this.isDraggingSwept) {
                e.preventDefault();
                this.stopTimer();
            }
        });
        
        // Mouse events for desktop
        this.touchArea.addEventListener('mousedown', () => {
            if (!this.isDraggingPredicted && !this.isDraggingSwept) {
                this.startTimer();
            }
        });
        
        this.touchArea.addEventListener('mouseup', () => {
            if (!this.isDraggingPredicted && !this.isDraggingSwept) {
                this.stopTimer();
            }
        });
        
        // Set up dragging for position indicators
        this.setupPositionDragging();
    },

    /**
     * Set up dragging for position indicators
     */
    setupPositionDragging() {
        // Predicted position dragging
        const onPredictedDragStart = (clientY) => {
            if (TimerBackend.isRunning) return false;
            this.isDraggingPredicted = true;
            this.dragStartY = clientY;
            this.dragStartPosition = SharedState.getPredictedDistance();
            this.predictedPosElement.classList.add('dragging');
            return true;
        };
        
        const onPredictedDragMove = (clientY) => {
            if (!this.isDraggingPredicted) return;
            const deltaY = this.dragStartY - clientY;
            const scale = this.mainElement.offsetHeight / this.SCALE_CONFIG.viewportRange;
            const deltaDistance = (deltaY / scale) * 0.25; // 1/4 sensitivity like advanced screen
            
            const newPosition = Math.max(
                this.SCALE_CONFIG.bottomPosition, 
                Math.min(this.SCALE_CONFIG.topPosition, this.dragStartPosition + deltaDistance)
            );
            
            this.setPredictedPosition(newPosition);
        };
        
        const onPredictedDragEnd = () => {
            if (this.isDraggingPredicted) {
                this.isDraggingPredicted = false;
                this.predictedPosElement.classList.remove('dragging');
                this.onPositionAdjusted();
            }
        };
        
        // Touch events for predicted
        this.predictedPosElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && onPredictedDragStart(e.touches[0].clientY)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        this.predictedPosElement.addEventListener('touchmove', (e) => {
            if (this.isDraggingPredicted && e.touches.length === 1) {
                e.preventDefault();
                e.stopPropagation();
                onPredictedDragMove(e.touches[0].clientY);
            }
        });
        
        this.predictedPosElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onPredictedDragEnd();
        });
        
        // Mouse events for predicted
        this.predictedPosElement.addEventListener('mousedown', (e) => {
            if (onPredictedDragStart(e.clientY)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingPredicted) {
                e.preventDefault();
                onPredictedDragMove(e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDraggingPredicted) {
                onPredictedDragEnd();
            }
        });
        
        // Swept position dragging
        const onSweptDragStart = (clientY) => {
            if (TimerBackend.isRunning) return false;
            this.isDraggingSwept = true;
            this.dragStartY = clientY;
            this.dragStartPosition = SharedState.getSweptDistance();
            this.sweptPosElement.classList.add('dragging');
            return true;
        };
        
        const onSweptDragMove = (clientY) => {
            if (!this.isDraggingSwept) return;
            const deltaY = this.dragStartY - clientY;
            const scale = this.mainElement.offsetHeight / this.SCALE_CONFIG.viewportRange;
            const deltaDistance = (deltaY / scale) * 0.25; // 1/4 sensitivity
            
            const newPosition = Math.max(
                this.SCALE_CONFIG.bottomPosition, 
                Math.min(this.SCALE_CONFIG.topPosition, this.dragStartPosition + deltaDistance)
            );
            
            this.setSweptPosition(newPosition);
        };
        
        const onSweptDragEnd = () => {
            if (this.isDraggingSwept) {
                this.isDraggingSwept = false;
                this.sweptPosElement.classList.remove('dragging');
                this.onPositionAdjusted();
            }
        };
        
        // Touch events for swept
        this.sweptPosElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && onSweptDragStart(e.touches[0].clientY)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        this.sweptPosElement.addEventListener('touchmove', (e) => {
            if (this.isDraggingSwept && e.touches.length === 1) {
                e.preventDefault();
                e.stopPropagation();
                onSweptDragMove(e.touches[0].clientY);
            }
        });
        
        this.sweptPosElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onSweptDragEnd();
        });
        
        // Mouse events for swept
        this.sweptPosElement.addEventListener('mousedown', (e) => {
            if (onSweptDragStart(e.clientY)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingSwept) {
                e.preventDefault();
                onSweptDragMove(e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDraggingSwept) {
                onSweptDragEnd();
            }
        });
    },

    /**
     * Cycle through zone types (guard -> draw -> takeout -> guard)
     */
    cycleZone() {
        const zones = ['guard', 'draw', 'takeout'];
        const currentIndex = zones.indexOf(SharedState.selectedZone);
        const nextIndex = (currentIndex + 1) % zones.length;
        SharedState.setZone(zones[nextIndex]);
    },

    /**
     * Set predicted position and update swept position
     */
    setPredictedPosition(position) {
        SharedState.setAdjustedPredictedDistance(position);
    },

    /**
     * Set swept position independently
     */
    setSweptPosition(position) {
        SharedState.setAdjustedSweptDistance(position);
    },

    /**
     * Update visual positions of indicators
     */
    updatePositions() {
        const predictedPosition = SharedState.getPredictedDistance();
        const sweptPosition = SharedState.getSweptDistance();
        
        const scale = this.mainElement.offsetHeight / this.SCALE_CONFIG.viewportRange;
        
        // Calculate Y positions (inverted - 0 at top)
        const predictedY = this.mainElement.offsetHeight - 
            (predictedPosition - this.SCALE_CONFIG.bottomPosition) * scale;
        const sweptY = this.mainElement.offsetHeight - 
            (sweptPosition - this.SCALE_CONFIG.bottomPosition) * scale;
        
        // Update left-side indicators
        this.predictedPosElement.style.top = `${predictedY}px`;
        this.sweptPosElement.style.top = `${sweptY}px`;
        
        // Update right-side indicators (mirrors)
        if (this.predictedPosElementRight) {
            this.predictedPosElementRight.style.top = `${predictedY}px`;
        }
        if (this.sweptPosElementRight) {
            this.sweptPosElementRight.style.top = `${sweptY}px`;
        }
    },

    /**
     * Update sweep percentage display
     */
    updateSweepPercentage() {
        const predictedPosition = SharedState.getPredictedDistance();
        const sweptPosition = SharedState.getSweptDistance();
        const targetDistance = this.getTargetDistance();
        
        // Calculate sweep percentage using Physics module
        const sweepPercentage = Physics.calculateSweepPercentage(
            predictedPosition,
            sweptPosition,
            SharedState.selectedZone
        );
        
        // Display the percentage (cap display at 1.00 for clarity, even if >1 internally)
        this.sweepPercentage.textContent = Math.min(1, sweepPercentage).toFixed(2);
        
        // Set color based on how close predicted position is to target
        const tolerance = 3; // feet
        if (Math.abs(predictedPosition - targetDistance) <= tolerance) {
            this.sweepPercentage.className = 'sweep-percentage good';
        } else if (predictedPosition < targetDistance) {
            this.sweepPercentage.className = 'sweep-percentage slow';
        } else {
            this.sweepPercentage.className = 'sweep-percentage fast';
        }
    },

    /**
     * Get target distance for current zone
     */
    getTargetDistance() {
        switch (SharedState.selectedZone) {
            case 'guard':
                return (Physics.DIMENSIONS.guardZoneStart + Physics.DIMENSIONS.guardZoneEnd) / 2; // ~133.5ft
            case 'draw':
                return Physics.DIMENSIONS.hoglineToTee; // 147ft (button)
            case 'takeout':
                return Physics.DIMENSIONS.takeoutZoneStart; // 153ft (just past house)
            default:
                return Physics.DIMENSIONS.hoglineToTee;
        }
    },

    /**
     * Called when positions are manually adjusted (calibration)
     */
    onPositionAdjusted() {
        // If we have a current throw and positions were adjusted, add calibration
        if (SharedState.currentThrow && SharedState.currentThrow.time > 0) {
            SharedState.addCalibration();
        }
    },

    /**
     * Start the timer
     */
    startTimer() {
        if (TimerBackend.isRunning) return;
        
        TimerBackend.start();
        this.mainElement.classList.add('timer-running');
        this.touchArea.classList.add('active');
    },

    /**
     * Stop the timer
     */
    stopTimer() {
        if (!TimerBackend.isRunning) return;
        
        const time = TimerBackend.stop();
        this.mainElement.classList.remove('timer-running');
        this.touchArea.classList.remove('active');
        
        // Record throw in shared state
        SharedState.recordThrow(time);
    },

    /**
     * Update all display elements
     */
    updateDisplay(elapsedSeconds) {
        if (elapsedSeconds === undefined) {
            elapsedSeconds = TimerBackend.getElapsedTime();
        }
        this.timeDisplay.textContent = elapsedSeconds.toFixed(3) + 's';
    },

    /**
     * Reset timer for new throw
     */
    reset() {
        TimerBackend.reset();
        SharedState.reset();
        
        this.mainElement.classList.remove('timer-running');
        this.touchArea.classList.remove('active');
        
        this.updateDisplay();
    },
    
    /**
     * Update calibration samples display
     */
    updateCalibrationDisplay() {
        if (this.calSamplesElement) {
            const calInfo = Physics.getCalibrationInfo();
            this.calSamplesElement.textContent = calInfo.sampleCount;
        }
    },
    
    /**
     * Reset calibration to defaults
     */
    resetCalibration() {
        SharedState.resetCalibration();
        // Note: updateCalibrationDisplay() is called automatically via SharedState listener
    }
};
