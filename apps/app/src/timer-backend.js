/**
 * Timer Backend Module
 * Shared core timer functionality used by both home and advanced screens
 * Provides timer state management and control
 */

export const TimerBackend = {
    // Timer state
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    animationFrameId: null,
    
    // Callback for timer updates (set by consumer)
    onTick: null,
    
    // Bound tick method for animation frame
    boundTick: null,
    
    /**
     * Initialize the timer backend (called automatically on first use)
     */
    _init() {
        if (!this.boundTick) {
            this.boundTick = () => this.tick();
        }
    },
    
    /**
     * Start the timer
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this._init();
        this.isRunning = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        
        // Start animation loop
        this.tick();
    },
    
    /**
     * Stop the timer and return elapsed time in seconds
     * @returns {number} Elapsed time in seconds
     */
    stop() {
        if (!this.isRunning) {
            return this.elapsedTime / 1000;
        }
        
        this.isRunning = false;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Return elapsed time in seconds
        return this.elapsedTime / 1000;
    },
    
    /**
     * Reset timer state
     */
    reset() {
        this.isRunning = false;
        this.elapsedTime = 0;
        this.startTime = null;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },
    
    /**
     * Get current elapsed time in seconds
     * @returns {number} Elapsed time in seconds
     */
    getElapsedTime() {
        return this.elapsedTime / 1000;
    },
    
    /**
     * Animation loop tick
     */
    tick() {
        if (!this.isRunning) {
            return;
        }
        
        const currentTime = performance.now();
        this.elapsedTime = currentTime - this.startTime;
        
        // Call update callback if provided
        if (this.onTick) {
            this.onTick(this.elapsedTime / 1000);
        }
        
        // Continue animation using bound method
        this.animationFrameId = requestAnimationFrame(this.boundTick);
    }
};
