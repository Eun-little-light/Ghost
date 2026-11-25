// 빠른 모드 — 그림체를 정하는 부분(체크포인트·화풍 참조·슬라이더 LoRA)은 그대로 두고 생성 시간을 줄임 (Little Light · Ghost 공용)
//  [빠른 모드] 손질 단계의 steps만 줄임 (같은 시드 비교 약 25% 단축)
//   - 얼굴 보정(FaceDetailer 등 *Detailer*): steps → 최대 12 (원래 20, denoise 0.35라 12면 충분)
//   - 업스케일(UltimateSDUpscale): steps → 최대 8 (원래 16, denoise 0.25라 거의 차이 없음)
//  [초고속 (Lightning)] Hunt의 4초 생성 방식(SDXL Lightning 8step LoRA)을 접목 (같은 시드 비교 77초 → 14초, 그림체 거의 같음)
//   - 체크포인트 바로 뒤에 속도 LoRA(sdxl_lightning_8step_lora)를 넣음 — 슬라이더 LoRA·화풍 참조는 그 뒤에 그대로 이어짐
//   - 기본 생성(KSampler): 9 steps · CFG 1.5 · euler_ancestral · simple
//   - 얼굴 보정(*Detailer*): steps 최대 5 · CFG 1.5
//   - 업스케일(UltimateSDUpscale): 빼고, 그 결과를 쓰던 노드가 업스케일 전 그림을 바로 받음
//   - ComfyUI에 그 LoRA가 없으면 초고속을 건너뛰고 [빠른 모드]로, 워크플로에 이미 속도 LoRA(Lightning·DMD2 등)가 있으면 LoRA는 더 넣지 않음
//  방법: 고른 워크플로의 숨김 사본(이름~fast / 이름~lightning, 목록엔 숨김)을 생성 직전에 최신 상태로 만들어 그 사본으로 생성
//        ComfyUI와 연동된 워크플로는 ComfyUI 원본을 새로 읽어 사본을 만듦 (charfolder.js와 같은 방식)
//  charfolder보다 먼저 불러와야 함(안쪽) → 캐릭터용 사본(이름@캐릭터)이 정해진 뒤 그 사본의 빠른 사본을 씀
//  설정 탭·생성 버튼 위 대기열 줄에서 켜고 끔
(() => {
  const KEY = "bc_fast_on", LKEY = "bc_lightning_on", TAG = "~fast", LTAG = "~lightning";
  const LIMIT = [[/Detailer/, 12], [/^UltimateSDUpscale/, 8]];
  const SPEED_LORA = "sdxl_lightning_8step_lora.safetensors";
  const LIGHT = { steps: 9, cfg: 1.5, sampler_name: "euler_ancestral", scheduler: "simple", faceSteps: 5 };
  const ls = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  let on = ls.get(KEY, true), light = ls.get(LKEY, true);
  const made = new Map();

  function shrink(graph) {
    let n = 0;
    for (const node of Object.values(graph)) {
      if (!node || !node.inputs || typeof node.inputs.steps !== "number") continue;
      const lim = LIMIT.find(([re]) => re.test(String(node.class_type || "")));
      if (lim && node.inputs.steps > lim[1]) { node.inputs.steps = lim[1]; n++; }
    }
    return n;
  }

  // 그래프에서 [id, 출력번호] 참조를 다른 것으로 바꿈
  const relink = (graph, from, to) => {
    for (const node of Object.values(graph)) {
      if (!node || !node.inputs) continue;
      for (const [k, v] of Object.entries(node.inputs)) if (Array.isArray(v) && v[0] === from[0] && v[1] === from[1]) node.inputs[k] = to;
    }
  };
  function lightning(graph) {
    let n = 0;
    const ids = Object.keys(graph);
    const hasSpeed = Object.values(graph).some((x) => x && /LoraLoader/.test(String(x.class_type || "")) && /lightning|dmd2|hyper|turbo|lcm/i.test(String(x.inputs && x.inputs.lora_name)));
    const ckpt = ids.find((id) => graph[id] && graph[id].class_type === "CheckpointLoaderSimple");
    if (!hasSpeed && ckpt) {
      const id = "bc_speed_lora";
      relink(graph, [ckpt, 0], [id, 0]);
      graph[id] = { class_type: "LoraLoaderModelOnly", inputs: { lora_name: SPEED_LORA, strength_model: 1, model: [ckpt, 0] }, _meta: { title: "Speed LoRA (Lightning)" } };
      n++;
    }
    for (const node of Object.values(graph)) {
      if (!node || !node.inputs) continue;
      const ct = String(node.class_type || "");
      if (ct === "KSampler") { Object.assign(node.inputs, { steps: LIGHT.steps, cfg: LIGHT.cfg, sampler_name: LIGHT.sampler_name, scheduler: LIGHT.scheduler }); n++; }
      else if (/Detailer/.test(ct) && typeof node.inputs.steps === "number") {
        Object.assign(node.inputs, { steps: Math.min(node.inputs.steps, LIGHT.faceSteps), cfg: LIGHT.cfg, sampler_name: LIGHT.sampler_name, scheduler: LIGHT.scheduler }); n++;
      }
    }
    for (const id of Object.keys(graph)) {
      const node = graph[id];
      if (!node || !/^UltimateSDUpscale/.test(String(node.class_type || "")) || !Array.isArray(node.inputs && node.inputs.image)) continue;
      relink(graph, [id, 0], node.inputs.image);
      delete graph[id]; n++;
    }
    // 쓰는 곳이 없어진 업스케일 모델 로더는 지움
    for (const id of Object.keys(graph)) {
      if (!graph[id] || graph[id].class_type !== "UpscaleModelLoader") continue;
      const used = Object.values(graph).some((x) => x && x.inputs && Object.values(x.inputs).some((v) => Array.isArray(v) && v[0] === id));
      if (!used) delete graph[id];
    }
    return n;
  }

  // ComfyUI에 Lightning LoRA가 있는지 (1분마다 다시 확인)
  let loraCheck = { at: 0, ok: null };
  async function hasSpeedLora() {
    if (loraCheck.ok !== null && Date.now() - loraCheck.at < 60000) return loraCheck.ok;
    let ok = false;
    try {
      const r = await fetch("/comfy/object_info/LoraLoaderModelOnly");
      if (r.ok) { const j = await r.json(); const list = j && j.LoraLoaderModelOnly && j.LoraLoaderModelOnly.input && j.LoraLoaderModelOnly.input.required && j.LoraLoaderModelOnly.input.required.lora_name; ok = Array.isArray(list) && Array.isArray(list[0]) && list[0].includes(SPEED_LORA); }
    } catch {}
    loraCheck = { at: Date.now(), ok };
    return ok;
  }

  async function variant(baseName) {
    const useLight = light && await hasSpeedLora();
    if (!useLight && !on) return baseName;
    const list = await _api("/api/workflows");
    const base = list.find((w) => w.name === baseName);
    if (!base || !base.prompt) return baseName;
    let graph = base.prompt;
    if (base.source) { try { const u = await _api("/api/comfy/userworkflow?path=" + encodeURIComponent(base.source)); if (u && u.prompt) graph = u.prompt; } catch {} }
    graph = JSON.parse(JSON.stringify(graph));
    const tag = useLight ? LTAG : TAG;
    if (!(useLight ? lightning(graph) : shrink(graph))) return baseName;   // 바꿀 단계가 없는 워크플로는 그대로
    const name = baseName + tag, js = JSON.stringify(graph);
    // 업스케일을 뺀 사본은 그 노드의 시드 칸도 빼서 저장 (없는 노드에 시드를 넣지 않게)
    const seeds = (base.seeds || []).filter((s) => s && graph[s.node]);
    const old = list.find((w) => w.name === name);
    if (made.get(name) !== js && !(old && JSON.stringify(old.prompt) === js))
      await _api("/api/workflows", { json: { name, prompt: graph, positive: base.positive, negative: base.negative, seeds, checkpoint: base.checkpoint || null, latent: base.latent || "", sampler: base.sampler || "", source: "" } });
    made.set(name, js);
    return name;
  }
  const _api = api;
  api = async (url, opt) => {
    if ((on || light) && url === "/api/generate" && opt && opt.json) {
      const wf = opt.json.workflow;
      if (wf && wf !== "builtin" && !String(wf).endsWith(TAG) && !String(wf).endsWith(LTAG)) {
        try { opt = { ...opt, json: { ...opt.json, workflow: await variant(wf) } }; }
        catch (e) { console.warn("빠른 사본을 만들지 못해 원래 워크플로로 생성", e); }
      }
    }
    return _api(url, opt);
  };
  window.BC_FAST = { variant, shrink, lightning, get on() { return on; }, get lightningOn() { return light; } };

  // 빠른 사본은 워크플로 선택 목록·워크플로 탭에서 숨김
  const hidden = (s) => { const t = String(s || "").trim(); return t.endsWith(TAG) || t.endsWith(LTAG); };
  function hide() {
    document.querySelectorAll("#wfSelect option").forEach((o) => { if (hidden(o.value)) o.remove(); });
    document.querySelectorAll("#wfList .wf").forEach((d) => { const b = d.querySelector("b"); if (b && hidden(b.textContent)) d.remove(); });
  }
  const _lw = loadWorkflows;
  loadWorkflows = async (...a) => { const r = await _lw(...a); hide(); return r; };
  hide(); setTimeout(hide, 1500);

  // ---------- 켜고 끄기: 설정 탭 + 생성 버튼 위 대기열 줄 ----------
  const boxes = new Set(), lboxes = new Set();
  function set(v) { on = v; ls.set(KEY, on); boxes.forEach((b) => (b.checked = on)); toast(on ? "빠른 모드를 켰습니다 (얼굴 보정·업스케일 steps 줄임)" : "빠른 모드를 껐습니다 (워크플로 원래 설정)", "ok"); }
  function setLight(v) { light = v; ls.set(LKEY, light); lboxes.forEach((b) => (b.checked = light)); toast(light ? "초고속(Lightning)을 켰습니다 — 약 5배 빠름, 업스케일 생략" : "초고속(Lightning)을 껐습니다", "ok"); }
  function bind(cb) { cb.checked = on; cb.onchange = () => set(cb.checked); boxes.add(cb); }
  function bindLight(cb) { cb.checked = light; cb.onchange = () => setLight(cb.checked); lboxes.add(cb); }
  function addSetting() {
    const st = document.querySelector(".settings"); if (!st) return false;
    if (st.querySelector(".bc-fast")) return true;
    const d = document.createElement("div"); d.className = "field bc-fast";
    d.innerHTML = `<label>빠른 모드 <small class="muted">— 기본 생성은 그대로, 얼굴 보정 steps 최대 12 · 업스케일 steps 최대 8로 줄여 생성 시간 단축 (그림체·구도는 같음)</small></label><label class="check"><input type="checkbox" class="bc-fast-in"> 켜기</label>` +
      `<label>초고속 (Lightning) <small class="muted">— SDXL Lightning LoRA로 기본 생성 9 steps · CFG 1.5, 얼굴 보정 5 steps, 업스케일 생략. 약 5배 빠름 (같은 시드 77초 → 14초), 그림체는 거의 같고 큰 그림(업스케일)은 나오지 않음. 켜면 빠른 모드보다 먼저 씀</small></label><label class="check"><input type="checkbox" class="bc-light-in"> 켜기</label>`;
    const hr = st.querySelector("hr"); hr ? hr.before(d) : st.append(d);
    bind(d.querySelector(".bc-fast-in")); bindLight(d.querySelector(".bc-light-in")); return true;
  }
  function addRow() {
    document.querySelectorAll(".bc-queue").forEach((q) => {
      if (q.querySelector(".bc-fast-cb")) return;
      const l = document.createElement("label"); l.className = "check bc-fast-cb"; l.title = "얼굴 보정·업스케일 steps를 줄여 더 빨리 생성";
      l.innerHTML = `<input type="checkbox"> 빠른 모드`;
      const l2 = document.createElement("label"); l2.className = "check bc-light-cb"; l2.title = "Lightning LoRA로 약 5배 빠르게 (업스케일 생략)";
      l2.innerHTML = `<input type="checkbox"> 초고속`;
      q.append(l, l2); bind(l.querySelector("input")); bindLight(l2.querySelector("input"));
    });
  }
  { let n = 0; const t = setInterval(() => { addSetting(); addRow(); if (++n > 16) clearInterval(t); }, 500); }
})();
