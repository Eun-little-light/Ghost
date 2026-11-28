// 그림체 선택 (대사판) — 기존 그림체 / 작가 그림체 (Ghost의 모든 생성에)
//  작가를 고르면: 프롬프트 맨 앞에 (작가 태그:1.3) + 고른 워크플로의 참조 그림(IPAdapter) 세기를 0으로 한 숨김 사본(이름~style)으로 생성
//  빠른 모드(fast.js) 뒤에 실행 → 이 감싸기가 먼저 돌고, 빠른 모드는 ~style 사본을 다시 빠르게 만듦
(() => {
  const KEY = "bc_style";
  const STYLES = { "": "기존 그림체", ratatatat74: "ratatatat74" };   // 작가를 늘리려면 여기에 '단부루 작가 태그: 보이는 이름'
  let cur = ""; try { cur = localStorage.getItem(KEY) || ""; } catch {}
  if (!(cur in STYLES)) cur = "";
  const sels = new Set();
  const set = (v) => { cur = v in STYLES ? v : ""; try { localStorage.setItem(KEY, cur); } catch {} sels.forEach((s) => (s.value = cur)); };
  const make = () => {
    const s = document.createElement("select"); s.className = "bc-style-sel"; s.title = "그림체 — 작가를 고르면 그 작가 태그를 맨 앞에 넣고 참조 그림은 끔";
    s.innerHTML = Object.entries(STYLES).map(([k, n]) => `<option value="${k}">${n}</option>`).join("");
    s.value = cur; s.onchange = () => set(s.value); sels.add(s); return s;
  };
  const _api = api, made = new Map();
  async function wf(baseName) {
    try {
      const list = await _api("/api/workflows"), base = list.find((w) => w.name === baseName);
      if (!base || !base.prompt) return baseName;
      let graph = base.prompt;
      if (base.source) { try { const u = await _api("/api/comfy/userworkflow?path=" + encodeURIComponent(base.source)); if (u && u.prompt) graph = u.prompt; } catch {} }
      graph = JSON.parse(JSON.stringify(graph));
      let n = 0; for (const id of Object.keys(graph)) { const nd = graph[id]; if (nd && /IPAdapter/.test(String(nd.class_type || "")) && nd.inputs && typeof nd.inputs.weight === "number") { nd.inputs.weight = 0; n++; } }
      if (!n) return baseName;   // 참조 그림이 없는 워크플로는 그대로
      const name = baseName + "~style", js = JSON.stringify(graph), old = list.find((w) => w.name === name);
      if (made.get(name) !== js && !(old && JSON.stringify(old.prompt) === js))
        await _api("/api/workflows", { json: { name, prompt: graph, positive: base.positive, negative: base.negative, seeds: base.seeds || [], checkpoint: base.checkpoint || null, latent: base.latent || "", sampler: base.sampler || "", source: "" } });
      made.set(name, js);
      return name;
    } catch (e) { console.warn("그림체 사본을 만들지 못해 원래 워크플로로", e); return baseName; }
  }
  api = async (url, opt) => {
    if (cur && url === "/api/generate" && opt && opt.json) {
      const j = { ...opt.json };
      if (!String(j.positive || "").includes(cur)) j.positive = `(${cur}:1.3), ` + (j.positive || "");
      if (j.workflow && j.workflow !== "builtin" && !/~style/.test(j.workflow)) j.workflow = await wf(j.workflow);
      opt = { ...opt, json: j };
    }
    return _api(url, opt);
  };
  window.BC_STYLE = { get: () => cur, set, make, STYLES };
  // 생성 버튼 위 대기열 줄에 '그림체' 칸 (빠른 모드 옆)
  function addRow() {
    document.querySelectorAll(".bc-queue").forEach((q) => {
      if (q.querySelector(".bc-style-sel")) return;
      const l = document.createElement("label"); l.className = "check bc-style-row"; l.append("그림체 ", make()); q.append(l);
    });
  }
  { let k = 0; const t = setInterval(() => { addRow(); if (++k > 16) clearInterval(t); }, 500); }
})();
