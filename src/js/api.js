/**
 * API functions for fetching BCV dollar rate data
 */

const API_URL = 'https://pydolarve.org/api/v1/dollar?page=bcv&monitor=usd';

/**
 * Fetches the current BCV dollar rate
 * @returns {Promise<Object>} The rate data object
 */
export async function fetchBCVRate() {
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      currentRate: parseFloat(data.price),
      previousRate: parseFloat(data.price_old),
      date: data.fetch_date || new Date().toISOString(),
      change: parseFloat(data.price) - parseFloat(data.price_old),
      changePercentage: ((parseFloat(data.price) - parseFloat(data.price_old)) / parseFloat(data.price_old)) * 100
    };
  } catch (error) {
    console.error('Error fetching rate:', error);
    throw error;
  }
}

/**
 * Formats a date string into a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    
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
    return dateString || 'Unknown date';
  }
}

/**
 * Calculate the time difference from now in a human readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Human readable time difference
 */
export function getTimeDifference(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    // Convert to seconds
    const diffSecs = Math.floor(diffMs / 1000);
    
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
    return 'Recently';
  }
}