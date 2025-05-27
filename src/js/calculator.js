/**
 * @file Contains utility functions for currency conversion, formatting, and rate analysis.
 */

/**
 * Converts an amount from US Dollars (USD) to Venezuelan Bolívar (VES) using a given exchange rate.
 * Returns 0 if any input is invalid or not a number.
 * @function convertUSDtoBs
 * @param {number} amount - The amount in USD to convert.
 * @param {number} rate - The current VES/USD exchange rate.
 * @returns {number} The equivalent amount in VES, or 0 if inputs are invalid.
 */
export function convertUSDtoBs(amount, rate) {
  if (typeof amount !== 'number' || isNaN(amount) || typeof rate !== 'number' || isNaN(rate)) {
    console.warn('Invalid input for convertUSDtoBs: Amount or rate is not a number.', {amount, rate});
    return 0;
  }
  return amount * rate;
}

/**
 * Converts an amount from Venezuelan Bolívar (VES) to US Dollars (USD) using a given exchange rate.
 * Returns 0 if any input is invalid, not a number, or if the rate is zero (to prevent division by zero).
 * @function convertBstoUSD
 * @param {number} amount - The amount in VES to convert.
 * @param {number} rate - The current VES/USD exchange rate.
 * @returns {number} The equivalent amount in USD, or 0 if inputs are invalid or rate is zero.
 */
export function convertBstoUSD(amount, rate) {
  if (typeof amount !== 'number' || isNaN(amount) || typeof rate !== 'number' || isNaN(rate) || rate === 0) {
    console.warn('Invalid input for convertBstoUSD: Amount or rate is invalid or rate is zero.', {amount, rate});
    return 0;
  }
  return amount / rate;
}

/**
 * Formats a numeric amount into a currency string based on the specified currency type.
 * Handles USD and VES (Bolívares) formatting.
 * Returns a default formatted zero value if the amount is invalid.
 * @function formatCurrency
 * @param {number|null|undefined} amount - The numeric amount to format.
 * @param {string} currency - The currency type, either 'USD' or 'Bs' (for VES).
 * @returns {string} A string representing the formatted currency amount.
 *                   Example: "$1,234.50" for USD, "Bs. 1.234,50" for VES.
 */
export function formatCurrency(amount, currency) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    // Return a default formatted zero based on currency
    return currency === 'USD' ? '$0.00' : 'Bs. 0,00';
  }
  
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } else { // Assuming 'Bs' or any other value defaults to VES formatting
    return 'Bs. ' + new Intl.NumberFormat('es-VE', { // Using 'es-VE' for typical Venezuelan formatting
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

/**
 * Formats a numeric percentage value into a string with two decimal places and a percent sign.
 * Returns "0.00%" if the input is invalid.
 * @function formatPercentage
 * @param {number|null|undefined} percentage - The percentage value to format.
 * @returns {string} A string representing the formatted percentage (e.g., "12.34%").
 */
export function formatPercentage(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0.00%';
  }
  const formattedValue = percentage.toFixed(2);
  return `${formattedValue}%`;
}

/**
 * Determines if the current exchange rate represents an increase, decrease, or no change
 * compared to the previous rate.
 * @function getRateChangeType
 * @param {number} currentRate - The current exchange rate.
 * @param {number} previousRate - The previous exchange rate.
 * @returns {('increase'|'decrease'|'same')} A string indicating the type of rate change.
 * Returns 'same' if rates are equal or inputs are invalid/not numbers.
 */
export function getRateChangeType(currentRate, previousRate) {
  if (typeof currentRate !== 'number' || isNaN(currentRate) || typeof previousRate !== 'number' || isNaN(previousRate)) {
    console.warn('Invalid input for getRateChangeType: Rates must be numbers.', {currentRate, previousRate});
    return 'same'; // Default to 'same' if inputs are problematic
  }

  if (currentRate > previousRate) {
    return 'increase';
  } else if (currentRate < previousRate) {
    return 'decrease';
  } else {
    return 'same';
  }
}