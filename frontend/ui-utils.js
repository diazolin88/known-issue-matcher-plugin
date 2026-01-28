/**
 * UI Utilities module for the Known Issues Matcher.
 * Provides helper functions for HTML escaping and modal creation.
 */

/**
 * Escapes special characters in a string to prevent XSS when injecting into HTML.
 * 
 * @param {string} text - The raw text to escape.
 * @returns {string} The HTML-safe escaped string.
 */
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Creates and displays a modal dialog on the page.
 * 
 * @param {Object} options - Configuration for the modal.
 * @param {string} options.title - The title to display in the modal header.
 * @param {string} options.bodyContent - The HTML content for the modal body.
 * @param {Function} options.onSubmit - Callback function executed when the 'Save' button is clicked.
 * @param {Function} [options.onCancel] - Optional callback for when the 'Cancel' button is clicked.
 * @param {string} [options.overlayClass='vim-modal-overlay'] - Optional custom class for the modal overlay.
 */
function createModal(options) {
    const { title, bodyContent, onSubmit, onCancel, overlayClass = 'vim-modal-overlay' } = options;

    // Remove existing modal if any
    const existing = document.querySelector(`.${overlayClass}`);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = overlayClass;

    const modal = document.createElement('div');
    modal.className = 'vim-modal';

    modal.innerHTML = `
        <h3>${title}</h3>
        ${bodyContent}
        <div class="vim-modal-actions">
            <button id="vim-modal-cancel-btn" type="button">Cancel</button>
            <button id="vim-modal-save-btn" type="button">Save</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    const cancelBtn = document.getElementById('vim-modal-cancel-btn');
    const saveBtn = document.getElementById('vim-modal-save-btn');
    const input = modal.querySelector('input');

    cancelBtn.onclick = () => {
        if (onCancel) onCancel();
        overlay.remove();
        modal.remove();
    };

    saveBtn.onclick = () => {
        const value = input ? input.value : null;
        onSubmit(value);
        overlay.remove();
        modal.remove();
    };
}

// Expose to window
window.escapeHtml = escapeHtml;
window.createModal = createModal;
