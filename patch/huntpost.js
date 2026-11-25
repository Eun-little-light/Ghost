// 대사 마지막 손질 (BC_POST · 빌드 없이 대사 업데이트로도 바뀜) — 모두 성인 간 합의된 관계 · 모두 새로 쓴 글
//  1) 1여 1남 · 상대가 다른 남자(1남 (바람 · 불륜 상대) / 장면에 없음)일 때
//     - 관계(연인 · 썸 …) 서술은 '당신'이 행위자라서 → '그'로 (네토라레 서술 속 '당신'은 남편이라 그대로)
//     - 다인원용 표현(두 남자 · 동시에 · 한꺼번에)을 한 명으로
//  2) 더 천박한 그녀의 말 한 줄 (단계별 · 해요체로 쓰고 말투는 BC_GEN2.lv가 바꿈) — 덜 쓴 문장부터 골라 한 시퀀스 안에서 겹치지 않게
(() => {
  const UN = (s) => s.replace(/당신은/g, "그는").replace(/당신이/g, "그가").replace(/당신의/g, "그의").replace(/당신을/g, "그를").replace(/당신에게/g, "그에게").replace(/당신과/g, "그와").replace(/당신도/g, "그도").replace(/당신만/g, "그만").replace(/당신/g, "그");
  const KEEP = /^(cheat|cheatwatch|rebound)$/;   // 이 관계들은 서술 속 '당신'이 원래 남편
  const S = (s) => s.split("/");
  const L = {
    pre: S("저 오늘 박히려고 나온 거예요. 팬티도 안 입고 왔어요, 확인해 볼래요?/키스만 했는데 팬티 벌써 다 젖었어요… 만져 봐요, 질척거리죠?/밥 먹는 내내 자지 생각만 했어요. 저 진짜 걸레 같죠?/혀 내밀어 봐요… 침 섞고 싶어요, 질질 흘릴 때까지/오늘은 마음대로 써 줘요. 저 그냥 구멍이라고 생각해요/바지 위로도 다 느껴져요… 벌써 이렇게 딱딱해졌어요?/보지가 벌렁거려서 똑바로 못 앉겠어요/오늘 몇 번 쌀 거예요? 다 받을 거니까 아끼지 마요/엘리베이터에서부터 박히고 싶었어요… 참느라 죽는 줄 알았어요/제 몸 냄새 맡아 봐요… 발정 난 냄새 나죠?/만지기만 해도 허벅지까지 흘러요… 부끄러운데 멈추지 마요/오늘은 착한 척 안 할래요. 천박하게 굴어도 돼요?"),
    fore: S("자지 냄새 너무 좋아요… 씻지 말고 그대로 입에 넣어 줘요/목 끝까지 처박아요, 컥컥거려도 빼지 마요/입보지 쓰니까 좋아요? 불알도 핥아 줄게요, 다 빨아 줄게요/입에 다 안 들어가요… 목구멍까지 쑤셔 넣어 줘요, 침 질질 흘리게/제 가슴 오나홀처럼 써도 돼요/손가락 두 개 더 넣어 줘요… 보지가 더 먹고 싶대요/클리 빨리니까 다리가 저절로 벌어져요… 더 세게 빨아요/쯉쯉 소리 나게 빨아 줄게요… 귀 막지 말고 들어요/핥을수록 자지가 껄떡거려요… 귀여워 죽겠어요/보지 벌려서 보여 줄게요… 안쪽까지 다 젖은 거 봐요/침 범벅 된 자지 얼굴에 문질러 줘요/제 입 안에 넣고 허리 흔들어요… 제 입은 보지랑 똑같아요"),
    fin: S("얼굴에 싸 줘요… 화장 다 망가지게, 정액으로 범벅 되게/입안 가득 쌌네요… 꿀꺽, 다 삼켰어요. 보여 줄까요?/눈에 들어갔어요… 따가운데 좋아요, 더 싸 줘요/정액 냄새 진동해요… 이 냄새 맡으면서 자고 싶어요/턱까지 흘러내려요… 혀로 다 핥아 먹을게요/가슴에 싼 거 문질러서 바를게요… 반들반들해졌죠?/손바닥에 받은 거 이렇게 쭉 빨아 먹을게요/아직 껄떡거려요… 남은 거 한 방울도 안 남기고 짜 줄게요"),
    sex: S("보지 찢어질 것 같아요… 근데 멈추면 안 돼요, 더 쑤셔요/자궁 두드리는 거 느껴져요… 쾅쾅 박아요, 보지 망가뜨려요/엉덩이 때려 줘요… 빨개지게, 자국 남게/개처럼 박히는 게 제일 좋아요… 저 이제 암캐예요, 멍멍♡/보지에서 하얀 거품 나와요… 너무 좋아서 애액이 멈추질 않아요/소리 나는 거 들려요? 찌걱찌걱… 제 보지가 내는 소리예요/보지가 자지 모양으로 길들여지고 있어요… 더 세게 박아요/머리채 잡고 박아요… 저 그런 거 좋아해요/박힐 때마다 오줌 나올 것 같아요… 싸도 돼요? 진짜 싸도 돼요?/자지 빠질 때마다 보지가 쭉쭉 따라 나가요… 다시 처박아요/저 지금 혀 내밀고 침 흘리고 있죠? 이게 제 진짜 얼굴이에요/보지 쑤셔 주는 자지가 세상에서 제일 좋아요/더 깊이… 배꼽까지 올라오게 박아요/허리 못 움직이게 짓눌러서 박아요… 도망 못 가게/가요, 가요, 보지 가 버려요오—!/머릿속에 자지밖에 없어요… 아무 생각도 안 나요"),
    cream: S("싸요, 싸요, 안에 다 싸요… 자궁 정액으로 가득 채워 줘요/꿀렁꿀렁 쏟아지는 거 다 느껴져요… 빼지 마요, 한 방울도 흘리기 싫어요/자궁에 정액 꿀렁꿀렁 들어와요… 임신해도 몰라요, 다 싸요/안에서 자지가 껄떡거리면서 싸요… 보지가 쭉쭉 받아 마셔요/뜨거운 게 자궁 입구에 철퍽철퍽 부딪혀요/배 속이 정액으로 묵직해요… 더 넣어 줘요, 터질 때까지/질싸 받으면서 또 가요오—!/이제 제 보지는 정액받이예요♡"),
    out: S("배 위에 뜨거운 게 철퍽 떨어져요… 손가락으로 찍어 먹을래요/뺄 때 보지가 아쉬워서 쭉 빨아들였어요… 다음엔 안에 싸요/엉덩이에 싼 거 흘러내려요… 그대로 문질러 줘요/몸에 정액 뿌려진 거 보니까 또 젖어요"),
    after: S("보지에서 정액 줄줄 새요… 아까우니까 손가락으로 떠먹을래요/흘러나오는 거 봐요… 벌어진 채로 안 닫혀요/오늘 박힌 거 한 달은 생각날 것 같아요… 또 박아 줄 거죠?/다리에 힘이 안 들어가요… 업어 줘요, 보지가 아직 떨려요/이대로 팬티 입고 집에 갈래요. 정액 흘리면서 잘래요/시트에 제 애액이랑 정액이 범벅이에요… 지도 그려졌네요/샤워하기 싫어요. 몸에 냄새 배게 그냥 둘래요/자지 아직 서 있네요… 한 번 더 박을 수 있죠?/다음엔 처음부터 콘돔 없이 해요. 저 이제 정액받이니까요♡/보지가 얼얼해요… 근데 벌써 또 하고 싶어요"),
  };
  const used = new Map();
  const pick = (a) => { let m = Infinity, c = []; for (const x of a) { const n = used.get(x) || 0; if (n < m) { m = n; c = [x]; } else if (n === m) c.push(x); } const x = c[Math.floor(Math.random() * c.length)]; used.set(x, m + 1); return x; };
  const speech = (t) => { const q = (String(t).match(/"[^"]+"/g) || []).join(" "); return /(습니다|십시오|입니까|합니다)/.test(q) ? 1 : /요[.!?…"\s]/.test(q) ? 0 : q ? 2 : 0; };
  const groupOf = (sid, o) => {
    if (/^(video|self|dt_|datetoy|ntrcall|ntrphoto|care)/.test(sid)) return null;
    if (/_fin$/.test(sid)) return "fin";
    if (/^(meet|kiss|change|undress|act_)/.test(sid)) return "pre";
    if (/^(neck|caress|chest|nipple|hand|toy|cunni|analtoy|oral|handjob|paizuri|footjob|thighjob|sixtynine|grind)/.test(sid)) return "fore";
    if (/^(ready|pose|deny)/.test(sid)) return "sex";
    if (/^(climax|finish)/.test(sid)) return o && o.fin && /cum in pussy|internal/.test(o.fin.tags || "") ? "cream" : "out";
    if (/^after/.test(sid)) return "after";
    return null;
  };
  // 그녀의 짝 호칭 하나로: 부부 · 아내의 바람 · 홧김 · 불륜 · 스와핑 → 남편, 그 밖(연인 · 썸 · 지정 안 함 …) → 남자친구
  const HB = { 는: "은", 가: "이", 를: "을", 와: "과", 랑: "이랑", 로: "으로", 예요: "이에요", 야: "이야", 다: "이다" };
  const BF = { 은: "는", 이: "가", 을: "를", 과: "와", 이랑: "랑", 으로: "로", 이에요: "예요", 이야: "야", 이다: "다" };
  const toHB = (s) => s.replace(/남자친구(예요|랑|로|는|가|를|와|야|다)?/g, (m, j) => "남편" + (j ? HB[j] : ""));
  const toBF = (s) => s.replace(/남편(이에요|이랑|으로|이야|이다|은|을|과|이(?![었라지면]))?/g, (m, j) => "남자친구" + (j ? BF[j] : ""));
  //  관계를 골랐으면 관계대로, 안 골랐으면 스와핑 · 지켜보는 남편 → 남편 / 네토라레 · 네토리 · 장면에 없음 → 남자친구
  const whoOf = (o) => {
    if (!o) return "";
    if (o.situ === "swap" || /^(married|cheat|cheatwatch|rebound|affair)$/.test(o.rel || "")) return "남편";
    if (/^(interest|some|lover|partner)$/.test(o.rel || "")) return "남자친구";
    if (o.watch && o.nb > 1) return "남편";
    return /^(ntr|ntori)$/.test(o.situ || "") || o.absent ? "남자친구" : "";
  };
  window.BC_POST = (t, sid, o) => {
    if (!t) return t;
    let s = String(t);
    { const w = whoOf(o); if (w === "남편") s = toHB(s); else if (w === "남자친구") s = toBF(s); }
    if (o && o.absent && o.nb === 1) {
      const R = o.rel && !KEEP.test(o.rel) && window.BC_REL && window.BC_REL[o.rel];
      if (R && R.narr) for (const a of R.narr) for (const n of a || []) if (n && /당신/.test(n) && s.includes(n)) s = s.split(n).join(UN(n));
      s = s.replace(/두 남자의 손을 한꺼번에/g, "그 남자의 손을").replace(/두 남자/g, "그 남자").replace(/(남자의 (손|입)[이가]) 동시에/g, "$1").replace(/양옆 남자들?/g, "그 남자").replace(/남자들/g, "그 남자");
    }
    const k = groupOf(sid, o);
    if (k && Math.random() < 0.65) {
      const G = window.BC_GEN2, si = speech(s), x = pick(L[k]);
      s += `\n"${G && G.lv ? G.lv(x, si) : x}"`;
    }
    return s;
  };
  window.BC_POST._crude = L;   // 시험용
})();
