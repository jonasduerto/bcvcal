/**
 * Main entry point for the BCV Dollar Calculator extension.
 *
 * This script initializes the user interface when the popup DOM is fully loaded.
 * All core logic, including API calls, data processing, UI updates, and error handling,
 * is managed by the modules imported from the './src/js/' directory, primarily 'ui.js'.
 */

import { initializeUI } from './src/js/ui.js';

/**
 * Event listener for the 'DOMContentLoaded' event.
 * Initializes the popup's user interface once the DOM is fully loaded.
 * This function serves as the main entry point for the popup's functionality.
 * It delegates all UI setup and core logic to the `initializeUI` function.
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
});