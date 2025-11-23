/**
 * New Timer Module with Physics-Based Predictions
 * Implements timing, prediction, and calibration workflows
 */

import { Physics } from './physics.js';
import { TimerBackend } from './timer-backend.js';
import { SharedState } from './shared-state.js';

export const NewTimer = {
    
    // Calibration state
    calibrationSliderMoved: false,
    
    // Rock adjustment state
    isAdjustingRock: false,
    
    // DOM elements
    timerDisplay: null,
    startButton: null,
    resetButton: null,
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
        this.resetButton = document.getElementById('reset-calibration');
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

        // Set up timer backend callback
        this.registerCallback();
        
        // Listen to shared state changes
        SharedState.addListener((event) => {
            this.onStateChange(event);
        });

        // Set up event listeners
        this.setupEventListeners();
        
        // Set initial zone to match shared state
        this.setZone(SharedState.selectedZone);
        
        // Initialize display
        this.updateDisplay();
        this.renderRink();
    },
    
    /**
     * Register timer callback for real-time updates
     */
    registerCallback() {
        TimerBackend.onTick = (elapsedSeconds) => {
            this.updateTimerDisplay(elapsedSeconds);
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
            case 'calibrationReset':
                this.updateDisplay();
                this.renderRink();
                this.updateSweepRecommendation();
                this.updateScoreIndicator();
                this.isAdjustingRock = false;
                break;
            case 'zoneChanged':
                this.updateZoneButtons();
                this.updateZoneDisplay();
                this.updateDisplay();
                this.renderRink();
                break;
        }
    },
    
    /**
     * Update zone buttons to match shared state
     */
    updateZoneButtons() {
        Object.keys(this.zoneButtons).forEach(key => {
            if (key === SharedState.selectedZone) {
                this.zoneButtons[key].classList.add('active');
            } else {
                this.zoneButtons[key].classList.remove('active');
            }
        });
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

        // Reset button
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                this.resetCalibration();
            });
        }

        // Rabbit R1 scroll wheel support for rock adjustment
        window.addEventListener('scrollUp', () => {
            if (SharedState.currentThrow && !TimerBackend.isRunning) {
                this.adjustRockPosition(1); // Move rock up (further)
            }
        });
        
        window.addEventListener('scrollDown', () => {
            if (SharedState.currentThrow && !TimerBackend.isRunning) {
                this.adjustRockPosition(-1); // Move rock down (shorter)
            }
        });

        // Canvas drag support for rock adjustment
        this.setupCanvasDragSupport();

        // Rabbit R1 side button support
        window.addEventListener('sideClick', () => {
            if (TimerBackend.isRunning) {
                this.stopTimer();
            } else if (SharedState.previousThrow && !this.calibrationSliderMoved) {
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
            if (!SharedState.currentThrow || TimerBackend.isRunning) return false;
            
            // Allow drag from anywhere on the canvas
            isDragging = true;
            const rect = this.rinkCanvas.getBoundingClientRect();
            dragStartY = clientY - rect.top;
            dragStartDistance = SharedState.getPredictedDistance();
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
        if (!SharedState.currentThrow) return;
        
        const currentDistance = SharedState.getPredictedDistance();
        const adjustment = direction * 2; // 2 feet per scroll
        const newDistance = Math.max(0, Math.min(Physics.DIMENSIONS.hoglineToBackline, currentDistance + adjustment));
        
        this.setAdjustedDistance(newDistance);
    },

    /**
     * Set adjusted distance for current throw
     * @param {number} distance - New distance in feet
     */
    setAdjustedDistance(distance) {
        if (!SharedState.currentThrow) return;
        
        SharedState.setAdjustedPredictedDistance(distance);
        this.isAdjustingRock = true;
    },

    /**
     * Set the selected zone for throws
     * @param {string} zone - 'guard', 'draw', or 'takeout'
     */
    setZone(zone) {
        if (!['guard', 'draw', 'takeout'].includes(zone)) {
            return;
        }
        
        SharedState.setZone(zone);
    },

    /**
     * Start the timer
     */
    startTimer() {
        if (TimerBackend.isRunning) {
            return;
        }
        
        // Previous throw handling is now managed by SharedState when recording new throws
        if (SharedState.previousThrow && !this.calibrationSliderMoved) {
            this.resetCalibrationSlider();
        }
        
        TimerBackend.start();
        
        // Reset adjustment state
        this.isAdjustingRock = false;
        
        // Add active state to button
        this.startButton.classList.add('active');
    },

    /**
     * Stop the timer
     */
    stopTimer() {
        if (!TimerBackend.isRunning) {
            return;
        }
        
        const backToHogTime = TimerBackend.stop();
        
        // Remove active state from button
        this.startButton.classList.remove('active');
        
        // Validate minimum time (lowered to 1.0 second for fast takeout shots)
        if (backToHogTime < 1.0) {
            console.log('Timer stopped too quickly - throw ignored (min 1.0s)');
            this.updateDisplay();
            return;
        }
        
        // Record throw in shared state
        SharedState.recordThrow(backToHogTime);
        
        // Show calibration slider if there's a previous throw
        if (SharedState.previousThrow) {
            this.showCalibrationSlider();
        }
    },

    /**
     * Update timer display (called on each animation frame by TimerBackend)
     */
    updateTimerDisplay(elapsedSeconds) {
        const timeInSeconds = elapsedSeconds.toFixed(3);
        this.timerDisplay.textContent = `${timeInSeconds}s`;
        
        // Update info panel
        if (this.infoTime) {
            this.infoTime.textContent = `${timeInSeconds}s`;
        }
    },

    /**
     * Update the display with current throw information
     */
    updateDisplay() {
        // Update timer display
        this.updateTimerDisplay(TimerBackend.getElapsedTime());
        
        if (SharedState.currentThrow) {
            // Use distance from shared state
            const displayDistance = SharedState.getPredictedDistance();
            
            if (this.infoZone) {
                const zoneNames = { guard: 'Guard', draw: 'Draw', takeout: 'Takeout' };
                this.infoZone.textContent = zoneNames[SharedState.currentThrow.zone] || '-';
            }
            if (this.infoDistance) {
                // Use new distance description format
                const description = Physics.getDistanceDescription(displayDistance, SharedState.selectedZone);
                this.infoDistance.textContent = description;
            }
            if (this.infoSwept) {
                // Calculate swept distance based on current position
                const sweptDist = SharedState.getSweptDistance();
                const sweptDescription = Physics.getDistanceDescription(sweptDist, SharedState.selectedZone);
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
            <span class="zone-icon">${icons[SharedState.selectedZone]}</span>
            <span class="zone-label">${labels[SharedState.selectedZone]}</span>
        `;
    },

    /**
     * Update sweep recommendation display
     */
    updateSweepRecommendation() {
        if (!SharedState.currentThrow) {
            this.sweepRecommendation.textContent = '';
            this.sweepRecommendation.className = 'sweep-recommendation';
            return;
        }
        
        const rec = SharedState.currentThrow.sweepRecommendation;
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
        if (!SharedState.currentThrow) {
            this.scoreIndicator.textContent = '';
            this.scoreIndicator.className = 'score-indicator';
            return;
        }
        
        if (SharedState.currentThrow.willScore) {
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
        
        // Canvas visualization: Shows the FAR END (target end) of the rink
        // From bottom to top:
        // - Small buffer (~5ft)
        // - FAR HOG LINE (at 126ft from near hog line)
        // - Guard zone (space between far hog and house front, ~15ft)
        // - HOUSE (scoring zone, centered at tee line 147ft from near hog)
        // - FAR BACK LINE (at 153ft from near hog - TOUCHING the back of house)
        // - Small buffer (~5ft)
        
        // The canvas shows from 118ft to 160ft from the near hog line
        // This gives us: buffer + far hog + guard zone + house + back line + buffer
        const viewportStart = 118; // Start viewing from 118ft (8ft before far hog line)
        const viewportEnd = 160; // End at 160ft (7ft past back line)
        const viewportRange = viewportEnd - viewportStart; // 42ft visible range
        const scale = height / viewportRange; // pixels per foot
        
        // Helper function to convert distance from near hog to canvas Y position
        const distanceToY = (distFromNearHog) => {
            return height - (distFromNearHog - viewportStart) * scale;
        };
        
        // Draw buffer zones (semi-transparent gray)
        // Buffer below far hog (118-126ft range)
        ctx.fillStyle = 'rgba(50, 50, 50, 0.1)';
        ctx.fillRect(0, distanceToY(Physics.DIMENSIONS.hoglineToHogline), width, (Physics.DIMENSIONS.hoglineToHogline - viewportStart) * scale);
        
        // Buffer above back line (153-160ft range)
        ctx.fillRect(0, 0, width, distanceToY(Physics.DIMENSIONS.hoglineToBackline));
        
        // Draw zones with shading
        // Guard zone (126-141ft from near hog - between far hog and front of house)
        ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
        const guardHeight = (Physics.DIMENSIONS.guardZoneEnd - Physics.DIMENSIONS.guardZoneStart) * scale;
        ctx.fillRect(0, distanceToY(Physics.DIMENSIONS.guardZoneEnd), width, guardHeight);
        
        // House zone (141-153ft from near hog - the 12-foot circle)
        ctx.fillStyle = 'rgba(255, 200, 100, 0.25)';
        const houseHeight = (Physics.DIMENSIONS.drawZoneEnd - Physics.DIMENSIONS.drawZoneStart) * scale;
        ctx.fillRect(0, distanceToY(Physics.DIMENSIONS.drawZoneEnd), width, houseHeight);
        
        // Draw house circles (centered at tee line, 147ft from near hog)
        const teeY = distanceToY(Physics.DIMENSIONS.hoglineToTee);
        const centerX = width / 2;
        
        // 12-foot (outer) - Blue
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, teeY, 6 * scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 8-foot - White
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, teeY, 4 * scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 4-foot - Red
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, teeY, 2 * scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Button (center)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(centerX, teeY, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw FAR HOG LINE (at 126ft from near hog - this is the hog line on the far end)
        const farHogY = distanceToY(Physics.DIMENSIONS.hoglineToHogline);
        ctx.strokeStyle = 'rgba(34, 197, 94, 1.0)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, farHogY);
        ctx.lineTo(width, farHogY);
        ctx.stroke();
        
        // Add FAR HOG LINE label
        ctx.fillStyle = 'rgba(34, 197, 94, 1.0)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('HOG LINE', 4, farHogY - 5);
        
        // Draw FAR BACK LINE (end line at 153ft from near hog - touching back of house)
        const farBackY = distanceToY(Physics.DIMENSIONS.hoglineToBackline);
        ctx.strokeStyle = 'rgba(239, 68, 68, 1.0)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, farBackY);
        ctx.lineTo(width, farBackY);
        ctx.stroke();
        
        // Add FAR BACK LINE label
        ctx.fillStyle = 'rgba(239, 68, 68, 1.0)';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('BACK LINE', 4, farBackY + 11);
        
        // Add directional indicator showing rock travels upward
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(width - 10, height - 15);
        ctx.lineTo(width - 10, 15);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Arrow head pointing up (rock direction)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(width - 10, 15);
        ctx.lineTo(width - 13, 21);
        ctx.lineTo(width - 7, 21);
        ctx.closePath();
        ctx.fill();
        
        // Draw predicted positions if we have a current throw
        if (SharedState.currentThrow) {
            // Use distance from shared state
            const displayDistance = SharedState.getPredictedDistance();
            const sweptDistance = SharedState.getSweptDistance();
            
            // Calculate Y positions using distanceToY function
            const predictedY = distanceToY(displayDistance);
            const sweptY = distanceToY(sweptDistance);
            
            // Only show rocks that are within the viewport (118-160ft range)
            if (displayDistance >= viewportStart && displayDistance <= viewportEnd) {
                // Draw horizontal line for predicted position (without sweeping) - YELLOW/GOLD
                ctx.strokeStyle = this.isAdjustingRock ? 'rgba(255, 100, 100, 1.0)' : 'rgba(255, 215, 0, 1.0)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, predictedY);
                ctx.lineTo(width, predictedY);
                ctx.stroke();
                
                // Draw small rock icon at predicted position
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 5;
                ctx.shadowColor = this.isAdjustingRock ? 'rgba(255, 100, 100, 0.8)' : 'rgba(255, 215, 0, 0.8)';
                ctx.fillText('🥌', centerX, predictedY + 4);
                ctx.shadowBlur = 0;
            }
            
            // Draw swept position if within viewport
            if (sweptDistance >= viewportStart && sweptDistance <= viewportEnd) {
                // Draw horizontal line for swept position - GREEN
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(0, sweptY);
                ctx.lineTo(width, sweptY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
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
        if (!SharedState.previousThrow) return;
        
        this.calibrationSliderMoved = true;
        
        // Convert slider value (0-100) to distance adjustment
        // Use percentage-based range for better handling of uncalibrated initial predictions
        const predictedDist = SharedState.previousThrow.predictedDistance;
        
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
        if (!SharedState.previousThrow) return;
        
        // If no distance provided, calculate from slider
        if (actualDistance === null) {
            const sliderValue = parseFloat(this.calibrationSlider.value);
            const predictedDist = SharedState.previousThrow.predictedDistance;
            
            // Use same percentage-based range as onSliderMove
            const rangePercent = 0.5;
            const minRange = 60;
            const range = Math.max(minRange, predictedDist * rangePercent * 2);
            
            const adjustment = (sliderValue - 50) * (range / 100);
            actualDistance = Math.max(0, predictedDist + adjustment);
        }
        
        // Add calibration sample to physics model
        Physics.addCalibrationSample(SharedState.previousThrow.time, actualDistance);
        
        // Clear previous throw and reset slider
        SharedState.previousThrow = null;
        this.resetCalibrationSlider();
        
        console.log('Calibration accepted:', Physics.getCalibrationInfo());
    },

    /**
     * Reset calibration to defaults
     */
    resetCalibration() {
        SharedState.resetCalibration();
        
        // Reset local state
        this.isAdjustingRock = false;
        
        // Update calibration count in main.js if possible
        if (window.updateCalibrationDisplay) {
            window.updateCalibrationDisplay();
        }
        
        console.log('Calibration reset to defaults:', Physics.getCalibrationInfo());
    }
};

// Don't auto-initialize - will be initialized by main.js when appropriate
