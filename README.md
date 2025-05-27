# BCV Dollar Calculator Chrome Extension

## Brief Description

BCV Dollar Calculator is a Chrome extension that displays the latest Venezuelan Bolívar (VES) to US Dollar (USD) exchange rate from the Banco Central de Venezuela (BCV). It features automatic background updates, a quick popup view, and a convenient side panel display for easy access to the current rate.

<!-- Placeholder for a general screenshot or banner -->
<!-- [Screenshot of Extension in Action] -->

## Features

*   **Popup View:**
    *   Click the extension icon to quickly see the current and previous exchange rates.
    *   Includes a rate change indicator (increase, decrease, or no change) with percentage.
    *   Manually refresh the rate using the refresh button.
    *   Integrated calculator to convert amounts between USD and VES based on the current BCV rate.
    *   Displays the date and time of the last BCV update and when the data was last fetched/cached.
    *   Recent conversion history is available within the popup.
*   **Side Panel View:**
    *   Access the exchange rate information in a persistent side panel without leaving your current tab.
    *   Displays the current rate, previous rate, rate change, and last update times.
*   **Automatic Background Updates:**
    *   The extension automatically fetches the latest exchange rate from the BCV every 60 minutes in the background.
    *   Ensures you usually see up-to-date information when you open the popup or side panel.
*   **Manual Refresh:**
    *   A refresh button in the popup allows for immediate fetching of the latest rate.
*   **Rate Change Indicator:**
    *   Visually indicates if the rate has increased, decreased, or remained stable compared to the previous day's rate, along with the percentage change.
*   **Calculator:**
    *   Convert amounts from USD to VES or VES to USD directly within the popup.
*   **Conversion History:**
    *   Stores your recent conversions for quick reference. This history can be cleared.
*   **Cached Data Display:**
    *   Loads rate data from local cache first for speed and offline availability. Indicates if displayed data is cached and when it was last updated by the background process.

## Installation

1.  **Download the Extension:**
    *   Download this repository as a ZIP file and unzip it, or clone the repository to your local machine.
2.  **Enable Developer Mode in Chrome:**
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" using the toggle switch, usually found in the top right corner.
3.  **Load the Extension:**
    *   Click on the "Load unpacked" button.
    *   Select the directory where you unzipped or cloned the extension files (the directory containing `manifest.json`).
4.  The extension icon should now appear in your Chrome toolbar.

## How to Use

*   **Popup View:**
    *   Click on the BCV Dollar Calculator extension icon in your Chrome toolbar to open the popup.
    *   The latest available rate will be displayed.
    *   Use the input fields to convert amounts.
    *   Click the refresh icon in the popup header to fetch the latest rate on demand.
*   **Side Panel View:**
    *   Click the extension icon in the toolbar to open the side panel. The side panel will appear on the right side of your current browser window.
    *   It displays the current rate information and updates automatically when new data is fetched by the background process or when data is updated via the popup.
*   **Automatic Updates:**
    *   The extension updates the rate in the background automatically every 60 minutes. You generally don't need to do anything to get the latest rate.

## Permissions Used

The extension requests the following permissions:

*   **`sidePanel`**:
    *   **Reason:** Required to allow the extension to display information in the browser's side panel, providing a persistent view of the exchange rate.
*   **Host Permission for `https://pydolarve.org/`**:
    *   **Reason:** Needed to fetch the exchange rate data from the pydolarve API, which sources its data from the Banco Central de Venezuela.

Additionally, the extension utilizes standard browser capabilities that do not require explicit permission prompts but are essential for its functionality:
*   **`storage` (implicitly used via `chrome.storage.local`)**:
    *   **Reason:** Used to cache the fetched exchange rate data locally. This allows the extension to display data quickly when opened and to show the last known rate even if you are temporarily offline or before the first background update occurs.
*   **`alarms` (implicitly used via `chrome.alarms`)**:
    *   **Reason:** Used to schedule periodic background fetches of the exchange rate data, ensuring the information stays relatively up-to-date without manual intervention.

## Data Source

The exchange rate data is sourced from the **Banco Central de Venezuela (BCV)**. The extension uses the free [pydolarve API](https://pydolarve.org/) to fetch this data.

## Screenshots

*Placeholder for screenshots. These would be added manually to the repository.*

`[Screenshot of Popup View]`

`[Screenshot of Side Panel View]`

## Contributing

Contributions are welcome! If you have suggestions for improvements or find any issues, please feel free to open an issue or submit a pull request on the project's repository.

(Standard contribution guidelines would typically be included here, e.g., fork the repo, create a branch, make changes, submit a PR.)

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details (if a LICENSE file is present in the repository).
