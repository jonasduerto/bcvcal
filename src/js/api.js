/**
 * API functions for fetching BCV dollar rate data
 */

const API_URL = 'https://pydolarve.org/api/v1/dollar?page=bcv&monitor=usd';

/**
 * Fetches the current BCV (Banco Central de Venezuela) dollar exchange rate data from the pydolarve API.
 * The function constructs an object containing the current rate, previous rate, date of the data,
 * the change amount, and the percentage change.
 * @async
 * @function fetchBCVRate
 * @returns {Promise<object>} A promise that resolves to an object with rate data:
 *  - `currentRate` {number}: The current exchange rate.
 *  - `previousRate` {number}: The previous day's exchange rate.
 *  - `date` {string}: ISO string representing the date of the fetched data (from API or current if not provided).
 *  - `change` {number}: The absolute difference between current and previous rates.
 *  - `changePercentage` {number}: The percentage difference between current and previous rates.
 * @throws {Error} If the network request fails, the API returns a non-OK status, or if parsing the response fails.
 *                 The error object will contain a message detailing the issue.
 * @sideEffects Outputs an error message to the console if an error occurs.
 */
export async function fetchBCVRate() {
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate essential data presence
    if (data.price === undefined || data.price_old === undefined) {
        throw new Error('API response missing essential price data.');
    }

    const currentPrice = parseFloat(data.price);
    const previousPrice = parseFloat(data.price_old);

    if (isNaN(currentPrice) || isNaN(previousPrice)) {
        throw new Error('Invalid number format for price data in API response.');
    }

    return {
      currentRate: currentPrice,
      previousRate: previousPrice,
      date: data.fetch_date || new Date().toISOString(), // Fallback to current date if API doesn't provide one
      change: currentPrice - previousPrice,
      changePercentage: previousPrice !== 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0 // Avoid division by zero
    };
  } catch (error) {
    console.error('Error fetching BCV rate:', error);
    throw error; // Re-throw the error so it can be caught by the caller
  }
}

/**
 * Formats an ISO date string into a human-readable string.
 * Displays as "Today at HH:MM AM/PM" if the date is today,
 * otherwise as "MM/DD/YYYY at HH:MM AM/PM".
 * @function formatDate
 * @param {string} dateString - The ISO date string to format.
 * @returns {string} The formatted date string, or the original string if formatting fails, or 'Unknown date' if input is falsy.
 * @sideEffects Outputs an error message to the console if formatting fails.
 */
export function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
        throw new Error('Invalid dateString provided.');
    }
    
    // Format: Today at HH:MM AM/PM or MM/DD/YYYY at HH:MM AM/PM
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const time = date.toLocaleTimeString('en-US', timeOptions);
    
    if (isToday) {
      return `Today at ${time}`;
    } else {
      const dateOptions = { month: 'numeric', day: 'numeric', year: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', dateOptions);
      return `${formattedDate} at ${time}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string on error
  }
}

/**
 * Calculates the time difference between a given ISO date string and the current time,
 * and returns it in a human-readable format (e.g., "5 secs ago", "10 mins ago", "2 hours ago", "3 days ago").
 * @function getTimeDifference
 * @param {string} dateString - The ISO date string from which to calculate the time difference.
 * @returns {string} A string representing the time difference, or "Recently" if formatting fails or input is invalid.
 * @sideEffects Outputs an error message to the console if an error occurs.
 */
export function getTimeDifference(dateString) {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid dateString provided.');
    }
    const now = new Date();
    const diffMs = now - date;
    
    // Convert to seconds
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 0) return 'In the future'; // Handle dates in the future
    if (diffSecs < 60) {
      return `${diffSecs} sec${diffSecs !== 1 ? 's' : ''} ago`;
    }
    
    // Convert to minutes
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    // Convert to hours
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    // Convert to days
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return 'Recently'; // Fallback value
  }
}