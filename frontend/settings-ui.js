/**
 * Settings UI module for the Known Issues Matcher.
 * Handles the injection of the settings button and the configuration modal.
 */

/**
 * Injects the settings gear button into the bottom right corner of the page.
 * Prevents duplicate injection.
 */
function injectSettingsButton() {
    // Don't inject if already exists
    if (document.querySelector('.vim-settings-btn')) return;

    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'vim-settings-btn';
    settingsBtn.innerHTML = '⚙';
    settingsBtn.title = 'Settings';
    settingsBtn.onclick = () => createSettingsModal();
    document.body.appendChild(settingsBtn);
}

/**
 * Creates and displays the Settings modal, allowing users to configure
 * API endpoints and CSS selectors for the matcher.
 */
function createSettingsModal() {
    const settings = window.getSettings();

    const bodyContent = `
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: var(--cp-neon-blue); font-size: 12px; text-transform: uppercase;">API Endpoint</label>
            <input type="text" id="vim-settings-api-url" value="${window.escapeHtml(settings.apiUrl)}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: var(--cp-neon-blue); font-size: 12px; text-transform: uppercase;">Row Selector (CSS)</label>
            <input type="text" id="vim-settings-row-selector" value="${window.escapeHtml(settings.rowSelector)}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: var(--cp-neon-blue); font-size: 12px; text-transform: uppercase;">Error Selector (CSS)</label>
            <input type="text" id="vim-settings-error-selector" value="${window.escapeHtml(settings.errorSelector)}" style="width: 100%;">
        </div>
    `;

    window.createModal({
        title: 'Settings',
        bodyContent: bodyContent,
        overlayClass: 'vim-settings-modal-overlay',
        onSubmit: () => {
            const apiUrl = document.getElementById('vim-settings-api-url').value;
            const rowSelector = document.getElementById('vim-settings-row-selector').value;
            const errorSelector = document.getElementById('vim-settings-error-selector').value;

            window.saveSettings(apiUrl, rowSelector, errorSelector);
            alert('Settings saved! Please reload the page for changes to take effect.');
        }
    });
}

// Expose to window
window.injectSettingsButton = injectSettingsButton;
window.createSettingsModal = createSettingsModal;
