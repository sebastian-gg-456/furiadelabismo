// src/core/common.js
// Global helpers and error hooks shared by scenes

// Language flag (menu toggles this)
var isEnglish = typeof window !== 'undefined' && typeof window.isEnglish === 'boolean' ? window.isEnglish : false;

// Safe gamepad accessor
function getPad(idx, scene) {
    const pads = scene && scene.input && scene.input.gamepad ? scene.input.gamepad.gamepads : null;
    if (!pads || !pads.length) return null;
    return pads[idx] || null;
}

// Expose to window for any late-loaded scripts
if (typeof window !== 'undefined') {
    window.isEnglish = isEnglish;
    window.getPad = getPad;

    // Global error hooks to capture stack traces for runtime errors (helps debugging)
    window.addEventListener('error', (e) => {
        try {
            console.warn('Global error caught:', e.message, e.filename + ':' + e.lineno + ':' + e.colno);
            if (e.error && e.error.stack) console.warn(e.error.stack);
        } catch (ex) { /* ignore */ }
    });
    window.addEventListener('unhandledrejection', (ev) => {
        try { console.warn('Unhandled promise rejection:', ev.reason && ev.reason.stack ? ev.reason.stack : ev.reason); } catch (ex) { /* ignore */ }
    });
}
