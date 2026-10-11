const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
const O=path.resolve(__dirname,'..'),R=path.resolve(O,'../../../..'),B=path.join(os.tmpdir(),'sandfeather-idle147-baseline'),base='5c0987c2a4c4e72144d7022d4de9af66596c1d0d';
fs.mkdirSync(B,{recursive:true});for(const who of ['set','somang','horus'])for(const dir of ['front','back','left','right']){const n=who+'-'+dir+'.png',buf=cp.execFileSync('git',['show',base+':docs/art/chibi-refresh/review-trio-idle-v1/native/'+n],{cwd:R,maxBuffer:8*1024*1024});fs.writeFileSync(B+'/'+n,buf);fs.writeFileSync(O+'/native/'+n,buf);}
for(const p of ['parts.cjs','horus.cjs','legs.cjs','edges.cjs'])cp.execFileSync(process.execPath,[path.join(__dirname,p)],{stdio:'inherit'});
cp.execFileSync(process.execPath,[O+'/finish-147.cjs'],{stdio:'inherit'});
cp.execFileSync(process.execPath,[__dirname+'/validate.cjs'],{stdio:'inherit'});
