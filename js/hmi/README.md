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

## Installation

```bash
npm install @your-org/hmi
# or
yarn add @your-org/hmi
```

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
