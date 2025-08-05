# HMI (Human-Machine Interface) System

A comprehensive, modular, and extensible HMI system for advanced gesture and voice recognition in web applications. Perfect for creating intuitive, touch-friendly interfaces with natural interaction patterns.

## 🌟 Features

- **Advanced Gesture Recognition**: Detect a wide variety of gestures including:
  - Basic: Swipes, circles, lines
  - Advanced: Checkmarks (✓), question marks (?), zigzags, and custom patterns
  - Multi-touch: Pinch, rotate, and multi-finger gestures
- **Voice Control**: Full speech recognition and text-to-speech capabilities
- **Fluent API**: Intuitive, chainable API for defining interactions
- **Modular Architecture**: Easily extensible with custom gesture detectors and voice commands
- **Debug Tools**: Built-in debugging with detailed logging and visualization
- **Smart Constraints**: Define detection areas, timing, and sequence requirements
- **Performance Optimized**: Efficient event handling with requestAnimationFrame and passive event listeners
- **Cross-Platform**: Works on both desktop and mobile devices
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install @your-org/hmi

# Or using Yarn
yarn add @your-org/hmi

# Or include directly in HTML
<script src="path/to/hmi/dist/hmi.min.js"></script>
```

### Basic Setup

```javascript
import { createHMI } from '@your-org/hmi';

// Initialize with a target element and options
const hmi = createHMI(document.body, {
  debug: true,      // Enable debug logging
  autoStartVoice: false  // Don't start listening for voice commands automatically
});

// Start voice recognition when user grants permission
document.getElementById('start-voice').addEventListener('click', () => {
  hmi.voiceHMI.startListening();
  hmi.voiceHMI.speak('Voice commands are now active');
});

// Clean up when your app is being torn down
// window.addEventListener('beforeunload', () => hmi.destroy());
```

## ✋ Gesture Reference

### Available Gestures

#### 1. Swipe
Detects swipe gestures in four directions with configurable sensitivity.

```javascript
hmi.gesture('rightSwipe')
  .swipe('right', { 
    minDistance: 50,  // minimum distance in pixels
    maxTime: 500      // maximum duration in ms
  })
  .on(({ result }) => {
    console.log('Swiped right!', result);
  });

// Available directions: 'up', 'down', 'left', 'right'
// Or use directional shortcuts:
hmi.gesture('swipeUp').swipeUp();
hmi.gesture('swipeDown').swipeDown();
```

#### 2. Circle
Detects circular motions with configurable size and tolerance.

```javascript
hmi.gesture('circle')
  .circle({
    minRadius: 30,    // minimum circle radius
    maxRadius: 200,   // maximum circle radius
    tolerance: 0.2    // allowed deviation from perfect circle (0-1)
  })
  .on(({ result }) => {
    console.log('Circle detected!', result);
  });
```

#### 3. Check Mark (✓)
Detects check mark gestures.

```javascript
hmi.gesture('checkMark')
  .check()
  .on(({ result }) => {
    console.log('Check mark detected!', result);
  });
```

#### 4. Question Mark (?)
Detects question mark gestures.

```javascript
hmi.gesture('question')
  .questionMark()
  .on(({ result }) => {
    console.log('Question mark detected!', result);
  });
```

#### 5. Zigzag
Detects back-and-forth zigzag motions.

```javascript
hmi.gesture('zigzag')
  .zigzag({
    minZigZags: 3,    // minimum number of direction changes
    maxAngle: 45      // maximum angle between segments
  })
  .on(({ result }) => {
    console.log('Zigzag detected!', result);
  });
```

#### 6. Custom Gesture
Create your own gesture detectors.

```javascript
hmi.gesture('customShape')
  .custom((points, options) => {
    // Your custom gesture detection logic here
    return {
      detected: true,  // or false
      confidence: 0.9, // confidence level (0-1)
      // Any additional data you want to pass to the callback
    };
  })
  .on(({ result }) => {
    console.log('Custom gesture detected!', result);
  });
```

### Gesture Options

All gestures support these common options:

- `area`: Define a bounding box where the gesture is valid
  ```javascript
  .inArea({
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: 100
  })
  ```
- `cooldown`: Minimum time between gesture detections (ms)
  ```javascript
  .cooldown(1000)  // 1 second cooldown
  ```
- `priority`: Set gesture priority (higher numbers take precedence)
  ```javascript
  .priority(10)
  ```
- `condition`: Add custom conditions
  ```javascript
  .when(() => someCondition)
  ```

## 🎙️ Voice Commands

### Basic Usage

```javascript
// Simple voice command
hmi.voice('greeting', 'hello computer')
  .on(({ transcript }) => {
    console.log('Heard:', transcript);
    hmi.voiceHMI.speak('Hello! How can I help you?');
  });

// Command with regex pattern
hmi.voice('colorChange', /change color to (red|blue|green)/i)
  .on(({ transcript, matches }) => {
    const color = matches[1].toLowerCase();
    document.body.style.backgroundColor = color;
  });

// Case-sensitive command
hmi.voice('caseSensitive', 'CaseSensitiveText')
  .caseSensitive(true)
  .on(/* ... */);
```

### Voice Command Options

- `cooldown`: Minimum time between command detections (ms)
  ```javascript
  .cooldown(2000)  // 2 second cooldown
  ```
- `caseSensitive`: Whether the command is case sensitive
  ```javascript
  .caseSensitive(true)
  ```
- `enabled`: Enable/disable the command
  ```javascript
  .enable()  // or .disable()
  ```

### Text-to-Speech

```javascript
// Simple text-to-speech
hmi.voiceHMI.speak('Hello, world!');

// With options
hmi.voiceHMI.speak('This is a test', {
  rate: 1.2,     // Speaking rate (0.1 to 10)
  pitch: 1.1,    // Pitch (0 to 2)
  volume: 0.8,   // Volume (0 to 1)
  voice: 'Google UK English Female'  // Specific voice
});

// Get available voices
const voices = hmi.voiceHMI.getVoices();
```

## 🔗 Gesture Sequences

Create multi-step gestures by chaining them together:

```javascript
let sequence = [];

hmi.gesture('star')
  .custom((points) => {
    // Custom star detection logic
    sequence.push({ points, timestamp: Date.now() });
    // Keep only recent gestures (last 2 seconds)
    sequence = sequence.filter(g => (Date.now() - g.timestamp) < 2000);
    
    // Check for star pattern in the sequence
    // ...
    
    return {
      detected: isStarPattern,
      confidence: 0.9
    };
  })
  .on(({ result }) => {
    console.log('Star gesture detected!', result);
    sequence = []; // Reset sequence
  });
```

## 🛠️ Advanced Usage

### Multi-touch Gestures

```javascript
// Two-finger tap
hmi.gesture('twoFingerTap')
  .withTouches(2)  // Require exactly 2 touch points
  .on(({ result }) => {
    console.log('Two-finger tap detected!');
  });
```

### Debugging

```javascript
// Enable debug mode
const hmi = createHMI(document.body, { debug: true });

// Or enable later
hmi.enableDebug();

// Visual feedback for debugging
hmi.gesture('debugCircle')
  .circle()
  .on(({ points }) => {
    // Visualize the drawn points
    visualizePoints(points);
  });
```

### Performance Optimization

```javascript
// For high-frequency events, use throttling
import { throttle } from './utils/helpers';

const throttledHandler = throttle((points) => {
  // Handle points with throttling
}, 100);  // Max once every 100ms

hmi.gesture('highFreq')
  .custom((points) => {
    throttledHandler(points);
    return { detected: false }; // Don't trigger the main callback
  });
```

## 📚 API Reference

### HMIManager

The main class that coordinates gesture and voice recognition.

#### Methods

- `gesture(name)`: Register a new gesture
- `voice(name, pattern)`: Register a new voice command
- `enableDebug()`: Enable debug logging
- `destroy()`: Clean up all event listeners and resources

### GestureDetector

Handles gesture recognition on a target element.

#### Methods

- `swipe(direction, options)`: Detect swipe gestures
- `circle(options)`: Detect circular motions
- `check(options)`: Detect check mark gestures
- `questionMark(options)`: Detect question mark gestures
- `zigzag(options)`: Detect zigzag motions
- `custom(detectorFn)`: Create custom gesture detectors
- `withTouches(count)`: Set required number of touch points
- `inArea(bounds)`: Constrain gesture detection to an area
- `cooldown(ms)`: Set cooldown period
- `priority(level)`: Set gesture priority
- `when(condition)`: Add custom conditions

### VoiceHMI

Handles speech recognition and synthesis.

#### Methods

- `command(name, pattern)`: Register a voice command
- `startListening()`: Start speech recognition
- `stopListening()`: Stop speech recognition
- `speak(text, options)`: Convert text to speech
- `getVoices()`: Get available speech synthesis voices
- `isListening`: Boolean indicating if recognition is active

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Usage

### Basic Setup

```javascript
import { createHMI } from './hmi';

// Initialize the HMI system
const hmi = createHMI(document.body, { debug: true });

// Start voice recognition
hmi.voiceHMI.startListening();

// Clean up when done
// hmi.destroy();
```

### Gesture Detection

```javascript
// Register a swipe gesture
hmi.gesture('rightSwipe')
  .swipe('right', { minDistance: 50 })
  .on(({ result }) => {
    console.log('Swiped right!', result);
  });

// Register a circle gesture
hmi.gesture('circle')
  .circle({ minRadius: 30 })
  .on(({ result }) => {
    console.log('Circle detected!', result);
  });
```

### Voice Commands

```javascript
// Register a voice command
hmi.voice('hello', 'hello computer')
  .on(({ transcript }) => {
    console.log(`You said: ${transcript}`);
    hmi.voiceHMI.speak('Hello! How can I help you?');
  });
```

## API Reference

### HMIManager

The main class that coordinates gesture and voice recognition.

#### Methods

- `gesture(name)`: Register a new gesture
- `voice(name, pattern)`: Register a new voice command
- `startVoice()`: Start voice recognition
- `stopVoice()`: Stop voice recognition
- `speak(text, options)`: Convert text to speech
- `destroy()`: Clean up resources

### GestureDetector

Handles gesture recognition on a target element.

#### Gesture Types

- `swipe(direction, options)`: Detect swipe gestures
- `circle(options)`: Detect circular motions
- `line(options)`: Detect straight line gestures
- `custom(detectorFn)`: Create custom gesture detectors

### VoiceHMI

Handles speech recognition and synthesis.

#### Methods

- `command(name, pattern)`: Register a voice command
- `startListening()`: Start speech recognition
- `stopListening()`: Stop speech recognition
- `speak(text, options)`: Convert text to speech
- `getVoices()`: Get available speech synthesis voices

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

MIT
