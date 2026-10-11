const sharp=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.cjs');
(async()=>{await sharp(process.argv[2]).resize(620,720,{fit:'fill',kernel:'nearest'}).ensureAlpha().png().toFile(process.argv[3]);})();
