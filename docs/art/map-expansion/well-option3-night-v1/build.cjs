const sharp=require('sharp'),path=require('path');
(async()=>{await sharp(path.join(__dirname,'sources/night-edit.png')).resize(2160,887,{fit:'fill'}).png().toFile(path.join(__dirname,'well-courtyard-option3-night.png'));})();
