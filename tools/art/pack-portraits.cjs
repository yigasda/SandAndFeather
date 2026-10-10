// Crop approved artwork only; do not regenerate or recolour the characters.
const sharp = require('sharp'), path = require('node:path'), fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const defs = {
    set: ['set', 280, 78, 445, 1045],
    horus: ['horus', 270, 85, 470, 1065],
    'somang-calm': ['somang-closed', 258, 78, 500, 975],
    'somang-smile': ['somang-options-01-02', 536, 85, 465, 967],
};
(async () => {
    const out = path.join(root, 'data/art/portraits'); fs.mkdirSync(out, {recursive:true});
    for (const [id, [name,left,top,width,height]] of Object.entries(defs)) {
        const source = path.join(root, `docs/art/sprites/approved/${name}.png`);
        await sharp(source).extract({left,top,width,height}).png().toFile(path.join(out, `${id}-full.png`));
        await sharp(source).extract({left,top,width,height:Math.round(height*.52)}).png().toFile(path.join(out, `${id}-bust.png`));
    }
})().catch(e=>{console.error(e);process.exitCode=1;});
