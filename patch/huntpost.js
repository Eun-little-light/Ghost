// 대사 마지막 손질 (BC_POST · 빌드 없이 대사 업데이트로도 바뀜)
//  1여 1남 · 상대가 다른 남자(1남 (바람 · 불륜 상대) / 장면에 없음)일 때
//  - 관계(연인 · 썸 …) 서술은 '당신'이 행위자라서 → '그'로 (네토라레 서술 속 '당신'은 남편이라 그대로)
//  - 다인원용 표현(두 남자 · 동시에 · 한꺼번에)을 한 명으로
(() => {
  const UN = (s) => s.replace(/당신은/g, "그는").replace(/당신이/g, "그가").replace(/당신의/g, "그의").replace(/당신을/g, "그를").replace(/당신에게/g, "그에게").replace(/당신과/g, "그와").replace(/당신도/g, "그도").replace(/당신만/g, "그만").replace(/당신/g, "그");
  const KEEP = /^(cheat|cheatwatch|rebound)$/;   // 이 관계들은 서술 속 '당신'이 원래 남편
  window.BC_POST = (t, sid, o) => {
    if (!o || !o.absent || o.nb !== 1 || !t) return t;
    let s = String(t);
    const R = o.rel && !KEEP.test(o.rel) && window.BC_REL && window.BC_REL[o.rel];
    if (R && R.narr) for (const a of R.narr) for (const n of a || []) if (n && /당신/.test(n) && s.includes(n)) s = s.split(n).join(UN(n));
    return s.replace(/두 남자의 손을 한꺼번에/g, "그 남자의 손을").replace(/두 남자/g, "그 남자").replace(/(남자의 (손|입)[이가]) 동시에/g, "$1").replace(/양옆 남자들?/g, "그 남자").replace(/남자들/g, "그 남자");
  };
})();
