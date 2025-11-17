/**
 * PTT (Push-to-Talk) Handler Library
 * Prevents the PTT button from activating the voice assistant when the app is active
 * 
 * This module implements PTT button locking to ensure that:
 * 1. PTT button presses are captured by the app
 * 2. Voice assistant is not activated when the app is in use
 * 3. Events are properly handled within the app scope
 */

class PTTHandler {
  constructor() {
    this.isLocked = false;
    this.isAppActive = false;
  }

  /**
   * Initialize PTT handler
   * Sets up event listeners to prevent voice assistant activation
   */
  init() {
    // Lock PTT when app becomes active
    this.lockPTT();
    
    // Handle visibility changes
    this.setupVisibilityListener();
    
    // Handle window focus changes
    this.setupFocusListener();
    
    // Intercept any potential voice assistant triggers
    this.interceptVoiceAssistant();
    
    console.log('PTT Handler initialized - Voice assistant prevention active');
  }

  /**
   * Lock the PTT button to prevent voice assistant activation
   */
  lockPTT() {
    this.isLocked = true;
    this.isAppActive = true;
    
    // Notify the system that PTT is locked
    // This is typically handled by the manifest.json lockPtt: true setting
    // but we also set it programmatically for additional safety
    if (window.PTTLockHandler) {
      try {
        window.PTTLockHandler.postMessage(JSON.stringify({
          action: 'lock',
          reason: 'app_active'
        }));
      } catch (error) {
        console.warn('PTTLockHandler not available:', error);
      }
    }
  }

  /**
   * Unlock the PTT button (when app becomes inactive)
   */
  unlockPTT() {
    this.isLocked = false;
    this.isAppActive = false;
    
    if (window.PTTLockHandler) {
      try {
        window.PTTLockHandler.postMessage(JSON.stringify({
          action: 'unlock',
          reason: 'app_inactive'
        }));
      } catch (error) {
        console.warn('PTTLockHandler not available:', error);
      }
    }
  }

  /**
   * Setup visibility change listener
   * Locks/unlocks PTT based on app visibility
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App is hidden/backgrounded - unlock PTT
        this.unlockPTT();
        console.log('App hidden - PTT unlocked');
      } else {
        // App is visible - lock PTT
        this.lockPTT();
        console.log('App visible - PTT locked');
      }
    });
  }

  /**
   * Setup focus listener
   * Ensures PTT remains locked when app has focus
   */
  setupFocusListener() {
    window.addEventListener('focus', () => {
      if (!this.isLocked) {
        this.lockPTT();
        console.log('Window focused - PTT locked');
      }
    });

    window.addEventListener('blur', () => {
      // Keep PTT locked even on blur unless app is hidden
      // This prevents accidental voice assistant activation during transitions
      if (!document.hidden) {
        this.lockPTT();
      }
    });
  }

  /**
   * Intercept and prevent voice assistant activation
   * Captures PTT events before they can reach the system voice assistant
   */
  interceptVoiceAssistant() {
    // Capture longPressStart events and prevent them from triggering voice assistant
    const originalLongPressStart = window.addEventListener;
    const self = this;
    
    // Override addEventListener to capture longPressStart events first
    const capturedEvents = new Set();
    
    // Add a capturing phase listener for longPressStart
    window.addEventListener('longPressStart', (event) => {
      if (self.isLocked && self.isAppActive) {
        // Stop the event from propagating to voice assistant
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Mark this event as handled by the app
        capturedEvents.add(event);
        
        console.log('PTT longPressStart captured - Voice assistant prevented');
      }
    }, true); // Use capturing phase

    // Add a capturing phase listener for longPressEnd
    window.addEventListener('longPressEnd', (event) => {
      if (self.isLocked && self.isAppActive) {
        // Stop the event from propagating to voice assistant
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('PTT longPressEnd captured - Voice assistant prevented');
      }
    }, true); // Use capturing phase

    // Also capture sideClick events
    window.addEventListener('sideClick', (event) => {
      if (self.isLocked && self.isAppActive) {
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('PTT sideClick captured - Voice assistant prevented');
      }
    }, true); // Use capturing phase
  }

  /**
   * Check if PTT is currently locked
   * @returns {boolean} True if PTT is locked
   */
  isLocked() {
    return this.isLocked;
  }

  /**
   * Check if app is currently active
   * @returns {boolean} True if app is active
   */
  isActive() {
    return this.isAppActive;
  }
}

// Export singleton instance
const pttHandler = new PTTHandler();

// Example usage:
// import pttHandler from './lib/ptt-handler.js';
// pttHandler.init(); // Initialize PTT locking

export default pttHandler;
