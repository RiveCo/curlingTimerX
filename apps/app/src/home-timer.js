/**
 * Home Timer Module - Stopwatch Style Interface
 * Implements discrete stopwatch-like timer with essential curling information
 */

import { Physics } from './physics.js';

export const HomeTimer = {
    // Timer state
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    animationFrameId: null,
    
    // Throw tracking
    currentThrow: null,
    
    // Selected zone (guard, draw, takeout)
    selectedZone: 'draw',
    
    // Position state (in feet from near hog line)
    predictedPosition: 147, // Default to button (draw)
    sweptPosition: 154, // Default with sweeping effect
    
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
    mainElement: null,
    
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
        this.mainElement = this.homeScreen.querySelector('.home-main');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize positions
        this.updatePositions();
        this.updateDisplay();
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
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
            if (this.isRunning) return false;
            this.isDraggingPredicted = true;
            this.dragStartY = clientY;
            this.dragStartPosition = this.predictedPosition;
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
            if (this.isRunning) return false;
            this.isDraggingSwept = true;
            this.dragStartY = clientY;
            this.dragStartPosition = this.sweptPosition;
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
        const currentIndex = zones.indexOf(this.selectedZone);
        const nextIndex = (currentIndex + 1) % zones.length;
        this.selectedZone = zones[nextIndex];
        
        // Update time display zone
        this.timeDisplay.setAttribute('data-zone', this.selectedZone);
        
        // Update sweep percentage display
        this.updateSweepPercentage();
    },

    /**
     * Set predicted position and update swept position
     */
    setPredictedPosition(position) {
        this.predictedPosition = position;
        // Update swept position based on predicted
        this.sweptPosition = Physics.predictSweptDistance(position, 'normal');
        this.updatePositions();
        this.updateSweepPercentage();
    },

    /**
     * Set swept position independently
     */
    setSweptPosition(position) {
        this.sweptPosition = position;
        this.updatePositions();
        this.updateSweepPercentage();
    },

    /**
     * Update visual positions of indicators
     */
    updatePositions() {
        const scale = this.mainElement.offsetHeight / this.SCALE_CONFIG.viewportRange;
        
        // Calculate Y positions (inverted - 0 at top)
        const predictedY = this.mainElement.offsetHeight - 
            (this.predictedPosition - this.SCALE_CONFIG.bottomPosition) * scale;
        const sweptY = this.mainElement.offsetHeight - 
            (this.sweptPosition - this.SCALE_CONFIG.bottomPosition) * scale;
        
        this.predictedPosElement.style.top = `${predictedY}px`;
        this.sweptPosElement.style.top = `${sweptY}px`;
    },

    /**
     * Update sweep percentage display
     */
    updateSweepPercentage() {
        if (!this.currentThrow && !this.isDraggingPredicted && !this.isDraggingSwept) {
            // Before any throw, show preview based on current positions
            const sweepDistance = this.sweptPosition - this.predictedPosition;
            const totalDistance = this.predictedPosition;
            const sweepPercentage = totalDistance > 0 ? sweepDistance / totalDistance : 0;
            this.sweepPercentage.textContent = Math.max(0, Math.min(1, sweepPercentage)).toFixed(2);
            
            // Set color based on zone
            const targetDistance = this.getTargetDistance();
            if (Math.abs(this.predictedPosition - targetDistance) <= 3) {
                this.sweepPercentage.className = 'sweep-percentage good';
            } else if (this.predictedPosition < targetDistance) {
                this.sweepPercentage.className = 'sweep-percentage slow';
            } else {
                this.sweepPercentage.className = 'sweep-percentage fast';
            }
            return;
        }
        
        if (this.currentThrow) {
            const actualDistance = this.predictedPosition;
            const targetDistance = this.getTargetDistance();
            const sweepRec = Physics.getSweepRecommendation(actualDistance, this.selectedZone);
            
            // Calculate sweep percentage (0-1)
            const sweepDistance = this.sweptPosition - actualDistance;
            const sweepPercentage = actualDistance > 0 ? sweepDistance / actualDistance : 0;
            this.sweepPercentage.textContent = Math.max(0, Math.min(1, sweepPercentage)).toFixed(2);
            
            // Color based on speed
            const tolerance = 3; // feet
            if (Math.abs(actualDistance - targetDistance) <= tolerance) {
                this.sweepPercentage.className = 'sweep-percentage good';
            } else if (actualDistance < targetDistance) {
                this.sweepPercentage.className = 'sweep-percentage slow';
            } else {
                this.sweepPercentage.className = 'sweep-percentage fast';
            }
        }
    },

    /**
     * Get target distance for current zone
     */
    getTargetDistance() {
        switch (this.selectedZone) {
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
        // If we have a current throw and positions were adjusted, it's a calibration opportunity
        if (this.currentThrow && this.currentThrow.time > 0) {
            const calibratedDistance = this.predictedPosition;
            Physics.addCalibrationSample(this.currentThrow.time, calibratedDistance);
            console.log('Calibration added:', {
                time: this.currentThrow.time,
                distance: calibratedDistance,
                samples: Physics.getCalibrationInfo().sampleCount
            });
        }
    },

    /**
     * Start the timer
     */
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.mainElement.classList.add('timer-running');
        this.touchArea.classList.add('active');
        
        this.updateTimerDisplay();
    },

    /**
     * Stop the timer
     */
    stopTimer() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.mainElement.classList.remove('timer-running');
        this.touchArea.classList.remove('active');
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Calculate final throw
        const time = this.elapsedTime / 1000; // Convert to seconds
        const velocity = Physics.calculateVelocity(time);
        const predictedDistance = Physics.predictDistance(velocity);
        const sweptDistance = Physics.predictSweptDistance(predictedDistance, 'normal');
        
        // Store throw
        this.currentThrow = {
            time: time,
            velocity: velocity,
            predictedDistance: predictedDistance,
            sweptDistance: sweptDistance,
            zone: Physics.classifyZone(predictedDistance),
            intendedZone: this.selectedZone
        };
        
        // Update positions based on prediction
        this.predictedPosition = predictedDistance;
        this.sweptPosition = sweptDistance;
        this.updatePositions();
        this.updateSweepPercentage();
    },

    /**
     * Update timer display (animation loop)
     */
    updateTimerDisplay() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.elapsedTime = currentTime - this.startTime;
        
        // Update display
        this.updateDisplay();
        
        // Continue animation
        this.animationFrameId = requestAnimationFrame(() => this.updateTimerDisplay());
    },

    /**
     * Update all display elements
     */
    updateDisplay() {
        const seconds = this.elapsedTime / 1000;
        this.timeDisplay.textContent = seconds.toFixed(3) + 's';
    },

    /**
     * Reset timer for new throw
     */
    reset() {
        this.isRunning = false;
        this.elapsedTime = 0;
        this.currentThrow = null;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.mainElement.classList.remove('timer-running');
        this.touchArea.classList.remove('active');
        
        // Reset to default positions
        this.predictedPosition = 147; // Button
        this.sweptPosition = 154; // With sweep
        this.updatePositions();
        this.updateDisplay();
        this.updateSweepPercentage();
    }
};
