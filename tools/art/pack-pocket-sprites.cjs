// Packs the preserved four-direction source without redrawing character art.
// npm dependency: sharp. Run from any directory.
const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
(async () => {
    const source = path.join(root, 'docs/art/sprites/pocket-directions-source.png');
    const {width, height} = await sharp(source).metadata();
    const size = 64, layers = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
        const left = Math.round(col * width / 4), top = Math.round(row * height / 4);
        const cell = await sharp(source).extract({left, top,
            width: Math.round((col + 1) * width / 4) - left,
            height: Math.round((row + 1) * height / 4) - top}).png().toBuffer();
        const {data, info} = await sharp(cell).ensureAlpha().raw().toBuffer({resolveWithObject: true});
        let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
        for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
            if (data[(y * info.width + x) * 4 + 3] < 16) continue;
            x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }
        if (x1 < x0) throw new Error(`Empty sprite at ${row},${col}`);
        const sprite = await sharp(cell).extract({left:x0, top:y0, width:x1-x0+1, height:y1-y0+1})
            .resize(60, 60, {fit:'inside', kernel:'nearest'}).png().toBuffer();
        const m = await sharp(sprite).metadata();
        layers.push({input:sprite, left:col*size+Math.floor((size-m.width)/2), top:row*size+size-m.height});
    }
    const target = path.join(root, 'data/art/characters/pocket-chibi.png');
    fs.mkdirSync(path.dirname(target), {recursive:true});
    await sharp({create:{width:256,height:256,channels:4,background:'#00000000'}})
        .composite(layers).png().toFile(target);
    console.log(target);
})().catch(e => {console.error(e);process.exitCode=1;});
