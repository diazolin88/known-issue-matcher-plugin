/**
 * Button Actions module for the Known Issues Matcher.
 * Contains logic for handling user interactions such as reporting, deleting, and saving known issues.
 */

/**
 * Handles the 'Delete' button click. Identifies the matched known issue for the row,
 * calls the backend to delete it, and reloads the page.
 * 
 * @async
 * @param {Event} e - The click event.
 * @param {HTMLElement} rowElement - The element containing the test iteration text.
 */
async function handleDeleteClick(e, rowElement) {
    if (e) e.preventDefault();

    const settings = window.getSettings();
    const row = rowElement.closest('tr');
    if (!row) return;

    const errorDiv = row.querySelector(settings.errorSelector);
    if (!errorDiv) {
        alert('No .error div found in this row.');
        return;
    }

    const errorText = errorDiv.textContent.trim();
    // Re-fetch issues to ensure we have fresh data for delete
    const knownIssues = await window.KnownIssuesApiClient.getKnownIssues();

    let matchedIssue = null;
    for (const issue of knownIssues) {
        try {
            const re = new RegExp(issue.regex_pattern, 'i');
            if (re.test(errorText)) {
                matchedIssue = issue;
                break;
            }
        } catch (e) {
            console.warn('Invalid regex:', issue.regex_pattern);
        }
    }

    if (!matchedIssue) {
        alert('No known issue matches this error text.');
        return;
    }

    try {
        await window.KnownIssuesApiClient.deleteKnownIssue(matchedIssue.id);
        alert('Known issue deleted!');
        location.reload();
    } catch (e) {
        console.error(e);
        alert(`Failed to delete issue: ${e.message}`);
    }
}

/**
 * Handles the 'Report' button click. Extracts error text, generates a safe regex,
 * and opens a modal for the user to confirm or edit the regex before saving.
 * 
 * @async
 * @param {Event} e - The click event.
 * @param {HTMLElement} rowElement - The element containing the test iteration text.
 */
async function handleReportClick(e, rowElement) {
    if (e) e.preventDefault();

    const settings = window.getSettings();
    const row = rowElement.closest('tr');
    if (!row) return;

    const errorDiv = row.querySelector(settings.errorSelector);
    if (!errorDiv) {
        alert('No .error div found in this row.');
        return;
    }

    const errorText = errorDiv.textContent.trim();
    // Escape regex special chars to provide a literal match by default
    const safeRegex = errorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const bodyContent = `
        <p>Detected Error Content (you can edit the regex below):</p>
        <input type="text" id="vim-regex-input" value="${window.escapeHtml(safeRegex)}" style="width: 100%;">
    `;

    window.createModal({
        title: 'Add Known Issue Regex',
        bodyContent: bodyContent,
        onSubmit: async (regex) => {
            const finalRegex = document.getElementById('vim-regex-input').value;
            await saveKnownIssue(finalRegex);
        }
    });
}

/**
 * Sends a new known issue regex pattern to the backend for storage.
 * 
 * @async
 * @param {string} regex - The regex pattern to save.
 */
async function saveKnownIssue(regex) {
    try {
        const result = await window.KnownIssuesApiClient.saveKnownIssue(regex);
        alert(`Known issue saved! ID: ${result.id}`);
        window.runMatcher(); // Re-scan page using the unified function
    } catch (e) {
        console.error(e);
        alert(`Failed to save issue: ${e.message}`);
    }
    location.reload();
}

// Expose to window
window.handleDeleteClick = handleDeleteClick;
window.handleReportClick = handleReportClick;
window.saveKnownIssue = saveKnownIssue;
