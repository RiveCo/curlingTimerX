# Experimental Physics-Based Curling Predictor

This experimental branch implements a completely new approach to curling timing with physics-based predictions and calibration.

## Overview

Instead of simple timing comparisons, this version uses real curling physics to:
- Predict where the rock will stop
- Recommend sweeping intensity
- Classify throws into zones (Guard/Draw/Takeout)
- Calibrate to actual ice conditions

## Key Features

### 1. Physics Model

The app uses a constant deceleration model based on real curling physics:

```
distance = v0² / (2a)

where:
- v0 = initial velocity at hog line (ft/s)
- a = deceleration constant (ft/s²)
- distance = predicted stopping distance from hog line (feet)
```

**How it works:**
1. You time from hog line to back line (126 feet)
2. App calculates initial velocity: `v0 = 2 × distance / time`
3. App predicts final distance using calibrated deceleration
4. App shows where rock will stop with and without sweeping

### 2. Zone Classification

Three distinct zones based on official curling dimensions:

- **Guard Zone** (0-54 ft from hog line)
  - Before the house
  - Used for defensive play
  - Icon: 🛡️

- **Draw Zone** (54-78 ft from hog line)
  - The house (12-foot circle)
  - Scoring zone
  - Icon: 🎯

- **Takeout Zone** (78-126 ft from hog line)
  - Beyond the house
  - Used to remove opponent stones
  - Icon: ❌

### 3. Sweeping Recommendations

Based on predicted distance vs. intended zone:

- **Hard Sweep** (red, pulsing) - Rock is >10 ft short, sweep hard!
- **Sweep** (yellow) - Rock is 3-10 ft short, sweep normally
- **Good** (green) - Rock is on target
- **Fast** (blue) - Rock is past target, no sweeping

The app also shows TWO predicted positions:
- **Yellow dot** = without sweeping
- **Green dot** = with sweeping (+5% distance)

### 4. Calibration System

The app learns from your actual throws:

**How to Calibrate:**
1. Complete a throw (timer shows the time)
2. After the next throw, a slider appears
3. Move the slider to match where the previous rock actually stopped
4. The app automatically accepts and updates its physics model

**Physical Button:** On Rabbit R1, you can also press the side button to accept calibration at the current slider position.

**Behind the Scenes:**
- App stores last 10 calibration throws
- Uses weighted average (newer throws count more)
- Adjusts deceleration constant to match your ice conditions
- Each session improves predictions

### 5. Score Prediction

Shows whether the predicted position will score:
- **✓ Score** (green) - Rock will be inside the house
- **○ No Score** (gray) - Rock will be outside

## User Interface

### Compact Design for Rabbit R1 (240×282 pixels)

```
┌─────────────────────────┐
│ Curling Predictor  🎯Draw│  ← Header with current zone
├─────────────────────────┤
│                         │
│   [Curling Sheet]       │  ← Canvas showing zones & predictions
│   • Yellow = No sweep   │
│   • Green = With sweep  │
│                         │
├─────────────────────────┤
│ 🛡️Guard 🎯Draw ❌Takeout │  ← Zone selection
├─────────────────────────┤
│ Hard Sweep  ✓ Score     │  ← Recommendations
├─────────────────────────┤
│ [Calibration Slider]    │  ← Shows when needed
├─────────────────────────┤
│ 3.650s    [PRESS HOLD]  │  ← Timer & button
├─────────────────────────┤
│ Cal: 5 samples          │  ← Calibration status
└─────────────────────────┘
```

## Workflow

### Normal Throw Sequence:

1. **Select Zone** - Choose Guard, Draw, or Takeout
2. **Press & Hold** - Start timing when rock crosses hog line
3. **Release** - Stop timing when rock crosses back line
4. **View Prediction** - See where rock will stop (with/without sweeping)
5. **Get Recommendation** - See if you should sweep
6. **Check Score** - See if throw will score

### Calibration Sequence:

1. Complete first throw (e.g., 3.5 seconds)
2. Complete second throw (e.g., 3.8 seconds)
3. Calibration slider appears for first throw
4. Move slider to match where first rock actually stopped
5. App accepts calibration and updates model
6. Future predictions become more accurate

## Physics Details

### Curling Rink Dimensions

Based on World Curling Federation regulations:
- Hog line to back line: 126 feet
- Hog line to tee (button): 66 feet
- House diameter: 12 feet (outer circle)
- Guard zone: 0-54 feet from hog line

### Deceleration Model

Default deceleration: 0.15 ft/s²

This is adjusted through calibration. Factors affecting deceleration:
- Ice temperature
- Pebble condition
- Rock condition
- Humidity

### Sweeping Effect

Based on research:
- Normal sweeping: +5% distance
- Hard sweeping: +10% distance

These values are configurable in the physics model.

## Files

- **physics.js** - Core physics calculations and calibration
- **new-timer.js** - Timer logic and UI management
- **new-main.js** - Application initialization
- **new-style.css** - Compact UI styling

## Development

### Testing Locally

```bash
cd apps/app
npm install
npm run dev
```

Open http://localhost:5173 in a browser resized to 240×282 pixels.

### Building

```bash
npm run build
```

### Keyboard Controls (for testing)

- **Space bar** - Simulate Rabbit R1 side button
- **Arrow Up/Down** - Simulate scroll wheel (not used in this version)

## Future Enhancements

Possible improvements:
- Curl (lateral movement) prediction
- Multiple calibration profiles for different ice conditions
- Historical throw tracking and statistics
- Shot success rate by zone
- Ice speed rating (1-10 scale) integration
- Weight range recommendations per zone

## Comparison to Original

| Feature | Original | Experimental |
|---------|----------|--------------|
| Timing | ✅ Hog to back | ✅ Hog to back |
| Predictions | ❌ None | ✅ Physics-based |
| Zones | Fixed times | Dynamic classification |
| Calibration | Time adjustment | Physics calibration |
| Sweeping | Simple feedback | Intelligent recommendations |
| Score | N/A | Predicted |
| Canvas | Simple shapes | Full rink visualization |

## Known Limitations

1. Assumes straight throws (no curl)
2. Assumes constant deceleration
3. Minimum 1.5s timing required (validation)
4. 2D visualization only (no 3D)
5. Calibration requires manual slider adjustment

## Credits

Physics model based on curling dynamics research and WCF regulations.
