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
    
    // Try multiple methods to notify the system that PTT is locked
    
    // Method 1: PTTLockHandler (if available)
    if (window.PTTLockHandler) {
      try {
        window.PTTLockHandler.postMessage(JSON.stringify({
          action: 'lock',
          reason: 'app_active'
        }));
        console.log('PTT locked via PTTLockHandler');
      } catch (error) {
        console.warn('PTTLockHandler failed:', error);
      }
    }
    
    // Method 2: PluginMessageHandler - tell Flutter to disable voice assistant
    if (window.PluginMessageHandler) {
      try {
        window.PluginMessageHandler.postMessage(JSON.stringify({
          action: 'disableVoiceAssistant',
          message: 'PTT button locked by Curling Timer X',
          lockPtt: true
        }));
        console.log('PTT lock message sent via PluginMessageHandler');
      } catch (error) {
        console.warn('PluginMessageHandler lock failed:', error);
      }
    }
    
    // Method 3: FlutterButtonHandler (if available)
    if (window.FlutterButtonHandler) {
      try {
        window.FlutterButtonHandler.postMessage(JSON.stringify({
          action: 'lockPTT',
          locked: true
        }));
        console.log('PTT locked via FlutterButtonHandler');
      } catch (error) {
        console.warn('FlutterButtonHandler lock failed:', error);
      }
    }
  }

  /**
   * Unlock the PTT button (when app becomes inactive)
   */
  unlockPTT() {
    this.isLocked = false;
    this.isAppActive = false;
    
    // Try multiple methods to notify the system that PTT is unlocked
    
    // Method 1: PTTLockHandler (if available)
    if (window.PTTLockHandler) {
      try {
        window.PTTLockHandler.postMessage(JSON.stringify({
          action: 'unlock',
          reason: 'app_inactive'
        }));
        console.log('PTT unlocked via PTTLockHandler');
      } catch (error) {
        console.warn('PTTLockHandler unlock failed:', error);
      }
    }
    
    // Method 2: PluginMessageHandler - tell Flutter to enable voice assistant
    if (window.PluginMessageHandler) {
      try {
        window.PluginMessageHandler.postMessage(JSON.stringify({
          action: 'enableVoiceAssistant',
          message: 'PTT button unlocked by Curling Timer X',
          lockPtt: false
        }));
        console.log('PTT unlock message sent via PluginMessageHandler');
      } catch (error) {
        console.warn('PluginMessageHandler unlock failed:', error);
      }
    }
    
    // Method 3: FlutterButtonHandler (if available)
    if (window.FlutterButtonHandler) {
      try {
        window.FlutterButtonHandler.postMessage(JSON.stringify({
          action: 'unlockPTT',
          locked: false
        }));
        console.log('PTT unlocked via FlutterButtonHandler');
      } catch (error) {
        console.warn('FlutterButtonHandler unlock failed:', error);
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
    const self = this;
    
    // Override addEventListener to capture longPressStart events first
    const capturedEvents = new Set();
    
    // Add a capturing phase listener for longPressStart
    window.addEventListener('longPressStart', (event) => {
      if (self.isLocked && self.isAppActive) {
        // Prevent the default action (voice assistant activation)
        if (event.cancelable) {
          event.preventDefault();
        }
        // Stop the event from propagating to voice assistant
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Mark this event as handled by the app
        capturedEvents.add(event);
        
        // Notify Flutter that we've handled this event
        self.notifyEventHandled('longPressStart');
        
        console.log('PTT longPressStart captured - Voice assistant prevented');
        
        // Return false as additional prevention measure
        return false;
      }
    }, true); // Use capturing phase

    // Add a capturing phase listener for longPressEnd
    window.addEventListener('longPressEnd', (event) => {
      if (self.isLocked && self.isAppActive) {
        // Prevent the default action (voice assistant activation)
        if (event.cancelable) {
          event.preventDefault();
        }
        // Stop the event from propagating to voice assistant
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Notify Flutter that we've handled this event
        self.notifyEventHandled('longPressEnd');
        
        console.log('PTT longPressEnd captured - Voice assistant prevented');
        
        // Return false as additional prevention measure
        return false;
      }
    }, true); // Use capturing phase

    // Also capture sideClick events
    window.addEventListener('sideClick', (event) => {
      if (self.isLocked && self.isAppActive) {
        // Prevent the default action (voice assistant activation)
        if (event.cancelable) {
          event.preventDefault();
        }
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        // Notify Flutter that we've handled this event
        self.notifyEventHandled('sideClick');
        
        console.log('PTT sideClick captured - Voice assistant prevented');
        
        // Return false as additional prevention measure
        return false;
      }
    }, true); // Use capturing phase
  }

  /**
   * Notify Flutter/native layer that we've handled a PTT event
   * This tells the system not to trigger the voice assistant
   * @param {string} eventType - Type of event that was handled
   */
  notifyEventHandled(eventType) {
    // Try to notify Flutter that we've consumed this event
    if (window.PluginMessageHandler) {
      try {
        window.PluginMessageHandler.postMessage(JSON.stringify({
          action: 'pttEventHandled',
          eventType: eventType,
          timestamp: Date.now(),
          message: 'PTT event consumed by app, do not trigger voice assistant'
        }));
      } catch (error) {
        // Silently fail - this is a best-effort notification
      }
    }
    
    if (window.FlutterButtonHandler) {
      try {
        window.FlutterButtonHandler.postMessage(JSON.stringify({
          action: 'eventHandled',
          event: eventType
        }));
      } catch (error) {
        // Silently fail - this is a best-effort notification
      }
    }
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
