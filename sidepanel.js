// sidepanel.js

import { fetchBCVRate, formatDate, getTimeDifference } from './src/js/api.js';
import { formatCurrency, formatPercentage, getRateChangeType } from './src/js/calculator.js';

const RATE_DATA_KEY = 'bcvRateData'; // Same key as in background.js and ui.js

// DOM Elements for Side Panel
let sidePanelElements = {};
// To store the current rate data, similar to currentState in ui.js but simpler for side panel
let currentRateData = { 
  isCachedData: false,
  lastFetchedByBackground: null
}; 


/**
 * Caches references to frequently used DOM elements in the side panel.
 * This improves performance by avoiding repeated DOM lookups.
 * The references are stored in the `sidePanelElements` object.
 * @function cacheSidePanelElements
 * @sideEffects Modifies the global `sidePanelElements` object.
 */
function cacheSidePanelElements() {
  sidePanelElements = {
    currentRateValue: document.getElementById('sidePanelCurrentRateValue'),
    previousRateValue: document.getElementById('sidePanelPreviousRateValue'),
    lastUpdated: document.getElementById('sidePanelLastUpdated'),
    rateChange: document.getElementById('sidePanelRateChange'),
    // These might be null if the HTML doesn't have separate spans
    rateChangeIcon: document.getElementById('sidePanelRateChangeIcon'),
    rateChangeValue: document.getElementById('sidePanelRateChangeValue')
  };
}

/**
 * Updates the side panel UI to indicate that data is being loaded.
 * Displays "Loading..." messages in relevant fields and adds a 'loading' class for styling.
 * @function showSidePanelLoadingState
 * @param {string} [message='Fetching latest rates...'] - Optional message to display in the 'lastUpdated' field.
 * @sideEffects Modifies the text content and class lists of DOM elements.
 */
function showSidePanelLoadingState(message = 'Fetching latest rates...') {
  if (sidePanelElements.currentRateValue) {
    sidePanelElements.currentRateValue.textContent = 'Loading...';
    sidePanelElements.currentRateValue.classList.add('loading');
  }
  if (sidePanelElements.previousRateValue) {
     sidePanelElements.previousRateValue.textContent = 'Loading...'; // Adjusted for consistency
     sidePanelElements.previousRateValue.classList.add('loading');
  }
  if (sidePanelElements.lastUpdated) {
    sidePanelElements.lastUpdated.textContent = message;
  }
}

/**
 * Updates the side panel UI to indicate an error occurred while loading data.
 * Displays "Error" messages and logs the error to the console.
 * @function showSidePanelErrorState
 * @param {Error} error - The error object that occurred.
 * @sideEffects Modifies the text content and class lists of DOM elements. Outputs to console.
 */
function showSidePanelErrorState(error) {
  console.error('Error loading data for side panel:', error);
  if (sidePanelElements.currentRateValue) {
    sidePanelElements.currentRateValue.textContent = 'Error';
    sidePanelElements.currentRateValue.classList.remove('loading');
  }
  if (sidePanelElements.previousRateValue) {
    sidePanelElements.previousRateValue.textContent = 'Error';
    sidePanelElements.previousRateValue.classList.remove('loading');
  }
  if (sidePanelElements.lastUpdated) {
    sidePanelElements.lastUpdated.textContent = 'Could not fetch rates.';
  }
}

/**
 * Updates the global `currentRateData` object with new rate information.
 * This object holds the data that will be rendered in the side panel.
 * @function updateLocalRateData
 * @param {object} rateData - The new rate data, typically from `chrome.storage` or a live fetch.
 * Should include properties like `currentRate`, `previousRate`, `date`, `changePercentage`, `lastFetchedByBackground`.
 * @param {boolean} [isCached=false] - Flag indicating if the provided `rateData` is from a cache.
 * @sideEffects Modifies the global `currentRateData` object.
 */
function updateLocalRateData(rateData, isCached = false) {
    currentRateData = {
        ...rateData, // Spread all properties from fetched/stored data
        isCachedData: isCached,
        // lastFetchedByBackground is already part of rateData if from storage
    };
}


/**
 * Renders the fetched or cached exchange rate data into the side panel's DOM elements.
 * It updates the current rate, previous rate, last updated timestamp, and rate change indicator.
 * Information about whether the data is cached or live is also displayed.
 * @function renderSidePanelRateData
 * @sideEffects Modifies the text content, HTML content, and styles of DOM elements. Outputs to console if elements are missing.
 */
function renderSidePanelRateData() {
  if (!sidePanelElements.currentRateValue || !currentRateData || currentRateData.currentRate === undefined) {
    console.warn('Side panel elements not found or data incomplete for rendering.');
    // Attempt to show loading or error if data is truly missing
    if (!currentRateData || currentRateData.currentRate === undefined) {
        showSidePanelLoadingState('Data unavailable.');
    }
    return;
  }

  sidePanelElements.currentRateValue.classList.remove('loading');
  if (sidePanelElements.previousRateValue) sidePanelElements.previousRateValue.classList.remove('loading');

  sidePanelElements.currentRateValue.textContent = formatCurrency(currentRateData.currentRate, 'Bs').replace('Bs. ', '');
  if (sidePanelElements.previousRateValue) {
    sidePanelElements.previousRateValue.textContent = `Previous: ${formatCurrency(currentRateData.previousRate, 'Bs')}`;
  }

  if (sidePanelElements.lastUpdated) {
    if (currentRateData.date) {
      let updatedText = `BCV: ${getTimeDifference(currentRateData.date)}`;
      if (currentRateData.isCachedData && currentRateData.lastFetchedByBackground) {
        updatedText += ` (Cached: ${getTimeDifference(currentRateData.lastFetchedByBackground)})`;
        sidePanelElements.lastUpdated.style.color = 'var(--neutral-400)';
      } else if (!currentRateData.isCachedData) {
        updatedText += ` (Live)`;
        sidePanelElements.lastUpdated.style.color = 'var(--neutral-500)';
      }
      sidePanelElements.lastUpdated.textContent = updatedText;
      sidePanelElements.lastUpdated.title = `BCV Date: ${formatDate(currentRateData.date)}`;
      if (currentRateData.lastFetchedByBackground) {
          sidePanelElements.lastUpdated.title += ` | Cached: ${formatDate(currentRateData.lastFetchedByBackground)}`;
      }
    } else {
      sidePanelElements.lastUpdated.textContent = currentRateData.isCachedData ? 'Using cached data' : 'Date N/A';
      sidePanelElements.lastUpdated.style.color = 'var(--neutral-400)';
    }
  }

  const changeType = getRateChangeType(currentRateData.currentRate, currentRateData.previousRate);
  if (sidePanelElements.rateChange && sidePanelElements.rateChangeIcon && sidePanelElements.rateChangeValue) {
    sidePanelElements.rateChange.className = `rate-change ${changeType}`;
    const iconElement = sidePanelElements.rateChangeIcon;
    const valueElement = sidePanelElements.rateChangeValue;

    if (changeType === 'increase') {
      iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`;
      valueElement.textContent = `+${formatPercentage(currentRateData.changePercentage)}`;
    } else if (changeType === 'decrease') {
      iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
      valueElement.textContent = `${formatPercentage(currentRateData.changePercentage)}`;
    } else {
      iconElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h8"/></svg>`;
      valueElement.textContent = `0.00%`;
    }
  } else if (sidePanelElements.rateChange) { // Fallback for simpler HTML structure
    sidePanelElements.rateChange.className = `rate-change ${changeType}`;
    let textContent = '';
    if (changeType === 'increase') textContent = `▲ +${formatPercentage(currentRateData.changePercentage)}`;
    else if (changeType === 'decrease') textContent = `▼ ${formatPercentage(currentRateData.changePercentage)}`;
    else textContent = `● 0.00%`;
    sidePanelElements.rateChange.textContent = textContent;
  }
}


/**
 * Loads initial data for the side panel.
 * It first tries to load data from `chrome.storage.local`. If data is found, it's displayed.
 * If no data is in storage, it attempts a live fetch using `fetchBCVRate`.
 * The fetched data (either from storage or live) is then rendered.
 * @async
 * @function loadInitialData
 * @sideEffects Calls `cacheSidePanelElements`, `showSidePanelLoadingState`, `updateLocalRateData`, `renderSidePanelRateData`,
 * `fetchBCVRate` (conditionally), `chrome.storage.local.set` (conditionally), and `showSidePanelErrorState` (on error).
 * Outputs to console.
 */
async function loadInitialData() {
  cacheSidePanelElements(); // Ensure elements are cached
  showSidePanelLoadingState('Loading from cache...');

  chrome.storage.local.get([RATE_DATA_KEY], async (result) => {
    const storedData = result[RATE_DATA_KEY];
    if (storedData && storedData.currentRate !== undefined) {
      console.log('Side Panel: Found data in storage:', storedData);
      updateLocalRateData(storedData, true);
      renderSidePanelRateData();
    } else {
      console.log('Side Panel: No data in storage, attempting live fetch...');
      try {
        showSidePanelLoadingState('Fetching live rates...');
        const liveData = await fetchBCVRate(); // Live fetch
        const dataToStore = {
          ...liveData,
          lastFetchedByBackground: new Date().toISOString() 
        };
        // Store this live fetched data so it's available if background hasn't run yet
        await chrome.storage.local.set({ [RATE_DATA_KEY]: dataToStore }); 
        updateLocalRateData(dataToStore, false); // Mark as not cached (live)
        renderSidePanelRateData();
      } catch (error) {
        console.error('Side Panel: Error fetching live data:', error);
        showSidePanelErrorState(error);
      }
    }
  });
}

/**
 * Event listener for the 'DOMContentLoaded' event specific to the side panel.
 * Initializes the side panel by loading data and setting up a keep-alive connection
 * to the service worker if available.
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
  loadInitialData();

  if (chrome.runtime && chrome.runtime.connect) {
    const port = chrome.runtime.connect({ name: 'keepAliveSidePanel' });
     port.onDisconnect.addListener(() => { /* console.log('Side panel keep-alive disconnected'); */ });
  }
});

/**
 * Listener for `chrome.storage.onChanged` event.
 * If the exchange rate data stored under `RATE_DATA_KEY` changes in `chrome.storage.local`,
 * this function updates the side panel's local data store and re-renders the UI.
 * @param {object} changes - Object describing the changes. Each key is the name of the changed item,
 *                           and its value is a `chrome.storage.StorageChange` object.
 * @param {string} namespace - The storage area ('local', 'sync', or 'managed') where the changes occurred.
 * @listens chrome.storage.onChanged
 * @sideEffects Calls `updateLocalRateData` and `renderSidePanelRateData`. Outputs to console.
 */
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes[RATE_DATA_KEY]) {
      const newStoredData = changes[RATE_DATA_KEY].newValue;
      if (newStoredData) {
        console.log('Side Panel: Detected rate data change in storage, updating UI.');
        updateLocalRateData(newStoredData, true); // Mark as cached
        renderSidePanelRateData();
      }
    }
  });
}
