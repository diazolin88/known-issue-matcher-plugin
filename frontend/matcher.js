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
        console.log('VIM: runMatcher started');
        const settings = window.getSettings();
        const knownIssues = await window.KnownIssuesApiClient.getKnownIssues();

        // 1. Inject buttons (R/D)
        await injectButtons(knownIssues, settings);

        // 2. Add "KNOWN ISSUE" badges to error text
        await checkPageForKnownIssues(knownIssues, settings);

    } catch (error) {
        console.error('Error in runMatcher:', error);
    }
}

/**
 * Scans the page for test rows based on the configured selectors.
 * Injects a 'Report' (R) button for new failures and a 'Delete' (D) button for matched ones.
 * 
 * @async
 * @param {Array<Object>} knownIssues - List of issue objects from the backend.
 * @param {Object} settings - Current plugin configuration.
 */
async function injectButtons(knownIssues, settings) {
    const rowElements = document.querySelectorAll(settings.rowSelector);

    rowElements.forEach(rowElement => {
        // Only target element that contain FAIL and haven't been processed yet
        const text = rowElement.textContent;
        if (text.includes('FAIL') && !rowElement.dataset.vimInjected) {
            rowElement.dataset.vimInjected = 'true';

            // Identify if this row matches a known issue to decide which buttons to show
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
                btn.onclick = (e) => window.handleReportClick(e, rowElement);
            }
            rowElement.parentNode.appendChild(btn);

            if (isKnown) {
                const delBtn = document.createElement('button');
                delBtn.textContent = 'D';
                delBtn.type = 'button';
                delBtn.title = 'Delete Known Issue';
                delBtn.className = 'vim-delete-btn';
                delBtn.onclick = (e) => window.handleDeleteClick(e, rowElement);
                rowElement.parentNode.appendChild(delBtn);
            }
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
    if (!knownIssues || knownIssues.length === 0) return;
    const errorDivs = document.querySelectorAll(settings.errorSelector);

    errorDivs.forEach(div => {
        const text = div.textContent;
        // Skip if already marked
        if (div.querySelector('.vim-known-issue-badge')) return;

        for (const issue of knownIssues) {
            try {
                const re = new RegExp(issue.regex_pattern, 'i');
                if (re.test(text)) {
                    const badge = document.createElement('span');
                    badge.className = 'vim-known-issue-badge';
                    badge.textContent = 'KNOWN ISSUE';
                    div.appendChild(badge);
                    break;
                }
            } catch (e) {
                console.warn('Invalid regex from DB:', issue.regex_pattern);
            }
        }
    });
}

// Expose to window
window.injectActionButtonAndLabel = injectActionButtonAndLabel;
