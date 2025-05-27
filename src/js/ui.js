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
const RATE_DATA_KEY = 'bcvRateData'; // Same key as in background.js

/**
 * @typedef {object} CurrentState
 * @property {number} currentRate - The current BCV exchange rate.
 * @property {number} previousRate - The previous BCV exchange rate.
 * @property {string|null} date - ISO string of the date for the current rate.
 * @property {string} mode - The current conversion mode ('usd-to-bs' or 'bs-to-usd').
 * @property {string|number} amount - The amount entered by the user for conversion.
 * @property {number|null} result - The result of the current conversion.
 * @property {string|null} lastFetchedByBackground - ISO string of when the background last fetched data.
 * @property {boolean} isCachedData - Flag indicating if the currently displayed data is from cache.
 * @property {number} change - The difference between current and previous rate.
 * @property {number} changePercentage - The percentage change between current and previous rate.
 */

/** @type {CurrentState} */
let currentState = {
  currentRate: 0,
  previousRate: 0,
  date: null,
  mode: 'usd-to-bs', // 'usd-to-bs' or 'bs-to-usd'
  amount: '',
  result: null,
  lastFetchedByBackground: null,
  isCachedData: false,
  change: 0,
  changePercentage: 0
};

// DOM Elements
/**
 * @typedef {object} DOMElementCache
 * @property {HTMLElement|null} refreshButton
 * @property {HTMLElement|null} currentRateValue
 * @property {HTMLElement|null} previousRateValue
 * @property {HTMLElement|null} lastUpdated
 * @property {HTMLElement|null} rateChange
 * @property {HTMLElement|null} rateChangeIcon
 * @property {HTMLElement|null} rateChangeValue
 * @property {HTMLElement|null} fromLabel
 * @property {HTMLElement|null} fromSymbol
 * @property {HTMLInputElement|null} fromInput
 * @property {HTMLElement|null} fromGroup
 * @property {HTMLElement|null} toLabel
 * @property {HTMLElement|null} toSymbol
 * @property {HTMLInputElement|null} toInput
 * @property {HTMLElement|null} toGroup
 * @property {HTMLElement|null} swapButton
 * @property {HTMLElement|null} convertButton
 * @property {HTMLElement|null} convertButtonBs
 * @property {HTMLElement|null} resultCard
 * @property {HTMLElement|null} resultValue
 * @property {HTMLElement|null} copyButton
 * @property {HTMLElement|null} historyList
 * @property {HTMLElement|null} clearHistoryButton
 */

/** @type {DOMElementCache} */
let elements = {};

/**
 * Initializes the user interface for the popup.
 * This function caches DOM elements, sets up event listeners,
 * loads initial data (prioritizing local storage), and sets up a listener
 * for changes in `chrome.storage` to keep the UI up-to-date.
 * @export
 * @function initializeUI
 * @sideEffects Modifies global `elements` and `currentState`. Attaches event listeners. Outputs to console.
 *              Calls functions that modify DOM content.
 */
export function initializeUI() {
  cacheElements();
  setupEventListeners();
  loadDataFromStorageOrFetch(); // Load from storage first

  // Defensive check for chrome.storage and chrome.storage.onChanged
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes[RATE_DATA_KEY]) {
        const newStoredData = changes[RATE_DATA_KEY].newValue;
        if (newStoredData) {
          console.log('Popup: Detected rate data change in storage, updating UI.');
          updateStateWithRateData(newStoredData, true); // Mark as cached
          renderRateData(); // Re-render rate specific parts
        }
      }
    });
  }
}

/**
 * Caches references to frequently used DOM elements.
 * This improves performance by avoiding repeated DOM lookups.
 * The references are stored in the global `elements` object.
 * Also attempts to cache specific child elements for `rateChange` if they exist.
 * @function cacheElements
 * @sideEffects Modifies the global `elements` object.
 */
function cacheElements() {
  elements = {
    refreshButton: document.getElementById('refreshButton'),
    currentRateValue: document.getElementById('currentRateValue'),
    previousRateValue: document.getElementById('previousRateValue'),
    lastUpdated: document.getElementById('lastUpdated'),
    rateChange: document.getElementById('rateChange'),
    rateChangeIcon: document.getElementById('rateChangeIcon'),
    rateChangeValue: document.getElementById('rateChangeValue'), // Explicitly cache this
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
  // If rateChangeIcon or rateChangeValue were not found directly by ID, 
  // try to find them as children of rateChange if it exists.
  if (elements.rateChange) {
    if (!elements.rateChangeIcon) elements.rateChangeIcon = elements.rateChange.querySelector('span:first-child');
    if (!elements.rateChangeValue) elements.rateChangeValue = elements.rateChange.querySelector('span:last-child');
  }
}

/**
 * Sets up event listeners for various UI elements like buttons and inputs.
 * Ensures that listeners are only added if the corresponding elements exist in the DOM.
 * @function setupEventListeners
 * @sideEffects Attaches event listeners to DOM elements. Calls `showToast`, `loadData`, `handleConvert`,
 *              `handleSwap`, `handleCopy`, `handleClearHistory`, `validateInput`.
 */
function setupEventListeners() {
  if (elements.refreshButton) {
    elements.refreshButton.addEventListener('click', () => {
      showToast('Fetching live rates...');
      loadData(true); // Pass true to indicate a manual refresh (live fetch)
    });
  }

  if (elements.convertButton) elements.convertButton.addEventListener('click', handleConvert);
  if (elements.convertButtonBs) elements.convertButtonBs.addEventListener('click', handleConvert);
  if (elements.swapButton) elements.swapButton.addEventListener('click', handleSwap);
  if (elements.copyButton) elements.copyButton.addEventListener('click', handleCopy);
  if (elements.clearHistoryButton) elements.clearHistoryButton.addEventListener('click', handleClearHistory);
  
  if (elements.fromInput) {
    elements.fromInput.addEventListener('input', validateInput);
    elements.fromInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleConvert(); });
  }
  if (elements.toInput) {
    elements.toInput.addEventListener('input', validateInput);
    elements.toInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleConvert(); });
  }
}

/**
 * Updates the global `currentState` object with new rate information.
 * @function updateStateWithRateData
 * @param {object} rateData - The new rate data, typically from `chrome.storage` or a live fetch.
 * Expected to include `currentRate`, `previousRate`, `date`, `change`, `changePercentage`, `lastFetchedByBackground`.
 * @param {boolean} [isCached=false] - Flag indicating if the provided `rateData` is from a cache.
 * @sideEffects Modifies the global `currentState` object.
 */
function updateStateWithRateData(rateData, isCached = false) {
  currentState = {
    ...currentState, // Preserve other state properties like mode, amount, result
    currentRate: rateData.currentRate,
    previousRate: rateData.previousRate,
    date: rateData.date,
    change: rateData.change,
    changePercentage: rateData.changePercentage,
    lastFetchedByBackground: rateData.lastFetchedByBackground,
    isCachedData: isCached
  };
}


/**
 * Loads rate data, prioritizing `chrome.storage.local`.
 * If data is found in storage, it's used to update the UI.
 * Otherwise, a live fetch is initiated via `loadData(true)`.
 * @async
 * @function loadDataFromStorageOrFetch
 * @sideEffects Calls `showLoadingState`, `updateStateWithRateData`, `renderUI`, or `loadData`.
 *              Interacts with `chrome.storage.local`. Outputs to console.
 */
async function loadDataFromStorageOrFetch() {
  showLoadingState('Loading from cache...');
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([RATE_DATA_KEY], async (result) => {
      const storedData = result[RATE_DATA_KEY];
      if (storedData && storedData.currentRate !== undefined) { // Check currentRate for validity
        console.log('Popup: Found data in storage:', storedData);
        updateStateWithRateData(storedData, true);
        renderUI(); 
      } else {
        console.log('Popup: No valid data in storage, fetching live data...');
        await loadData(true); // true for live fetch
      }
    });
  } else {
    console.error('chrome.storage.local is not available.');
    showErrorState(new Error('Storage API not available.'));
  }
}


/**
 * Fetches live exchange rate data using `fetchBCVRate`.
 * Stores the fetched data in `chrome.storage.local` and updates the UI.
 * If `forceLiveFetch` is false, it defaults to `loadDataFromStorageOrFetch`.
 * Handles errors during the fetch process and can fall back to stored data if live fetch fails.
 * @async
 * @function loadData
 * @param {boolean} [forceLiveFetch=false] - If true, a live fetch is performed.
 *                                           Otherwise, behavior might depend on `loadDataFromStorageOrFetch`.
 * @sideEffects Calls `showLoadingState`, `fetchBCVRate`, `chrome.storage.local.set`, `updateStateWithRateData`,
 *              `renderUI`, `showErrorState`, `showToast`. Outputs to console.
 */
async function loadData(forceLiveFetch = false) {
  if (!forceLiveFetch) {
    loadDataFromStorageOrFetch(); // Default to storage priority if not forcing live.
    return;
  }

  showLoadingState('Fetching live rates...');
  try {
    const rateData = await fetchBCVRate(); 
    const dataToStore = {
      ...rateData,
      lastFetchedByBackground: new Date().toISOString() 
    };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [RATE_DATA_KEY]: dataToStore });
      console.log('Popup: Live data fetched and stored:', dataToStore);
    } else {
      console.error('chrome.storage.local is not available.');
    }

    updateStateWithRateData(dataToStore, false); // Not cached, it's live
    renderUI(); 
    
  } catch (error) {
    console.error('Error loading live data:', error);
    showErrorState(error); // Display error state in UI
    // Attempt to display cached data as a fallback
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([RATE_DATA_KEY], (result) => {
        const storedData = result[RATE_DATA_KEY];
        if (storedData && storedData.currentRate !== undefined) {
          console.log('Popup: Live fetch failed, rendering stored data as fallback:', storedData);
          updateStateWithRateData(storedData, true);
          renderUI();
          showToast("Live fetch failed. Displaying cached data.", 4000);
        }
      });
    }
  }
}

/**
 * Updates the UI to show a loading state.
 * Typically displays "Loading..." messages in relevant fields.
 * @function showLoadingState
 * @param {string} [message='Fetching latest rates...'] - Optional message for the 'lastUpdated' field.
 * @sideEffects Modifies the text content and class lists of DOM elements.
 */
function showLoadingState(message = 'Fetching latest rates...') {
  if (elements.currentRateValue) {
    elements.currentRateValue.textContent = 'Loading...';
    elements.currentRateValue.classList.add('loading');
  }
  if (elements.previousRateValue) {
    elements.previousRateValue.textContent = 'Loading...';
    elements.previousRateValue.classList.add('loading');
  }
  if (elements.lastUpdated) elements.lastUpdated.textContent = message;
}

/**
 * Updates the UI to show an error state.
 * Displays "Error" messages and a toast notification with the error.
 * @function showErrorState
 * @param {Error} error - The error object.
 * @sideEffects Modifies the text content and class lists of DOM elements. Calls `showToast`.
 */
function showErrorState(error) {
  if (elements.currentRateValue) {
    elements.currentRateValue.textContent = 'Error';
    elements.currentRateValue.classList.remove('loading');
  }
  if (elements.previousRateValue) {
    elements.previousRateValue.textContent = 'Error';
    elements.previousRateValue.classList.remove('loading');
  }
  if (elements.lastUpdated) {
    elements.lastUpdated.textContent = 'Could not fetch rates';
  }
  
  showToast(`Error fetching rates: ${error.message}`);
}

/**
 * Renders the entire UI by calling individual render functions for each section.
 * This includes rate data, the conversion UI, and the history section.
 * @function renderUI
 * @sideEffects Calls `renderRateData`, `updateConversionUI`, `renderHistory`.
 */
function renderUI() {
  renderRateData();
  updateConversionUI();
  renderHistory();
}

/**
 * Renders the exchange rate data section of the UI.
 * Updates fields for current rate, previous rate, last updated time, and rate change indicator.
 * Information about data source (live/cached) is also displayed.
 * @function renderRateData
 * @sideEffects Modifies DOM content and styles for rate display elements.
 */
function renderRateData() {
  if (!elements.currentRateValue) return; 

  elements.currentRateValue.classList.remove('loading');
  if (elements.previousRateValue) elements.previousRateValue.classList.remove('loading');

  elements.currentRateValue.textContent = formatCurrency(currentState.currentRate, 'Bs').replace('Bs. ', '');
  if (elements.previousRateValue) elements.previousRateValue.textContent = `Previous: ${formatCurrency(currentState.previousRate, 'Bs')}`;

  if (elements.lastUpdated) {
    if (currentState.date) {
      let updatedText = `BCV: ${getTimeDifference(currentState.date)}`;
      if (currentState.isCachedData && currentState.lastFetchedByBackground) {
        updatedText += ` (Cached: ${getTimeDifference(currentState.lastFetchedByBackground)})`;
        elements.lastUpdated.style.color = 'var(--neutral-400)'; 
      } else if (!currentState.isCachedData) {
         updatedText += ` (Live)`;
         elements.lastUpdated.style.color = 'var(--neutral-500)'; 
      }
      elements.lastUpdated.textContent = updatedText;
      elements.lastUpdated.title = `BCV Date: ${formatDate(currentState.date)}`;
      if (currentState.lastFetchedByBackground) {
          elements.lastUpdated.title += ` | Cached: ${formatDate(currentState.lastFetchedByBackground)}`;
      }
    } else {
      elements.lastUpdated.textContent = currentState.isCachedData ? 'Using cached data' : 'Date N/A';
      elements.lastUpdated.style.color = 'var(--neutral-400)';
    }
  }

  const changeType = getRateChangeType(currentState.currentRate, currentState.previousRate);
  if (elements.rateChange && elements.rateChangeIcon && elements.rateChangeValue) {
    elements.rateChange.className = `rate-change ${changeType}`;
    const iconElement = elements.rateChangeIcon;
    const valueElement = elements.rateChangeValue;

    if (changeType === 'increase') {
        iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
        valueElement.textContent = `+${formatPercentage(currentState.changePercentage)}`;
    } else if (changeType === 'decrease') {
        iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
        valueElement.textContent = `${formatPercentage(currentState.changePercentage)}`;
    } else {
        iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h8"/></svg>`;
        valueElement.textContent = `0.00%`;
    }
  } else if (elements.rateChange) { 
    elements.rateChange.className = `rate-change ${changeType}`;
    let textContent = '';
    if (changeType === 'increase') textContent = `▲ +${formatPercentage(currentState.changePercentage)}`;
    else if (changeType === 'decrease') textContent = `▼ ${formatPercentage(currentState.changePercentage)}`;
    else textContent = `● 0.00%`;
    elements.rateChange.textContent = textContent;
  }
}

/**
 * Updates the currency conversion section of the UI based on the current conversion mode.
 * Toggles visibility of input groups and updates labels and symbols.
 * Clears previous input values and results.
 * @function updateConversionUI
 * @sideEffects Modifies DOM content, styles, and input values for conversion elements. Updates `currentState.result`.
 */
function updateConversionUI() {
  if (!elements.fromLabel) return; 

  if (currentState.mode === 'usd-to-bs') {
    elements.fromLabel.textContent = 'USD Amount';
    elements.fromSymbol.textContent = '$';
    elements.toLabel.textContent = 'Bs Amount';
    elements.toSymbol.textContent = 'Bs.';
    if (elements.fromGroup) elements.fromGroup.classList.remove('hidden');
    if (elements.toGroup) elements.toGroup.classList.add('hidden');
  } else {
    elements.fromLabel.textContent = 'Bs Amount';
    elements.fromSymbol.textContent = 'Bs.';
    elements.toLabel.textContent = 'USD Amount';
    elements.toSymbol.textContent = '$';
    if (elements.fromGroup) elements.fromGroup.classList.add('hidden');
    if (elements.toGroup) elements.toGroup.classList.remove('hidden');
  }
  
  if (elements.fromInput) elements.fromInput.value = '';
  if (elements.toInput) elements.toInput.value = '';
  if (elements.resultCard) elements.resultCard.style.display = 'none';
  currentState.result = null;
}

/**
 * Handles the currency conversion when the convert button is clicked.
 * Reads the amount from the active input field, performs the conversion based on the current mode,
 * updates the UI with the result, and adds the conversion to history.
 * @function handleConvert
 * @sideEffects Modifies DOM to display result, calls `showToast`, `addConversionToHistory`, `renderHistory`.
 *              Updates `currentState.amount` and `currentState.result`.
 */
function handleConvert() {
  if (!elements.fromInput || !elements.toInput || !elements.resultValue || !elements.resultCard) return;

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
  
  currentState.amount = amount;
  currentState.result = result;
  
  elements.resultValue.textContent = resultText;
  elements.resultCard.style.display = 'flex';
  elements.resultCard.classList.remove('slide-up');
  void elements.resultCard.offsetWidth; // Force reflow
  elements.resultCard.classList.add('slide-up');
  
  addConversionToHistory({
    fromAmount: amount,
    fromCurrency,
    toAmount: result,
    toCurrency,
    rate: currentState.currentRate
  });
  renderHistory();
}

/**
 * Handles the click event of the swap button.
 * Toggles the conversion mode (USD to VES / VES to USD) and updates the UI accordingly.
 * @function handleSwap
 * @sideEffects Modifies `currentState.mode`, DOM classes for swap button, calls `updateConversionUI`.
 */
function handleSwap() {
  if (!elements.swapButton) return;

  currentState.mode = currentState.mode === 'usd-to-bs' ? 'bs-to-usd' : 'usd-to-bs';
  elements.swapButton.classList.toggle('active');
  updateConversionUI();
}

/**
 * Handles the click event of the copy button.
 * Copies the current conversion result text to the clipboard.
 * Shows a toast notification on success or failure.
 * @async
 * @function handleCopy
 * @sideEffects Interacts with `navigator.clipboard`, calls `showToast`. Outputs to console on error.
 */
async function handleCopy() {
  if (!currentState.result || !elements.resultValue) return;
  
  const resultText = elements.resultValue.textContent;
  try {
    await navigator.clipboard.writeText(resultText);
    showToast('Copied to clipboard');
  } catch (err) {
    console.error('Could not copy text: ', err);
    showToast('Failed to copy');
  }
}

/**
 * Handles the click event of the "Clear History" button.
 * Clears all conversion history from storage and re-renders the history section.
 * @function handleClearHistory
 * @sideEffects Calls `clearConversionHistory`, `renderHistory`, `showToast`. Interacts with `chrome.storage`.
 */
function handleClearHistory() {
  if (!elements.historyList) return;

  clearConversionHistory();
  renderHistory();
  showToast('History cleared');
}

/**
 * Validates the input in a currency field to allow only numbers and a single decimal point.
 * Modifies the input field's value directly if invalid characters are entered.
 * @function validateInput
 * @param {Event} event - The input event object.
 * @sideEffects Modifies the value of the input DOM element.
 */
function validateInput(event) {
  if (!event.target) return;
  const input = /** @type {HTMLInputElement} */ (event.target);
  const value = input.value;
  
  if (value === '') return;
  
  const regex = /^[0-9]*\.?[0-9]*$/;
  if (!regex.test(value)) {
    input.value = value.slice(0, -1);
  }
}

/**
 * Renders the conversion history list in the UI.
 * Fetches history from storage and populates the history list element.
 * Displays an empty state message if no history is found.
 * @function renderHistory
 * @sideEffects Modifies the innerHTML of the history list DOM element.
 */
function renderHistory() {
  if (!elements.historyList) return;

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
 * Displays a toast notification message at the bottom of the screen.
 * The toast automatically hides after a specified duration.
 * @export
 * @function showToast
 * @param {string} message - The message to display in the toast.
 * @param {number} [duration=3000] - The duration in milliseconds for which the toast should be visible.
 * @sideEffects Creates and appends a DOM element for the toast, then removes it.
 */
export function showToast(message, duration = 3000) {
  if (typeof document === 'undefined') return;

  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => { toast.classList.add('show'); }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.remove(); }, 300);
  }, duration);
}