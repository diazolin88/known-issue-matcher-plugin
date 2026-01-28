/**
 * Matcher module for the Known Issues Matcher.
 * Core logic for scanning the page for errors, matching them against known issues,
 * and injecting interaction buttons (R/D) and status badges.
 */

/**
 * Main entry point for the matching process. Fetches settings and known issues,
 * then triggers button injection and issue-badge marking.
 * 
 * @async
 */
async function injectActionButtonAndLabel() {
    try {
        console.log('VIM: injectActionButtonAndLabel started');
        const settings = window.getSettings();
        const knownIssues = await window.KnownIssuesApiClient.getKnownIssues();

        // 1. Inject buttons (R/D) via container
        await injectButtons(knownIssues, settings);

        // 2. Add "KNOWN ISSUE" badges to error text
        await checkPageForKnownIssues(knownIssues, settings);

    } catch (error) {
        console.error('VIM: Error in injectActionButtonAndLabel:', error);
    }
}

/**
 * Scans the page for test rows based on the configured selectors.
 * Injects a container with 'Report' (R) button for new failures OR a 'Delete' (D) button for known ones.
 * 
 * @async
 * @param {Array<Object>} knownIssues - List of issue objects from the backend.
 * @param {Object} settings - Current plugin configuration.
 */
async function injectButtons(knownIssues, settings) {
    const rowElements = document.querySelectorAll(settings.rowSelector);

    rowElements.forEach(rowElement => {
        const text = rowElement.textContent;
        // Only target element that contain FAIL
        if (!text.includes('FAIL')) return;

        // Ensure we have a container for buttons
        let container = rowElement.parentNode.querySelector('.vim-actions-container');
        if (!container) {
            container = document.createElement('span');
            container.className = 'vim-actions-container';
            rowElement.parentNode.appendChild(container);
        } else {
            // Clear existing buttons for partial reload
            container.innerHTML = '';
        }

        // Identify if this row matches a known issue
        const row = rowElement.closest('tr');
        let isKnown = false;
        if (row) {
            const errorDiv = row.querySelector(settings.errorSelector);
            if (errorDiv) {
                const errorText = errorDiv.textContent.trim();
                isKnown = knownIssues.some(issue => {
                    try {
                        return new RegExp(issue.regex_pattern, 'i').test(errorText);
                    } catch (e) { return false; }
                });
            }
        }

        if (isKnown) {
            // Only show Delete button if it's a known issue
            const delBtn = document.createElement('button');
            delBtn.textContent = 'D';
            delBtn.type = 'button';
            delBtn.title = 'Delete Known Issue';
            delBtn.className = 'vim-delete-btn';
            delBtn.onclick = (e) => window.handleDeleteClick(e, rowElement);
            container.appendChild(delBtn);
        } else {
            // Only show Report button if it's a new issue
            const btn = document.createElement('button');
            btn.textContent = 'R';
            btn.type = 'button';
            btn.className = 'vim-matcher-btn';
            btn.title = 'Report Known Issue';
            btn.onclick = (e) => window.handleReportClick(e, rowElement);
            container.appendChild(btn);
        }
    });
}

/**
 * Scans all error message containers on the page and appends a "KNOWN ISSUE" badge
 * if the error text matches any existing regex pattern from the backend.
 * 
 * @async
 * @param {Array<Object>} knownIssues - List of issue objects from the backend.
 * @param {Object} settings - Current plugin configuration.
 */
async function checkPageForKnownIssues(knownIssues, settings) {
    if (!knownIssues || knownIssues.length === 0) {
        // If no known issues, clear all existing badges
        document.querySelectorAll('.vim-known-issue-badge').forEach(b => b.remove());
        return;
    }

    const errorDivs = document.querySelectorAll(settings.errorSelector);

    errorDivs.forEach(div => {
        const text = div.textContent;

        // Check if it matches any known issue
        let matchedIssue = null;
        for (const issue of knownIssues) {
            try {
                const re = new RegExp(issue.regex_pattern, 'i');
                if (re.test(text)) {
                    matchedIssue = issue;
                    break;
                }
            } catch (e) {
                console.warn('VIM: Invalid regex from DB:', issue.regex_pattern);
            }
        }

        const existingBadge = div.querySelector('.vim-known-issue-badge');
        if (matchedIssue) {
            if (!existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'vim-known-issue-badge';
                badge.textContent = 'KNOWN ISSUE';
                div.appendChild(badge);
            }
        } else {
            // Remove badge if it no longer matches (e.g., after deletion)
            if (existingBadge) existingBadge.remove();
        }
    });
}

// Expose to window
window.injectActionButtonAndLabel = injectActionButtonAndLabel;
