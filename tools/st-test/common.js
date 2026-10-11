// shared: open ST, a chat with a tracker, helpers
const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T = '<tracker> 🌇 05:48 오후 \\| 하티르 여드렛날, 2년 \\| 옴보스 → 서쪽 별채 \\| ☀️ 맑음 </tracker>';
async function open({ fresh = true, dpr = 1, mobile = false } = {}) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 412, height: 900 }, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile });
  const errs = [];
  p.on('pageerror', e => { if (!/Internal S|Host not/.test(e.message)) errs.push('pageerror ' + e.message); });
  p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/Failed to load resource/.test(t)) || /\[SandAndFeather\]/.test(t)) errs.push(m.type() + ' ' + t); });
  await p.goto('http://127.0.0.1:8000/', { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => !!window.SillyTavern?.getContext, null, { timeout: 60000 });
  await sleep(6000);
  const sv = p.locator('button:visible, .menu_button:visible', { hasText: /^Save$/ }); if (await sv.count()) { await sv.first().click(); await sleep(1500); }
  await p.waitForFunction(() => window.SillyTavern.getContext().characters?.length > 0, null, { timeout: 30000 });
  await p.evaluate(() => SillyTavern.getContext().selectCharacterById(0));
  await sleep(2500);
  const slash = s => p.evaluate(async s => { await SillyTavern.getContext().executeSlashCommandsWithOptions(s); }, s);
  if (fresh) { await slash('/newchat'); await sleep(1500); }
  await p.evaluate(() => { const st = SillyTavern.getContext().extensionSettings.sand_feather; st.conn = { ...(st.conn || {}), mode: 'custom', url: 'http://127.0.0.1:8111/v1', model: 'fake', key: 'x', fmt: 'openai' }; });
  const S = () => p.evaluate(() => SillyTavern.getContext().chatMetadata.sand_feather);
  const mod = path => `/scripts/extensions/third-party/SandAndFeather/${path}`;
  return { b, p, errs, slash, S, mod, sleep, T };
}
// run every thing's act on the map with a ui that presses the given button (by text, or the primary one)
const FAKE_UI = `({ cards: [], toasts: [], press: null,
  showCard(o) { this.cards.push(o); const bs = o.buttons || []; const want = this.press && bs.find(b => b.label.includes(this.press)); const b = want || bs.find(b => b.primary); if (b && b.onClick) setTimeout(() => b.onClick(), 0); return () => {}; },
  toast(t) { this.toasts.push(t); }, fold: async () => {} })`;
module.exports = { open, sleep, T, FAKE_UI };
