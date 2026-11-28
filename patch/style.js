// 그림체 선택 (대사판) — 기존 그림체 / 작가 그림체 프리셋 (Ghost의 모든 생성에)
//  프리셋: 작가 태그(가중치) + 그림체 태그 + 참고 그림(IPAdapter 화풍 참조)
//   - 참고 그림은 내 빌드에만(style_local.js의 BC_STYLE_REFS — 작가의 그림이라 저장소 · 배포용엔 없음) → 없으면 참조를 끄고 태그만
//   - 고른 워크플로의 IPAdapter가 보는 그림을 그 참고 그림으로 바꾼 숨김 사본(이름~style_프리셋)으로 생성
//  빠른 모드(fast.js) 뒤에 실행 → 이 감싸기가 먼저 돌고, 빠른 모드는 그 사본을 다시 빠르게 만듦
(() => {
  const KEY = "bc_style";
  const STYLES = {
    "": { n: "기존 그림체" },
    rata_bw: { n: "ratatatat74 · 흑백 원고", tag: "ratatatat74", extra: "(monochrome:1.2), greyscale, manga, sketch, thick lineart, screentone, hatching", ref: "rata_bw1.png", w: 0.7 },
    rata_color: { n: "ratatatat74 · 컬러", tag: "ratatatat74", extra: "flat color, cel shading, sketch lines, simple shading, muted colors", ref: "rata_color.png", w: 0.7 },
  };
  let cur = ""; try { cur = localStorage.getItem(KEY) || ""; } catch {}
  if (cur === "ratatatat74") cur = "rata_bw";   // 예전 값
  if (!(cur in STYLES)) cur = "";
  const sels = new Set();
  const set = (v) => { cur = v in STYLES ? v : ""; try { localStorage.setItem(KEY, cur); } catch {} sels.forEach((s) => (s.value = cur)); };
  const make = () => {
    const s = document.createElement("select"); s.className = "bc-style-sel"; s.title = "그림체 — 작가 프리셋을 고르면 그 작가 태그 · 그림체 태그 · 참고 그림으로 생성";
    s.innerHTML = Object.entries(STYLES).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join("");
    s.value = cur; s.onchange = () => set(s.value); sels.add(s); return s;
  };
  const prefix = (k = cur) => { const S = STYLES[k]; return S && S.tag ? [`(${S.tag}:1.3)`, S.extra].filter(Boolean).join(", ") : ""; };
  const refOf = (k) => { const S = STYLES[k], R = window.BC_STYLE_REFS || {}; return S && S.ref && R[S.ref] ? S.ref : ""; };
  // 참고 그림은 이번 실행에서 처음 쓸 때 ComfyUI input에 올림 (comfysetup.js와 같은 길)
  const upped = new Set();
  async function upload(name) {
    if (!name || upped.has(name)) return !!name;
    try {
      const fd = new FormData(); fd.append("image", await (await fetch(window.BC_STYLE_REFS[name])).blob(), name); fd.append("type", "input"); fd.append("overwrite", "true");
      const r = await fetch("/comfy/upload/image", { method: "POST", body: fd });
      if (r.ok) { upped.add(name); return true; }
    } catch (e) { console.warn("그림체 참고 그림 올리기 실패", name, e); }
    return false;
  }
  const _api = api, made = new Map();
  async function wf(baseName, k) {
    try {
      const S = STYLES[k], ref = refOf(k), refOk = ref ? await upload(ref) : false;
      const list = await _api("/api/workflows"), base = list.find((w) => w.name === baseName);
      if (!base || !base.prompt) return baseName;
      let graph = base.prompt;
      if (base.source) { try { const u = await _api("/api/comfy/userworkflow?path=" + encodeURIComponent(base.source)); if (u && u.prompt) graph = u.prompt; } catch {} }
      graph = JSON.parse(JSON.stringify(graph));
      let n = 0;
      for (const id of Object.keys(graph)) {
        const nd = graph[id]; if (!nd || !/IPAdapter/.test(String(nd.class_type || "")) || !nd.inputs || typeof nd.inputs.weight !== "number") continue;
        nd.inputs.weight = refOk ? S.w : 0; n++;
        const li = Array.isArray(nd.inputs.image) && graph[nd.inputs.image[0]];   // 이 IPAdapter가 보는 그림
        if (refOk && li && li.class_type === "LoadImage") li.inputs.image = ref;
      }
      if (!n) return baseName;   // 참조 그림이 없는 워크플로는 그대로
      const name = baseName + "~style_" + k, js = JSON.stringify(graph), old = list.find((w) => w.name === name);
      if (made.get(name) !== js && !(old && JSON.stringify(old.prompt) === js))
        await _api("/api/workflows", { json: { name, prompt: graph, positive: base.positive, negative: base.negative, seeds: base.seeds || [], checkpoint: base.checkpoint || null, latent: base.latent || "", sampler: base.sampler || "", source: "" } });
      made.set(name, js);
      return name;
    } catch (e) { console.warn("그림체 사본을 만들지 못해 원래 워크플로로", e); return baseName; }
  }
  api = async (url, opt) => {
    const S = STYLES[cur];
    if (S && S.tag && url === "/api/generate" && opt && opt.json) {
      const j = { ...opt.json };
      if (!String(j.positive || "").includes(S.tag)) j.positive = prefix() + ", " + (j.positive || "");
      if (j.workflow && j.workflow !== "builtin" && !/~style/.test(j.workflow)) j.workflow = await wf(j.workflow, cur);
      opt = { ...opt, json: j };
    }
    return _api(url, opt);
  };
  window.BC_STYLE = { get: () => cur, set, make, prefix, STYLES };
  // 생성 버튼 위 대기열 줄에 '그림체' 칸 (빠른 모드 옆)
  function addRow() {
    document.querySelectorAll(".bc-queue").forEach((q) => {
      if (q.querySelector(".bc-style-sel")) return;
      const l = document.createElement("label"); l.className = "check bc-style-row"; l.append("그림체 ", make()); q.append(l);
    });
  }
  { let k = 0; const t = setInterval(() => { addRow(); if (++k > 16) clearInterval(t); }, 500); }
})();
