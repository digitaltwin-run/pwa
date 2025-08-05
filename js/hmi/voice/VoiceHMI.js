/**
 * @file Voice recognition and synthesis (STT/TTS) module
 * @module hmi/voice/VoiceHMI
 */

const DEFAULT_VOICE_CONFIG = {
  pattern: null,
  callback: null,
  isRegex: false,
  caseSensitive: false,
  cooldown: 0,
  lastTriggered: 0,
  enabled: true
};

export class VoiceHMI {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voiceCommands = new Map();
    this.debug = false;
    
    this.setupSpeechRecognition();
  }

  setupSpeechRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) throw new Error('Speech recognition not supported');
      
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      
      this.recognition.onresult = (e) => this.handleRecognitionResult(e);
      this.recognition.onerror = (e) => console.error('Recognition error:', e);
      this.recognition.onend = () => this.isListening && this.recognition?.start();
      
      if (this.debug) console.log('🎤 Speech recognition initialized');
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
    }
  }

  handleRecognitionResult(event) {
    if (!event.results?.length) return;
    
    const transcript = event.results[event.resultIndex][0].transcript.trim();
    if (this.debug) console.log('🎤 Recognized:', transcript);
    
    this.processVoiceCommand(transcript);
  }

  processVoiceCommand(transcript) {
    const now = Date.now();
    
    for (const [name, config] of this.voiceCommands.entries()) {
      if (!config.enabled) continue;
      if (now - config.lastTriggered < (config.cooldown || 0)) continue;
      
      let isMatch = false;
      
      if (config.isRegex) {
        const regex = new RegExp(config.pattern, config.caseSensitive ? '' : 'i');
        isMatch = regex.test(transcript);
      } else if (config.caseSensitive) {
        isMatch = transcript === config.pattern;
      } else {
        isMatch = transcript.toLowerCase() === config.pattern.toLowerCase();
      }
      
      if (isMatch) {
        config.lastTriggered = now;
        if (this.debug) console.log(`🎤 Matched command: ${name}`);
        
        try {
          config.callback?.({
            name,
            transcript,
            pattern: config.pattern,
            isRegex: config.isRegex
          });
        } catch (error) {
          console.error(`Error in voice command "${name}":`, error);
        }
        break;
      }
    }
  }

  command(name, pattern) {
    if (!name || typeof name !== 'string') {
      throw new Error('Command name must be a non-empty string');
    }
    
    const config = {
      ...DEFAULT_VOICE_CONFIG,
      pattern: pattern instanceof RegExp ? pattern.source : pattern,
      isRegex: pattern instanceof RegExp
    };
    
    this.voiceCommands.set(name, config);
    
    return {
      on: (callback) => {
        if (typeof callback === 'function') config.callback = callback;
        return this;
      },
      cooldown: (ms) => {
        config.cooldown = Math.max(0, parseInt(ms, 10) || 0);
        return this;
      },
      caseSensitive: (enabled = true) => {
        config.caseSensitive = !!enabled;
        return this;
      },
      enable: () => {
        config.enabled = true;
        return this;
      },
      disable: () => {
        config.enabled = false;
        return this;
      },
      remove: () => this.voiceCommands.delete(name)
    };
  }

  startListening() {
    if (!this.recognition) return false;
    if (this.isListening) return true;
    
    try {
      this.recognition.start();
      this.isListening = true;
      if (this.debug) console.log('🎤 Started listening');
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      return false;
    }
  }

  stopListening() {
    if (!this.recognition || !this.isListening) return;
    
    try {
      this.recognition.stop();
      this.isListening = false;
      if (this.debug) console.log('🎤 Stopped listening');
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply options
      if (options.voice) {
        const voices = this.synthesis.getVoices();
        const voice = voices.find(v => v.name === options.voice || v.voiceURI === options.voice);
        if (voice) utterance.voice = voice;
      }
      
      utterance.rate = Math.min(Math.max(0.1, parseFloat(options.rate) || 1), 10);
      utterance.pitch = Math.min(Math.max(0, parseFloat(options.pitch) || 1), 2);
      utterance.volume = Math.min(Math.max(0, parseFloat(options.volume) || 1), 1);
      
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      
      this.synthesis.speak(utterance);
    });
  }

  getVoices() {
    return this.synthesis?.getVoices() || [];
  }

  destroy() {
    this.stopListening();
    this.voiceCommands.clear();
    this.recognition = null;
  }
}
