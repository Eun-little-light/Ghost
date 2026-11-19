// 파스텔 홀로그램 화풍 항목 — 태그 선택기 '파스텔 홀로그램' 그룹 (시퀀스의 연출·효과에도 나옴)
// Little Light의 '화풍·분위기'에 있는 항목과 같음. 워크플로 등록·자동 선택·생성 보정은 pastel.js
(() => {
  const T = window.BC_TAGS;
  if (!T) return;
  const BASE = ["pastel colors", "iridescent", "rainbow gradient", "holographic clothing", "chromatic aberration", "refraction", "translucent", "white background", "simple background", "white theme", "sparkle", "light particles"];
  const HAIR = ["very long hair", "absurdly long hair", "gradient hair", "floating hair", "wind"];
  const FULL = [...BASE, "very long hair", "absurdly long hair", "gradient hair", "floating hair", "transparent wings", "mini wings", "bubble", "frills", "lace trim", "full body", "floating"];
  T.G.push({ t: "파스텔 홀로그램", m: "m", z: "", it: [
    { n: "파스텔 홀로그램", tags: BASE },
    { n: "파스텔 홀로그램 풀세트", tags: FULL },
    { n: "파스텔 홀로그램 · 참고 그림 화풍", tags: FULL },
    { n: "아주 길게 흩날리는 머리", tags: HAIR },
    { n: "반투명 날개", tags: ["transparent wings", "mini wings"] },
    { n: "무지갯빛 굴절", tags: ["iridescent", "refraction", "chromatic aberration", "rainbow gradient"] },
  ] });
  // 기존 사전(kodict1~10)에 없던 태그의 한국어 표시
  Object.assign(window.BC_KO = window.BC_KO || {}, {
    "iridescent": "무지갯빛(홀로그램)", "rainbow gradient": "무지개 그라데이션", "holographic clothing": "홀로그램 옷", "refraction": "빛 굴절",
    "translucent": "반투명", "white theme": "흰색 테마", "transparent wings": "투명한 날개", "mini wings": "작은 날개",
  });
})();
