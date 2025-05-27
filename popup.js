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

document.getElementById('openSidebarButton')?.addEventListener('click', async () => {
  try {
    if (chrome && chrome.tabs && chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs && tabs[0];
        if (tab && tab.id) {
          try {
            await chrome.sidePanel.open({ tabId: tab.id });
          } catch (e) {
            alert('No se pudo abrir el panel lateral: ' + (e && e.message ? e.message : e));
          }
        } else {
          alert('No se pudo determinar la pestaña activa.');
        }
      });
    } else {
      alert('Side panel API no disponible en este navegador.');
    }
  } catch (e) {
    alert('No se pudo abrir el panel lateral: ' + (e && e.message ? e.message : e));
  }
});