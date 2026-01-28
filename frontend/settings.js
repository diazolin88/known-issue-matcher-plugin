/**
 * Settings Management module for the Known Issues Matcher.
 * Handles retrieval and storage of user configurations in localStorage.
 */

/**
 * Retrieves the current plugin settings from localStorage.
 * Defaults to localhost API and standard report selectors if not set.
 * 
 * @returns {Object} An object containing apiUrl, rowSelector, and errorSelector.
 */
function getSettings() {
    return {
        apiUrl: localStorage.getItem('vim_api_url') || 'http://localhost:3000/known-issues',
        rowSelector: localStorage.getItem('vim_row_selector') || 'strong',
        errorSelector: localStorage.getItem('vim_error_selector') || '.error'
    };
}

/**
 * Saves the plugin settings to localStorage.
 * 
 * @param {string} apiUrl - The base URL for the known issues API.
 * @param {string} rowSelector - The CSS selector used to identify test result rows.
 * @param {string} errorSelector - The CSS selector used to find error message containers.
 */
function saveSettings(apiUrl, rowSelector, errorSelector) {
    localStorage.setItem('vim_api_url', apiUrl);
    localStorage.setItem('vim_row_selector', rowSelector);
    localStorage.setItem('vim_error_selector', errorSelector);
}

// Expose to window for modular accessibility
window.getSettings = getSettings;
window.saveSettings = saveSettings;
