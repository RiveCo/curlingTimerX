/**
 * New Timer Module with Physics-Based Predictions
 * Implements timing, prediction, and calibration workflows
 */

import { Physics } from './physics.js';

export const NewTimer = {
    // Timer state
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    animationFrameId: null,
    
    // Throw tracking
    currentThrow: null, // Current throw being timed
    previousThrow: null, // Previous throw (calibration candidate)
    
    // Selected zone for the throw
    selectedZone: 'draw', // 'guard', 'draw', or 'takeout'
    
    // Calibration state
    calibrationSliderMoved: false,
    
    // DOM elements
    timerDisplay: null,
    startButton: null,
    zoneButtons: {},
    calibrationSlider: null,
    calibrationValue: null,
    rinkCanvas: null,
    sweepRecommendation: null,
    scoreIndicator: null,
    predictedPosition: null,
    sweptPosition: null,
    zoneDisplay: null,

    /**
     * Initialize the new timer module
     */
    init() {
        // Get DOM elements
        this.timerDisplay = document.getElementById('new-timer-display');
        this.startButton = document.getElementById('new-start-button');
        this.zoneButtons = {
            guard: document.getElementById('zone-guard'),
            draw: document.getElementById('zone-draw'),
            takeout: document.getElementById('zone-takeout')
        };
        this.calibrationSlider = document.getElementById('calibration-slider');
        this.calibrationValue = document.getElementById('calibration-value');
        this.rinkCanvas = document.getElementById('rink-canvas');
        this.sweepRecommendation = document.getElementById('sweep-recommendation');
        this.scoreIndicator = document.getElementById('score-indicator');
        this.predictedPosition = document.getElementById('predicted-pos');
        this.sweptPosition = document.getElementById('swept-pos');
        this.zoneDisplay = document.getElementById('zone-display');

        // Set up event listeners
        this.setupEventListeners();
        
        // Set initial zone
        this.setZone('draw');
        
        // Initialize display
        this.updateDisplay();
        this.renderRink();
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Zone selection buttons
        Object.keys(this.zoneButtons).forEach(zone => {
            this.zoneButtons[zone].addEventListener('click', () => this.setZone(zone));
        });

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

        // Start button - mouse events (for desktop)
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

        // Calibration slider
        this.calibrationSlider.addEventListener('input', (e) => {
            this.onSliderMove(e.target.value);
        });

        // Rabbit R1 side button support
        window.addEventListener('sideClick', () => {
            if (this.isRunning) {
                this.stopTimer();
            } else if (this.previousThrow && !this.calibrationSliderMoved) {
                // If there's a calibration candidate and slider hasn't been moved,
                // physical button accepts calibration at current slider position
                this.acceptCalibration();
            } else {
                this.startTimer();
            }
        });

        // Keyboard fallback (Space bar = device button)
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                event.preventDefault();
                const sideClickEvent = new CustomEvent('sideClick');
                window.dispatchEvent(sideClickEvent);
            }
        });
    },

    /**
     * Set the selected zone for throws
     * @param {string} zone - 'guard', 'draw', or 'takeout'
     */
    setZone(zone) {
        if (!['guard', 'draw', 'takeout'].includes(zone)) {
            return;
        }
        
        this.selectedZone = zone;
        
        // Update button states
        Object.keys(this.zoneButtons).forEach(key => {
            if (key === zone) {
                this.zoneButtons[key].classList.add('active');
            } else {
                this.zoneButtons[key].classList.remove('active');
            }
        });
        
        // Update display
        this.updateZoneDisplay();
        if (this.currentThrow) {
            this.renderRink();
        }
    },

    /**
     * Start the timer
     */
    startTimer() {
        if (this.isRunning) {
            return;
        }
        
        // If there's a previous throw that wasn't calibrated, make it the candidate
        if (this.currentThrow && !this.calibrationSliderMoved) {
            this.previousThrow = { ...this.currentThrow };
            this.resetCalibrationSlider();
        }
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        
        // Clear current throw
        this.currentThrow = null;
        
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
        
        // Create throw record
        const hogToBackTime = this.elapsedTime / 1000; // Convert to seconds
        const velocity = Physics.calculateVelocity(hogToBackTime);
        const predictedDistance = Physics.predictDistance(velocity);
        const sweptDistance = Physics.predictSweptDistance(predictedDistance, 'normal');
        const zone = Physics.classifyZone(predictedDistance);
        const sweepRec = Physics.getSweepRecommendation(predictedDistance, this.selectedZone);
        const willScore = Physics.willScore(predictedDistance);
        
        this.currentThrow = {
            time: hogToBackTime,
            velocity: velocity,
            predictedDistance: predictedDistance,
            sweptDistance: sweptDistance,
            zone: zone,
            sweepRecommendation: sweepRec,
            willScore: willScore,
            intendedZone: this.selectedZone
        };
        
        // Update displays
        this.updateDisplay();
        this.renderRink();
        this.updateSweepRecommendation();
        this.updateScoreIndicator();
        
        // Show calibration slider if there's a previous throw
        if (this.previousThrow) {
            this.showCalibrationSlider();
        }
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
     * Update zone display (icon and label)
     */
    updateZoneDisplay() {
        const icons = {
            guard: '🛡️',
            draw: '🎯',
            takeout: '❌'
        };
        
        const labels = {
            guard: 'Guard',
            draw: 'Draw',
            takeout: 'Takeout'
        };
        
        this.zoneDisplay.innerHTML = `
            <span class="zone-icon">${icons[this.selectedZone]}</span>
            <span class="zone-label">${labels[this.selectedZone]}</span>
        `;
    },

    /**
     * Update sweep recommendation display
     */
    updateSweepRecommendation() {
        if (!this.currentThrow) {
            this.sweepRecommendation.textContent = '';
            this.sweepRecommendation.className = 'sweep-recommendation';
            return;
        }
        
        const rec = this.currentThrow.sweepRecommendation;
        const texts = {
            'hard_sweep': 'Hard Sweep!',
            'sweep': 'Sweep',
            'fast': 'Fast',
            'good': 'Good'
        };
        
        this.sweepRecommendation.textContent = texts[rec] || '';
        this.sweepRecommendation.className = `sweep-recommendation ${rec}`;
    },

    /**
     * Update score indicator display
     */
    updateScoreIndicator() {
        if (!this.currentThrow) {
            this.scoreIndicator.textContent = '';
            this.scoreIndicator.className = 'score-indicator';
            return;
        }
        
        if (this.currentThrow.willScore) {
            this.scoreIndicator.textContent = '✓ Score';
            this.scoreIndicator.className = 'score-indicator will-score';
        } else {
            this.scoreIndicator.textContent = '○ No Score';
            this.scoreIndicator.className = 'score-indicator no-score';
        }
    },

    /**
     * Render the curling rink with predicted positions
     */
    renderRink() {
        if (!this.rinkCanvas) return;
        
        const ctx = this.rinkCanvas.getContext('2d');
        const width = this.rinkCanvas.width;
        const height = this.rinkCanvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw zones with shading
        const hoglineToBackline = Physics.DIMENSIONS.hoglineToBackline;
        const scale = height / hoglineToBackline; // pixels per foot
        
        // Guard zone (bottom - near hog line)
        ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
        const guardStart = 0;
        const guardEnd = Physics.DIMENSIONS.guardZoneEnd;
        ctx.fillRect(0, height - guardEnd * scale, width, (guardEnd - guardStart) * scale);
        
        // Draw zone (middle - house)
        ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
        const drawStart = Physics.DIMENSIONS.drawZoneStart;
        const drawEnd = Physics.DIMENSIONS.drawZoneEnd;
        ctx.fillRect(0, height - drawEnd * scale, width, (drawEnd - drawStart) * scale);
        
        // Takeout zone (top - beyond house)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        const takeoutStart = Physics.DIMENSIONS.takeoutZoneStart;
        const takeoutEnd = Physics.DIMENSIONS.takeoutZoneEnd;
        ctx.fillRect(0, height - takeoutEnd * scale, width, (takeoutEnd - takeoutStart) * scale);
        
        // Draw house circles
        const teeY = height - Physics.DIMENSIONS.hoglineToTee * scale;
        const centerX = width / 2;
        
        // 12-foot (outer) - Blue
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, teeY, 12 * scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 8-foot - White
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX, teeY, 8 * scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 4-foot - Red
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX, teeY, 4 * scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Button (center)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, teeY, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw hog line (bottom)
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);
        ctx.stroke();
        
        // Draw back line (top)
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width, 0);
        ctx.stroke();
        
        // Draw predicted positions if we have a current throw
        if (this.currentThrow) {
            const predictedY = height - this.currentThrow.predictedDistance * scale;
            const sweptY = height - this.currentThrow.sweptDistance * scale;
            
            // Predicted position (without sweeping) - Yellow
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(centerX, predictedY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Swept position (with sweeping) - Green
            ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
            ctx.beginPath();
            ctx.arc(centerX, sweptY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw connecting line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX, predictedY);
            ctx.lineTo(centerX, sweptY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    },

    /**
     * Show calibration slider
     */
    showCalibrationSlider() {
        if (!this.calibrationSlider) return;
        
        // Set slider to center of its range initially
        this.calibrationSlider.value = 50;
        this.calibrationValue.textContent = 'Move to calibrate';
        this.calibrationSlider.parentElement.style.display = 'block';
        this.calibrationSliderMoved = false;
    },

    /**
     * Reset calibration slider
     */
    resetCalibrationSlider() {
        if (!this.calibrationSlider) return;
        
        this.calibrationSlider.value = 50;
        this.calibrationValue.textContent = '';
        this.calibrationSlider.parentElement.style.display = 'none';
        this.calibrationSliderMoved = false;
    },

    /**
     * Handle slider movement
     * @param {number} value - Slider value (0-100)
     */
    onSliderMove(value) {
        if (!this.previousThrow) return;
        
        this.calibrationSliderMoved = true;
        
        // Convert slider value (0-100) to distance adjustment
        // Center (50) = predicted distance, lower = shorter, higher = longer
        const predictedDist = this.previousThrow.predictedDistance;
        const range = 30; // +/- 15 feet from predicted
        const adjustment = (value - 50) * (range / 100);
        const actualDistance = predictedDist + adjustment;
        
        this.calibrationValue.textContent = `${actualDistance.toFixed(1)} ft`;
        
        // Auto-accept calibration when slider is moved
        this.acceptCalibration(actualDistance);
    },

    /**
     * Accept calibration with the current slider value
     * @param {number} actualDistance - Actual final distance, optional (calculated from slider if not provided)
     */
    acceptCalibration(actualDistance = null) {
        if (!this.previousThrow) return;
        
        // If no distance provided, calculate from slider
        if (actualDistance === null) {
            const sliderValue = parseFloat(this.calibrationSlider.value);
            const predictedDist = this.previousThrow.predictedDistance;
            const range = 30;
            const adjustment = (sliderValue - 50) * (range / 100);
            actualDistance = predictedDist + adjustment;
        }
        
        // Add calibration sample to physics model
        Physics.addCalibrationSample(this.previousThrow.time, actualDistance);
        
        // Clear previous throw and reset slider
        this.previousThrow = null;
        this.resetCalibrationSlider();
        
        console.log('Calibration accepted:', Physics.getCalibrationInfo());
    }
};

// Don't auto-initialize - will be initialized by main.js when appropriate
