/**
 * Main entry point for Curling Timer X
 * Imports all modules and initializes the application
 */

// Import styles
import './style.css';

// Import modules in proper order
import { Storage } from './storage.js';
import { Timer } from './timer.js';
import { Settings } from './settings.js';
import pttHandler from './lib/ptt-handler.js';

// Initialize storage first
Storage.init();

// Initialize PTT handler to prevent voice assistant activation
pttHandler.init();

// Application is initialized by the modules themselves via DOMContentLoaded
console.log('Curling Timer X initialized');
