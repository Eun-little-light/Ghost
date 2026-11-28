// Hunt 시퀀스 생성 대기열을 '장면 카드'로 (대사판)
//  카드 한 장 = 장면 묶음 하나: 만남(데이트 · 영상통화) / 애무(키스 ~ 삽입 전) / 체위마다(삽입 직전 · 체위 1 · 2 · 애태우기 · 절정) / 마무리(여운 · 사정 · 뒷정리)
//  카드 안에는 그 묶음의 그림과 대사가 모두 들어감 (많으면 카드 안에서만 스크롤)
//  카드들은 겹쳐 쌓이고 ◀ ▶ / ← → 키 / 옆으로 밀기 / 뒤 카드 누르기로 넘김 · '최신 따라가기' · '펼쳐 보기'
(() => {
  const grid = document.querySelector("#hsGrid"); if (!grid) return;
  const KEY = "hseq_deck";
  let stacked = (() => { try { return localStorage.getItem(KEY) !== "grid"; } catch { return true; } })();
  let follow = true, idx = 0;
  const css = document.createElement("style");
  css.textContent = `#hsDeckBar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:6px 0}#hsDeckBar .sp{flex:1}#hsDeckBar .ct{font-weight:700}#hsDeckBar .tt{opacity:.85}#hsDeckBar button.on{background:var(--accent);color:#000}
#hsGrid.cards{position:relative;display:block!important;height:max(460px,calc(100vh - 200px));overflow:hidden;touch-action:pan-y}
body:has(#tab-hseq.active) main{max-width:none}
@media (min-width:1000px){#tab-hseq .seq-layout{grid-template-columns:minmax(360px,1fr) minmax(0,2.1fr)}#tab-hseq .seq-layout>.card:last-child{position:sticky;top:8px}}
@media (min-width:1700px){#hsGrid .hs-card .cd-in{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}}
#hsGrid.cards.flat{height:auto;overflow:visible}
#hsGrid.cards>h4,#hsGrid.cards>h5{display:none}
#hsGrid .hs-card{position:absolute;left:50%;top:6px;width:calc(100% - 90px);height:calc(100% - 40px);display:flex;flex-direction:column;background:var(--panel,#1b1b20);border:1px solid var(--line,#444);border-radius:14px;box-shadow:0 12px 32px #000a;transition:transform .34s cubic-bezier(.2,.8,.2,1),opacity .34s,filter .34s;transform-origin:50% 80%}
#hsGrid .hs-card .cd-hd{display:flex;align-items:baseline;gap:8px;padding:9px 14px;border-bottom:1px solid var(--line,#444)}#hsGrid .hs-card .cd-hd b{font-size:15px}#hsGrid .hs-card .cd-hd small{opacity:.7}#hsGrid .hs-card .cd-hd .gp{margin-left:auto;opacity:.7;font-size:12px}
#hsGrid .hs-card .cd-in{flex:1;overflow:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px;align-content:start}
#hsGrid .hs-card .cd-in>.hs-slot{margin:0}#hsGrid .hs-card .cd-in>.hs-slot .im img{object-fit:contain;background:#000}
#hsGrid .hs-card.back{cursor:pointer}#hsGrid .hs-card.back .cd-in{overflow:hidden;pointer-events:none}#hsGrid .hs-card.far{opacity:0!important;pointer-events:none}
#hsGrid.cards.flat .hs-card{position:relative;left:auto;top:auto;width:auto;height:auto;margin-bottom:14px;transform:none!important;opacity:1!important;filter:none!important;box-shadow:none}#hsGrid.cards.flat .hs-card .cd-in{overflow:visible}`;
  document.head.append(css);
  const bar = document.createElement("div"); bar.id = "hsDeckBar";
  bar.innerHTML = `<button type="button" class="mini" data-a="prev" title="이전 카드 (←)">◀</button><span class="ct"></span><button type="button" class="mini" data-a="next" title="다음 카드 (→)">▶</button><span class="tt"></span><span class="sp"></span><button type="button" class="mini" data-a="follow" title="방금 완성된 장이 든 카드를 앞으로">최신 따라가기</button><button type="button" class="mini" data-a="mode"></button>`;
  grid.before(bar);

  const MEET = /^(video[1-4]|meet1|meet2)$/, END = /^(after1|after2|finish|finish_both|care)$/, POSE = /^(ready|pose1|pose2|deny1|deny2|climax|climax_both)$/;
  // 바로 아래 칸들을 장면 카드로 묶음 (목록을 새로 그리면 다시)
  function regroup() {
    const kids = [...grid.children];
    if (!kids.some((x) => x.classList && x.classList.contains("hs-slot"))) return false;
    const frag = document.createDocumentFragment();
    let cur = null, poseName = "", ended = false, g = "";
    const open = (title) => {
      const c = document.createElement("div"); c.className = "hs-card"; c._title = title;
      c.innerHTML = `<div class="cd-hd"><b></b><small></small><span class="gp"></span></div><div class="cd-in"></div>`;
      c.querySelector("b").textContent = title; c.querySelector(".gp").textContent = g;
      frag.append(c); cur = c;
    };
    for (const x of kids) {
      if (x.tagName === "H4") { g = x.textContent; frag.append(x); cur = null; poseName = ""; ended = false; continue; }
      if (x.tagName === "H5") { frag.append(x); continue; }
      if (!x.classList || !x.classList.contains("hs-slot")) { frag.append(x); continue; }
      const sid = x.dataset.sid || "", n = x.dataset.n || "";
      let title;
      if (ended || END.test(sid)) { ended = true; title = "마무리"; }
      else if (MEET.test(sid)) title = "만남";
      else if (POSE.test(sid)) {
        if (/^pose[12]$/.test(sid)) { const p = n.split(" · ")[0]; if (p) poseName = p; }
        title = poseName ? `체위 · ${poseName}` : "체위 · 삽입";
      } else title = "애무";
      if (cur && cur._title === "체위 · 삽입" && sid === "pose1") { cur._title = title; cur.querySelector("b").textContent = title; }   // 삽입 직전은 첫 체위 카드로
      if (!cur || cur._title !== title) open(title);
      cur.querySelector(".cd-in").append(x);
    }
    grid.innerHTML = ""; grid.append(frag);
    return true;
  }
  const cards = () => [...grid.querySelectorAll(".hs-card")];
  const slotsOf = (c) => [...c.querySelectorAll(".cd-in > .hs-slot")];
  function layout() {
    grid.classList.add("cards"); grid.classList.toggle("flat", !stacked);
    const C = cards(), n = C.length;
    bar.style.display = n ? "" : "none";
    bar.querySelector('[data-a="mode"]').textContent = stacked ? "▦ 펼쳐 보기" : "🂠 카드로 보기";
    bar.querySelector('[data-a="follow"]').classList.toggle("on", follow);
    ["prev", "next", "follow"].forEach((a) => (bar.querySelector(`[data-a="${a}"]`).style.display = stacked ? "" : "none"));
    C.forEach((c) => { const S = slotsOf(c), dn = S.filter((x) => x.classList.contains("done")).length; c.querySelector(".cd-hd small").textContent = `${S.length}장${dn ? ` · 완성 ${dn}` : ""}`; });
    if (!n) return;
    if (!stacked) { C.forEach((c) => { c.classList.remove("back", "far"); c.style.transform = c.style.opacity = c.style.zIndex = c.style.filter = ""; }); bar.querySelector(".ct").textContent = `카드 ${n}장`; bar.querySelector(".tt").textContent = ""; return; }
    if (follow) { let k = -1; C.forEach((c, i) => { if (slotsOf(c).some((x) => x.classList.contains("done"))) k = i; }); if (k >= 0) idx = k; }
    if (idx >= n) idx = n - 1; if (idx < 0) idx = 0;
    C.forEach((c, i) => {
      const d = i - idx, a = Math.abs(d);
      if (c.classList.contains("back") !== (d !== 0)) c.classList.toggle("back");
      if (c.classList.contains("far") !== (a > 3)) c.classList.toggle("far");
      c.style.zIndex = String(50 - a);
      c.style.opacity = d === 0 ? "1" : String(Math.max(0, 0.85 - a * 0.2));
      c.style.filter = d === 0 ? "" : `brightness(${Math.max(0.35, 0.7 - a * 0.1)})`;
      c.style.transform = `translateX(calc(-50% + ${d * 30}px)) translateY(${a * 9}px) scale(${1 - a * 0.04}) rotate(${d * 1.2}deg)`;
    });
    bar.querySelector(".ct").textContent = `${idx + 1} / ${n}`;
    bar.querySelector(".tt").textContent = C[idx]._title + (C[idx].querySelector(".gp").textContent ? ` · ${C[idx].querySelector(".gp").textContent}` : "");
  }
  const go = (i) => { idx = i; follow = false; layout(); };
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const a = b.dataset.a;
    if (a === "mode") { stacked = !stacked; try { localStorage.setItem(KEY, stacked ? "deck" : "grid"); } catch {} layout(); return; }
    if (a === "follow") { follow = !follow; layout(); return; }
    go(idx + (a === "next" ? 1 : -1));
  });
  // 뒤 카드 누르면 그 카드가 앞으로 (앞 카드 안 그림은 원래대로 크게 열림)
  grid.addEventListener("click", (e) => {
    if (!stacked) return;
    const c = e.target.closest(".hs-card"); if (!c || !c.classList.contains("back")) return;
    e.preventDefault(); e.stopPropagation(); go(cards().indexOf(c));
  }, true);
  let x0 = null, y0 = null;
  grid.addEventListener("pointerdown", (e) => { if (stacked) { x0 = e.clientX; y0 = e.clientY; } });
  grid.addEventListener("pointerup", (e) => { if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5) go(idx + (dx < 0 ? 1 : -1)); });
  document.addEventListener("keydown", (e) => {
    if (!stacked || !cards().length) return;
    const tab = document.querySelector("#tab-hseq"); if (!tab || !tab.classList.contains("active")) return;
    const md = document.querySelector("#modal"); if (md && !md.classList.contains("hidden")) return;
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || "")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
  });
  // 목록이 새로 그려지면 카드로 다시 묶고, 칸 상태(완성 등)가 바뀌면 다시 배치
  let rt = 0;
  new MutationObserver(() => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (regroup()) { follow = true; idx = 0; } layout(); }, 50);
  }).observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  regroup(); layout();
  window.BC_HSDECK = { cards: () => cards().map((c) => ({ title: c._title, n: slotsOf(c).length })), go, get idx() { return idx; } };
})();
