/**
 * Storage functions for managing conversion history
 */

const HISTORY_KEY = 'bcv_conversion_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Get conversion history from local storage
 * @returns {Array} Array of conversion history items
 */
export function getConversionHistory() {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting conversion history:', error);
    return [];
  }
}

/**
 * Add a conversion to history
 * @param {Object} conversion - Conversion object
 */
export function addConversionToHistory(conversion) {
  try {
    if (!conversion) return;
    
    // Create history item
    const historyItem = {
      ...conversion,
      timestamp: new Date().toISOString()
    };
    
    // Get existing history
    let history = getConversionHistory();
    
    // Add new item to the beginning
    history.unshift(historyItem);
    
    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // Save to local storage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    
    return history;
  } catch (error) {
    console.error('Error adding conversion to history:', error);
  }
}

/**
 * Clear conversion history
 */
export function clearConversionHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing conversion history:', error);
  }
}

/**
 * Format timestamp for display in history
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted timestamp
 */
export function formatHistoryTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true 
      });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // This week (last 7 days)
    const lastWeek = new Date(now);
    lastWeek.setDate(now.getDate() - 7);
    if (date > lastWeek) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Default format (MM/DD)
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting history timestamp:', error);
    return 'Unknown';
  }
}