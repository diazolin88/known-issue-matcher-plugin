// --- Settings Management ---

function getSettings() {
    return {
        apiUrl: localStorage.getItem('vim_api_url') || 'http://localhost:3000/known-issues',
        rowSelector: localStorage.getItem('vim_row_selector') || 'strong',
        errorSelector: localStorage.getItem('vim_error_selector') || '.error'
    };
}

function saveSettings(apiUrl, rowSelector, errorSelector) {
    localStorage.setItem('vim_api_url', apiUrl);
    localStorage.setItem('vim_row_selector', rowSelector);
    localStorage.setItem('vim_error_selector', errorSelector);
}

// --- UI Injection ---

async function injectButtons() {
    try {
        if (typeof window.KnownIssuesApiClient === 'undefined') {
            console.error('KnownIssuesApiClient is undefined on window. API client script might not be loaded.');
            return;
        }
        const settings = getSettings();
        const knownIssues = await window.KnownIssuesApiClient.getKnownIssues();
        const rowElements = document.querySelectorAll(settings.rowSelector);

        rowElements.forEach(rowElement => {
            if (rowElement.textContent.includes('FAIL') && !rowElement.dataset.vimInjected) {
                rowElement.dataset.vimInjected = 'true';

                // Identify if this row is a known issue
                const row = rowElement.closest('tr');
                let isKnown = false;
                if (row) {
                    const errorDiv = row.querySelector(settings.errorSelector);
                    if (errorDiv) {
                        const errorText = errorDiv.textContent.trim();
                        isKnown = knownIssues.some(issue => {
                            try {
                                return new RegExp(issue.regex_pattern).test(errorText);
                            } catch (e) { return false; }
                        });
                    }
                }

                const btn = document.createElement('button');
                btn.textContent = 'R';
                btn.type = 'button';
                btn.className = 'vim-matcher-btn';

                if (isKnown) {
                    btn.disabled = true;
                    btn.title = 'Already a Known Issue';
                } else {
                    btn.title = 'Report Known Issue';
                    btn.onclick = (e) => handleReportClick(e, rowElement);
                }
                rowElement.parentNode.appendChild(btn);

                if (isKnown) {
                    const delBtn = document.createElement('button');
                    delBtn.textContent = 'D';
                    delBtn.type = 'button';
                    delBtn.title = 'Delete Known Issue';
                    delBtn.className = 'vim-delete-btn';
                    delBtn.onclick = (e) => handleDeleteClick(e, rowElement);
                    rowElement.parentNode.appendChild(delBtn);
                }
            }
        });
    } catch (error) {
        console.error('Error in injectButtons:', error.message);
    }
}

async function handleDeleteClick(e, rowElement) {
    if (e) e.preventDefault();

    const settings = getSettings();
    const row = rowElement.closest('tr');
    if (!row) return;

    const errorDiv = row.querySelector(settings.errorSelector);
    if (!errorDiv) {
        alert('No .error div found in this row.');
        return;
    }

    const errorText = errorDiv.textContent.trim();
    // Re-fetch issues to ensure we have fresh data
    const knownIssues = await window.KnownIssuesApiClient.getKnownIssues();

    // Find if this error matches any known issue
    let matchedIssue = null;
    for (const issue of knownIssues) {
        try {
            const re = new RegExp(issue.regex_pattern);
            if (re.test(errorText)) {
                matchedIssue = issue;
                break;
            }
        } catch (e) {
            console.warn('Invalid regex:', issue.regex_pattern);
        }
    }

    if (!matchedIssue) {
        alert('Debug: No known issue matches regex for this error text.');
        console.log('Error Text:', errorText);
        console.log('Known Issues:', knownIssues);
        return;
    }

    try {
        await KnownIssuesApiClient.deleteKnownIssue(matchedIssue.id);
        alert('Known issue deleted!');
        location.reload();
    } catch (e) {
        console.error(e);
        alert(`Failed to delete issue: ${e.message}`);
    }

}

function createModal(initialRegex, onSubmit) {
    // Remove existing modal if any
    const existing = document.querySelector('.vim-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'vim-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'vim-modal';

    modal.innerHTML = `
        <h3>Add Known Issue Regex</h3>
        <p>Detected Error Content (you can edit the regex below):</p>
        <input type="text" id="vim-regex-input" value="${escapeHtml(initialRegex)}">
        <div class="vim-modal-actions">
            <button id="vim-cancel-btn" type="button">Cancel</button>
            <button id="vim-save-btn" type="button">Save</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    document.getElementById('vim-cancel-btn').onclick = () => {
        overlay.remove();
        modal.remove();
    };

    document.getElementById('vim-save-btn').onclick = () => {
        const regex = document.getElementById('vim-regex-input').value;
        onSubmit(regex);
        overlay.remove();
        modal.remove();
    };
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function handleReportClick(e, rowElement) {
    if (e) e.preventDefault();

    const settings = getSettings();
    const row = rowElement.closest('tr');
    if (!row) return;

    const errorDiv = row.querySelector(settings.errorSelector);
    if (!errorDiv) {
        alert('No .error div found in this row.');
        return;
    }

    const errorText = errorDiv.textContent.trim();
    const safeRegex = errorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    createModal(safeRegex, (regex) => {
        saveKnownIssue(regex);
    });
}

// --- Backend Interaction ---

async function saveKnownIssue(regex) {
    try {
        const result = await window.KnownIssuesApiClient.saveKnownIssue(regex);
        alert(`Known issue saved! ID: ${result.id}`);
        checkPageForKnownIssues(); // Re-scan page
    } catch (e) {
        console.error(e);
        alert(`Failed to save issue: ${e.message}`);
    }
}

// --- Matching Logic ---

async function checkPageForKnownIssues() {
    if (typeof KnownIssuesApiClient === 'undefined') {
        return;
    }
    const settings = getSettings();
    const knownIssues = await KnownIssuesApiClient.getKnownIssues();
    if (!knownIssues || knownIssues.length === 0) return;

    const errorDivs = document.querySelectorAll(settings.errorSelector);
    errorDivs.forEach(div => {
        const text = div.textContent;
        // Check if already marked
        if (div.querySelector('.vim-known-issue-badge')) return;

        for (const issue of knownIssues) {
            try {
                const re = new RegExp(issue.regex_pattern);
                if (re.test(text)) {
                    const badge = document.createElement('span');
                    badge.className = 'vim-known-issue-badge';
                    badge.textContent = 'KNOWN ISSUE';
                    div.appendChild(badge);
                    break; // Stop after first match
                }
            } catch (e) {
                console.warn('Invalid regex from DB:', issue.regex_pattern);
            }
        }
    });
}

// --- Settings UI ---

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

function createSettingsModal() {
    // Remove existing modal if any
    const existing = document.querySelector('.vim-settings-modal-overlay');
    if (existing) existing.remove();

    const settings = getSettings();

    const overlay = document.createElement('div');
    overlay.className = 'vim-modal-overlay vim-settings-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'vim-modal';

    modal.innerHTML = `
        <h3>Settings</h3>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: var(--cp-neon-blue); font-size: 12px; text-transform: uppercase;">API Endpoint</label>
            <input type="text" id="vim-settings-api-url" value="${escapeHtml(settings.apiUrl)}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: var(--cp-neon-blue); font-size: 12px; text-transform: uppercase;">Row Selector (CSS)</label>
            <input type="text" id="vim-settings-row-selector" value="${escapeHtml(settings.rowSelector)}" style="width: 100%;">
        </div>
        <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; color: var(--cp-neon-blue); font-size: 12px; text-transform: uppercase;">Error Selector (CSS)</label>
            <input type="text" id="vim-settings-error-selector" value="${escapeHtml(settings.errorSelector)}" style="width: 100%;">
        </div>
        <div class="vim-modal-actions">
            <button id="vim-settings-cancel-btn" type="button">Cancel</button>
            <button id="vim-settings-save-btn" type="button">Save</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    document.getElementById('vim-settings-cancel-btn').onclick = () => {
        overlay.remove();
        modal.remove();
    };

    document.getElementById('vim-settings-save-btn').onclick = () => {
        const apiUrl = document.getElementById('vim-settings-api-url').value;
        const rowSelector = document.getElementById('vim-settings-row-selector').value;
        const errorSelector = document.getElementById('vim-settings-error-selector').value;

        saveSettings(apiUrl, rowSelector, errorSelector);
        alert('Settings saved! Please reload the page for changes to take effect.');
        overlay.remove();
        modal.remove();
    };
}

// --- Initialization ---

window.addEventListener('load', () => {
    injectSettingsButton();
    injectButtons();
    checkPageForKnownIssues();
});
