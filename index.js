// 모래와 깃털 (Sand and Feather): entry point. Only wiring — the parts live in src/.
// The chat is the clock: every reply's tracker moves the game's date, hour and place,
// and the game puts one short English line about the world back into the prompt.

import { emit } from './src/core/bus.js';
import { loadData } from './src/core/data.js';
import { applyInjection } from './src/core/inject.js';
import { ctx, eventTypes, hasChat } from './src/core/st.js';
import { syncFromChat } from './src/core/tracker.js';
import { addWandMenu, refreshDrawer, renderDrawer } from './src/ui/drawer.js';
import { applyTheme, refresh } from './src/ui/window.js';

(function init() {
    const es = ctx().eventSource;
    const et = eventTypes();

    let ready = false;
    // a chat was opened (or the page loaded with one): read its game, its newest tracker, set the prompt block
    const onChat = async () => {
        if (!ready) return;
        if (hasChat()) await syncFromChat({ force: true });
        emit('state', {});
        applyInjection();
        refreshDrawer();
    };
    // a reply came, was edited, swiped or deleted: read the tracker again, a moment later
    let timer;
    const onMessage = () => {
        if (!ready || !hasChat()) return;
        clearTimeout(timer);
        timer = setTimeout(async () => {
            await syncFromChat();
            applyInjection();
            refreshDrawer();
            refresh();
        }, 250);
    };

    let started = false;
    const start = async () => {
        if (started) return;
        started = true;
        try { await loadData(); } catch (e) { console.error('[SandAndFeather] data', e); window.toastr?.error?.(String(e.message || e), '모래와 깃털'); return; }
        ready = true;
        renderDrawer();
        addWandMenu();
        applyTheme();
        onChat();
    };

    es.on(et.APP_READY, start);
    es.on(et.CHAT_CHANGED, onChat);
    for (const ev of [et.MESSAGE_RECEIVED, et.MESSAGE_SENT, et.MESSAGE_EDITED, et.MESSAGE_UPDATED, et.MESSAGE_SWIPED, et.MESSAGE_DELETED]) {
        if (ev) es.on(ev, onMessage);
    }
    if (document.getElementById('extensions_settings2')) start();
})();
