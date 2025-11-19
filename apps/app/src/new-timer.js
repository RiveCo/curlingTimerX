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
    
    // Rock adjustment state
    isAdjustingRock: false,
    adjustedDistance: null, // Manually adjusted distance (overrides predicted)
    
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
    infoTime: null,
    infoZone: null,
    infoDistance: null,
    infoSwept: null,

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
        this.infoTime = document.getElementById('info-time');
        this.infoZone = document.getElementById('info-zone');
        this.infoDistance = document.getElementById('info-distance');
        this.infoSwept = document.getElementById('info-swept');

        // Set up event listeners
        this.setupEventListeners();
        
        // Set initial zone
        this.setZone('draw');
        
        // Create initial throw preview for 3.6s (button weight)
        this.createInitialThrowPreview();
        
        // Initialize display
        this.updateDisplay();
        this.renderRink();
    },

    /**
     * Create initial throw preview showing 3.0s throw to button
     */
    createInitialThrowPreview() {
        // Create a throw record for 3.0 seconds (typical draw weight to button)
        const backToHogTime = 3.0; // seconds
        const velocity = Physics.calculateVelocity(backToHogTime);
        const predictedDistance = Physics.predictDistance(velocity);
        const sweptDistance = Physics.predictSweptDistance(predictedDistance, 'normal');
        const zone = Physics.classifyZone(predictedDistance);
        const sweepRec = Physics.getSweepRecommendation(predictedDistance, this.selectedZone);
        const willScore = Physics.willScore(predictedDistance);
        
        this.currentThrow = {
            time: backToHogTime,
            velocity: velocity,
            predictedDistance: predictedDistance,
            sweptDistance: sweptDistance,
            zone: zone,
            sweepRecommendation: sweepRec,
            willScore: willScore,
            intendedZone: this.selectedZone
        };
        
        // Set elapsed time to match the preview
        this.elapsedTime = backToHogTime * 1000; // Convert to milliseconds
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

        // Calibration slider (if present)
        if (this.calibrationSlider) {
            this.calibrationSlider.addEventListener('input', (e) => {
                this.onSliderMove(e.target.value);
            });
        }

        // Rabbit R1 scroll wheel support for rock adjustment
        window.addEventListener('scrollUp', () => {
            if (this.currentThrow && !this.isRunning) {
                this.adjustRockPosition(1); // Move rock up (further)
            }
        });
        
        window.addEventListener('scrollDown', () => {
            if (this.currentThrow && !this.isRunning) {
                this.adjustRockPosition(-1); // Move rock down (shorter)
            }
        });

        // Canvas drag support for rock adjustment
        this.setupCanvasDragSupport();

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

        // Keyboard fallback (Space bar = device button, Arrow keys = scroll wheel)
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.repeat) {
                event.preventDefault();
                const sideClickEvent = new CustomEvent('sideClick');
                window.dispatchEvent(sideClickEvent);
            } else if (event.code === 'ArrowUp' && !event.repeat) {
                event.preventDefault();
                const scrollUpEvent = new CustomEvent('scrollUp');
                window.dispatchEvent(scrollUpEvent);
            } else if (event.code === 'ArrowDown' && !event.repeat) {
                event.preventDefault();
                const scrollDownEvent = new CustomEvent('scrollDown');
                window.dispatchEvent(scrollDownEvent);
            }
        });
    },

    /**
     * Set up canvas drag support for rock adjustment
     */
    setupCanvasDragSupport() {
        let isDragging = false;
        let dragStartY = 0;
        let dragStartDistance = 0;
        
        const onDragStart = (clientY) => {
            if (!this.currentThrow || this.isRunning) return false;
            
            // Allow drag from anywhere on the canvas
            isDragging = true;
            const rect = this.rinkCanvas.getBoundingClientRect();
            dragStartY = clientY - rect.top;
            dragStartDistance = this.adjustedDistance !== null ? this.adjustedDistance : this.currentThrow.predictedDistance;
            this.isAdjustingRock = true;
            return true;
        };
        
        const onDragMove = (clientY) => {
            if (!isDragging) return;
            
            const rect = this.rinkCanvas.getBoundingClientRect();
            const y = clientY - rect.top;
            const deltaY = dragStartY - y; // Inverted: drag up = positive distance
            
            // Convert pixel movement to distance with 1/4 sensitivity
            const scale = this.rinkCanvas.height / Physics.DIMENSIONS.hoglineToBackline;
            const deltaDistance = (deltaY / scale) * 0.25; // 1/4 sensitivity
            
            // Update adjusted distance
            const newDistance = Math.max(0, Math.min(Physics.DIMENSIONS.hoglineToBackline, dragStartDistance + deltaDistance));
            this.setAdjustedDistance(newDistance);
        };
        
        const onDragEnd = () => {
            if (isDragging) {
                isDragging = false;
                this.isAdjustingRock = false;
            }
        };
        
        // Touch events
        this.rinkCanvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                if (onDragStart(e.touches[0].clientY)) {
                    e.preventDefault();
                }
            }
        });
        
        this.rinkCanvas.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                e.preventDefault();
                onDragMove(e.touches[0].clientY);
            }
        });
        
        this.rinkCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            onDragEnd();
        });
        
        this.rinkCanvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            onDragEnd();
        });
        
        // Mouse events (for desktop)
        this.rinkCanvas.addEventListener('mousedown', (e) => {
            if (onDragStart(e.clientY)) {
                e.preventDefault();
            }
        });
        
        this.rinkCanvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                onDragMove(e.clientY);
            }
        });
        
        this.rinkCanvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            onDragEnd();
        });
        
        this.rinkCanvas.addEventListener('mouseleave', (e) => {
            onDragEnd();
        });
    },

    /**
     * Adjust rock position using scroll wheel
     * @param {number} direction - 1 for up/further, -1 for down/shorter
     */
    adjustRockPosition(direction) {
        if (!this.currentThrow) return;
        
        const currentDistance = this.adjustedDistance !== null ? this.adjustedDistance : this.currentThrow.predictedDistance;
        const adjustment = direction * 2; // 2 feet per scroll
        const newDistance = Math.max(0, Math.min(Physics.DIMENSIONS.hoglineToBackline, currentDistance + adjustment));
        
        this.setAdjustedDistance(newDistance);
    },

    /**
     * Set adjusted distance for current throw
     * @param {number} distance - New distance in feet
     */
    setAdjustedDistance(distance) {
        if (!this.currentThrow) return;
        
        this.adjustedDistance = distance;
        this.isAdjustingRock = true;
        
        // Update displays
        this.updateDisplay();
        this.renderRink();
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
            this.updateDisplay(); // Update distance description
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
            // Use adjusted distance for calibration if it was adjusted
            const finalDistance = this.adjustedDistance !== null ? this.adjustedDistance : this.currentThrow.predictedDistance;
            this.previousThrow = { ...this.currentThrow, finalDistance };
            this.resetCalibrationSlider();
            
            // Auto-calibrate if rock was adjusted
            if (this.adjustedDistance !== null) {
                Physics.addCalibrationSample(this.currentThrow.time, this.adjustedDistance);
                this.previousThrow = null;
            }
        }
        
        this.isRunning = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        
        // Clear current throw and adjusted distance
        this.currentThrow = null;
        this.adjustedDistance = null;
        this.isAdjustingRock = false;
        
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
        
        // Create throw record only if we have a valid time
        const backToHogTime = this.elapsedTime / 1000; // Convert to seconds
        
        // Validate minimum time (lowered to 1.0 second for fast takeout shots)
        if (backToHogTime < 1.0) {
            console.log('Timer stopped too quickly - throw ignored (min 1.0s)');
            this.updateDisplay();
            return;
        }
        
        const velocity = Physics.calculateVelocity(backToHogTime);
        const predictedDistance = Physics.predictDistance(velocity);
        const sweptDistance = Physics.predictSweptDistance(predictedDistance, 'normal');
        const zone = Physics.classifyZone(predictedDistance);
        const sweepRec = Physics.getSweepRecommendation(predictedDistance, this.selectedZone);
        const willScore = Physics.willScore(predictedDistance);
        
        this.currentThrow = {
            time: backToHogTime,
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
        
        // Update info panel
        if (this.infoTime) {
            this.infoTime.textContent = `${timeInSeconds}s`;
        }
        
        if (this.currentThrow) {
            // Use adjusted distance if available
            const displayDistance = this.adjustedDistance !== null ? this.adjustedDistance : this.currentThrow.predictedDistance;
            
            if (this.infoZone) {
                const zoneNames = { guard: 'Guard', draw: 'Draw', takeout: 'Takeout' };
                this.infoZone.textContent = zoneNames[this.currentThrow.zone] || '-';
            }
            if (this.infoDistance) {
                // Use new distance description format
                const description = Physics.getDistanceDescription(displayDistance, this.selectedZone);
                this.infoDistance.textContent = description;
            }
            if (this.infoSwept) {
                // Calculate swept distance based on current position
                const sweptDist = Physics.predictSweptDistance(displayDistance, 'normal');
                const sweptDescription = Physics.getDistanceDescription(sweptDist, this.selectedZone);
                this.infoSwept.textContent = sweptDescription;
            }
        } else {
            if (this.infoZone) this.infoZone.textContent = '-';
            if (this.infoDistance) this.infoDistance.textContent = '-';
            if (this.infoSwept) this.infoSwept.textContent = '-';
        }
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
        
        // Canvas visualization setup:
        // - Bottom (0ft): Buffer zone below NEAR hog line (for very slow rocks)
        // - NEAR HOG LINE: Where timing ends, thrower's side
        // - Middle: House and playing area
        // - FAR BACK LINE: 126ft from near hog
        // - FAR HOG LINE: 146ft from near hog (extends past back line)
        // - Top: Buffer zone above far hog line (for very fast rocks)
        
        const bufferZone = 20; // feet of buffer above/below for extreme shots
        const totalDistance = Physics.DIMENSIONS.hoglineToHogline + bufferZone; // 146 + 20 = 166ft
        const scale = height / totalDistance; // pixels per foot
        const nearHogY = height - bufferZone * scale; // Near hog line position on canvas
        
        // Draw buffer zones (semi-transparent gray)
        // Buffer below near hog (for rocks that don't reach hog line)
        ctx.fillStyle = 'rgba(50, 50, 50, 0.15)';
        ctx.fillRect(0, nearHogY, width, bufferZone * scale);
        
        // Buffer above far hog (for very fast rocks that go past far hog)
        const farHogY = nearHogY - Physics.DIMENSIONS.hoglineToHogline * scale;
        ctx.fillRect(0, 0, width, farHogY);
        
        // Draw zones with shading (all measured from near hog line)
        // Guard zone (0-54ft from near hog)
        ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
        const guardStart = 0;
        const guardEnd = Physics.DIMENSIONS.guardZoneEnd;
        ctx.fillRect(0, nearHogY - guardEnd * scale, width, (guardEnd - guardStart) * scale);
        
        // Draw zone (middle - house) (54-78ft from near hog)
        ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
        const drawStart = Physics.DIMENSIONS.drawZoneStart;
        const drawEnd = Physics.DIMENSIONS.drawZoneEnd;
        ctx.fillRect(0, nearHogY - drawEnd * scale, width, (drawEnd - drawStart) * scale);
        
        // Takeout zone (78-126ft from near hog)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        const takeoutStart = Physics.DIMENSIONS.takeoutZoneStart;
        const takeoutEnd = Physics.DIMENSIONS.takeoutZoneEnd;
        ctx.fillRect(0, nearHogY - takeoutEnd * scale, width, (takeoutEnd - takeoutStart) * scale);
        
        // Draw house circles (centered at tee line, 66ft from near hog)
        const teeY = nearHogY - Physics.DIMENSIONS.hoglineToTee * scale;
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
        
        // Draw FAR HOG LINE (opposite end from thrower) - THICK RED
        ctx.strokeStyle = 'rgba(239, 68, 68, 1.0)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, farHogY);
        ctx.lineTo(width, farHogY);
        ctx.stroke();
        
        // Add FAR HOG LINE label
        ctx.fillStyle = 'rgba(239, 68, 68, 1.0)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('FAR HOG', 4, farHogY + 11);
        
        // Draw FAR BACK LINE (reference line, 126ft from near hog)
        const farBackY = nearHogY - Physics.DIMENSIONS.hoglineToBackline * scale;
        ctx.strokeStyle = 'rgba(255, 68, 68, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, farBackY);
        ctx.lineTo(width, farBackY);
        ctx.stroke();
        
        // Add FAR BACK LINE label
        ctx.fillStyle = 'rgba(255, 68, 68, 0.7)';
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText('BACK', 4, farBackY + 9);
        
        // Draw NEAR HOG LINE (thrower's side) - THICK GREEN
        ctx.strokeStyle = 'rgba(34, 197, 94, 1.0)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, nearHogY);
        ctx.lineTo(width, nearHogY);
        ctx.stroke();
        
        // Add NEAR HOG LINE label
        ctx.fillStyle = 'rgba(34, 197, 94, 1.0)';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('NEAR HOG', 4, nearHogY - 5);
        
        // Add timing direction arrow (rock travels upward from near hog)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(width - 10, nearHogY - 10);
        ctx.lineTo(width - 10, farHogY + 10);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Arrow head pointing up (rock direction - toward far end)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(width - 10, farHogY + 10);
        ctx.lineTo(width - 13, farHogY + 16);
        ctx.lineTo(width - 7, farHogY + 16);
        ctx.closePath();
        ctx.fill();
        
        // Draw predicted positions if we have a current throw
        if (this.currentThrow) {
            // Use adjusted distance if available
            const displayDistance = this.adjustedDistance !== null ? this.adjustedDistance : this.currentThrow.predictedDistance;
            const sweptDistance = Physics.predictSweptDistance(displayDistance, 'normal');
            
            // Calculate Y positions from near hog line
            const predictedY = nearHogY - displayDistance * scale;
            const sweptY = nearHogY - sweptDistance * scale;
            
            // Clamp positions to canvas bounds (allow buffer zones)
            const clampedPredictedY = Math.max(5, Math.min(height - 5, predictedY));
            const clampedSweptY = Math.max(5, Math.min(height - 5, sweptY));
            
            // Draw horizontal line for predicted position (without sweeping) - YELLOW/GOLD
            ctx.strokeStyle = this.isAdjustingRock ? 'rgba(255, 100, 100, 1.0)' : 'rgba(255, 215, 0, 1.0)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, clampedPredictedY);
            ctx.lineTo(width, clampedPredictedY);
            ctx.stroke();
            
            // Draw horizontal line for swept position - GREEN
            ctx.strokeStyle = 'rgba(34, 197, 94, 1.0)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, clampedSweptY);
            ctx.lineTo(width, clampedSweptY);
            ctx.stroke();
            
            // Draw small rock icon at predicted position
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 5;
            ctx.shadowColor = this.isAdjustingRock ? 'rgba(255, 100, 100, 0.8)' : 'rgba(255, 215, 0, 0.8)';
            ctx.fillText('🥌', centerX, clampedPredictedY + 3);
            ctx.shadowBlur = 0;
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
        // Use percentage-based range for better handling of uncalibrated initial predictions
        const predictedDist = this.previousThrow.predictedDistance;
        
        // Use percentage-based range: ±50% of predicted distance, minimum ±30 feet
        const rangePercent = 0.5; // ±50%
        const minRange = 60; // Minimum ±30 feet on each side
        const range = Math.max(minRange, predictedDist * rangePercent * 2); // Total range
        
        // Center (50) = predicted distance, 0 = much shorter, 100 = much longer
        const adjustment = (value - 50) * (range / 100);
        const actualDistance = Math.max(0, predictedDist + adjustment);
        
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
            
            // Use same percentage-based range as onSliderMove
            const rangePercent = 0.5;
            const minRange = 60;
            const range = Math.max(minRange, predictedDist * rangePercent * 2);
            
            const adjustment = (sliderValue - 50) * (range / 100);
            actualDistance = Math.max(0, predictedDist + adjustment);
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
