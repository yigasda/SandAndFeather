const { open, sleep, T } = require('./common.js');
const SP = process.argv[2]; require('fs').mkdirSync(SP + '/spr', { recursive: true });
(async () => {
  const { b, p, errs, slash } = await open({ dpr: 2, mobile: true });
  const base = '/scripts/extensions/third-party/SandAndFeather/';
  await slash(`/sendas name=Seraphina ${T}\n.`); await sleep(1200);
  await p.evaluate(async base => { const w = await import(base + 'src/ui/window.js'); await w.openGame(); }, base); await sleep(1500);
  const close = () => p.evaluate(() => document.querySelectorAll('#sf_game .sf_pop_x').forEach(x => x.click()));
  await close(); await sleep(300);
  const themes = await p.evaluate(async base => (await import(base + 'src/core/settings.js')).UI_THEMES.map(t => t.id), base);
  const out = [];
  for (const th of themes) {
    await p.evaluate(async ([base, th]) => { SillyTavern.getContext().extensionSettings.sand_feather.uiTheme = th; (await import(base + 'src/ui/window.js')).applyTheme(); }, [base, th]);
    for (const who of ['somang', 'set', 'horus']) {
      await p.locator('#sf_game .sf_tab[data-tab="party"]').click(); await sleep(600);
      const btns = await p.locator('#sf_game .sf_party_look').count();
      await p.locator(`[data-detail="${who}"]`).click(); await sleep(900);
      const card = p.locator('#sf_game .sf_pop').last();
      const info = await card.evaluate(c => { const f = c.querySelector('.sf_character_summary figure'); const r = f.getBoundingClientRect(); const img = f.querySelector('img'); const nav = c.querySelector('.sf_gallery_nav'); const nr = nav?.getBoundingClientRect(); const cr = c.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height), src: img.src.split('/').pop(), loaded: img.complete && img.naturalWidth > 0, navOver: nr ? (nr.left < cr.left || nr.right > cr.right) : null, dots: c.querySelectorAll('.sf_gallery_dot').length }; });
      let srcs = [info.src];
      if (info.dots) for (let k = 0; k < 3; k++) { await card.locator('.sf_gallery_step', { hasText: '›' }).click(); await sleep(400); srcs.push((await card.locator('.sf_gallery_pic img').getAttribute('src')).split('/').pop()); }
      if (th === 'cozy' || th === 'walnut' || who === 'set') { await card.locator('.sf_gallery_step', { hasText: '‹' }).count() && await card.locator('.sf_gallery_step', { hasText: '‹' }).click().catch(()=>{}); await sleep(300); await p.screenshot({ path: `${SP}/spr/prof_${th}_${who}.png` }); }
      out.push(`${th} ${who}: lookBtns=${btns} ${info.w}x${info.h} loaded=${info.loaded} dots=${info.dots} navOver=${info.navOver} ${srcs.join(' ')}`);
      await close(); await sleep(300); await close(); await sleep(200);
    }
  }
  console.log(out.join('\n'));
  await p.evaluate(async base => { SillyTavern.getContext().extensionSettings.sand_feather.uiTheme = 'cozy'; (await import(base + 'src/ui/window.js')).applyTheme(); }, base);
  console.log('ERR', errs.slice(0, 6)); await b.close();
})();
