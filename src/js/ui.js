/**
 * UI functions for handling user interface interactions
 */

import { fetchBCVRate, formatDate, getTimeDifference } from './api.js';
import { 
  convertUSDtoBs, 
  convertBstoUSD, 
  formatCurrency, 
  formatPercentage,
  getRateChangeType
} from './calculator.js';
import { 
  addConversionToHistory, 
  getConversionHistory, 
  clearConversionHistory,
  formatHistoryTimestamp
} from './storage.js';

// State
let currentState = {
  currentRate: 0,
  previousRate: 0,
  date: null,
  mode: 'usd-to-bs', // 'usd-to-bs' or 'bs-to-usd'
  amount: '',
  result: null
};

// DOM Elements
let elements = {};

/**
 * Initialize the UI
 */
export function initializeUI() {
  // Cache DOM elements
  cacheElements();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load initial data
  loadData();
  
  // Render initial UI
  renderUI();
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  elements = {
    currentRateValue: document.getElementById('currentRateValue'),
    previousRateValue: document.getElementById('previousRateValue'),
    lastUpdated: document.getElementById('lastUpdated'),
    rateChange: document.getElementById('rateChange'),
    rateChangeIcon: document.getElementById('rateChangeIcon'),
    fromLabel: document.getElementById('fromLabel'),
    fromSymbol: document.getElementById('fromSymbol'),
    fromInput: document.getElementById('fromInput'),
    fromGroup: document.getElementById('fromGroup'),
    toLabel: document.getElementById('toLabel'),
    toSymbol: document.getElementById('toSymbol'),
    toInput: document.getElementById('toInput'),
    toGroup: document.getElementById('toGroup'),
    swapButton: document.getElementById('swapButton'),
    convertButton: document.getElementById('convertButton'),
    convertButtonBs: document.getElementById('convertButtonBs'),
    resultCard: document.getElementById('resultCard'),
    resultValue: document.getElementById('resultValue'),
    copyButton: document.getElementById('copyButton'),
    historyList: document.getElementById('historyList'),
    clearHistoryButton: document.getElementById('clearHistoryButton')
  };
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Convert buttons
  elements.convertButton.addEventListener('click', handleConvert);
  elements.convertButtonBs.addEventListener('click', handleConvert);
  
  // Swap button
  elements.swapButton.addEventListener('click', handleSwap);
  
  // Copy button
  elements.copyButton.addEventListener('click', handleCopy);
  
  // Clear history button
  elements.clearHistoryButton.addEventListener('click', handleClearHistory);
  
  // Input validation and Enter key support
  elements.fromInput.addEventListener('input', validateInput);
  elements.toInput.addEventListener('input', validateInput);
  
  elements.fromInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleConvert();
    }
  });
  
  elements.toInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleConvert();
    }
  });
}

/**
 * Load initial data
 */
async function loadData() {
  try {
    // Show loading state
    showLoadingState();
    
    // Fetch rate data
    const rateData = await fetchBCVRate();
    
    // Update state
    currentState = {
      ...currentState,
      currentRate: rateData.currentRate,
      previousRate: rateData.previousRate,
      date: rateData.date,
      change: rateData.change,
      changePercentage: rateData.changePercentage
    };
    
    // Render UI with data
    renderRateData();
    
    // Render history
    renderHistory();
    
  } catch (error) {
    console.error('Error loading data:', error);
    showErrorState(error);
  }
}

/**
 * Show loading state
 */
function showLoadingState() {
  elements.currentRateValue.textContent = 'Loading...';
  elements.currentRateValue.classList.add('loading');
  elements.previousRateValue.textContent = 'Loading...';
  elements.previousRateValue.classList.add('loading');
  elements.lastUpdated.textContent = 'Fetching latest rates...';
}

/**
 * Show error state
 * @param {Error} error - The error that occurred
 */
function showErrorState(error) {
  elements.currentRateValue.textContent = 'Error';
  elements.currentRateValue.classList.remove('loading');
  elements.previousRateValue.textContent = 'Error';
  elements.previousRateValue.classList.remove('loading');
  elements.lastUpdated.textContent = 'Could not fetch rates';
  
  // Show toast with error
  showToast(`Error fetching rates: ${error.message}`);
}

/**
 * Render the UI
 */
function renderUI() {
  renderRateData();
  updateConversionUI();
  renderHistory();
}

/**
 * Render rate data
 */
function renderRateData() {
  // Remove loading class
  elements.currentRateValue.classList.remove('loading');
  elements.previousRateValue.classList.remove('loading');
  
  // Update rate display
  elements.currentRateValue.textContent = formatCurrency(currentState.currentRate, 'Bs').replace('Bs. ', '');
  elements.previousRateValue.textContent = `Previous: ${formatCurrency(currentState.previousRate, 'Bs')}`;
  
  // Update last updated
  if (currentState.date) {
    elements.lastUpdated.textContent = `Updated ${getTimeDifference(currentState.date)}`;
    elements.lastUpdated.title = formatDate(currentState.date);
  }
  
  // Update rate change indicator
  const changeType = getRateChangeType(currentState.currentRate, currentState.previousRate);
  elements.rateChange.className = `rate-change ${changeType}`;
  
  if (changeType === 'increase') {
    elements.rateChangeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
    elements.rateChange.textContent = `+${formatPercentage(currentState.changePercentage)}`;
  } else if (changeType === 'decrease') {
    elements.rateChangeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
    elements.rateChange.textContent = `${formatPercentage(currentState.changePercentage)}`;
  } else {
    elements.rateChangeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h8"/></svg>`;
    elements.rateChange.textContent = `0.00%`;
  }
}

/**
 * Update conversion UI based on current mode
 */
function updateConversionUI() {
  if (currentState.mode === 'usd-to-bs') {
    elements.fromLabel.textContent = 'USD Amount';
    elements.fromSymbol.textContent = '$';
    elements.toLabel.textContent = 'Bs Amount';
    elements.toSymbol.textContent = 'Bs.';
    elements.fromGroup.classList.remove('hidden');
    elements.toGroup.classList.add('hidden');
  } else {
    elements.fromLabel.textContent = 'Bs Amount';
    elements.fromSymbol.textContent = 'Bs.';
    elements.toLabel.textContent = 'USD Amount';
    elements.toSymbol.textContent = '$';
    elements.fromGroup.classList.add('hidden');
    elements.toGroup.classList.remove('hidden');
  }
  
  // Clear inputs and result
  elements.fromInput.value = '';
  elements.toInput.value = '';
  elements.resultCard.style.display = 'none';
  currentState.result = null;
}

/**
 * Handle convert button click
 */
function handleConvert() {
  const activeInput = currentState.mode === 'usd-to-bs' ? elements.fromInput : elements.toInput;
  const amount = parseFloat(activeInput.value);
  
  if (!amount || isNaN(amount)) {
    showToast('Please enter a valid amount');
    return;
  }
  
  let result, fromCurrency, toCurrency, resultText;
  
  if (currentState.mode === 'usd-to-bs') {
    result = convertUSDtoBs(amount, currentState.currentRate);
    fromCurrency = 'USD';
    toCurrency = 'Bs';
    resultText = `${formatCurrency(amount, 'USD')} = ${formatCurrency(result, 'Bs')}`;
  } else {
    result = convertBstoUSD(amount, currentState.currentRate);
    fromCurrency = 'Bs';
    toCurrency = 'USD';
    resultText = `${formatCurrency(amount, 'Bs')} = ${formatCurrency(result, 'USD')}`;
  }
  
  // Update state
  currentState.amount = amount;
  currentState.result = result;
  
  // Display result
  elements.resultValue.textContent = resultText;
  elements.resultCard.style.display = 'flex';
  
  // Add animation
  elements.resultCard.classList.remove('slide-up');
  void elements.resultCard.offsetWidth; // Force reflow
  elements.resultCard.classList.add('slide-up');
  
  // Add to history
  addConversionToHistory({
    fromAmount: amount,
    fromCurrency,
    toAmount: result,
    toCurrency,
    rate: currentState.currentRate
  });
  
  // Update history display
  renderHistory();
}

/**
 * Handle swap button click
 */
function handleSwap() {
  // Toggle mode
  currentState.mode = currentState.mode === 'usd-to-bs' ? 'bs-to-usd' : 'usd-to-bs';
  
  // Toggle swap button rotation
  elements.swapButton.classList.toggle('active');
  
  // Update UI
  updateConversionUI();
}

/**
 * Handle copy button click
 */
function handleCopy() {
  if (!currentState.result) return;
  
  // Get result text
  const resultText = elements.resultValue.textContent;
  
  // Copy to clipboard
  navigator.clipboard.writeText(resultText)
    .then(() => {
      showToast('Copied to clipboard');
    })
    .catch(err => {
      console.error('Could not copy text: ', err);
      showToast('Failed to copy');
    });
}

/**
 * Handle clear history button click
 */
function handleClearHistory() {
  clearConversionHistory();
  renderHistory();
  showToast('History cleared');
}

/**
 * Validate input to ensure it's a valid number
 * @param {Event} event - Input event
 */
function validateInput(event) {
  const input = event.target;
  const value = input.value;
  
  // Allow empty input
  if (value === '') {
    return;
  }
  
  // Check if it's a valid number
  const regex = /^[0-9]*\.?[0-9]*$/;
  if (!regex.test(value)) {
    input.value = input.value.slice(0, -1);
  }
}

/**
 * Render conversion history
 */
function renderHistory() {
  const history = getConversionHistory();
  
  if (history.length === 0) {
    elements.historyList.innerHTML = `
      <div class="history-empty">
        <p>No conversion history yet</p>
      </div>
    `;
    return;
  
  }
  
  const historyHTML = history.map((item, index) => {
    const fromFormatted = formatCurrency(item.fromAmount, item.fromCurrency);
    const toFormatted = formatCurrency(item.toAmount, item.toCurrency);
    const timestamp = formatHistoryTimestamp(item.timestamp);
    
    return `
      <div class="history-item fade-in" style="animation-delay: ${index * 0.05}s">
        <span class="history-conversion">${fromFormatted} = ${toFormatted}</span>
        <span class="history-date">${timestamp}</span>
      </div>
    `;
  }).join('');
  
  elements.historyList.innerHTML = historyHTML;
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, duration = 3000) {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // Add to body
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hide toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}