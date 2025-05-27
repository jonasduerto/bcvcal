// background.js

import { fetchBCVRate } from './src/js/api.js';

const RATE_DATA_KEY = 'bcvRateData';
const FETCH_ALARM_NAME = 'fetchRateAlarm';
const REFRESH_INTERVAL_MINUTES = 60; // Period for fetching data

/**
 * Fetches the BCV exchange rate using `fetchBCVRate` and stores it in `chrome.storage.local`.
 * The stored data includes the fetched rate information and a `lastFetchedByBackground` timestamp.
 * If the fetch is successful and the alarm `FETCH_ALARM_NAME` is not set, it creates the alarm.
 * Logs success or error messages to the console.
 * @async
 * @function fetchAndStoreRate
 * @sideEffects Stores data in `chrome.storage.local`. May create a Chrome alarm. Outputs to console.
 */
async function fetchAndStoreRate() {
  console.log('Background: Attempting to fetch and store BCV rate...');
  try {
    const rateData = await fetchBCVRate();
    if (rateData && rateData.currentRate) {
      const dataToStore = {
        ...rateData,
        lastFetchedByBackground: new Date().toISOString()
      };
      await chrome.storage.local.set({ [RATE_DATA_KEY]: dataToStore });
      console.log('Background: Successfully fetched and stored rate data:', dataToStore);
      // After successful fetch, ensure alarm is set for next interval
      chrome.alarms.get(FETCH_ALARM_NAME, (alarm) => {
        if (!alarm) {
          console.log('Background: Alarm was not set, setting it now.');
          chrome.alarms.create(FETCH_ALARM_NAME, { periodInMinutes: REFRESH_INTERVAL_MINUTES });
        }
      });
    } else {
      console.warn('Background: Fetched data is invalid or incomplete.', rateData);
    }
  } catch (error) {
    console.error('Background: Error fetching or storing BCV rate:', error);
    // Optional: Implement a more sophisticated retry/backoff strategy here.
    // For now, the alarm will simply try again at the next scheduled interval.
  }
}

/**
 * Listener for the `chrome.alarms.onAlarm` event.
 * When the alarm named `FETCH_ALARM_NAME` fires, this function calls `fetchAndStoreRate`.
 * @param {chrome.alarms.Alarm} alarm - The alarm object that fired.
 * @listens chrome.alarms.onAlarm
 * @async
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FETCH_ALARM_NAME) {
    console.log(`Background: Alarm "${FETCH_ALARM_NAME}" fired.`);
    await fetchAndStoreRate();
  }
});

/**
 * Listener for the `chrome.runtime.onInstalled` event.
 * This is triggered when the extension is first installed or updated to a new version.
 * It performs an initial fetch of the rate data and creates the periodic alarm for subsequent fetches.
 * @param {chrome.runtime.InstalledDetails} details - Object containing details about the installation/update.
 * @listens chrome.runtime.onInstalled
 * @async
 * @sideEffects Calls `fetchAndStoreRate` (which stores data and may create an alarm) and directly creates an alarm.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Background: Extension installed or updated.', details);
  // Perform an initial fetch and set up the alarm
  await fetchAndStoreRate(); 
  chrome.alarms.create(FETCH_ALARM_NAME, {
    delayInMinutes: 1, // Start after 1 minute
    periodInMinutes: REFRESH_INTERVAL_MINUTES
  });
  console.log(`Background: Alarm "${FETCH_ALARM_NAME}" created to fire every ${REFRESH_INTERVAL_MINUTES} minutes.`);
});

/**
 * Listener for the `chrome.runtime.onStartup` event.
 * This is triggered when the browser starts up and the extension is enabled.
 * It checks if the stored data is stale or missing and fetches if necessary.
 * It also ensures that the periodic alarm `FETCH_ALARM_NAME` is active.
 * @listens chrome.runtime.onStartup
 * @async
 * @sideEffects May call `fetchAndStoreRate` (which stores data and may create an alarm) and may create an alarm.
 */
chrome.runtime.onStartup.addListener(async () => {
  console.log('Background: Browser started. Ensuring alarm is set and performing initial fetch if needed.');
  // Check if data exists and is recent enough, otherwise fetch.
  // Also ensure the alarm is running.
  chrome.storage.local.get(RATE_DATA_KEY, async (result) => {
    if (result[RATE_DATA_KEY] && result[RATE_DATA_KEY].lastFetchedByBackground) {
      const lastFetch = new Date(result[RATE_DATA_KEY].lastFetchedByBackground);
      const now = new Date();
      // If data is older than our refresh interval, fetch now.
      if ((now.getTime() - lastFetch.getTime()) > (REFRESH_INTERVAL_MINUTES * 60 * 1000)) {
        console.log('Background: Data found but is stale, fetching new data.');
        await fetchAndStoreRate();
      } else {
        console.log('Background: Found recent data in storage, no immediate fetch needed on startup.');
      }
    } else {
      console.log('Background: No data found in storage on startup, fetching new data.');
      await fetchAndStoreRate();
    }
  });

  // Ensure the alarm is set, as it might be cleared if the browser was closed.
  chrome.alarms.get(FETCH_ALARM_NAME, (alarm) => {
    if (!alarm) {
      console.log('Background: Alarm not found on startup, creating it.');
      chrome.alarms.create(FETCH_ALARM_NAME, {
        delayInMinutes: 1, // Start after 1 minute
        periodInMinutes: REFRESH_INTERVAL_MINUTES
      });
    } else {
      console.log('Background: Alarm already set.');
    }
  });
});


// --- Side Panel Logic ---

/**
 * Listener for the `chrome.action.onClicked` event (extension icon click).
 * Opens the extension's side panel in the current window.
 * @param {chrome.tabs.Tab} tab - The tab where the action icon was clicked.
 * @listens chrome.action.onClicked
 * @async
 * @sideEffects Opens the Chrome side panel.
 */
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

/**
 * Listener for `chrome.runtime.onConnect`.
 * This is used to keep the service worker alive if a connection named 'keepAlive'
 * (or 'keepAliveSidePanel') is established from other parts of the extension (e.g., popup or side panel).
 * The connection is disconnected after a set timeout (250 seconds).
 * @param {chrome.runtime.Port} port - The port object for the established connection.
 * @listens chrome.runtime.onConnect
 * @sideEffects Disconnects the port after a timeout.
 */
chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive' || port.name === 'keepAliveSidePanel') {
    setTimeout(() => {
      if (port) port.disconnect(); // Check if port still exists
    }, 250e3); // 250 seconds
    port.onDisconnect.addListener(() => {
      // console.log('Side panel keep-alive disconnected for port:', port.name);
    });
  }
});
