import { build } from 'esbuild';
import fs from 'fs';
import { gunzipSync } from 'node:zlib';
import snapshot from './snapshot.mjs';
if (!fs.existsSync('data.json')) fs.writeFileSync('data.json', gunzipSync(Buffer.from(snapshot, 'base64')));
const freshData=JSON.parse(fs.readFileSync('data.json','utf8'));const fallbackData=JSON.parse(gunzipSync(Buffer.from(snapshot,'base64')).toString());if(!freshData.stocks.BONY?.partial&&!freshData.stocks.BONY?.ok){freshData.stocks.BONY=fallbackData.stocks.BONY;fs.writeFileSync('data.json',JSON.stringify(freshData));}
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('data.ts', 'export const DATA: any = ' + fs.readFileSync('data.json', 'utf8') + ';\n');
await build({ entryPoints: ['main.tsx'], bundle: true, minify: true, outfile: 'dist/app.js', loader: { '.css': 'css' }, define: { 'process.env.NODE_ENV': '"production"' }, target: 'es2019' });
const stamp = Date.now().toString(36);
for (const f of ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']) fs.copyFileSync(f, 'dist/' + f);
if(fs.existsSync('idx'))fs.cpSync('idx','dist/idx',{recursive:true}); if(fs.existsSync('fundamentals.json'))fs.copyFileSync('fundamentals.json','dist/fundamentals.json'); if(fs.existsSync('news.json'))fs.copyFileSync('news.json','dist/news.json'); if(fs.existsSync('fundamentals_rest.json'))fs.copyFileSync('fundamentals_rest.json','dist/fundamentals_rest.json'); if(fs.existsSync('studies_rest'))fs.cpSync('studies_rest','dist/studies_rest',{recursive:true});
for (const f of ['last_close.json', 'last_close_fallback.json']) if (fs.existsSync(f)) fs.copyFileSync(f, 'dist/' + f);
fs.writeFileSync('dist/index.html',fs.readFileSync('dist/index.html','utf8').replace('src="app.js"','src="app.js?v='+stamp+'"').replace('href="app.css"','href="app.css?v='+stamp+'"'));
fs.writeFileSync('dist/sw.js', fs.readFileSync('sw.js', 'utf8').replace('__V__', stamp));
console.log('built', stamp);

for (const f of ['flow_signal.json', 'flow_stats.json', 'peer_compare.json', 'egx_holidays.json', ...fs.readdirSync('.').filter(f => /^flow_combo_[A-Z0-9]+\.json$/.test(f))]) if (fs.existsSync(f)) fs.copyFileSync(f, 'dist/' + f);
if(fs.existsSync('gold/scenario.json')){fs.mkdirSync('dist/gold',{recursive:true});fs.copyFileSync('gold/scenario.json','dist/gold/scenario.json');}
if(fs.existsSync('gold/history.jsonl')){fs.mkdirSync('dist/gold',{recursive:true});fs.copyFileSync('gold/history.jsonl','dist/gold/history.jsonl');}
