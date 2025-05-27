/**
 * Storage functions for managing conversion history
 */

const HISTORY_KEY = 'bcv_conversion_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * @typedef {object} ConversionItem
 * @property {number} fromAmount - The amount that was converted.
 * @property {string} fromCurrency - The currency from which conversion was made (e.g., 'USD').
 * @property {number} toAmount - The result of the conversion.
 * @property {string} toCurrency - The currency to which conversion was made (e.g., 'Bs').
 * @property {number} rate - The exchange rate used for the conversion.
 * @property {string} timestamp - ISO string representing when the conversion was made.
 */

/**
 * Retrieves the conversion history from `localStorage`.
 * @function getConversionHistory
 * @returns {Array<ConversionItem>} An array of conversion history items, or an empty array if no history is found or an error occurs.
 * @sideEffects Outputs an error to the console if parsing fails.
 */
export function getConversionHistory() {
  try {
    const historyJSON = localStorage.getItem(HISTORY_KEY);
    return historyJSON ? JSON.parse(historyJSON) : [];
  } catch (error) {
    console.error('Error getting conversion history:', error);
    return [];
  }
}

/**
 * Adds a new conversion record to the history stored in `localStorage`.
 * The history is maintained as a list, with the most recent conversion at the beginning.
 * The history is capped at `MAX_HISTORY_ITEMS`.
 * @function addConversionToHistory
 * @param {object} conversion - The conversion data to add.
 * @param {number} conversion.fromAmount - The amount that was converted.
 * @param {string} conversion.fromCurrency - The currency from which conversion was made.
 * @param {number} conversion.toAmount - The result of the conversion.
 * @param {string} conversion.toCurrency - The currency to which conversion was made.
 * @param {number} conversion.rate - The exchange rate used.
 * @returns {Array<ConversionItem>|undefined} The updated history array, or undefined if input is invalid or an error occurs.
 * @sideEffects Modifies `localStorage`. Outputs an error to the console if an error occurs.
 */
export function addConversionToHistory(conversion) {
  if (!conversion || typeof conversion.fromAmount !== 'number' || typeof conversion.toAmount !== 'number') {
    console.warn('Invalid conversion object provided to addConversionToHistory.');
    return;
  }
  try {
    const historyItem = {
      ...conversion,
      timestamp: new Date().toISOString()
    };
    
    let history = getConversionHistory();
    history.unshift(historyItem);
    
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
  } catch (error) {
    console.error('Error adding conversion to history:', error);
    // Not returning undefined here as per original logic, but it might be better to.
  }
}

/**
 * Clears all conversion history from `localStorage`.
 * @function clearConversionHistory
 * @sideEffects Modifies `localStorage` by removing the history item. Outputs an error to the console if an error occurs.
 */
export function clearConversionHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing conversion history:', error);
  }
}

/**
 * Formats an ISO timestamp string into a user-friendly relative or short date format
 * for display in the conversion history.
 * Examples: "HH:MM AM/PM" (for today), "Yesterday", "Mon" (for this week), "MM/DD" (older).
 * @function formatHistoryTimestamp
 * @param {string} timestamp - The ISO timestamp string to format.
 * @returns {string} A formatted string representing the timestamp, or "Unknown" if formatting fails or input is invalid.
 * @sideEffects Outputs an error to the console if an error occurs.
 */
export function formatHistoryTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid timestamp provided.');
    }
    const now = new Date();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    if (date > lastWeek) {
      return date.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., "Mon"
    }
    
    return date.toLocaleDateString('en-US', { // Default format e.g., "03/15"
      month: 'numeric',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting history timestamp:', error);
    return 'Unknown';
  }
}