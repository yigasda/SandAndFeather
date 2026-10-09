// 모래와 깃털 (Sand and Feather): entry point. Only wiring — the parts live in src/.
// The chat is the clock: every reply's tracker moves the game's date, hour and place,
// and the game puts one short English line about the world back into the prompt.

import { emit, on } from './src/core/bus.js';
import { checkData } from './src/core/check.js';
import { loadData } from './src/core/data.js';
import { applyInjection } from './src/core/inject.js';
import { ctx, eventTypes, hasChat } from './src/core/st.js';
import { syncFromChat } from './src/core/tracker.js';
import { addWandMenu, refreshDrawer, renderDrawer } from './src/ui/drawer.js';
import { applyTheme, refresh } from './src/ui/window.js';
import { armPrepared } from './src/core/news.js';
import './src/packs/life/dock.js';
import './src/packs/life/market.js';
import './src/packs/life/garden.js';
import './src/packs/life/kitchen.js';
import './src/packs/growth/growth.js';
import './src/packs/duat/duat.js';
import './src/packs/realm/works.js';
import './src/packs/world/world.js';
import './src/packs/adventure/gen.js';

(function init() {
    const es = ctx().eventSource;
    const et = eventTypes();

    let ready = false;
    // a chat was opened (or the page loaded with one): read its game, its newest tracker, set the prompt block
    const onChat = async () => {
        if (!ready) return;
        if (hasChat()) await syncFromChat({ force: true });
        emit('game:loaded', {});
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
        const problems = checkData();
        if (problems.length) window.toastr?.warning?.(problems.slice(0, 3).join('<br>'), '모래와 깃털 · 데이터 확인', { escapeHtml: false });
        renderDrawer(problems);
        addWandMenu();
        applyTheme();
        onChat();
    };

    // right before a reply is written, the block must already be right: a new turn drops news a reply already
    // carried, a regenerate keeps it (news.js). No waiting here, SillyTavern builds the prompt next.
    const now = () => { if (ready && hasChat()) applyInjection(); };
    on('news:changed', () => { applyInjection(); refreshDrawer(); });

    es.on(et.APP_READY, start);
    es.on(et.CHAT_CHANGED, onChat);
    // a sent message decides whether a line the game only prepared goes in: only if the message still carries it
    if (et.MESSAGE_SENT) es.on(et.MESSAGE_SENT, i => { if (ready && hasChat()) { armPrepared(i); applyInjection(); } });
    if (et.GENERATION_STARTED) es.on(et.GENERATION_STARTED, now);
    for (const ev of [et.MESSAGE_RECEIVED, et.MESSAGE_SENT, et.MESSAGE_EDITED, et.MESSAGE_UPDATED, et.MESSAGE_SWIPED, et.MESSAGE_DELETED]) {
        if (ev) es.on(ev, onMessage);
    }
    if (document.getElementById('extensions_settings2')) start();
})();
