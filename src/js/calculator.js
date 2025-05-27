/**
 * Calculator functions for currency conversions
 */

/**
 * Convert USD to Bolivares
 * @param {number} amount - Amount in USD
 * @param {number} rate - Exchange rate
 * @returns {number} Amount in Bolivares
 */
export function convertUSDtoBs(amount, rate) {
  if (!amount || isNaN(amount) || !rate || isNaN(rate)) {
    return 0;
  }
  
  return amount * rate;
}

/**
 * Convert Bolivares to USD
 * @param {number} amount - Amount in Bolivares
 * @param {number} rate - Exchange rate
 * @returns {number} Amount in USD
 */
export function convertBstoUSD(amount, rate) {
  if (!amount || isNaN(amount) || !rate || isNaN(rate) || rate === 0) {
    return 0;
  }
  
  return amount / rate;
}

/**
 * Format currency based on type
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency type ('USD' or 'Bs')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === 'USD' ? '$0.00' : 'Bs. 0,00';
  }
  
  if (currency === 'USD') {
    // Format as USD
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } else {
    // Format as Venezuelan Bolivares
    return 'Bs. ' + new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

/**
 * Format percentage change
 * @param {number} percentage - Percentage value
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0.00%';
  }
  
  const formattedValue = percentage.toFixed(2);
  return `${formattedValue}%`;
}

/**
 * Determine if the rate has increased, decreased, or remained the same
 * @param {number} currentRate - Current rate
 * @param {number} previousRate - Previous rate
 * @returns {string} 'increase', 'decrease', or 'same'
 */
export function getRateChangeType(currentRate, previousRate) {
  if (currentRate > previousRate) {
    return 'increase';
  } else if (currentRate < previousRate) {
    return 'decrease';
  } else {
    return 'same';
  }
}