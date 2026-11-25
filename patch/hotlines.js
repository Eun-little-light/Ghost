// 빌드 없이 대사 업데이트 — patch\hot.ps1(또는 make.ps1)이 쓰는 BooruComfy_data\images\_ghost_hot_lines.json 을 10초마다 확인
//  스탬프가 바뀌면 대사 데이터 모듈(BC_HUNT_LINES · BC_WAY · BC_REL · BC_SITU …)을 새 그릇에서 처음부터 다시 실행해 통째로 바꿔 끼움
//  (같은 모듈을 그냥 다시 실행하면 문장이 두 번씩 쌓이므로) · 진행 중인 생성 · 선택 · 갤러리는 그대로
(() => {
  const URL_ = "/images/_ghost_hot_lines.json";
  let applied = window.__BC_HOT_EMBED || "";   // 이 exe에 들어 있는 대사와 같은 스탬프면 건너뜀
  const apply = (j) => {
    const box = {};
    // with(P) 안에서는 'window' 이름도 P로 풀리므로 window · self · globalThis는 P 자신을 돌려줌 (진짜 window에 문장이 두 번 쌓이지 않게)
    const P = new Proxy(box, {
      has: () => true,
      get: (t, k) => (k === Symbol.unscopables ? undefined : k === "window" || k === "self" || k === "globalThis" ? P : k in t ? t[k] : typeof k === "string" && k.startsWith("BC_") ? undefined : window[k]),
      set: (t, k, v) => { t[k] = v; return true; },
    });
    for (const m of j.mods) {
      const name = m && (m.n || m[0]), code = m && (m.c || m[1]);
      if (typeof code !== "string" || code.length < 20) throw new Error("대사 파일 형식이 이상함 (" + name + ")");
      try { new Function("window", "with (window) {\n" + code + "\n}")(P); }
      catch (e) { console.warn("대사 업데이트: " + name + " 실패", e); throw new Error(name + ": " + e.message); }
    }
    let n = 0;
    for (const k of Object.keys(box)) if (k.startsWith("BC_")) { window[k] = box[k]; n++; }
    return n;
  };
  async function check() {
    try {
      const r = await fetch(URL_ + "?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      if (!j || !j.stamp || !Array.isArray(j.mods) || j.stamp === applied) return;
      applied = j.stamp;   // 실패해도 같은 파일을 10초마다 다시 시도하지 않음
      const n = apply(j);
      applied = j.stamp;
      window.BC_HOT_STAMP = j.stamp;
      try { toast(`대사 업데이트를 적용했어요 · ${j.time} (빌드 없이 · ${n}묶음)`, "ok"); } catch {}
    } catch (e) {
      try { if (/:/.test(String(e.message))) toast("대사 업데이트 실패: " + e.message, "err"); } catch {}
    }
  }
  setTimeout(check, 3000);
  setInterval(check, 10000);
  window.BC_HOT = { check, apply };
})();
