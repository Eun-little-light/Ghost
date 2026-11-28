// 데이트 장소 32곳 로터 대사 점검 — 엔진을 7874 포트로 띄운 뒤: bun patch/tests/toy_places_check.mjs
// 데이트 장소 32곳 전부: 로터 7단계 대사 · 그림 자세 태그에 장소와 안 맞는 말이 있는지 (가짜 생성)
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(process.env.PUPPETEER_FROM || import.meta.url);   // puppeteer-core가 있는 곳 (PUPPETEER_FROM=…/package.json)
const puppeteer = require('puppeteer-core');
for (let i = 0; i < 60; i++) { try { await fetch('http://127.0.0.1:7874/'); break } catch { await new Promise(r => setTimeout(r, 1000)) } }
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f => fs.existsSync(f));
const browser = await puppeteer.launch({ executablePath: exe, headless: true });
const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto('http://127.0.0.1:7874/', { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('#hsRun'), { timeout: 60000 }); await new Promise(r => setTimeout(r, 2000));
const keys = await page.evaluate(() => Object.keys(BC_HUNTSEQ.DATES));
const TBL = /주문|메뉴판|메뉴를|테이블|숟가락|포크|접시|점원|물잔|컵을|의자|옆 테이블|뒤 테이블|밥 먹|식사|맛있는 거 먹는 중|table|holding cup/, STREET = /길모퉁이|가로등|횡단보도|길에서|지나가던 사람|신호를 기다리/, CARW = /걷는|걸음|걸었|걷던|걸을 때마다|엘리베이터|walking|standing/;
const KIND = await page.evaluate((keys) => Object.fromEntries(keys.map((k) => [k, BC_DATETOY.kindOf(k)])), keys);
let md = '# 데이트 장소별 몰래 로터 대사 점검\n', bad = [];
for (const k of keys) {
  const r = await page.evaluate(async (k) => {
    localStorage.clear(); const S = (a, v) => localStorage.setItem('hseq_' + a, JSON.stringify(v));
    S('chars', ['hunt_jieun']); S('multi', true); S('fmt', 'wayward'); S('dates', [k]); S('poses', ['press']); S('fins', ['inside']); S('places', ['suite']); S('outfits', ['maid']); S('rels', ['lover']);
    S('on', { video1: false, video2: false, datetoy: true, dt_wear: true, dt_back: true, dt_low: true, dt_mid: true, dt_high: true, dt_cum: true });
    return true;
  }, k);
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('#hsRun'), { timeout: 60000 }); await new Promise(r => setTimeout(r, 800));
  const recs = await page.evaluate(async () => { showTab('hseq'); window.iosAlert = async () => ({ ok: true }); const old = api; let n = 0; const pos = []; api = async (u, o) => { if (u === '/api/generate') { pos.push(o.json.positive); return { prompt_id: 'p' + (++n) }; } return old(u, o); };
    document.querySelector('#hsRun').click(); await new Promise(r => setTimeout(r, 4000)); document.querySelector('#hsStop').click(); api = old;
    const rr = JSON.parse(localStorage.getItem('hseq_run') || '[]'); return rr.map((x, i) => ({ sid: x.sid, n: x.n, line: x.line, pos: x.pos || pos[i] || '' })).filter((x) => /^(datetoy|dt_)/.test(x.sid)); });
  const kind = KIND[k];
  for (const x of recs) {
    const L = x.line, P = x.pos;
    if (kind !== 'table' && TBL.test(L)) bad.push(`${k}(${kind}) ${x.sid}: 테이블 말 ${L.match(TBL)[0]}`);
    if (/^(walkIn|seat|car|active)$/.test(kind) && STREET.test(L)) bad.push(`${k}(${kind}) ${x.sid}: 길거리 말 ${L.match(STREET)[0]}`);
    if (kind === 'car' && CARW.test(L.replace(/\[[^\]]*\]/, ''))) bad.push(`${k}(car) ${x.sid}: 걷는 말 ${L.match(CARW)[0]}`);
    if (/^(seat|car)$/.test(kind) && /서 있다|선 채로|매달려 겨우 서/.test(L)) bad.push(`() : 앉는 곳인데 서 있음`);
    if (kind === 'car' && /다 보는데|사람들 사이|주변 사람들/.test(L)) bad.push(`(car) : 차 안인데 사람들`);
    if (/^(walkOut|walkIn|active)$/.test(kind) && /앉으니까|의자|좌석/.test(L)) bad.push(`() : 걷는 곳인데 앉음`);
    if (kind !== 'table' && /sitting at table|clutching table edge|holding cup/.test(P)) bad.push(`${k}(${kind}) ${x.sid}: 그림 테이블 태그`);
    if (kind === 'car' && !/car interior|car passenger seat|public restroom/.test(P)) bad.push(`${k}(car) ${x.sid}: 그림 차 안 아님`);
  }
  md += `\n---\n\n## ${k} (${kind}) · 단계 ${recs.length}\n` + recs.map((x) => `\n**${x.n}**\n\n> ` + x.line.split('\n').join('\n>\n> ') + '\n').join('');
}

console.log('장소', keys.length, '문제', bad.length); for (const b of bad.slice(0, 40)) console.log(' ', b);
console.log('errors', errors.slice(0, 5));
await browser.close();
