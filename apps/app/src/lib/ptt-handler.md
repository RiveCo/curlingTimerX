# PTT Handler Guide

## Overview

The PTT (Push-to-Talk) Handler prevents the Rabbit R1 voice assistant from being activated when the PTT button is pressed while the Curling Timer X app is active. This ensures that pressing the PTT button only controls the timer and does not trigger unwanted voice assistant interactions.

## Problem

On the Rabbit R1 device, pressing the PTT (Push-to-Talk) button normally activates the voice assistant. When using the Curling Timer X app:

- **Without PTT Locking**: Pressing the PTT button would both:
  1. Start/stop the timer (desired behavior)
  2. Activate the voice assistant (undesired behavior)

- **With PTT Locking**: Pressing the PTT button only:
  1. Start/stop the timer (desired behavior)
  2. Voice assistant remains inactive (problem solved)

## Solution

The PTT Handler implements a two-layer approach to prevent voice assistant activation:

### 1. Manifest-Level Locking

The `.rabbit/manifest.json` file includes:

```json
{
  "lockPtt": true
}
```

This tells the Rabbit R1 system to lock the PTT button when the app is active, preventing the voice assistant from being triggered at the system level.

### 2. Application-Level Event Capture

The `ptt-handler.js` module provides additional protection by:

1. **Capturing PTT Events**: Uses capturing phase event listeners to intercept PTT button events before they can reach the system
2. **Preventing Propagation**: Calls `stopPropagation()` and `stopImmediatePropagation()` on PTT events
3. **Visibility Tracking**: Monitors app visibility and focus to ensure PTT locking is only active when the app is in use
4. **Automatic Lock/Unlock**: Automatically locks PTT when app is active and unlocks when app is hidden or backgrounded

## Implementation

### Initialization

The PTT Handler is automatically initialized when the app starts:

```javascript
// In main.js
import pttHandler from './lib/ptt-handler.js';

// Initialize PTT handler
pttHandler.init();
```

### How It Works

#### 1. App Startup
```
App loads → pttHandler.init() → PTT locked → Voice assistant disabled
```

#### 2. PTT Button Press (App Active)
```
User presses PTT → Event captured in capturing phase → 
stopPropagation() called → Timer starts → Voice assistant NOT triggered ✓
```

#### 3. PTT Button Press (App Hidden)
```
User presses PTT → App visibility=hidden → PTT unlocked → 
Voice assistant can be triggered normally ✓
```

#### 4. App Backgrounded
```
User switches away → visibilitychange event → PTT unlocked → 
Voice assistant available for other apps ✓
```

#### 5. App Returns to Foreground
```
User returns to app → visibilitychange event → PTT locked → 
Voice assistant disabled again ✓
```

## Event Flow

### Normal PTT Event Flow (Without Handler)
```
PTT Button Press
    ↓
longPressStart event fires
    ↓
Timer module captures event (Timer.startTimer())
    ↓
Event propagates to system
    ↓
Voice assistant activates ❌ (UNDESIRED)
```

### PTT Event Flow (With Handler)
```
PTT Button Press
    ↓
longPressStart event fires
    ↓
PTT Handler captures event (capturing phase)
    ↓
stopPropagation() / stopImmediatePropagation() called
    ↓
Timer module receives event (Timer.startTimer())
    ↓
Event does NOT propagate to system
    ↓
Voice assistant does NOT activate ✓ (DESIRED)
```

## API Reference

### PTTHandler Class

#### Methods

##### `init()`
Initializes the PTT handler and sets up all necessary event listeners.

```javascript
pttHandler.init();
```

##### `lockPTT()`
Manually locks the PTT button to prevent voice assistant activation.

```javascript
pttHandler.lockPTT();
```

##### `unlockPTT()`
Manually unlocks the PTT button to allow voice assistant activation.

```javascript
pttHandler.unlockPTT();
```

##### `isLocked()`
Returns whether the PTT button is currently locked.

```javascript
if (pttHandler.isLocked()) {
  console.log('PTT is locked');
}
```

##### `isActive()`
Returns whether the app is currently active.

```javascript
if (pttHandler.isActive()) {
  console.log('App is active');
}
```

### Events Captured

The PTT Handler captures the following events in the capturing phase:

1. **`longPressStart`** - Fired when PTT button is pressed down
2. **`longPressEnd`** - Fired when PTT button is released
3. **`sideClick`** - Fired when PTT button is clicked (short press)

## Visibility States

The PTT Handler responds to different app visibility states:

| App State | PTT Status | Voice Assistant | Reason |
|-----------|-----------|-----------------|---------|
| **Visible & Focused** | Locked | Disabled | App is in use |
| **Visible & Blurred** | Locked | Disabled | App is still visible |
| **Hidden** | Unlocked | Enabled | User switched away |
| **Unloaded** | Unlocked | Enabled | App closed |

## Testing

### Manual Testing

1. **Test PTT Locking**:
   ```
   1. Open Curling Timer X app
   2. Press and hold PTT button
   3. Verify: Timer starts, voice assistant does NOT activate ✓
   4. Release PTT button
   5. Verify: Timer stops, voice assistant does NOT activate ✓
   ```

2. **Test App Switching**:
   ```
   1. Open Curling Timer X app
   2. Switch to another app (home button)
   3. Press PTT button
   4. Verify: Voice assistant activates normally ✓
   5. Return to Curling Timer X
   6. Press PTT button
   7. Verify: Timer starts, voice assistant does NOT activate ✓
   ```

3. **Test Keyboard Fallback** (Development):
   ```
   1. Open app in browser
   2. Press and hold Space bar
   3. Verify: Timer starts
   4. Check console: "PTT longPressStart captured - Voice assistant prevented"
   5. Release Space bar
   6. Verify: Timer stops
   7. Check console: "PTT longPressEnd captured - Voice assistant prevented"
   ```

### Console Messages

The PTT Handler logs the following messages to help with debugging:

- `PTT Handler initialized - Voice assistant prevention active` - Handler started
- `App visible - PTT locked` - App became visible, PTT locked
- `App hidden - PTT unlocked` - App became hidden, PTT unlocked
- `Window focused - PTT locked` - Window gained focus, PTT locked
- `PTT longPressStart captured - Voice assistant prevented` - PTT press captured
- `PTT longPressEnd captured - Voice assistant prevented` - PTT release captured
- `PTT sideClick captured - Voice assistant prevented` - PTT click captured

## Compatibility

### Rabbit R1 Device
- ✅ Full support
- ✅ Manifest-level lockPtt support
- ✅ Event capturing support
- ✅ Visibility API support

### Development (Browser)
- ✅ Event capturing support
- ✅ Visibility API support
- ⚠️ No manifest-level lockPtt (not applicable)
- ✅ Keyboard fallback (Space bar = PTT)

## Troubleshooting

### Issue: Voice Assistant Still Activates

**Possible Causes:**
1. PTT Handler not initialized
2. Manifest lockPtt not set
3. Browser/device not supporting event capturing

**Solutions:**
1. Check console for "PTT Handler initialized" message
2. Verify `.rabbit/manifest.json` contains `"lockPtt": true`
3. Update to latest Rabbit R1 firmware

### Issue: PTT Events Not Working

**Possible Causes:**
1. Event listeners not properly attached
2. PTT Handler blocking too aggressively

**Solutions:**
1. Check console for error messages
2. Verify Timer module is properly initialized
3. Test with keyboard fallback (Space bar)

### Issue: PTT Remains Locked After Leaving App

**Possible Causes:**
1. Visibility change handler not firing
2. App not properly unloading

**Solutions:**
1. Check if visibility API is supported
2. Force close and reopen app
3. Restart Rabbit R1 device

## Best Practices

1. **Always Initialize Early**: Call `pttHandler.init()` as early as possible in app startup
2. **Don't Manually Unlock**: Let the handler manage lock/unlock automatically based on visibility
3. **Monitor Console**: Watch for PTT Handler log messages during development
4. **Test Both Modes**: Test both with app active and with app hidden
5. **Respect User Intent**: PTT should only be locked when app is actually in use

## Security Considerations

- The PTT Handler only prevents voice assistant activation when the app is visible and in use
- When the app is hidden or closed, PTT functions normally for other apps
- No system-level modifications are made - only app-level event handling
- All changes are reversed when the app is closed

## Future Enhancements

Potential improvements for future versions:

1. **User Preference**: Allow users to toggle PTT locking on/off
2. **Custom Lock Modes**: Different locking behaviors for different app screens
3. **Haptic Feedback**: Provide haptic feedback when PTT is locked
4. **Visual Indicator**: Show visual indicator when PTT is locked
5. **Lock Timeout**: Automatically unlock after period of inactivity

## Related Files

- `/apps/app/src/lib/ptt-handler.js` - PTT Handler implementation
- `/apps/app/src/main.js` - PTT Handler initialization
- `/.rabbit/manifest.json` - Manifest with lockPtt setting
- `/apps/app/src/timer.js` - Timer module that uses PTT events
- `/apps/app/src/lib/device-controls.js` - Device controls library

## References

- Rabbit R1 SDK Documentation
- R1 Creations WebView JavaScript API
- Flutter Channel Communication Guide
- Device Controls Guide

---

## Summary

The PTT Handler successfully prevents the voice assistant from being activated when the PTT button is pressed while the Curling Timer X app is active. This is achieved through:

1. **Manifest-level locking** (`lockPtt: true`)
2. **Event capture in capturing phase**
3. **Automatic visibility tracking**
4. **Proper event propagation prevention**

Users can now use the PTT button to control the timer without worrying about accidentally triggering the voice assistant.
