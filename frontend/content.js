// --- Initialization & Entry Point ---

// Main initialization function
async function init() {
    console.log('VIM: init triggered');
    try {
        if (window.injectSettingsButton) window.injectSettingsButton();
        if (window.injectActionButtonAndLabel) await window.injectActionButtonAndLabel();
    } catch (e) {
        console.error('VIM: init failed', e);
    }
}

// Expose init globally so observer.js can call it
window.vimInit = init;

// Run immediately on load
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
