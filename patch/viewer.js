// 이미지 보기 창 · 갤러리 확장 (대사판)
// - 그림을 열면 좌우(버튼 · ← → 키 · 밀기)로 넘겨 봄. 넘기는 범위는 "같은 캐릭터 · 같은 복장"만 → 다른 복장 그림이 섞이지 않음
// - Hunt 시퀀스에서 붙인 대사를 그림 위 좌측 또는 하단 대사창으로 띄움 (창 안 버튼으로 위치 바꿈, 기억됨)
// - 갤러리에서 열면 그림과 대사만 보임 (프롬프트·설정 칸 숨김)
// - 갤러리 "캐릭터 폴더" 보기: 캐릭터별 폴더 → 복장별 묶음. 예전에 만든 그림도 프롬프트(외모·복장 태그)로 알아봐서 폴더에 넣음
// 대사·캐릭터·복장 정보는 프롬프트 id별로 localStorage "bc_lines"에 저장
(() => {
  const K = "bc_lines", POS = "bc_line_pos", MODE = "bc_gal_mode";
  let map = {};
  try { map = JSON.parse(localStorage.getItem(K) || "{}") || {}; } catch {}
  window.BC_LINE = {
    set(id, v, noSave) {
      if (!id || !v) return;
      map[id] = v; cache.delete(id);
      if (!noSave) this.save();
    },
    save() {
      const keys = Object.keys(map); if (keys.length > 5000) keys.slice(0, keys.length - 5000).forEach((k) => delete map[k]);
      try { localStorage.setItem(K, JSON.stringify(map)); } catch {}
    },
    get: (id) => map[id] || null,
  };
  const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  let side = lsGet(POS, "bottom") === "left" ? "left" : "bottom";
  let mode = ["all", "new", "hidden"].includes(lsGet(MODE, "folder")) ? lsGet(MODE, "folder") : "folder";
  // 내가 가린 그림 (기록 id) · 새로 생성된 그림(마지막으로 '확인'한 때보다 나중 것)은 따로 보여 줌
  const jget = (k, d) => { try { const x = JSON.parse(localStorage.getItem(k)); return x == null ? d : x; } catch { return d; } };
  const jset = (k, x) => { try { localStorage.setItem(k, JSON.stringify(x)); } catch {} };
  const hidden = new Set(jget("bc_hidden", []));
  const seenIds = new Set(jget("bc_seen_ids", []));
  let seenAt = jget("bc_seen", null);
  const saveHidden = () => jset("bc_hidden", [...hidden].slice(-20000));
  const saveSeen = () => { jset("bc_seen", seenAt); jset("bc_seen_ids", [...seenIds].slice(-5000)); };
  let curC = null, curO = null, galAll = false;
  const SORT = "bc_gal_sort";
  let sortBy = lsGet(SORT, "new") === "old" ? "old" : "new";
  const ALL_O = "__all__";   // 캐릭터 폴더 안 '전체'

  const $v = (s, r = document) => r.querySelector(s);
  // 지워진 그림(파일이 없는 기록): 오류 없이 조용히 숨김 — 갤러리 칸 · 시퀀스 칸은 감추고, 보기 창에서는 건너뜀
  const dead = new Set();
  const isDead = (e) => !e || !e.images || !e.images.length || e.images.every((im) => dead.has(imgURL(im)));
  const onDead = (img) => {
    if (img.id === "mImg") { dropCurrent(); return; }
    const folder = img.closest("#gallery .bc-folder");
    if (folder && folder._next) { folder._next(); return; }
    const tile = img.closest("#gallery .g-item, .seq-grid .hs-slot, .seq-grid .seq-slot");
    if (tile) tile.style.display = "none";
  };
  document.addEventListener("error", (ev) => {
    const img = ev.target;
    if (!img || img.tagName !== "IMG") return;
    const src = img.getAttribute("src") || "";
    if (!/^\/(images|comfy\/view)/.test(src)) return;
    dead.add(src);
    onDead(img);
  }, true);
  // 폴더에서 지운 그림 숨김 — 앱 데이터 폴더(BooruComfy_data\images) 복사본이나 ComfyUI 출력 폴더(캐릭터 폴더) 원본 중 하나라도 지웠으면 숨김
  //  창(WebView2)이 예전에 받아 둔 그림을 캐시로 보여 주는 문제 때문에, 캐시를 거치지 않고 파일이 있는지 직접 확인함
  //  ComfyUI가 꺼져 있으면 원본 확인은 건너뜀 · 원본이 처음 20장 연속 없으면 경로가 바뀐 것으로 보고 원본 확인만 멈춤
  const origURL = (im) => "/comfy/view?" + new URLSearchParams({ filename: im.filename, subfolder: im.subfolder || "", type: im.type || "output" }).toString();
  let gone; try { gone = new Set(JSON.parse(localStorage.getItem("bc_dead") || "[]")); } catch { gone = new Set(); }
  for (const u of gone) dead.add(u);
  const saveGone = () => { try { localStorage.setItem("bc_dead", JSON.stringify([...gone].slice(-8000))); } catch {} };
  const hideURL = (u) => document.querySelectorAll("#gallery img, .seq-grid img, #mImg").forEach((img) => { if (img.getAttribute("src") === u) onDead(img); });
  let reT = 0;
  const rerender = () => { clearTimeout(reT); reT = setTimeout(() => { const g = document.querySelector("#tab-gallery"); if (g && g.classList.contains("active")) { try { renderGallery(); } catch {} } }, 800); };
  const checked = new Set(), queue = [];
  let running = 0, n404 = 0, nOk = 0, stopped = false; const mine = [];
  async function checkOne(im) {
    const key = imgURL(im);
    const mark = (isGone, byOrig) => {
      if (isGone && !gone.has(key)) { gone.add(key); if (byOrig) mine.push(key); dead.add(key); saveGone(); hideURL(key); rerender(); }
      else if (!isGone && gone.has(key)) { gone.delete(key); dead.delete(key); saveGone(); rerender(); }
    };
    try {
      // 1) 앱 데이터 폴더 복사본 — 창(WebView2)이 캐시해 둔 그림을 보여 줘도 실제 파일이 없으면 지운 것
      if (im.local) {
        const r1 = await fetch(key, { method: "HEAD", cache: "no-store" });
        if (r1.status === 404) return mark(true, false);
      }
      // 2) ComfyUI 출력 폴더 원본
      if (stopped) return mark(false, false);
      const res = await fetch(origURL(im), { method: "HEAD", cache: "no-store" });
      if (res.status === 404) { n404++; mark(true, true); }
      else if (res.ok) { nOk++; mark(false, false); }
      if (!stopped && n404 >= 20 && nOk === 0) {   // 원본 경로를 못 찾는 상태(ComfyUI 폴더가 바뀜 등) — 원본 기준으로 숨긴 것만 되돌리고 원본 확인은 멈춤
        stopped = true;
        for (const k of mine) { gone.delete(k); dead.delete(k); } saveGone(); rerender();
      }
    } catch {}
  }
  const pump = () => {
    while (running < 4 && queue.length) {
      const im = queue.shift(); running++;
      checkOne(im).finally(() => { running--; pump(); });
    }
  };
  const checkAll = () => {
    for (const h of state.history || []) for (const im of h.images || []) {
      const k = imgURL(im); if (checked.has(k)) continue; checked.add(k); queue.push(im);
    }
    pump();
  };
  window.BC_DEAD = { checkAll, gone, dead };
  let lastClick = null;
  document.addEventListener("click", (e) => { lastClick = e.target; }, true);

  // ---------- 캐릭터 · 복장 알아보기 ----------
  const norm = (t) => t.trim().replace(/^BREAK\s*/i, "").replace(/^\(+|\)+$/g, "").replace(/:[\d.]+\)*$/, "").replace(/[()]/g, "").replace(/_/g, " ").toLowerCase();
  const tagSet = (s) => new Set(String(s || "").split(",").map(norm).filter(Boolean));
  const hasAll = (tags, s) => { const need = [...tagSet(s)]; return need.length > 0 && need.every((t) => tags.has(t)); };
  const CLOTH_RE = /(shirt|blouse|dress|skirt|uniform|jacket|coat|sweater|hoodie|cardigan|vest|kimono|yukata|swimsuit|bikini|pants|shorts|jeans|leotard|apron|suit|blazer|necktie|ribbon tie|pantyhose|thighhighs|stockings|t-shirt|loungewear|camisole|tank top|overalls|maid)/;
  const STATE_RE = /(lift|open |unbutton|no shirt|taking off|removed|pulled|aside|hiked|undress|wet |torn|partially)/;
  const cache = new Map();
  // 복장 짐작: 란제리 · 집에서 입는 옷 → Hunt 인물 상황별 복장 / 캐릭터 기본 복장과 태그가 60% 이상 맞으면 그 복장
  //  → 아니면 대표 윗옷 하나(영어 태그) → 그래도 없으면 '기타 복장' (스타킹 · 동작 태그로 잘게 쪼개지지 않게)
  const scoreOf = (tags, s) => { const need = [...tagSet(s)]; return need.length ? need.filter((t) => tags.has(t)).length / need.length : 0; };
  const MAIN_RE = /(dress|uniform|blouse|shirt|sweater|hoodie|kimono|yukata|swimsuit|bikini|leotard|suit|blazer|jacket|coat|cardigan|apron|maid|camisole|t-shirt|loungewear|knit|turtleneck)/;
  const STATE2_RE = /(lift|open |unbutton|no shirt|taking|removed|pull|aside|hiked|undress|wet |torn|partially|his |hand|tear|smooth|grab|holding|fixing|slip|down|lifting)/;
  function guessOf(tags, h, gc) {
    const HS = window.BC_HUNTSEQ || {}, O = HS.OUTFITS || {};
    if (tags.has("black lace lingerie")) return O.lingerieBlack || "란제리 (검정)";
    if (tags.has("white lace lingerie")) return O.lingerieWhite || "란제리 (흰색)";
    if (HS.LOUNGE && scoreOf(tags, HS.LOUNGE) >= 0.75) return O.lounge || "집에서 입는 옷";
    let best = "", bs = 0;
    if (h) for (const [k, v] of Object.entries(h.outfits || {})) { if (!v) continue; const s = scoreOf(tags, v); if (s > bs) { bs = s; best = O[k] || k; } }
    if (gc && gc.wear) { const s = scoreOf(tags, gc.wear); if (s > bs) { bs = s; best = "기본 복장"; } }
    if (bs >= 0.6) return best;
    if (tags.has("completely nude") || tags.has("nude") || tags.has("naked")) return "옷 없음";
    const main = [...tags].find((t) => MAIN_RE.test(t) && !STATE2_RE.test(t));
    return main || "기타 복장";
  }
  const KNOWN_OF = () => new Set(["기본 복장", "기타 복장", "옷 없음", ...Object.values((window.BC_HUNTSEQ || {}).OUTFITS || {})]);
  function groupOf(e) {
    if (cache.has(e.id)) return cache.get(e.id);
    const m = map[e.id];
    let g;
    if (m && m.cn) {
      let of = m.of || "";
      // 예전에 영어 태그 묶음으로 저장된 복장 이름은 다시 짐작
      if (!of || (!KNOWN_OF().has(of) && /,|thighhighs|pantyhose|stockings|his |smoothing/.test(of))) {
        const HS = window.BC_HUNTSEQ || {};
        const h = (window.BC_HUNT_CHARS || []).find((c) => c.id === m.cid), gc = HS.chars ? HS.chars().find((c) => c.id === m.cid) : null;
        of = guessOf(tagSet(e.positive), h, gc);
      }
      g = { cid: m.cid || m.cn, cn: m.cn, of };
    } else {
      const tags = tagSet(e.positive);
      let cid = "", cn = "", of = "";
      const HS = window.BC_HUNTSEQ || {};
      const h = (window.BC_HUNT_CHARS || []).find((c) => hasAll(tags, c.anchor));
      if (h) {
        cid = h.id; cn = h.name;
        of = guessOf(tags, h, null);
      } else {
        const id = window.BC_CHAR_ID ? BC_CHAR_ID(e.positive) : "";
        if (id) {
          cid = id; cn = window.BC_CHARNAMES ? BC_CHARNAMES.name(id) : id;
          const gc = HS.chars ? HS.chars().find((c) => c.id === id) : null;
          of = guessOf(tags, null, gc);
        } else {
          const sub = e.images && e.images[0] && e.images[0].subfolder;
          cid = cn = sub && !/^claude$/i.test(sub) ? sub : "기타";
          of = guessOf(tags, null, null);
        }
      }
      void CLOTH_RE; void STATE_RE;
      g = { cid, cn, of };
    }
    cache.set(e.id, g);
    return g;
  }
  // 대사가 저장되지 않은 그림(예전 그림 · 다른 탭에서 만든 그림): 프롬프트로 장면을 짐작해서 그 장면 대사를 붙임 (그림마다 늘 같은 줄)
  const GUESS = [
    ["climax_both", /simultaneous orgasm/], ["finish_both", /\(after sex/], ["sixtynine", /sixty-nine|\(69/], ["paizuri", /paizuri/], ["footjob", /footjob/], ["handjob", /handjob/],
    ["cunni", /cunnilingus|licking pussy/], ["thighjob", /thigh sex|penis between thighs/], ["grind", /sumata|grinding/], ["analtoy", /anal beads/], ["nipple", /pinching her nipples/],
    ["act_cuffs", /putting fur-lined handcuffs/], ["act_blind", /tying a cloth blindfold/], ["act_tear", /tearing her pantyhose/], ["act_panties", /pulling down her panties/],
    ["act_strap", /hooking her bra strap/], ["act_hair", /untying her hair/], ["act_glasses", /taking off her glasses/],
    ["deny1", /orgasm denial|edging/], ["video2", /video call.*(open shirt|unbuttoned|cleavage)/], ["video1", /video call/],
    ["care", /naked under blanket|fixing clothes|cuddling/], ["finish", /ejaculation|cumshot|cum in pussy|cum on/],
    ["after2", /body jerk|legs shaking/], ["after1", /afterglow|post-orgasm/], ["climax", /orgasm|ahegao/],
    ["ready", /imminent (vaginal|penetration)/], ["self", /female masturbation/], ["oral", /fellatio|penis in mouth/],
    ["pose2", /moaning|wet hair.*motion lines/], ["pose1", /vaginal sex|penetration|sex from behind|cowgirl|missionary/],
    ["hand", /fingering|fingers in pussy/], ["chest", /breast sucking|groping|fondling/], ["caress", /petting|vibrator|dildo/],
    ["undress3", /taking off panties|lifting her skirt|panties aside/], ["undress2", /taking off shirt|shirt removed/],
    ["undress1", /unbuttoning|undressing her/], ["neck", /kissing her neck|neck focus/], ["kiss", /kiss/],
    ["meet2", /sofa|hotel room|stairwell|nervous/], ["meet1", /first date|intimate atmosphere|cafe|restaurant|bar counter/],
  ];
  window.BC_GROUP = (e) => groupOf(e);
  window.BC_GUESS_SID = (p) => { p = String(p || "").toLowerCase(); const hit = GUESS.find(([, re]) => re.test(p)); return hit ? hit[0] : "meet1"; };
  const GHOST_SPEECH = { c2: "polite", c3: "casual", c4: "formal", c5: "polite", c6: "polite", witch: "casual" };
  function guessLine(e) {
    const LS = window.BC_HUNT_LINES; if (!LS) return "";
    const p = String(e.positive || "").toLowerCase();
    const hit = GUESS.find(([, re]) => re.test(p)); const sid = hit ? hit[0] : "meet1";
    const g = groupOf(e), h = (window.BC_HUNT_CHARS || []).find((c) => c.id === g.cid);
    const sp = (h && h.speech) || GHOST_SPEECH[g.cid] || "polite";
    const a = (LS[sid] && (LS[sid][sp] || LS[sid].polite)) || [];
    if (!a.length) return "";
    let n = 0; for (const ch of String(e.id)) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
    return a[n % a.length];
  }
  const same = (a, b) => { const x = groupOf(a), y = groupOf(b); return x.cid === y.cid && x.of === y.of; };

  const css = document.createElement("style");
  css.textContent = `#modal .bc-stage{position:relative}
#bcLine{position:absolute;z-index:3;background:rgba(10,10,16,.78);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:10px;padding:10px 14px;font-size:15px;line-height:1.55;white-space:pre-wrap;backdrop-filter:blur(3px);box-shadow:0 4px 18px #0006}
#bcLine.bottom{left:4%;right:4%;bottom:3%}
#bcLine.left{left:2%;top:50%;transform:translateY(-50%);width:min(32%,280px);max-height:80%;overflow:auto}
#bcLine .pl{display:block;font-size:12px;opacity:.7;margin-bottom:2px}#bcLine .na{display:block;opacity:.78;font-style:italic}#bcLine .sp{display:block}
#bcLine .wy{display:block;margin-bottom:3px}#bcLine .wy .hd{font-weight:700;opacity:.85;margin-right:4px}#bcLine .wy i{opacity:.78}#bcLine .wy .q{font-style:normal}#bcLine .wy .th{color:#ffc9e3;font-style:normal}
#bcLine .nm{display:block;font-size:12px;font-weight:700;opacity:.75;margin-bottom:3px}
#bcLine .sw{position:absolute;top:4px;right:6px;background:none;border:0;color:#fff;opacity:.55;cursor:pointer;font-size:12px;padding:2px 4px}
#bcLine .sw:hover{opacity:1}
#bcLine.hidden{display:none}
#bcHide{position:absolute;z-index:5;top:8px;left:10px;background:rgba(0,0,0,.55);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:3px 10px;font-size:12px;cursor:pointer}#bcHide:hover{background:rgba(0,0,0,.8)}
#gallery .g-item{position:relative}#gallery .g-item .bc-x{position:absolute;top:5px;right:5px;z-index:2;display:none;background:rgba(0,0,0,.65);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:7px;padding:2px 8px;font-size:12px;cursor:pointer}
#gallery .g-item:hover .bc-x{display:block}#gallery .g-item .bc-x + .bc-x{right:auto;left:5px}
#gallery .g-item.bc-sel{outline:3px solid var(--accent);outline-offset:-3px}#gallery .g-item.bc-sel::after{content:"✓";position:absolute;top:6px;left:6px;z-index:2;background:var(--accent);color:#000;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
#gallery{user-select:none}#gallery img{-webkit-user-drag:none}#bcBand{position:fixed;z-index:9998;border:1px solid var(--accent);background:color-mix(in srgb,var(--accent) 18%,transparent);pointer-events:none}
#bcMenu{position:fixed;z-index:9999;min-width:190px;background:#1d1d22;color:#eee;border:1px solid #444;border-radius:9px;padding:5px;box-shadow:0 8px 24px #0008;display:flex;flex-direction:column}
#bcMenu button{background:none;border:0;color:inherit;text-align:left;padding:7px 10px;border-radius:6px;font-size:13px;cursor:pointer}#bcMenu button:hover{background:#ffffff14}#bcMenu button.danger{color:#ff7a7a}#bcMenu hr{border:0;border-top:1px solid #444;margin:4px 2px}
#bcSelBar{position:fixed;z-index:9997;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:6px;align-items:center;background:#1d1d22;color:#eee;border:1px solid #555;border-radius:12px;padding:7px 10px;box-shadow:0 8px 24px #0008;font-size:13px}
#bcSelBar b{margin-right:6px}#bcSelBar button{background:#2c2c33;color:#eee;border:1px solid #555;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:13px}#bcSelBar button.danger{color:#ff7a7a;border-color:#7a3a3a}
.bc-galmode button .n{margin-left:4px;font-size:11px;opacity:.8}.bc-galmode button[data-m="new"].has{border-color:var(--accent);color:var(--accent)}.bc-galmode button[data-m="new"].has.on{color:#000}
#bcCount{position:absolute;z-index:3;top:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;border-radius:10px;padding:2px 10px;font-size:12px}
#modal.bc-pure #mInfo{display:none!important}
#modal.bc-pure{padding:0!important;background:#000!important}
#modal.bc-pure .modal-body{position:fixed!important;inset:0!important;display:block!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:#000!important;box-shadow:none!important;animation:none!important}
#modal.bc-pure .bc-stage{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-height:none!important;display:flex!important;align-items:center;justify-content:center;background:#000}
#modal.bc-pure #mImg{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important}
#modal.bc-pure #modalClose{position:fixed!important;top:10px!important;right:14px!important;z-index:5}
#modal.bc-pure #mPrev,#modal.bc-pure #mNext{position:fixed!important;top:50%!important;transform:translateY(-50%);z-index:4}
#modal.bc-pure #mPrev{left:12px!important}#modal.bc-pure #mNext{right:12px!important}
#modal.bc-pure #bcLine.bottom{left:8%;right:8%;bottom:4%;font-size:17px}
#modal.bc-pure{--bcPanel:min(32vw,440px)}
#modal.bc-pure #bcLine.sideR,#modal.bc-pure #bcLine.sideL{position:fixed;top:0;bottom:0;width:var(--bcPanel);transform:none;max-height:none;overflow:auto;margin:0;border-radius:0;border:0;padding:56px 20px 24px;font-size:16px;line-height:1.8;background:#111116;box-shadow:none;backdrop-filter:none}
#modal.bc-pure #bcLine.sideR{right:0;left:auto;border-left:1px solid #2c2c34}#modal.bc-pure #bcLine.sideL{left:0;right:auto;border-right:1px solid #2c2c34}
#modal.bc-pure #bcLine.sideR .sw,#modal.bc-pure #bcLine.sideL .sw{top:14px;right:auto;left:20px;font-size:13px}
#modal.bc-pure.bc-lr .bc-stage{left:0!important;right:var(--bcPanel)!important;width:auto!important}#modal.bc-pure.bc-ll .bc-stage{left:var(--bcPanel)!important;right:0!important;width:auto!important}
#modal.bc-pure.bc-lr #mNext{right:calc(var(--bcPanel) + 12px)!important}#modal.bc-pure.bc-ll #mPrev{left:calc(var(--bcPanel) + 12px)!important}
#modal.bc-pure.bc-lr #bcCount{left:calc((100% - var(--bcPanel)) / 2)}#modal.bc-pure.bc-ll #bcCount{left:calc(var(--bcPanel) + (100% - var(--bcPanel)) / 2)}#modal.bc-pure.bc-ll #bcHide{left:calc(var(--bcPanel) + 10px)}
#modal.bc-pure.bc-lr #modalClose{right:calc(var(--bcPanel) + 14px)!important}
#modal.bc-pure #bcLine.sideB{position:fixed;left:0;right:0;bottom:0;top:auto;height:38vh;transform:none;max-height:none;overflow:auto;margin:0;border-radius:0;border:0;border-top:1px solid #2c2c34;padding:14px 16px 20px;font-size:15px;background:#111116;box-shadow:none;backdrop-filter:none}#modal.bc-pure.bc-lb .bc-stage{bottom:38vh!important;top:0!important;height:auto!important}
#modal.bc-pure #bcLine.left{left:3%;width:min(28%,340px);font-size:16px}
.bc-galmode{display:inline-flex;gap:4px}.bc-galsort{margin-left:10px;padding-left:10px;border-left:1px solid var(--line,#444)}.bc-galmode button.on{background:var(--accent);color:#000}
#gallery .g-item.err{display:none!important}#gallery .bc-folder{cursor:pointer}#gallery .bc-folder .fn{position:absolute;left:0;right:0;bottom:0;padding:6px 8px;background:linear-gradient(transparent,#000c);color:#fff;font-weight:700;font-size:13px}
#gallery .bc-folder .fn small{display:block;font-weight:400;opacity:.8}
#gallery .bc-ghd{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:4px 0}
#gallery .bc-osub{grid-column:1/-1;display:flex;align-items:center;gap:8px;margin-top:10px;padding:4px 2px;border-bottom:1px solid var(--line,#444)}#gallery .bc-osub b{font-size:14px}#gallery .bc-osub button{margin-left:auto}
#gallery .bc-ghd b{margin:0 6px;font-size:15px}#gallery .bc-ghd button.on{background:var(--accent);color:#000}`;
  document.head.append(css);
  // 대사 색: 그녀 · 여자(분홍) · 남자(파랑) · 당신(초록) — 따옴표 바로 앞 문장이 '…말한다/묻는다'처럼 말하는 문장이면 그 주어로, 아니면 그녀(신음 · 혼잣말)
  const SAY_V = /(말한다|묻는다|되묻는다|중얼거린다|속삭인다|건넨다|웃는다|외친다)\s*[.。]?\s*$/;
  const whoOf = (pre) => {
    const s = (String(pre).split(/[.!?…]\s+/).filter((x) => x.trim()).pop() || "").trim();
    if (!SAY_V.test(s)) return "w";
    if (/^당신/.test(s)) return "y";
    if (/^(그[가는]\s|이분|이이)/.test(s) || /남자(가|는|들이|들은)\s/.test(s)) return "m";   // 주어가 남자 (\"그녀의 입에서 빠져나온 남자가\" 포함)
    if (/^그녀/.test(s)) return "w";
    return "w";
  };
  const sayHTML = (text) => String(text || "").split("\n").map((line) => {
    const m = line.match(/^\[([^\]]+)\]/), rest = m ? line.slice(m[0].length) : line;
    let prev = "";
    const parts = rest.split(/("[^"]*"|『[^』]*』)/).filter(Boolean).map((p) => {
      if (/^"/.test(p)) { const c = "s-" + whoOf(prev); prev = ""; return `<span class="${c}">${esc(p)}</span>`; }
      if (/^『/.test(p)) return `<span class="th">${esc(p)}</span>`;
      prev += p; return `<i>${esc(p)}</i>`;
    }).join("");
    return `<span class="wy">${m ? `<b class="hd">[${esc(m[1])}]</b>` : ""}${parts}</span>`;
  }).join("");
  window.BC_SAY_HTML = sayHTML;
  { const c2 = document.createElement("style"); c2.textContent = ".s-w{color:#ffb3cf;font-weight:600}.s-m{color:#8fc3ff;font-weight:600}.s-y{color:#9fe39a;font-weight:600}.wy{display:block;margin-bottom:3px}.wy i{opacity:.82}"; document.head.append(c2); }

  // ---------- 보기 창 ----------
  let list = [], pos = 0, pure = false;
  const flat = (entries) => entries.flatMap((e) => (e && e.images ? e.images.map((_, i) => ({ e, i })) : []));
  const isNew = (h) => seenAt != null && h.time > seenAt && !seenIds.has(h.id);
  const baseList = () => {
    const q = (($v("#gallerySearch") || {}).value || "").trim().toLowerCase();
    const a = (state.history || []).filter((h) => h.images && h.images.length && !isDead(h) && (!q || ((h.positive || "") + " " + (h.negative || "")).toLowerCase().includes(q)));
    return a.sort((x, y) => (sortBy === "old" ? 1 : -1) * ((x.time || 0) - (y.time || 0)));   // 최신순 / 오래된순
  };
  // 다인 플레이(3인 이상): Hunt 시퀀스 프롬프트의 인원 태그 "(3girls:" · "(2boys:"로 알아냄 · 함께한 그녀들은 BREAK 블록의 외모로 찾음
  const partyCache = new Map();
  const partyOf = (h) => {
    if (partyCache.has(h.id)) return partyCache.get(h.id);
    // 프롬프트 맨 앞의 인원 태그만 봄: "(3girls:1.35), (1boy:" · 예전 형식 "1girl, 3boys,"
    const p = String(h.positive || ""), head = p.slice(0, 90), mg = head.match(/^\(?([2-9])girls\b/), mb = head.match(/\(?([2-9])boys\b/);
    let r = null;
    if (mg || mb) {
      const ng = mg ? +mg[1] : 1, nb = mb ? +mb[1] : /\(?1boy\b/.test(head) ? 1 : 0;
      if (ng + nb > 2) {
        const main = groupOf(h).cn;
        const hc = (window.BC_HUNTSEQ && BC_HUNTSEQ.chars ? BC_HUNTSEQ.chars() : []);
        const extra = ng > 1 ? hc.filter((c) => c.body && p.includes("BREAK 1girl, " + c.body.slice(0, 50))).map((c) => String(c.n).split(" · ")[0]).filter((n) => n !== main) : [];
        const members = [main, ...extra];
        r = { ng, nb, n: ng + nb, comp: `${ng}여 ${nb}남`, key: ng > 1 ? members.join(" · ") : `${main} + 남성 ${nb}명`, members };
      }
    }
    partyCache.set(h.id, r); return r;
  };
  // 상황별 카테고리: 새 그림은 생성할 때 저장한 관계(rel) · 다인 상황(situ) · 지켜봄(watch)으로, 예전 그림은 프롬프트 태그로
  const CATS = [["party", "👥 다인 플레이"], ["cheat", "💍 바람"], ["ntr", "💔 네토라레"], ["ntori", "🔥 네토리"], ["swap", "🔁 스와핑"], ["watch", "👀 지켜보는 남편"], ["bdsm", "⛓ 주종"], ["love", "💗 연애 · 부부"]];
  const catsOf = (h) => {
    const m = map[h.id] || {}, p = String(h.positive || "").toLowerCase(), c = [];
    if (partyOf(h)) c.push("party");
    if (/^(cheat|cheatwatch|affair)$/.test(m.rel || "")) c.push("cheat");
    if (m.situ === "ntr" || (!m.situ && /netorare/.test(p))) c.push("ntr");
    if (m.situ === "ntori" || (!m.situ && /cheating \(relationship\)/.test(p))) c.push("ntori");
    if (m.situ === "swap") c.push("swap");
    if (m.watch || m.rel === "cheatwatch") c.push("watch");
    if (m.rel === "dom" || m.rel === "sub") c.push("bdsm");
    if (/^(interest|some|lover|partner|married)$/.test(m.rel || "")) c.push("love");
    return c;
  };
  const subOf = (h) => {
    const m = map[h.id] || {}, H = window.BC_HUNTSEQ || {}, r = m.rel && H.RELS ? String(H.RELS[m.rel] || "").split(" (")[0] : "", s = m.situ && H.SITUS ? String(H.SITUS[m.situ] || "").split(" (")[0] : "";
    return [r, s, m.ng && m.nb && m.ng + m.nb > 2 ? `${m.ng}여 ${m.nb}남` : "", m.watch ? "남편은 지켜봄" : ""].filter(Boolean).join(" · ");
  };
  const listOf = (m) => { const a = baseList(); return m === "party" ? a.filter((h) => !hidden.has(h.id) && catsOf(h).length) : m === "hidden" ? a.filter((h) => hidden.has(h.id)) : m === "new" ? a.filter((h) => !hidden.has(h.id) && isNew(h)) : a.filter((h) => !hidden.has(h.id)); };   // 새로 만든 그림도 확인 없이 바로 캐릭터 폴더 · 전체에 들어감
  const galleryList = () => listOf(mode);
  function gridList(grid) {
    const bySrc = new Map();
    for (const h of state.history || []) (h.images || []).forEach((im, i) => bySrc.set(imgURL(im), { e: h, i }));
    const out = [];
    grid.querySelectorAll("img").forEach((img) => { const it = img._bc || bySrc.get(img.getAttribute("src")); if (it) out.push(it); });
    return out;
  }
  function stage() {
    const img = $v("#mImg"); if (!img) return null;
    const box = img.parentElement; box.classList.add("bc-stage");
    if (!$v("#bcLine")) {
      const ln = document.createElement("div"); ln.id = "bcLine"; box.append(ln);
      const c = document.createElement("div"); c.id = "bcCount"; box.append(c);
      let x0 = null;
      box.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
      box.addEventListener("pointerup", (e) => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); });
    }
    return box;
  }
  // 보기 창의 그림이 지워진 그림이면 목록에서 빼고 다음 그림으로 (남은 게 없으면 닫음)
  function dropCurrent() {
    if (!list.length) return;
    list.splice(pos, 1);
    if (!list.length) { closeModal(); return; }
    if (pos >= list.length) pos = 0;
    show();
  }
  function step(d) { if (list.length < 2) return; pos = (pos + d + list.length) % list.length; show(); }
  function show() {
    const { e, i } = list[pos];
    modalState = { entry: e, i };
    renderModal();
    const md = $v("#modal");
    md.classList.toggle("bc-pure", pure);
    md.classList.remove("hidden");
    if (!stage()) return;
    const many = list.length > 1;
    $v("#mPrev").style.display = $v("#mNext").style.display = many ? "" : "none";
    $v("#mPrev").onclick = () => step(-1);
    $v("#mNext").onclick = () => step(1);
    const g = groupOf(e);
    const c = $v("#bcCount"); c.textContent = `${g.cn} · ${g.of}  ${pos + 1} / ${list.length}`;
    let hb = $v("#bcHide"); if (!hb) { hb = document.createElement("button"); hb.id = "bcHide"; hb.type = "button"; $v("#bcCount").after(hb); }
    hb.textContent = hidden.has(e.id) ? "↩ 다시 보이기" : "🙈 숨기기";
    hb.onclick = (ev) => { ev.stopPropagation(); const cur = list[pos].e; if (hidden.has(cur.id)) hidden.delete(cur.id); else hidden.add(cur.id); saveHidden(); dropCurrent(); try { renderGallery(); } catch {} };
    const L = map[e.id], ln = $v("#bcLine");
    const t = (L && L.t) || guessLine(e), nm = (L && L.n) || (g.cn !== "기타" ? g.cn : "");
    // 갤러리 전체화면: 대사는 그림을 가리지 않게 옆 패널(오른쪽 · 왼쪽, 기억됨) — 그림은 남은 자리에 맞춰 줄어듦 · 좁은 창에서는 그림 아래 패널
    const pside = lsGet("bc_linepos_pure", "right") === "left" ? "left" : "right";
    const narrow = window.innerWidth < 760;
    const sd = pure ? (narrow ? "sideB" : pside === "left" ? "sideL" : "sideR") : side;
    ln.className = t ? sd : "hidden";
    { const md = $v("#modal"); if (md) { md.classList.toggle("bc-lr", !!(pure && t && sd === "sideR")); md.classList.toggle("bc-ll", !!(pure && t && sd === "sideL")); md.classList.toggle("bc-lb", !!(pure && t && sd === "sideB")); } }
    const body = sayHTML(t);
    ln.innerHTML = t ? `${nm ? `<span class="nm">${esc(nm)}</span>` : ""}${body}${pure ? (narrow ? "" : `<button type="button" class="sw" title="대사 패널 위치 바꾸기">${pside === "left" ? "◨ 오른쪽으로" : "◧ 왼쪽으로"}</button>`) : `<button type="button" class="sw" title="대사창 위치 바꾸기">${side === "left" ? "⬓ 아래로" : "◧ 왼쪽으로"}</button>`}` : "";
    // 아직 그림 태그로 맞추지 않은 대사면 지금 태거로 읽고 바꿔 끼움 (한 번 읽으면 저장)
    if (window.BC_LINE_TAG && BC_LINE_TAG.enabled() && !(L && L.vt) && e.images && e.images[i]) {
      const want = e.id, hh = (window.BC_HUNT_CHARS || []).find((c) => c.id === g.cid);
      BC_LINE_TAG.lineFor(e.id, e.images[i], { base: t, sid: L && L.sid, sp: (L && L.sp) || (hh && hh.speech) || GHOST_SPEECH[g.cid] || "polite", n: nm, positive: e.positive }).then((nt) => {
        if (nt && list[pos] && list[pos].e.id === want) show();
      });
    }
    const sw = $v(".sw", ln);
    if (sw) sw.onclick = (ev) => { ev.stopPropagation(); if (pure) lsSet("bc_linepos_pure", pside === "left" ? "right" : "left"); else { side = side === "left" ? "bottom" : "left"; lsSet(POS, side); } show(); };
  }
  window.BC_VIEW = (items, startEntry, startI = 0, opt = {}) => {
    pure = !!opt.pure;
    // 넘겨 보기 범위: 같은 캐릭터 · 같은 복장 (캐릭터 폴더 '전체'에서 열면 그 캐릭터 그림 전부)
    list = opt.allChar ? items.filter((x) => groupOf(x.e).cid === groupOf(startEntry).cid) : items.filter((x) => same(x.e, startEntry));
    pos = list.findIndex((x) => x.e === startEntry || (x.e.id === startEntry.id && x.i === startI));
    if (pos < 0) { list.unshift({ e: startEntry, i: startI }); pos = 0; }
    show();
  };
  const _close = closeModal;
  closeModal = function () { $v("#modal").classList.remove("bc-pure"); return _close(); };
  window.openModal = function (entry, i) {
    i = i || 0;
    const grid = lastClick && lastClick.closest && lastClick.closest(".seq-grid");
    const inGal = !!(lastClick && lastClick.closest && lastClick.closest("#gallery"));
    const items = grid ? gridList(grid) : flat(galleryList());
    BC_VIEW(items, entry, i, { pure: inGal });
  };

  // ---------- 갤러리: 새로 생성 / 캐릭터 폴더 / 전체 / 숨긴 그림 ----------
  //  - 새로 생성: 마지막으로 '확인'한 뒤 만든 그림만 따로 모아 봄. 폴더 · 전체에는 확인 없이 바로 들어감
  //  - 그림마다(마우스를 올리면) 🙈 숨기기 · 폴더/복장 묶음째 숨기기 · 숨긴 그림에서 다시 보이기
  const MODES = [["new", "🆕 새로 생성"], ["folder", "캐릭터 폴더"], ["party", "🎭 상황별"], ["all", "전체"], ["hidden", "🙈 숨긴 그림"]];
  let curCat = lsGet("bc_gal_cat", "party");   // 상황별 카테고리
  let curP = lsGet("bc_gal_party", "all");   // 다인 플레이: 인원수 탭 (all | 3 | 4 | 5 …)
  function bar() {
    const tb = $v("#tab-gallery .toolbar"); if (!tb) return;
    let w = $v(".bc-galmode", tb);
    if (!w) {
      w = document.createElement("span"); w.className = "bc-galmode"; tb.insertBefore(w, tb.firstChild);
      w.onclick = (e) => { const b = e.target.closest("button[data-m]"); if (!b) return; mode = b.dataset.m; lsSet(MODE, mode); curC = curO = null; renderGallery(); };
    }
    const nNew = listOf("new").length, nHid = listOf("hidden").length;
    w.innerHTML = MODES.map(([m, n]) => `<button type="button" data-m="${m}" class="${m === mode ? "on" : ""}${m === "new" && nNew ? " has" : ""}">${n}${m === "new" ? `<span class="n">${nNew}</span>` : m === "hidden" && nHid ? `<span class="n">${nHid}</span>` : ""}</button>`).join("");
    // 정렬: 최신순 / 오래된순 (기억됨)
    let so = $v(".bc-galsort", tb);
    if (!so) {
      so = document.createElement("span"); so.className = "bc-galmode bc-galsort"; w.after(so);
      so.onclick = (e) => { const b = e.target.closest("button[data-s]"); if (!b || b.dataset.s === sortBy) return; sortBy = b.dataset.s; lsSet(SORT, sortBy); renderGallery(); };
    }
    so.innerHTML = [["new", "↓ 최신순"], ["old", "↑ 오래된순"]].map(([k, n]) => `<button type="button" data-s="${k}" class="${k === sortBy ? "on" : ""}">${n}</button>`).join("");
  }
  const thumb = (h, extra) => `<img loading="lazy" src="${imgURL(h.images[0])}" alt="">${extra || ""}`;
  const hideIds = (ids, on) => { for (const id of ids) on ? hidden.add(id) : hidden.delete(id); saveHidden(); renderGallery(); };
  function tile(h, items) {
    const el = document.createElement("div"); el.className = "g-item" + (selIds.has(h.id) ? " bc-sel" : ""); el.dataset.id = h.id;
    const L = map[h.id];
    const btns = mode === "hidden" ? `<button type="button" class="bc-x" data-a="show">↩ 다시 보이기</button>`
      : `<button type="button" class="bc-x" data-a="hide" title="갤러리에서 가리기 (파일은 그대로)">🙈 숨기기</button>${mode === "new" ? `<button type="button" class="bc-x" data-a="seen" title="확인함 — 새로 생성 목록에서 뺌 (폴더에는 이미 들어가 있음)">✓ 확인</button>` : ""}`;
    el.innerHTML = thumb(h, `${h.images.length > 1 ? `<span class="badge">${h.images.length}</span>` : ""}<div class="meta">${esc(L && L.t ? L.t : new Date(h.time * 1000).toLocaleString())}</div>${btns}`);
    el.onclick = (ev) => {
      const b = ev.target.closest(".bc-x");
      if (b) { ev.stopPropagation(); if (b.dataset.a === "seen") { seenIds.add(h.id); saveSeen(); renderGallery(); } else hideIds([h.id], b.dataset.a === "hide"); return; }
      if (Date.now() < noClickUntil) return;   // 드래그 선택 직후의 클릭은 무시
      if (ev.ctrlKey || ev.metaKey || ev.shiftKey || selIds.size) { toggleSel(h.id, el); return; }
      BC_VIEW(flat(items), h, 0, { pure: true, allChar: mode === "folder" && galAll });
    };
    return el;
  }
  // ---------- 선택 · 우클릭 메뉴 · 삭제 ----------
  //  그림 칸을 드래그해 사각형으로 여러 장 선택 (Ctrl/Shift 누르고 드래그 = 더하기) · Ctrl/Shift+클릭 = 한 장씩 · 선택 중엔 클릭 = 토글
  //  우클릭 = 메뉴(삭제 · 숨기기 · 폴더로 · 다시 보이기) · Delete 키 = 선택 삭제 · Esc = 선택 해제 · Ctrl+A = 지금 보이는 그림 전부
  //  삭제 = Ghost '기록 삭제'와 같음: 갤러리 기록 + 앱 데이터 폴더 복사본을 지우고, ComfyUI 출력 폴더 원본은 남김
  const selIds = new Set();
  let noClickUntil = 0;
  const byId = (id) => (state.history || []).find((h) => h.id === id);
  function selBar() {
    let b = $v("#bcSelBar");
    if (!selIds.size) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement("div"); b.id = "bcSelBar"; document.body.append(b); b.onclick = (e) => { const x = e.target.closest("button[data-a]"); if (x) act(x.dataset.a, [...selIds]); }; }
    b.innerHTML = `<b>${selIds.size}장 선택</b>${mode === "hidden" ? `<button type="button" data-a="show">↩ 다시 보이기</button>` : `<button type="button" data-a="hide">🙈 숨기기</button>`}${mode === "new" ? `<button type="button" data-a="seen">✓ 확인</button>` : ""}<button type="button" data-a="rewrite">✍ 대사 다시 쓰기</button><button type="button" data-a="del" class="danger">🗑 삭제</button><button type="button" data-a="clear">선택 해제</button>`;
  }
  const paintSel = () => { document.querySelectorAll("#gallery .g-item[data-id]").forEach((el) => el.classList.toggle("bc-sel", selIds.has(el.dataset.id))); selBar(); };
  const toggleSel = (id, el) => { if (selIds.has(id)) selIds.delete(id); else selIds.add(id); if (el) el.classList.toggle("bc-sel", selIds.has(id)); selBar(); };
  const clearSel = () => { selIds.clear(); paintSel(); };
  // 대사 다시 쓰기 (Wayward 방식 · 캐릭터 말투 · 프롬프트에서 장면을 읽음) · 이전 대사로 되돌리기
  function rewriteIds(ids, undo) {
    let n = 0;
    for (const id of ids) {
      const h = byId(id); if (!h) continue;
      if (undo) { const m = map[id]; if (m && m.prev) { BC_LINE.set(id, { ...m, t: m.prev, base: m.prev, prev: m.t, vt: 0 }, true); n++; } continue; }
      if (window.BC_HUNTSEQ && BC_HUNTSEQ.rewrite && BC_HUNTSEQ.rewrite(h, "wayward", true)) n++;
    }
    BC_LINE.save();
    return n;
  }
  window.BC_REWRITE = rewriteIds;
  async function delIds(ids) {
    const es = ids.map(byId).filter(Boolean); if (!es.length) return;
    if (!confirm(`${es.length}장을 삭제할까요?\n갤러리 기록과 앱 데이터 폴더(BooruComfy_data\\images)의 사본이 지워져요.\nComfyUI 출력 폴더의 원본은 남아요. 되돌릴 수 없어요.`)) return;
    let ok = 0;
    for (const h of es) { try { await api("/api/history?id=" + encodeURIComponent(h.id), { method: "DELETE" }); ok++; state.history = state.history.filter((x) => x.id !== h.id); selIds.delete(h.id); } catch {} }
    toast(ok === es.length ? `${ok}장을 삭제했어요` : `${ok}/${es.length}장 삭제 (나머지는 실패)`, ok ? "ok" : "err");
    renderGallery();
  }
  function act(a, ids) {
    if (a === "clear") return clearSel();
    if (a === "del") return delIds(ids);
    if (a === "seen") { ids.forEach((id) => seenIds.add(id)); saveSeen(); }
    if (a === "hide" || a === "show") { for (const id of ids) a === "hide" ? hidden.add(id) : hidden.delete(id); saveHidden(); }
    if (a === "open") { const h = byId(ids[0]); if (h) window.open(imgURL(h.images[0]), "_blank"); return; }
    if (a === "rewrite" || a === "undo") { const n = rewriteIds(ids, a === "undo"); toast(a === "undo" ? `${n}장 대사를 이전 대사로 되돌렸어요` : `${n}장 대사를 Wayward 방식으로 다시 썼어요`, "ok"); renderGallery(); return; }
    ids.forEach((id) => selIds.delete(id)); renderGallery();
  }
  // 우클릭 메뉴
  function menu(x, y, items) {
    closeMenu();
    const m = document.createElement("div"); m.id = "bcMenu";
    m.innerHTML = items.map(([a, n, cls]) => (a === "-" ? `<hr>` : `<button type="button" data-a="${a}" class="${cls || ""}">${n}</button>`)).join("");
    document.body.append(m);
    const w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = Math.min(x, innerWidth - w - 6) + "px"; m.style.top = Math.min(y, innerHeight - h - 6) + "px";
    return m;
  }
  const closeMenu = () => { const m = $v("#bcMenu"); if (m) m.remove(); };
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#bcMenu")) closeMenu(); }, true);
  document.addEventListener("contextmenu", (e) => {
    const g = e.target.closest("#gallery"); if (!g) return;
    const tileEl = e.target.closest(".g-item[data-id]"), folder = e.target.closest(".g-item.bc-folder");
    if (!tileEl && !folder) return;
    e.preventDefault();
    if (folder) {
      const items = folder._items || [], ids = items.map((h) => h.id), name = (folder.querySelector(".fn") || {}).firstChild ? folder.querySelector(".fn").firstChild.textContent.replace("📁 ", "") : "";
      const m = menu(e.clientX, e.clientY, [["open", "📂 폴더 열기"], ["hide", `🙈 폴더 숨기기 (${ids.length}장)`], ["rewrite", `✍ 폴더 대사 모두 다시 쓰기 (${ids.length}장)`], ["-"], ["del", `🗑 폴더 그림 모두 삭제 (${ids.length}장)`, "danger"]]);
      m.onclick = (ev) => { const b = ev.target.closest("button[data-a]"); if (!b) return; closeMenu(); if (b.dataset.a === "open") folder.click(); else if (b.dataset.a === "hide") { ids.forEach((id) => hidden.add(id)); saveHidden(); renderGallery(); } else if (b.dataset.a === "rewrite") act("rewrite", ids); else delIds(ids); };
      void name; return;
    }
    const id = tileEl.dataset.id;
    if (!selIds.has(id)) { selIds.clear(); selIds.add(id); paintSel(); }
    const ids = [...selIds], n = ids.length;
    const items = [];
    if (n === 1) items.push(["view", "🔍 크게 보기"], ["open", "↗ 새 탭에서 열기"], ["-"]);
    if (mode === "hidden") items.push(["show", `↩ 다시 보이기${n > 1 ? ` (${n}장)` : ""}`]); else items.push(["hide", `🙈 숨기기${n > 1 ? ` (${n}장)` : ""}`]);
    if (mode === "new") items.push(["seen", `✓ 확인${n > 1 ? ` (${n}장)` : ""}`]);
    items.push(["rewrite", `✍ 대사 다시 쓰기${n > 1 ? ` (${n}장)` : ""}`]);
    if (ids.some((x) => map[x] && map[x].prev)) items.push(["undo", "↩ 이전 대사로"]);
    items.push(["-"], ["del", `🗑 삭제${n > 1 ? ` (${n}장)` : ""}`, "danger"], ["clear", "선택 해제"]);
    const m = menu(e.clientX, e.clientY, items);
    m.onclick = (ev) => { const b = ev.target.closest("button[data-a]"); if (!b) return; closeMenu(); if (b.dataset.a === "view") { selIds.clear(); paintSel(); tileEl.click(); } else act(b.dataset.a, ids); };
  });
  // 드래그 사각형 선택 (그림 위에서 시작해도 브라우저 기본 '그림 끌어 옮기기'가 끼어들지 않게 막음)
  document.addEventListener("dragstart", (e) => { if (e.target.closest && e.target.closest("#gallery")) e.preventDefault(); }, true);
  //  - 사각형은 스크롤 기준 좌표로 잡음 → 드래그 중에 휠로 스크롤해도 처음 잡은 그림이 풀리지 않음
  //  - 커서가 갤러리 위 · 아래 끝(60px)에 닿으면 저절로 스크롤 (끝에 가까울수록 빠르게)
  //  - 스크롤바를 끌 때는 드래그 선택으로 보지 않음
  let drag = null;
  const scrollerOf = (el) => { for (let x = el; x && x !== document.body && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (/(auto|scroll)/.test(cs.overflowY) && x.scrollHeight > x.clientHeight + 1) return x; } return document.scrollingElement || document.documentElement; };
  const viewOf = (s) => { const doc = s === document.scrollingElement || s === document.documentElement; const r = doc ? { top: 0, bottom: innerHeight } : s.getBoundingClientRect(); return { top: Math.max(0, r.top), bottom: Math.min(innerHeight, r.bottom), top0: doc ? 0 : r.top }; };
  function bandUpdate() {
    if (!drag || !drag.box) return;
    const s = drag.s, v = viewOf(s);
    const curY = drag.cy - v.top0 + s.scrollTop;   // 지금 커서의 스크롤 기준 y
    const yA = Math.min(drag.y0, curY), yB = Math.max(drag.y0, curY), L = Math.min(drag.x, drag.cx), R = Math.max(drag.x, drag.cx);
    const T = Math.max(v.top, yA - s.scrollTop + v.top0), B = Math.min(v.bottom, yB - s.scrollTop + v.top0);
    Object.assign(drag.box.style, { left: L + "px", top: T + "px", width: R - L + "px", height: Math.max(0, B - T) + "px", display: B > T ? "" : "none" });
    selIds.clear(); if (drag.add) drag.base.forEach((id) => selIds.add(id));
    document.querySelectorAll("#gallery .g-item[data-id]").forEach((el) => {
      if (el.style.display === "none") return;
      const r = el.getBoundingClientRect(), top = r.top - v.top0 + s.scrollTop, bot = r.bottom - v.top0 + s.scrollTop;
      if (r.right > L && r.left < R && bot > yA && top < yB) selIds.add(el.dataset.id);
    });
    paintSel();
  }
  function autoScroll() {
    if (!drag || !drag.box) return;
    const s = drag.s, v = viewOf(s), Z = 60;
    let d = 0;
    if (drag.cy < v.top + Z) d = -Math.ceil(((v.top + Z - drag.cy) / Z) * 22);
    else if (drag.cy > v.bottom - Z) d = Math.ceil(((drag.cy - (v.bottom - Z)) / Z) * 22);
    if (d) { const before = s.scrollTop; s.scrollTop += d; if (s.scrollTop !== before) bandUpdate(); }
    drag.raf = requestAnimationFrame(autoScroll);
  }
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const g = e.target.closest("#gallery"); if (!g || e.target.closest(".bc-x, .bc-ghd, button")) return;
    const t = e.target; if (t.clientWidth && (e.offsetX >= t.clientWidth || e.offsetY >= t.clientHeight)) return;   // 스크롤바
    const s = scrollerOf(g), v = viewOf(s);
    drag = { x: e.clientX, y0: e.clientY - v.top0 + s.scrollTop, cx: e.clientX, cy: e.clientY, s, add: e.ctrlKey || e.metaKey || e.shiftKey, base: new Set(selIds), box: null, raf: 0 };
  });
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    drag.cx = e.clientX; drag.cy = e.clientY;
    if (!drag.box) {
      const v = viewOf(drag.s), sy = drag.y0 - drag.s.scrollTop + v.top0;
      if (Math.hypot(e.clientX - drag.x, e.clientY - sy) < 8) return;
      drag.box = document.createElement("div"); drag.box.id = "bcBand"; document.body.append(drag.box);
      drag.raf = requestAnimationFrame(autoScroll);
    }
    e.preventDefault();
    bandUpdate();
  });
  // 드래그 중 휠 스크롤도 사각형에 반영
  document.addEventListener("scroll", () => { if (drag && drag.box) bandUpdate(); }, true);
  const endDrag = () => {
    if (!drag) return;
    if (drag.box) { drag.box.remove(); noClickUntil = Date.now() + 250; }
    cancelAnimationFrame(drag.raf);
    drag = null;
  };
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
  document.addEventListener("keydown", (e) => {
    const gt = $v("#tab-gallery"); if (!gt || !gt.classList.contains("active") || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || "")) || !$v("#modal").classList.contains("hidden")) return;
    if (e.key === "Escape" && selIds.size) { clearSel(); closeMenu(); }
    else if (e.key === "Delete" && selIds.size) { e.preventDefault(); delIds([...selIds]); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") { e.preventDefault(); document.querySelectorAll("#gallery .g-item[data-id]").forEach((el) => { if (el.style.display !== "none") selIds.add(el.dataset.id); }); paintSel(); }
  });
  // 보기 창 그림 우클릭: 숨기기 · 삭제
  document.addEventListener("contextmenu", (e) => {
    if (e.target.id !== "mImg" || !list.length) return;
    e.preventDefault();
    const cur = list[pos] && list[pos].e; if (!cur) return;
    const m = menu(e.clientX, e.clientY, [["rewrite", "✍ 대사 다시 쓰기"], ...(map[cur.id] && map[cur.id].prev ? [["undo", "↩ 이전 대사로"]] : []), [hidden.has(cur.id) ? "show" : "hide", hidden.has(cur.id) ? "↩ 다시 보이기" : "🙈 숨기기"], ["-"], ["del", "🗑 삭제", "danger"]]);
    m.onclick = async (ev) => {
      const b = ev.target.closest("button[data-a]"); if (!b) return; closeMenu();
      if (b.dataset.a === "rewrite" || b.dataset.a === "undo") { rewriteIds([cur.id], b.dataset.a === "undo"); show(); return; }
      if (b.dataset.a === "del") { const before = state.history.length; await delIds([cur.id]); if (state.history.length < before) dropCurrent(); }
      else { if (b.dataset.a === "hide") hidden.add(cur.id); else hidden.delete(cur.id); saveHidden(); dropCurrent(); renderGallery(); }
    };
  });
  const _rg = renderGallery;
  renderGallery = function () {
    if (seenAt == null && (state.history || []).length) { seenAt = Math.max(...state.history.map((h) => h.time || 0)); saveSeen(); }   // 처음 쓸 때: 지금까지 만든 건 모두 '확인함'
    bar();
    setTimeout(checkAll, 1500);
    setTimeout(() => { const have = new Set(listOf(mode).map((h) => h.id)); [...selIds].forEach((id) => { if (!have.has(id)) selIds.delete(id); }); paintSel(); }, 0);
    const g = $v("#gallery"); if (!g) return _rg();
    g.innerHTML = "";
    const all = listOf(mode);
    const hd = (html) => { const d = document.createElement("div"); d.className = "bc-ghd"; d.innerHTML = html; g.append(d); return d; };
    // 상황별: 다인 플레이(인원수 탭 → 엮은 캐릭터들) · 바람 · 네토라레 · 네토리 · 스와핑 · 지켜보는 남편 · 주종 · 연애 (캐릭터별 묶음)
    if (mode === "party") {
      const byCat = new Map(); for (const h of all) for (const c of catsOf(h)) { if (!byCat.has(c)) byCat.set(c, []); byCat.get(c).push(h); }
      if (!byCat.has(curCat)) curCat = (CATS.find(([k]) => byCat.has(k)) || ["party"])[0];
      const d0 = hd(all.length ? `<b>🎭 상황별</b>` + CATS.filter(([k]) => byCat.has(k)).map(([k, n]) => `<button type="button" class="mini${k === curCat ? " on" : ""}" data-c="${k}">${n} (${byCat.get(k).length})</button>`).join("")
        : `<span class="muted">상황별로 모을 그림이 없어요. Hunt 시퀀스에서 관계(바람 · 주종 등) · 다인 상황(네토라레 · 스와핑 등) · 인원 구성을 고르면 여기에 나뉘어 모여요.</span>`);
      d0.onclick = (e) => { const b = e.target.closest("button[data-c]"); if (!b) return; curCat = b.dataset.c; lsSet("bc_gal_cat", curCat); renderGallery(); };
      const inCat = byCat.get(curCat) || [];
      let groups = [];
      if (curCat === "party") {
        const byN = new Map(); for (const h of inCat) { const n = partyOf(h).n; byN.set(n, (byN.get(n) || 0) + 1); }
        const ns = [...byN.keys()].sort((a, b) => a - b);
        if (curP !== "all" && !byN.has(+curP)) curP = "all";
        const d = hd(`<span class="muted">인원수</span><button type="button" class="mini${curP === "all" ? " on" : ""}" data-p="all">전체 (${inCat.length})</button>` + ns.map((n) => `<button type="button" class="mini${String(n) === String(curP) ? " on" : ""}" data-p="${n}">${n}인 (${byN.get(n)})</button>`).join(""));
        d.onclick = (e) => { const b = e.target.closest("button[data-p]"); if (!b) return; curP = b.dataset.p; lsSet("bc_gal_party", curP); renderGallery(); };
        const items = curP === "all" ? inCat : inCat.filter((h) => partyOf(h).n === +curP);
        const gm = new Map();
        for (const h of items) { const p = partyOf(h), k = `${p.n}|${p.key}`; if (!gm.has(k)) gm.set(k, { title: p.key, sub: p.n + "인", sortN: p.n, a: [] }); gm.get(k).a.push(h); }
        groups = [...gm.values()].sort((x, y) => x.sortN - y.sortN || y.a.length - x.a.length);
      } else {
        // 캐릭터별 묶음 · 소제목에 관계 · 상황 이름
        const gm = new Map();
        for (const h of inCat) { const cn = groupOf(h).cn; if (!gm.has(cn)) gm.set(cn, { title: cn, a: [] }); gm.get(cn).a.push(h); }
        groups = [...gm.values()].sort((x, y) => (x.title === "기타") - (y.title === "기타") || y.a.length - x.a.length);
        for (const x of groups) x.sub = [...new Set(x.a.map(subOf).filter(Boolean))].join(" · ");
      }
      const shown = groups.reduce((s, x) => s + x.a.length, 0);
      $v("#galleryCount").textContent = `${(CATS.find(([k]) => k === curCat) || ["", ""])[1]} ${shown}개`;
      const order = groups.flatMap((x) => x.a);   // 보기 창에서 넘기는 순서 = 화면 순서
      let n = 0;
      for (const x of groups) {
        if (n >= 1200) break;
        const sh = document.createElement("div"); sh.className = "bc-osub";
        sh.innerHTML = `<b>${esc(x.title)}</b><span class="muted">${x.sub ? esc(x.sub) + " · " : ""}${x.a.length}개</span><button type="button" class="mini" data-hide="1">🙈 이 묶음 숨기기</button>`;
        sh.querySelector("button").onclick = () => { if (confirm(`'${x.title}' ${x.a.length}개를 갤러리에서 가릴까요? (파일은 그대로)`)) hideIds(x.a.map((h) => h.id), true); };
        g.append(sh);
        for (const h of x.a.slice(0, 1200 - n)) { g.append(tile(h, order)); n++; }
      }
      return;
    }
    if (mode !== "folder") {
      $v("#galleryCount").textContent = `${all.length}개`;
      if (mode === "new") {
        const d = hd(all.length ? `<b>🆕 새로 생성 ${all.length}개</b><button type="button" class="mini" data-a="seenAll">✓ 모두 확인</button><button type="button" class="mini" data-a="hideAll">🙈 모두 숨기기</button>` : `<span class="muted">새로 생성된 그림이 없어요. 새로 만든 그림은 바로 캐릭터 폴더에 들어가고, 여기에는 최근 것만 따로 모여요 (확인하면 여기서만 빠짐).</span>`);
        d.onclick = (e) => { const b = e.target.closest("button[data-a]"); if (!b) return; if (b.dataset.a === "seenAll") { seenAt = Math.max(seenAt || 0, ...all.map((h) => h.time || 0)); saveSeen(); renderGallery(); } else hideIds(all.map((h) => h.id), true); };
      } else if (mode === "hidden") {
        const d = hd(all.length ? `<b>🙈 숨긴 그림 ${all.length}개</b><span class="muted">갤러리에서만 가린 것 — 파일은 그대로예요</span><button type="button" class="mini" data-a="showAll">↩ 전부 다시 보이기</button>` : `<span class="muted">숨긴 그림이 없어요. 그림에 마우스를 올리면 🙈 숨기기 버튼이 나와요.</span>`);
        d.onclick = (e) => { if (e.target.closest("button[data-a]")) hideIds(all.map((h) => h.id), false); };
      }
      for (const h of all.slice(0, 800)) g.append(tile(h, all));
      return;
    }
    const folders = new Map();
    for (const h of all) { const x = groupOf(h); if (!folders.has(x.cid)) folders.set(x.cid, { cn: x.cn, items: [] }); folders.get(x.cid).items.push(h); }
    if (curC && !folders.has(curC)) curC = null;
    if (!curC) {
      $v("#galleryCount").textContent = `캐릭터 ${folders.size}명 · ${all.length}개`;
      if (!folders.size) { g.innerHTML = '<div class="empty">기록이 없습니다</div>'; return; }
      const sorted = [...folders.entries()].sort((a, b) => (a[1].cn === "기타") - (b[1].cn === "기타") || b[1].items.length - a[1].items.length);
      for (const [cid, f] of sorted) {
        const outs = new Set(f.items.map((h) => groupOf(h).of));
        const el = document.createElement("div"); el.className = "g-item bc-folder"; el.dataset.cid = cid; el._items = f.items;
        el.innerHTML = thumb(f.items[0], `<div class="fn">📁 ${esc(f.cn)}<small>${f.items.length}개 · 복장 ${outs.size}가지</small></div><button type="button" class="bc-x" title="이 캐릭터 폴더 그림을 모두 가리기">🙈 폴더 숨기기</button>`);
        let ti = 0;   // 폴더 표지 그림이 지워졌으면 다음 그림으로 (다 없으면 폴더 숨김)
        el._next = () => { ti++; const h2 = f.items[ti]; const im = el.querySelector("img"); if (h2 && im) im.src = imgURL(h2.images[0]); else el.style.display = "none"; };
        el.onclick = (ev) => {
          if (ev.target.closest(".bc-x")) { ev.stopPropagation(); if (confirm(`'${f.cn}' 폴더의 그림 ${f.items.length}개를 갤러리에서 가릴까요?\n(파일은 그대로 · '숨긴 그림'에서 다시 보이게 할 수 있어요)`)) hideIds(f.items.map((h) => h.id), true); return; }
          if (Date.now() < noClickUntil) return;
          curC = cid; curO = null; renderGallery();
        };
        g.append(el);
      }
      return;
    }
    const f = folders.get(curC), byO = new Map();
    for (const h of f.items) { const o = groupOf(h).of; if (!byO.has(o)) byO.set(o, []); byO.get(o).push(h); }
    const outs = [...byO.entries()].sort((a, b) => b[1].length - a[1].length);
    // 폴더 안: '전체'(그 캐릭터 그림 전부 · 복장별 소제목으로 나눠 보여 줌) + 복장별 묶음
    if (!curO || (curO !== ALL_O && !byO.has(curO))) curO = ALL_O;
    const isAll = curO === ALL_O, items = isAll ? f.items : byO.get(curO);
    galAll = isAll;
    $v("#galleryCount").textContent = `${f.cn} · ${isAll ? "전체" : curO} ${items.length}개`;
    const d = hd(`<button type="button" class="mini" data-back="1">← 폴더 목록</button><b>📁 ${esc(f.cn)}</b>`
      + `<button type="button" class="mini${isAll ? " on" : ""}" data-o="${ALL_O}">📂 전체 (${f.items.length})</button>`
      + outs.map(([o, a]) => `<button type="button" class="mini${o === curO ? " on" : ""}" data-o="${esc(o)}">${esc(o)} (${a.length})</button>`).join("")
      + `<button type="button" class="mini" data-hideo="1" title="${isAll ? "이 캐릭터 그림을 모두 가리기" : "지금 보는 복장 묶음을 모두 가리기"}">🙈 ${isAll ? "폴더 전체 숨기기" : "이 복장 숨기기"}</button>`);
    d.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.hideo) { if (confirm(`'${isAll ? f.cn + " 전체" : curO}' ${items.length}개를 갤러리에서 가릴까요? (파일은 그대로)`)) hideIds(items.map((h) => h.id), true); return; }
      if (b.dataset.back) curC = null; else curO = b.dataset.o; renderGallery();
    };
    if (isAll) {
      let n = 0;
      const order = outs.flatMap(([, a]) => a);   // 보기 창에서 넘기는 순서 = 화면에 보이는 순서
      for (const [o, a] of outs) {
        if (n >= 1200) break;
        const sh = document.createElement("div"); sh.className = "bc-osub";
        sh.innerHTML = `<b>${esc(o)}</b><span class="muted">${a.length}개</span><button type="button" class="mini" data-o="${esc(o)}">이 복장만 보기 →</button>`;
        sh.querySelector("button").onclick = () => { curO = o; renderGallery(); };
        g.append(sh);
        for (const h of a.slice(0, 1200 - n)) { g.append(tile(h, order)); n++; }
      }
      return;
    }
    for (const h of items.slice(0, 800)) g.append(tile(h, items));
  };
  // 새 그림이 생기면 (갤러리를 보고 있을 때) 목록 · 개수 다시 그림
  let lastN = 0;
  setInterval(() => { const n = (state.history || []).length; if (n !== lastN) { lastN = n; const gt = document.querySelector("#tab-gallery"); if (gt && gt.classList.contains("active")) renderGallery(); else bar(); } }, 3000);
  window.BC_GAL = { hidden, isNew, listOf, get seenAt() { return seenAt; } };
  bar();
})();
