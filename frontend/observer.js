// --- MutationObserver & DOM Monitoring ---

let observer = null;
let currentUrl = window.location.href;

// Debounce helper to prevent multiple rapid calls
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Wrapper to safely call the main init function
function triggerInit() {
    if (typeof window.vimInit === 'function') {
        window.vimInit();
    } else {
        console.warn('VIM: window.vimInit is not defined yet.');
    }
}

const debouncedInit = debounce(triggerInit, 1000);

// Setup MutationObserver
function setupObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
        let shouldRefresh = false;

        // Check for URL changes
        if (window.location.href !== currentUrl) {
            console.log('VIM: URL changed');
            currentUrl = window.location.href;
            shouldRefresh = true;
        }

        // Check mutations for significant changes
        if (!shouldRefresh) {
            for (const mutation of mutations) {
                // 1. IGNORE our own elements to prevent infinite loops
                const target = mutation.target;
                const targetClass = target.className || '';

                // Check target element
                if (typeof targetClass === 'string' && targetClass.includes('vim-actions-container')) {
                    continue;
                }

                // Check added nodes
                let isSelfChange = false;
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && node.classList &&
                            (node.classList.contains('vim-actions-container') || node.classList.contains('vim-known-issue-badge'))) {
                            isSelfChange = true;
                            break;
                        }
                    }
                }

                if (isSelfChange) continue;

                // If it's NOT our own change, assume it might be relevant and trigger refresh (debounced)
                shouldRefresh = true;
                break;
            }
        }

        if (shouldRefresh) {
            debouncedInit();
        }
    });

    // Observe the body for any changes
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true, // Watch for attribute changes (e.g. data-controller)
        attributeFilter: ['data-controller', 'class'] // Only relevant attributes
    });

    // Trigger once on setup to ensure we catch initial state if content.js missed it
    debouncedInit();
}

// Polling for URL changes (fallback for SPA navigation)
setInterval(() => {
    if (window.location.href !== currentUrl) {
        console.log('VIM: URL changed (polling)');
        currentUrl = window.location.href;
        debouncedInit();
    }
}, 500);

// Start the observer
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', setupObserver);
} else {
    setupObserver();
}
