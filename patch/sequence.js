// "시퀀스" 탭 — 체위를 고르면 도입(대화 → 키스 → 애무) 10장 + 본편(초기 흥분 → 고조 → 절정 직전 → 절정 → 흔적) 15장 = 25장을 한 장씩 자동 생성
// "여러 체위 한 번에"를 켜면 고른 체위들을 1인 → 2인 → 5인 순서로 같은 캐릭터·설정으로 이어서 생성
(() => {
  const T = window.BC_TAGS;
  if (!T) return;
  const { G, NEG, KEY, BLK, MFN, MFP, rm } = T;
  const $s = (s, r = document) => r.querySelector(s);
  const escH = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const st = { get(k, d) { try { const v = localStorage.getItem("seq_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem("seq_" + k, JSON.stringify(v)); } catch {} } };

  const item = (gt, n) => (G.find((g) => g.t === gt)?.it.find((i) => i.n === n)?.tags) || [];
  // 큰 단계(5) — 효과·옷 처리·내 태그의 "N단계부터/까지" 범위는 이 기준
  const PHASES = ["초기 흥분", "고조", "절정 직전", "절정", "흔적"];
  // 도입(10) — 대화 → 키스 → 애무. 체위 태그는 빼고 인원 태그만, 옷은 입은 채로. 혼자 체위는 soloTags/solo 이름 사용
  // kiss: 1·2 = 첫 키스·깊은 키스 — 누가 먼저인지(#seqKissBy)에 따라 태그가 바뀜
  const PRE = [
    { pre: "talk", name: "대화 · 웃으며 이야기", solo: "휴식 · 편하게 쉬기", tags: ["talking", "smile", "looking at another", "sitting", "light blush"], soloTags: ["sitting", "on bed", "relaxing", "smile", "holding phone", "looking at phone"] },
    { pre: "talk", name: "대화 · 가까워짐", solo: "휴식 · 메시지", tags: ["talking", "face-to-face", "leaning forward", "blush", "smile", "eye contact"], soloTags: ["holding phone", "smartphone", "light blush", "smile", "lying", "on bed"] },
    { pre: "talk", name: "대화 · 눈이 마주침", solo: "휴식 · 상상", tags: ["face-to-face", "eye contact", "blush", "parted lips", "nervous", "looking at another"], soloTags: ["imagining", "blush", "hand on own cheek", "looking to the side", "lying", "on bed"] },
    { pre: "kiss", kiss: 0, name: "키스 · 첫 키스", solo: "상상 · 베개 끌어안기", tags: [], soloTags: ["pillow hug", "blush", "closed eyes", "lying", "on bed"] },
    { pre: "kiss", kiss: 1, name: "키스 · 깊은 키스", solo: "상상 · 입술 만지기", tags: [], soloTags: ["finger to mouth", "blush", "half-closed eyes", "parted lips"] },
    { pre: "kiss", name: "키스 · 입술이 떨어짐", solo: "상상 · 달아오름", tags: ["saliva trail", "after kiss", "blush", "half-closed eyes", "heavy breathing", "parted lips", "face-to-face"], soloTags: ["blush", "heavy breathing", "half-closed eyes", "parted lips", "pillow hug"] },
    { pre: "fore", name: "애무 · 끌어안기", solo: "애무 · 몸 쓰다듬기", tags: ["hug from behind", "hand on another's waist", "blush", "parted lips", "closed eyes"], soloTags: ["hand on own chest", "blush", "parted lips", "lying", "on bed"] },
    { pre: "fore", name: "애무 · 가슴", solo: "애무 · 가슴 만지기", tags: ["grabbing another's breast", "blush", "heavy breathing", "half-closed eyes"], soloTags: ["grabbing own breast", "blush", "heavy breathing", "half-closed eyes"] },
    { pre: "fore", loose: true, name: "애무 · 목덜미", solo: "애무 · 허벅지", tags: ["kissing neck", "grabbing another's breast", "blush", "closed eyes", "heavy breathing"], soloTags: ["hand on own thigh", "blush", "heavy breathing", "half-closed eyes"] },
    { pre: "fore", loose: true, name: "애무 · 손길 아래로", solo: "애무 · 옷 위로", tags: ["fingering", "groping", "blush", "heavy breathing", "trembling"], soloTags: ["masturbation through clothes", "blush", "heavy breathing", "trembling"] },
  ];
  // 누가 먼저 키스하나 — [첫 키스, 깊은 키스]
  const KISS = {
    mutual: [["kiss", "closed eyes", "blush", "hug", "face-to-face"], ["french kiss", "tongue", "saliva", "closed eyes", "blush", "hug"]],
    male: [["surprise kiss", "kiss", "wide-eyed", "blush", "hand on another's cheek", "hand on another's head"], ["french kiss", "tongue", "saliva", "blush", "hand on another's waist", "half-closed eyes"]],
    female: [["surprise kiss", "kiss", "tiptoe kiss", "closed eyes", "blush", "necktie grab", "hands on another's face"], ["french kiss", "tongue", "saliva", "arms around neck", "closed eyes", "blush"]],
  };
  const PRE_KEY = new Set(["talking", "kiss", "surprise kiss", "french kiss", "tiptoe kiss", "hug from behind", "kissing neck", "grabbing another's breast", "fingering"]);
  // 도입 단계엔 이 효과 그룹만 (자위 동작·흥분 반응 등은 본편부터)
  const PRE_FX = new Set(["상황", "감정", "분위기 이펙트", "카메라 연출", "음문 (하복부 문신)", "피부 디테일", "파스텔 홀로그램", "작가 화풍", "푸른 밤"]);
  const PRE_NEG = { talk: ["sex", "vaginal", "penis", "nude", "nipples", "pussy", "cum", "orgasm", "ahegao"], kiss: ["sex", "vaginal", "penis", "nude", "nipples", "pussy", "cum", "orgasm", "ahegao"], fore: ["sex", "vaginal", "penis", "cum", "orgasm", "ahegao"] };
  // 자위 체위: 곁에 둔 기기 — 소리(스마트폰·차 오디오)는 옆에 두고 들으며, 화면(노트북·컴퓨터·TV)은 장면을 보며
  // pre = 도입, main = 본편(절정까지), dev = 흔적(기기만), neg = 부정에 추가
  const SCREEN = {
    phone: { n: "스마트폰 (옆에 두고 소리)", pre: ["smartphone", "earphones", "sound effects", "closed eyes"], main: ["smartphone", "earphones", "sound effects"], dev: ["smartphone", "earphones"], neg: ["holding phone"] },
    car: { n: "차 오디오 (소리)", pre: ["radio", "speaker", "sound effects", "closed eyes"], main: ["radio", "sound effects"], dev: ["radio"], neg: ["holding phone"] },
    laptop: { n: "노트북 (장면 보며)", pre: ["laptop", "looking at screen", "watching", "screen light"], main: ["laptop", "looking at screen", "watching", "screen light"], dev: ["laptop", "screen light"] },
    pc: { n: "컴퓨터 화면 (장면 보며)", pre: ["computer", "monitor", "desk", "looking at screen", "watching", "screen light"], main: ["computer", "monitor", "looking at screen", "watching", "screen light"], dev: ["computer", "monitor"] },
    tv: { n: "TV (장면 보며)", pre: ["television", "watching television", "looking at screen", "screen light"], main: ["television", "watching television", "screen light"], dev: ["television", "screen light"] },
  };
  // 자위 체위 본편(15장) — 스스로 달아올라 손이 움직이는 흐름: 가슴을 쥐고 → 아래로 → 손가락 → 절정
  // 도구를 쓰는 단계에선 아래쪽 손 태그(HAND_LOW)를 빼고 도구로 대신, 남은 손은 가슴을 주무름
  const SOLO_ACT = [
    ["aroused", "hand on own chest", "naughty face"],
    ["aroused", "hand under shirt", "grabbing own breast", "hand on own crotch"],
    ["in heat", "grabbing own breast", "nipple tweak", "hand between legs", "crotch rub"],
    ["in heat", "grabbing own breast", "hand in panties", "female masturbation"],
    ["grabbing own breast", "nipple tweak", "female masturbation", "clitoral stimulation", "moaning"],
    ["grabbing own breast", "female masturbation", "fingering", "pussy juice", "moaning"],
    ["grabbing own breast", "nipple tweak", "fingering", "spread legs", "pussy juice", "moaning"],
    ["grabbing own breast", "fingering", "spread legs", "pussy juice", "arched back", "moaning"],
    ["grabbing own breast", "fingering", "clitoral stimulation", "pussy juice", "trembling"],
    ["grabbing own breast", "nipple tweak", "fingering", "pussy juice", "trembling", "moaning"],
    ["grabbing own breast", "fingering", "pussy juice", "arched back", "trembling"],
    ["female masturbation", "grabbing own breast", "pussy juice", "trembling"],
    ["grabbing own breast", "pussy juice", "trembling"],
    ["hand on own chest", "pussy juice"],
    [],
  ];
  const HAND_LOW = new Set(["hand between legs", "crotch rub", "hand in panties", "fingering", "clitoral stimulation", "hand on own crotch", "spread pussy"]);
  const LOW_TOOL_RE = /dildo|magic wand|rotor|egg vibrator|vibrator under|vibrator in|remote control vibrator|beads|butt plug|shower head|object insertion|sex machine|inserting/;
  const SOLO_KEY =new Set(["grabbing own breast", "female masturbation", "fingering"]);
  // 자동: 고른 배경에 맞춰 — 차 안 → 차 오디오, 호텔·거실 → TV, 사무실 → 컴퓨터, 그 밖 → 스마트폰
  function screenFor(bgTags) {
    const s = new Set(bgTags.map((t) => t.toLowerCase()));
    if (s.has("car interior") || s.has("car")) return "car";
    if (s.has("hotel room") || s.has("hotel") || s.has("living room") || s.has("couch")) return "tv";
    if (s.has("office") || s.has("library")) return "pc";
    return "phone";
  }
  const SCREEN_DROP = new Set(["holding phone", "looking at phone", "smartphone", "imagining", "looking to the side", "pillow hug", "hand on own cheek", "lying", "on bed", "sitting"]);   // 화면을 고르면 도입의 '상상' 계열 대신 화면을 봄
  const PEOPLE_RE =/^(\d+(girl|boy)s?|multiple (girls|boys)|solo|solo focus|hetero|\dpeople|yuri)$/;
  // 본편(15) — 초기 흥분→고조, 고조→절정 직전 사이를 촘촘하게
  const MAIN = [
    { phase: 0, name: "분위기", tags: ["light blush", "shy", "nervous", "parted lips", "looking at partner"] },
    { phase: 0, name: "초기 흥분", tags: item("신체 반응", "1단계 초기흥분") },
    { phase: 0, name: "달아오름", tags: ["blush", "parted lips", "heavy breathing", "slight sweat", "glossy skin", "half-closed eyes", "embarrassed"] },
    { phase: 0, name: "숨 가빠짐", tags: ["blush", "open mouth", "panting", "sweat", "glistening skin", "furrowed brow"] },
    { phase: 1, name: "고조 시작", tags: ["heavy blush", "open mouth", "panting", "sweat", "half-closed eyes", "arched back"] },
    { phase: 1, name: "고조", tags: item("신체 반응", "2단계 고조") },
    { phase: 1, name: "고조 깊어짐", tags: ["heavy blush", "half-closed eyes", "tears", "open mouth", "heavy breathing", "sweaty body", "messy hair", "gripping sheets", "arched back", "drooling"] },
    { phase: 1, name: "무너지기 시작", tags: ["full-face blush", "trembling", "tears", "open mouth", "tongue out", "sweaty body", "messy hair", "gripping sheets"] },
    { phase: 2, name: "절정 다가옴", tags: ["full-face blush", "trembling", "twitching", "biting lip", "tears", "curled toes", "sweaty body", "steam"] },
    { phase: 2, name: "절정 직전", tags: item("신체 반응", "3단계 절정직전") },
    { phase: 2, name: "한계", tags: ["full-face blush", "trembling", "clenched teeth", "crying with pleasure", "tears", "tense muscles", "arched back", "curled toes", "steam"] },
    { phase: 3, name: "절정", tags: ["orgasm", "ahegao", "rolling eyes", "tongue out", "trembling", "spasm", "heavy sweat", "arched back", "tears"] },
    { phase: 3, name: "절정 붕괴", tags: item("신체 반응", "4단계 절정붕괴") },
    { phase: 4, name: "여운", tags: ["afterglow", "half-closed eyes", "heavy breathing", "exhausted", "limp", "sweat", "messy hair", "blush"] },
    { phase: 4, name: "흔적", key: "trace", tags: [...item("신체 반응", "흔적·접촉"), "after sex", "afterglow", "cum", "sweat"] },
  ];
  const NPRE = PRE.length;
  const STAGES = [...PRE.map((s) => ({ ...s, phase: 0 })), ...MAIN];   // 25장 = 도입 10 + 본편 15
  const CORE = [0, 3, 7, ...[1, 5, 9, 12, 14].map((i) => i + NPRE)];   // "핵심 8장" = 대화·키스·애무 + 예전 5단계
  const stageName = (si, p) => (STAGES[si].pre && p && p.g.t.startsWith("1인") ? STAGES[si].solo : STAGES[si].name);
  // 복장 → 착의노출 (3단계부터)
  const EXPO = { "오피스 복장": item("착의노출 상태", "오피스"), "바니걸 복장": item("착의노출 상태", "바니걸"), "메이드 복장": item("착의노출 상태", "메이드"), "검은 속옷": item("착의노출 상태", "검은 속옷"), "흰 속옷": item("착의노출 상태", "흰 속옷") };
  // 연출·효과: 그룹 목록과 항목별 기본 시작 단계(0 = 1단계부터)
  const STYLE_G = ["파스텔 홀로그램", "작가 화풍", "푸른 밤"];   // 화풍 칸(연출·효과와 분리, 견본 썸네일)에 보이는 그룹
  const FX_GROUPS = ["음문 (하복부 문신)", "자위 동작", "상황", "감정", "흥분 반응", "눈 이펙트", "분위기 이펙트", "카메라 연출", "피부 디테일", "파스텔 홀로그램", "작가 화풍", "푸른 밤"];
  const FX_FROM = { "빛나는 음문": 1, "마법진 음문": 1, "절정 (분수)": 3, "과흥분 (감각 과부하)": 1, "몰입 (넋 나감)": 2, "격한 절정·여운": 3, "하트 눈": 1, "흰자위 (실신 눈)": 3, "눈물 (촉촉한 눈)": 2, "열기·김서림": 1, "움직임·흔들림": 1 };
  const FX_UNTIL = { "밀당·츤데레 (장난스러운)": 1 };   // 이 단계까지만 (기본은 끝까지)
  const fxList = [];
  function collectFx() {   // 기본 효과 + 내 태그(g.c) 그룹
    fxList.length = 0;
    G.forEach((g, gi) => {
      if (FX_GROUPS.includes(g.t)) g.it.forEach((it, ii) => fxList.push({ key: `${gi}-${ii}`, g: g.t, n: it.n, tags: it.tags, img: it.img, full: it.full, from: FX_FROM[it.n] ?? 0, until: FX_UNTIL[it.n] ?? 4 }));
      // 내 태그(효과·연출) 그룹은 "2. 설정"의 자동 생성 칸에서 고름 (renderMyFields)
    });
  }
  collectFx();
  // 단계별로 자연스럽게 벗기기 (단계 인덱스 0~4)
  const STRIP = [
    ["undressing", "unbuttoning", "loosened clothes"],
    ["open clothes", "open shirt", "clothes pull", "bra pull", "skirt lift", "partially undressed"],
    ["partially undressed", "clothes around waist", "panty pull", "panties around one leg", "bare shoulders"],
    ["nude", "naked", "clothes removed", "clothes on floor"],
    ["nude", "completely nude", "clothes on floor", "discarded clothes"],
  ];
  const NUDE_FROM = 3;
  // 1인(혼자·자위) 체위용: 상대가 있어야 하는 태그 대신
  const SOLO_DROP = new Set(["cum", "after sex", "handprint", "kiss mark", "hickey", "bite mark", "grabbing"]);
  // 혼자 장면: 상대·인원 관련 태그는 프롬프트에서 빼고 부정에 넣음
  const SOLO_PARTNER = ["1boy", "2boys", "3boys", "4boys", "multiple boys", "2girls", "3girls", "4girls", "multiple girls", "hetero", "2people", "3people", "5people", "group sex", "gangbang", "orgy", "harem", "threesome", "spitroast", "double penetration", "sex", "vaginal", "fellatio", "handjob", "paizuri", "oral", "faceless male", "penis", "couple", "looking at partner"];
  const SOLO_NEG = ["1boy", "multiple boys", "2girls", "multiple girls", "hetero", "group sex", "sex", "penis", "male", "2people", "3people"];
  // 기본(내장) 그룹 중 복장을 뺀 모든 그룹의 태그 — 생성 탭 프롬프트에서 정리할 대상
  let _strip = null;
  const baseStripSet = () => _strip || (_strip = new Set(G.filter((g) => !g.c && g.m !== "o").flatMap((g) => g.it.flatMap((i) => i.tags.map((x) => x.toLowerCase())))
    .concat(["5people", "4boys", "3boys", "2boys", "1boy", "multiple boys", "multiple girls", "hetero", "group sex", "gangbang", "orgy"])));
  const SOLO_END = ["afterglow", "heavy breathing", "sweat", "messy hair", "lying", "on bed", "exhausted", "pussy juice", "half-closed eyes"];   // 이 단계부터 복장 태그를 빼고 맨몸
  const CLOTH_STATE = new Set(["disheveled clothes", "torn clothes", "lifted shirt", "bra pull", "panties aside"]);
  const poseGroups =G.map((g, gi) => ({ ...g, gi })).filter((g) => g.m === "p");
  // 복장·배경 목록: 기본 그룹 + 내 태그(★) 그룹. 값은 "그룹명::항목명" (내 태그를 고쳐도 선택이 유지되도록)
  const PARTS = () => window.BC_CUSTOM_PARTS || {};
  const koName = (n) => (window.BC_KO_LOOKUP && window.BC_KO_LOOKUP(n)) || n;   // 영어 태그 이름이면 한국어로 표시
  const keyOf = (g, it) => `${g.t}::${it.n}`;
  const isBgGroup = (g) => g.t === "배경" || (g.c && g.kind === "bg");
  function findItem(key, pred) {
    if (!key) return null;
    for (const g of G) if (pred(g)) for (const it of g.it) if (keyOf(g, it) === key) return { g, it };
    return null;
  }
  // 복장 세트 목록: 기본 복장 그룹 + 내 태그 복장 중 "풀세트·기타" 항목 (부위 항목은 아래 부위별 칸에서)
  const isOutfitGroup = (g) => g.m === "o" || (g.c && g.kind === "outfit");
  const isSetItem = (g, it) => !g.c || !it.part || it.part === "full" || it.part === "etc";
  const PART_SLOTS = [["top", "상의"], ["bottom", "하의"], ["under", "속옷"], ["leg", "스타킹·가터·신발"], ["acc", "소품"]];
  // ---------- 여러 개 고르는 칸: 누르면 펼쳐지는 사각 타일 + 체크 ----------
  // cfg = { label, empty, groups() -> [{t, items:[{v, n}]}], get() -> 값 배열, set(배열) }
  function mtRender(box, cfg) {
    if (!box) return;
    const groups = cfg.groups(), all = groups.flatMap((g) => g.items);
    // 지금 목록에 없는 항목(내 태그가 아직 안 불러와졌거나 지워진 것)은 표시만 안 함 — 저장값은 지우지 않음 (프롬프트엔 안 들어감)
    const cur = cfg.get().filter((v) => all.some((i) => i.v === v));
    const sel = new Set(cur), open = !!(box.querySelector("details.mt") || {}).open;
    const names = cur.map((v) => all.find((i) => i.v === v).n);
    box.innerHTML = `<details class="mt"${open ? " open" : ""}><summary><span class="mt-l">${escH(cfg.label)}</span><span class="mt-s${cur.length ? " has" : ""}" title="${escH(names.join(", "))}">${cur.length ? `<b>${cur.length}</b> ${escH(names.join(", "))}` : escH(cfg.empty)}</span>${cur.length ? '<button type="button" class="mt-x">지우기</button>' : ""}<span class="mt-a">▾</span></summary>`
      + `<div class="mt-b">${groups.map((g) => `${g.t ? `<h5>${escH(g.t)}</h5>` : ""}<div class="mt-g">${g.items.map((i) => `<button type="button" class="mt-t${sel.has(i.v) ? " on" : ""}" data-v="${escH(i.v)}"><i></i><span>${escH(i.n)}</span></button>`).join("")}</div>`).join("")}</div></details>`;
    box.onclick = (e) => {
      const x = e.target.closest(".mt-x");
      if (x) { e.preventDefault(); cfg.set([]); mtRender(box, cfg); cfg.after && cfg.after(); return; }
      const t = e.target.closest(".mt-t"); if (!t) return;
      const v = t.dataset.v, now = cfg.get().filter((y) => all.some((i) => i.v === y));   // 고칠 때 없어진 항목은 정리
      cfg.set(now.includes(v) ? now.filter((y) => y !== v) : [...now, v]);
      mtRender(box, cfg); cfg.after && cfg.after();
    };
  }
  const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);   // 예전(하나만 고르던) 저장값 → 배열
  const partGroups = (part) => G.filter((g) => g.c && g.kind === "outfit" && g.it.some((it) => it.part === part))
    .map((g) => ({ t: g.t, items: g.it.filter((it) => it.part === part).map((it) => ({ v: keyOf(g, it), n: koName(it.n) })) }));
  let parts = Object.fromEntries(Object.entries(st.get("parts", {})).map(([k, v]) => [k, arr(v)]));   // 부위 -> 항목 키 배열
  function renderParts() {
    const box = $s("#seqPartsBox"); if (!box) return;
    const slots = PART_SLOTS.filter(([p]) => partGroups(p).length);
    box.innerHTML = slots.length ? `<label>부위별 복장 <small class="muted">(내 태그 복장 그룹의 부위 항목 — 부위마다 여러 개, 위 "복장"과도 함께 적용)</small></label><div class="grid2">${slots.map(([p]) => `<div data-part="${p}"></div>`).join("")}</div>` : "";
    for (const [p, name] of slots) mtRender($s(`[data-part="${p}"]`, box), { label: name, empty: "없음", groups: () => partGroups(p), get: () => parts[p] || [], set: (a) => { if (a.length) parts[p] = a; else delete parts[p]; st.set("parts", parts); } });
  }
  const outfitGroups = () => G.filter(isOutfitGroup).filter((g) => g.it.some((it) => isSetItem(g, it))).map((g) => ({
    t: g.c ? g.t : g.t.replace(/ 복장$/, ""),
    items: g.it.filter((it) => isSetItem(g, it)).map((it) => {
      const p = g.c && it.part && it.part !== "full" && PARTS()[it.part] && !it.n.includes(PARTS()[it.part].replace(/만$/, "")) ? ` (${PARTS()[it.part]})` : "";
      return { v: keyOf(g, it), n: koName(it.n) + p };
    }),
  }));
  const bgGroups = () => G.filter(isBgGroup).map((g) => ({ t: g.t, items: g.it.map((it) => ({ v: keyOf(g, it), n: koName(it.n) })) }));
  // 예전 형식("그룹번호-항목번호" / 배경 "번호")으로 저장된 선택을 새 형식으로
  const oldOutfit = (o) => { if (/^\d+-\d+$/.test(o)) { const [g, i] = o.split("-").map(Number); return G[g] && G[g].it[i] ? keyOf(G[g], G[g].it[i]) : ""; } return o; };
  const oldBg = (b) => { if (/^\d+$/.test(b)) { const bg = G.find((g) => g.t === "배경"); return bg && bg.it[+b] ? keyOf(bg, bg.it[+b]) : ""; } return b; };
  let outfits = st.get("outfits", null) || arr(oldOutfit(st.get("seqOutfit", "")));
  let bgs = st.get("bgs", null) || arr(oldBg(st.get("seqBg", "")));
  const OUTFIT_CFG = { label: "복장", empty: "없음 (캐릭터 프롬프트 그대로)", groups: outfitGroups, get: () => outfits, set: (a) => { outfits = a; st.set("outfits", a); } };
  const BG_CFG = { label: "배경", empty: "없음", groups: bgGroups, get: () => bgs, set: (a) => { bgs = a; st.set("bgs", a); }, after: () => drawScreen() };
  const renderOutfitBg = () => { mtRender($s("#seqOutfitBox"), OUTFIT_CFG); mtRender($s("#seqBgBox"), BG_CFG); };
  const pickedItems = (keys, pred) => keys.map((k) => findItem(k, pred)).filter(Boolean);

  // ---------- 탭 버튼 + 섹션 ----------
  const genBtn = $s('#tabs button[data-tab="gen"]');
  const tabBtn = document.createElement("button");
  tabBtn.dataset.tab = "seq"; tabBtn.textContent = "시퀀스";
  genBtn.after(tabBtn);
  tabBtn.addEventListener("click", () => showTab("seq"));

  const sec = document.createElement("section");
  sec.id = "tab-seq"; sec.className = "tab";
  sec.innerHTML = `
<div class="seq-layout">
  <div class="card">
    <div class="card-head"><h3>1. 체위 선택</h3><span class="muted" id="seqPoseName">하나를 고르세요</span></div>
    <div class="seq-multi"><label class="check"><input type="checkbox" id="seqMulti"> 여러 체위 한 번에</label><div class="muted small seq-mhint">"인원"에 보이는 체위 전부를 같은 캐릭터·복장·내 태그로 1인 → 2인 순서로 생성 · 빼고 싶은 체위는 눌러서 끔</div><label class="check" id="seqWith5Box"><input type="checkbox" id="seqWith5"> 5인 포함</label><button type="button" class="mini" id="seqMultiAll">전부 선택</button><button type="button" class="mini" id="seqMultiClear">비우기</button></div>
    <div id="seqPoses"></div>
  </div>
  <div class="card seq-opts">
    <div class="card-head"><h3>2. 설정</h3><button class="mini" type="button" id="seqReset" title="체위·인원·복장·배경·옷 처리·연출 효과·내 태그 칸·스위치·단계를 모두 기본값으로">선택 초기화</button></div>
    <div class="field"><label>인원 <small class="muted">(고른 인원의 체위만 보여줌 · 워크플로·크기도 인원에 맞춰 자동)</small></label><div class="seq-seg" id="seqPeople"><button type="button" data-v="all">전체</button><button type="button" data-v="1">혼자</button><button type="button" data-v="2">2인</button><button type="button" data-v="5">5인</button></div></div>
    <div class="field"><label>캐릭터 <small class="muted">(고르면 아래 "캐릭터 프롬프트"가 채워짐 · 직접 고쳐도 됨)</small></label><select id="seqChar"></select></div>
    <div class="field hidden" id="seqToolBox"><label>도구 <small class="muted">(자위 체위를 고르면 나타남 — 두 개까지 같이 쓸 수 있음)</small></label><div class="grid2">
      <div class="field"><label>도구 1</label><select id="seqTool1"></select></div>
      <div class="field"><label>도구 2</label><select id="seqTool2"></select></div>
      <div class="field"><label>언제부터</label><select id="seqToolFrom"></select></div>
      <div class="field"><label>곁에 둔 기기 <small class="muted" id="seqScreenNow"></small></label><select id="seqScreen"><option value="auto">자동 (배경에 맞춰)</option><option value="">없음</option>${Object.entries(SCREEN).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join("")}</select></div>
    </div></div>
    <div class="field"><label>복장 · 배경 <small class="muted">(눌러서 펼치고 여러 개를 체크 — 고른 것을 모두 합쳐서 적용)</small></label>
      <div class="mt-stack"><div id="seqOutfitBox"></div><div id="seqBgBox"></div></div></div>
    <div class="field" id="seqPartsBox"></div>
    <div class="field" id="seqKissBox"><label>첫 키스 <small class="muted">(도입 4~5장 — 대화하다가 누가 먼저 참지 못하고 키스하나)</small></label><div class="seq-seg" id="seqKissBy"><button type="button" data-v="mutual">서로 자연스럽게</button><button type="button" data-v="male">남자가 먼저</button><button type="button" data-v="female">여자가 먼저</button></div></div>
    <div class="field"><label>모자 처리 <small class="muted">(모든 생성 공통 · 설정 탭과 같은 값)</small></label><div id="seqHatSlot"></div></div>
    <div class="field"><label>옷 처리</label><select id="seqCloth">
      <option value="expo">3단계부터 착의노출 (입은 채로)</option>
      <option value="strip">단계별로 자연스럽게 벗기기 (풀기 → 벗기 → 맨몸)</option>
      <option value="keep">그대로 두기</option></select></div>
    <label class="check"><input type="checkbox" id="seqSameSeed" checked> 모든 단계 같은 시드 (캐릭터·구도 일관성)</label>
    <label class="check"><input type="checkbox" id="seqMale" checked> 남자 얼굴 숨기기</label>
    <label class="check"><input type="checkbox" id="seqAuto" checked> 인원수에 맞는 워크플로 · 크기 자동</label>
    <label class="check"><input type="checkbox" id="seqKey" checked> 핵심 태그 가중치 사용</label>
    <div class="field"><label>가중치 <small class="muted">(1.0 = 없음 · 높을수록 강하게, 1.5 넘으면 그림이 깨질 수 있음)</small></label><div class="seq-wts" id="seqWts"></div></div>
    <div id="seqMyFields"></div>
    <div class="field"><label>만들 단계</label><div class="seq-stages" id="seqStages">${STAGES.map((s, i) => `${i === 0 ? '<div class="seq-sth">도입 — 대화 → 키스 → 애무 <small>(옷 입은 채 · 체위 태그 없이)</small></div>' : i === NPRE ? '<div class="seq-sth">본편 — 체위</div>' : ""}<label class="seq-st"${s.pre ? ` title="혼자 체위: ${escH(s.solo)}"` : ""}><input type="checkbox" data-i="${i}" checked><span>${i + 1}. ${s.name}</span></label>`).join("")}</div><div class="row" style="margin-top:6px"><button type="button" class="mini" id="seqAll">25장 전부</button><button type="button" class="mini" id="seqMain">본편 15장</button><button type="button" class="mini" id="seqCore">핵심 8장</button><span class="muted small" id="seqCount"></span></div></div>
    <div class="gen-buttons"><button id="seqRun" class="primary big">시퀀스 생성 <small>체위당 단계별 1장씩</small></button><button id="seqPreview">미리보기</button><button id="seqStop" class="danger-ghost">중단</button></div>
    <div class="muted" id="seqInfo"></div>
  </div>
</div>
<div class="card seq-char">
  <div class="card-head"><h3>캐릭터 프롬프트 <small class="muted">(시퀀스 전용 · 고정 — "2. 설정"의 캐릭터에서 고르면 채워짐. 의상·도구·체위·반응·배경은 위에서 고른 대로 장면마다 붙음)</small></h3></div>
  <div class="grid2">
    <div class="field"><label>긍정 (캐릭터)</label><textarea id="seqPos" spellcheck="false" placeholder="예: 1girl, adult, long black hair, red eyes, witch …"></textarea><div class="chips" id="seqPosChips"></div></div>
    <div class="field"><label>부정</label><textarea id="seqNeg" class="short" spellcheck="false" placeholder="비워 두면 기본 부정 프롬프트 사용"></textarea><div class="chips" id="seqNegChips"></div></div>
  </div>
</div>
<div class="card">
  <div class="card-head"><h3>화풍 <small class="muted">(작가 · 파스텔 홀로그램 · 푸른 밤 — 여러 개 고를 수 있음, 모든 단계에 적용 · 견본은 가운데 휠 클릭으로 크게)</small></h3></div>
  <div id="seqStyle"></div>
</div>
<div class="card">
  <div class="card-head"><h3>3. 연출 · 효과 <small class="muted">(선택 — 고른 단계부터 적용)</small></h3><div class="head-tools"><button class="mini primary-ghost" id="seqFxEdit">+ 내 태그</button><button class="mini" id="seqFxClear">모두 끄기</button></div></div>
  <div id="seqFx"></div>
  <div class="seq-fxsel" id="seqFxSel"></div>
</div>
<div class="card">
  <div class="card-head"><h3>4. 결과 <span class="seq-prog" id="seqProg"></span></h3><span class="muted" id="seqSeed"></span></div>
  <div class="seq-resume hidden" id="seqResume"><span></span><button type="button" class="primary" id="seqResumeGo">이어서 생성</button><button type="button" class="mini" id="seqResumeDrop">버리기</button></div>
  <div id="seqSlots"></div>
</div>`;
  $s("#tab-gen").after(sec);
  if (window.BC_HAT) $s("#seqHatSlot").append(window.BC_HAT.makeSelect());
  else $s("#seqHatSlot").closest(".field").remove();
  renderParts();
  renderOutfitBg();
  let screen = st.get("screen", "auto");
  $s("#seqScreen").value = screen; if ($s("#seqScreen").value !== screen) { screen = "auto"; $s("#seqScreen").value = "auto"; }
  const screenKey = () => (screen === "auto" ? screenFor(pickedItems(bgs, isBgGroup).flatMap((x) => x.it.tags)) : screen);   // 배경 여러 개면 전부 보고 판단
  const drawScreen = () => { const k = screenKey(); $s("#seqScreenNow").textContent = screen === "auto" ? `→ 지금: ${k ? SCREEN[k].n : "없음"}` : ""; };
  $s("#seqScreen").addEventListener("change", () => { screen = $s("#seqScreen").value; st.set("screen", screen); drawScreen(); });
  for (const id of ["seqTool1", "seqTool2", "seqToolFrom"]) $s("#" + id).addEventListener("change", () => {
    tools = { t1: $s("#seqTool1").value, t2: $s("#seqTool2").value, from: +$s("#seqToolFrom").value || 0 }; st.set("tools", tools);
  });

  // ---------- 시퀀스 전용 캐릭터 프롬프트 (생성 탭과 분리) ----------
  const seqEd = { pos: new PromptEditor($s("#seqPos"), $s("#seqPosChips")), neg: new PromptEditor($s("#seqNeg"), $s("#seqNegChips")) };
  function cleanCharPrompt(str) {   // 체위·인원·반응·효과·배경 태그를 빼고 캐릭터 태그만
    let s = String(str || "");
    for (const x of baseStripSet()) { const n = rm(s, x); if (n != null) s = n; }
    for (const x of ["solo focus", "pov"]) { const n = rm(s, x); if (n != null) s = n; }
    return s;
  }
  seqEd.pos.value = store.get("prompt_seqPos", "") || "";
  seqEd.neg.value = store.get("prompt_seqNeg", "") || "";
  // 처음 한 번만: 앱이 생성 탭 프롬프트를 다 불러온 뒤, 정리해서 캐릭터 프롬프트로 가져옴
  function initChar() {
    if (st.get("charInit", false) || seqEd.pos.value.trim()) return true;
    if (!editors.positive.value.trim()) return false;
    seqEd.pos.value = cleanCharPrompt(editors.positive.value);
    if (!seqEd.neg.value.trim()) seqEd.neg.value = editors.negative.value;
    st.set("charInit", true);
    return true;
  }
  { let n = 0; const tick = () => { if (!initChar() && ++n < 20) setTimeout(tick, 500); }; setTimeout(tick, 800); }
  // ---------- 캐릭터 선택 (설정 카드) — 고르면 캐릭터 프롬프트가 채워짐 ----------
  const charSel = $s("#seqChar");
  const charPrompt = (c) => {   // 체위·반응·배경 태그는 빼되 "1girl, solo"는 남김 (솔로/솔로 제외 구분 유지 — 인원은 체위에 맞춰 시퀀스가 정리)
    if (c.raw) return String(c.positive || "");   // 캐릭터 고유 태그(색·옷 등)는 그대로
    let s = String(c.positive || "");
    for (const x of baseStripSet()) { if (x === "solo" || x === "1girl") continue; const n = rm(s, x); if (n != null) s = n; }
    for (const x of ["solo focus", "pov"]) { const n = rm(s, x); if (n != null) s = n; }
    return s;
  };
  function fillChars() {
    const cs = state.defaultCharacters || [], cur = st.get("charLabel", "");
    charSel.innerHTML = `<option value="">직접 입력 (아래 칸)</option>` + cs.map((c) => `<option value="${escH(c.label)}">${escH(c.label)}</option>`).join("");
    charSel.value = cs.some((c) => c.label === cur) ? cur : "";
  }
  fillChars(); setTimeout(fillChars, 1500); addEventListener("bc-chars-changed", fillChars);
  charSel.addEventListener("change", () => {
    const c = (state.defaultCharacters || []).find((x) => x.label === charSel.value);
    if (!c) { st.set("charLabel", ""); return; }
    seqEd.pos.value = charPrompt(c); seqEd.neg.value = c.negative || "";
    st.set("charLabel", c.label); st.set("charInit", true);
    toast(`캐릭터: ${c.label}`, "ok");
  });
  // 캐릭터 프롬프트를 직접 고치면 선택 표시는 "직접 입력"으로
  seqEd.pos.ta.addEventListener("input", () => {
    const c = (state.defaultCharacters || []).find((x) => x.label === charSel.value);
    if (c && seqEd.pos.value.trim() !== charPrompt(c).trim()) { charSel.value = ""; st.set("charLabel", ""); }
  });

  const css = document.createElement("style");
  css.textContent = `
.seq-char textarea{min-height:90px}
.seq-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(420px,1.25fr);gap:14px;align-items:start}
@media (max-width:980px){.seq-layout{grid-template-columns:1fr}}
#seqPoses h4{margin:12px 0 6px;font-size:12px;color:var(--muted);font-weight:600}
#seqPoses h4:first-child{margin-top:0}
.seq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.seq-tile{min-height:54px;border-radius:12px;color:var(--text);font-size:13px;line-height:1.3;word-break:keep-all}
.seq-tile.on{background:var(--accent)!important;color:#fff!important;font-weight:600}
.seq-stages{display:flex;flex-wrap:wrap;gap:6px}
.seq-resume{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--accent) 12%,var(--panel2))}
.seq-resume.hidden{display:none}
.seq-resume span{flex:1;min-width:180px;font-size:13px;font-weight:600}
.seq-resume button{flex:none}
.seq-prog{margin-left:8px;font-size:13px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}
.seq-prog small{font-weight:500;color:var(--muted);margin-left:4px}
.mt-stack{display:flex;flex-direction:column;gap:6px}
#seqPartsBox .grid2,.seq-my{gap:6px}
.mt{border-radius:12px;background:var(--panel2)}
.mt summary{display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer;list-style:none;font-size:13px;min-height:40px}
.mt summary::-webkit-details-marker{display:none}
.mt-l{font-weight:600;flex:none;color:var(--text)}
.mt-s{flex:1;min-width:0;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt-s.has{color:var(--text)}
.mt-s b{display:inline-block;min-width:18px;padding:0 5px;margin-right:4px;border-radius:999px;background:var(--accent);color:#fff;font-size:11px;text-align:center}
.mt-x{flex:none;padding:3px 10px;font-size:11.5px;border-radius:999px}
.mt-a{flex:none;color:var(--muted);transition:transform .2s}
.mt[open] .mt-a{transform:rotate(180deg)}
.mt-b{padding:2px 10px 10px;max-height:520px;overflow:auto}
.mt-b h5{margin:8px 0 5px;font-size:11.5px;color:var(--muted);font-weight:600}
.mt-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px}
.mt-t{display:flex;align-items:center;gap:7px;min-height:42px;padding:6px 9px;border-radius:10px;background:var(--panel);color:var(--text);font-size:12.5px;line-height:1.25;text-align:left;word-break:keep-all}
.mt-t i{flex:none;width:17px;height:17px;border-radius:5px;box-shadow:inset 0 0 0 1.6px var(--muted);display:grid;place-items:center;font-style:normal}
.mt-t.on{box-shadow:inset 0 0 0 1.6px var(--accent);font-weight:600}
.mt-t.on i{background:var(--accent);box-shadow:none}
.mt-t.on i::after{content:"✓";color:#fff;font-size:12px;line-height:1}
.seq-wts{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}
.seq-wts label{display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:var(--muted);margin:0}
.seq-wts select{padding:4px 22px 4px 8px;font-size:12.5px}
.seq-sth{flex-basis:100%;font-size:12px;color:var(--muted);font-weight:600;margin-top:4px}
.seq-sth small{font-weight:400}
.seq-multi{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px}
.seq-multi .check{margin:0}
.seq-multi{flex-wrap:wrap;justify-content:flex-start}
.seq-multi>.check:first-child,.seq-mhint{flex:1 1 100%}
.seq-mhint{margin:-4px 0 2px;font-size:11.5px}
.seq-multi #seqWith5Box{flex:none;white-space:nowrap}
.seq-pg.off5{display:none}
#seqMultiClear,#seqMultiAll{flex:none}
.seq-tile .ord{display:inline-block;min-width:18px;margin-right:4px;border-radius:999px;background:rgba(255,255,255,.25);font-size:11px}
.seq-grp{margin-bottom:16px}
.seq-gh{font-size:13.5px;font-weight:700;margin:0 0 8px}
.seq-gh small{font-weight:400;color:var(--muted);margin-left:6px}
#seqKissBox.hidden{display:none}
#seqStop,#seqPreview{flex:none;white-space:nowrap}
.seq-seg{display:inline-flex;background:var(--fill,var(--panel2));border-radius:10px;padding:2px;gap:2px}
.seq-seg button{background:transparent;color:var(--text);border-radius:8px;padding:6px 18px;font-size:13px;font-weight:500;border:0}
.seq-seg button.on{background:var(--seg-on,var(--accent));color:var(--text);font-weight:700;box-shadow:0 3px 8px rgba(0,0,0,.12)}
.seq-pg.hidden{display:none}
#seqFx h4{margin:12px 0 6px;font-size:12px;color:var(--muted);font-weight:600}
#seqFx h4:first-child{margin-top:0}
.seq-fx{display:flex;flex-direction:column;gap:1px;min-height:50px;border-radius:12px;color:var(--text);font-size:13px;line-height:1.25}
.seq-fx small{font-size:10.5px;color:var(--muted);font-weight:400}
.seq-fx.on{background:var(--accent)!important;color:#fff!important;font-weight:600}
.seq-fx.on small{color:rgba(255,255,255,.8)}
.seq-fxsel{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.seq-fxsel:empty{display:none}
.seq-fxsel .r{display:flex;align-items:center;gap:6px;background:var(--panel2);border-radius:999px;padding:3px 4px 3px 12px;font-size:12.5px}
.seq-fxsel select{width:auto;padding:3px 26px 3px 8px;font-size:12px;border-radius:999px}
.seq-st{display:flex;align-items:center;gap:6px;background:var(--panel2);border-radius:999px;padding:4px 10px 4px 4px;font-size:13px;cursor:pointer}
.seq-st input{width:34px!important;height:20px!important}
.seq-st input::before{width:16px!important;height:16px!important}
.seq-st input:checked::before{transform:translateX(14px)!important}
#seqStyle h4{margin:10px 0 6px;font-size:13px;color:var(--muted)}#seqStyle h4:first-child{margin-top:0}
.sty-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px;max-height:560px;overflow:auto;padding:2px}
.sty-t{display:flex;flex-direction:column;align-items:stretch;gap:3px;padding:4px;font-size:11px;line-height:1.25;text-align:left;border-radius:10px}
.sty-t img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:7px;display:block}
.sty-t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sty-t small{display:none}
.sty-t.on{box-shadow:0 0 0 2px var(--accent);border-color:var(--accent);color:var(--accent);font-weight:700}
.seq-slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.seq-slot{background:var(--panel2);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.seq-slot .hd{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;font-size:13px;font-weight:600}
.seq-slot .hd span{font-weight:500;font-size:12px;color:var(--muted);margin-left:auto}
.seq-slot .hd .re{display:none;flex:none;margin-left:6px;padding:2px 8px;font-size:13px;line-height:1.2;border-radius:8px}
.seq-slot.done .hd .re,.seq-slot.err .hd .re{display:inline-block}
.seq-slot .im{position:relative;aspect-ratio:var(--ar,2/3);background:var(--bg);display:grid;place-items:center;color:var(--muted);font-size:12px;cursor:default}
.seq-slot .im img{width:100%;height:100%;object-fit:cover;display:block;cursor:zoom-in}
.seq-slot .bar{position:absolute;left:0;bottom:0;height:3px;background:var(--accent);width:0;transition:width .3s}
.seq-slot.done .hd span{color:var(--ok)}.seq-slot.err .hd span{color:var(--danger)}
.seq-slot.run .hd span{color:var(--accent)}
.seq-slot details{padding:6px 10px 10px;font-size:11.5px;color:var(--muted)}
.seq-slot details>div{margin-top:4px;max-height:220px;overflow:auto}
.sq-cs{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0 8px}
.sq-c{background:var(--panel);border-radius:999px;padding:2px 8px;font-size:11.5px;color:var(--text);cursor:default}
.sq-c.en{color:var(--muted)}
.sq-c small{color:var(--accent);margin-left:2px}
.sq-c.mine{background:color-mix(in srgb,var(--c5) 22%,var(--panel));color:var(--text);box-shadow:inset 0 0 0 1px var(--c5)}
.sq-mine{font-size:11.5px;color:var(--c5);margin:2px 0 8px;font-weight:600}
.sq-mine small{color:var(--muted);font-weight:400}
.sq-mine.none{color:var(--muted);font-weight:400}
.sq-star{color:var(--c5)}
.sq-brk{flex-basis:100%;font-size:10px;color:var(--accent2);font-weight:700}
.sq-raw summary{cursor:pointer;font-size:11px}
.sq-raw div{white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Consolas,monospace;font-size:11px;margin-top:4px}`;
  document.head.append(css);

  // ---------- 체위 타일 ----------
  let pose = st.get("pose", null);   // "gi-ii"
  const headOf = (t) => (/^1인/.test(t) ? "1" : /^2인/.test(t) ? "2" : /^5인/.test(t) ? "5" : "all");
  $s("#seqPoses").innerHTML = poseGroups.map((g) => `<div class="seq-pg" data-n="${headOf(g.t)}"><h4>${escH(g.t)}</h4><div class="seq-grid">${g.it.map((it, ii) => `<button type="button" class="seq-tile" data-p="${g.gi}-${ii}">${escH(it.n)}</button>`).join("")}</div></div>`).join("");
  // 인원 선택 → 체위 목록 거르기
  let people = st.get("people", "all");
  function applyPeople() {
    sec.querySelectorAll("#seqPeople button").forEach((b) => b.classList.toggle("on", b.dataset.v === people));
    sec.querySelectorAll(".seq-pg").forEach((d) => d.classList.toggle("hidden", people !== "all" && d.dataset.n !== people));
    const p = pose && G[+pose.split("-")[0]];
    if (p && people !== "all" && headOf(p.t) !== people) { pose = null; st.set("pose", null); }   // 다른 인원의 체위가 골라져 있으면 해제
    if (people !== "all" && !multi) { poses = poses.filter((k) => G[+k.split("-")[0]] && headOf(G[+k.split("-")[0]].t) === people); st.set("poses", poses); }
  }
  // ---------- 여러 체위 한 번에 ----------
  let multi = st.get("multi", false);
  let poses = st.get("poses", []);   // 고른 순서대로 "gi-ii"
  const itemOf = (key) => { if (!key) return null; const [g, i] = key.split("-").map(Number); const gg = G[g]; return gg && gg.it[i] ? { g: gg, it: gg.it[i], key } : null; };
  const HEAD_ORDER = { 1: 0, 2: 1, 5: 2, all: 3 };
  let with5 = st.get("with5", false);   // 여러 체위 모드에서 5인은 켤 때만
  // 만들 체위 목록 — 여러 체위면 1인 → 2인 순 (5인은 "5인 포함"을 켰을 때만 마지막에, 같은 인원 안에선 고른 순서)
  function selPoses() {
    if (!multi) { const p = poseItem(); return p ? [p] : []; }
    return poses.map(itemOf).filter(Boolean).filter((p) => with5 || headOf(p.g.t) !== "5").map((p, i) => ({ p, i })).sort((a, b) => HEAD_ORDER[headOf(a.p.g.t)] - HEAD_ORDER[headOf(b.p.g.t)] || a.i - b.i).map((x) => x.p);
  }
  // ---------- 자위 도구 (자위 체위일 때만) ----------
  const toolGroup = () => G.find((g) => g.t === "자위 도구");
  const isToolPose = (p = poseItem()) => !!p && p.g.t === "1인 자위";
  let tools = st.get("tools", { t1: "", t2: "", from: 0 });
  function renderTools() {
    const tg = toolGroup(), box = $s("#seqToolBox"); if (!tg || !box) return;
    const opts = `<option value="">없음</option>` + tg.it.map((it) => `<option value="${escH(it.n)}">${escH(it.n)}</option>`).join("");
    $s("#seqTool1").innerHTML = opts; $s("#seqTool2").innerHTML = opts;
    $s("#seqToolFrom").innerHTML = PHASES.slice(0, 4).map((s, i) => `<option value="${i}">${i + 1}. ${s}부터</option>`).join("");
    $s("#seqTool1").value = tools.t1 || ""; $s("#seqTool2").value = tools.t2 || ""; $s("#seqToolFrom").value = String(tools.from || 0);
  }
  function showTools() {
    const ps = selPoses();
    const b = $s("#seqToolBox"); if (b) b.classList.toggle("hidden", !ps.some((p) => isToolPose(p)));
    const k = $s("#seqKissBox"); if (k) k.classList.toggle("hidden", !!ps.length && ps.every((p) => p.g.t.startsWith("1인")));   // 혼자 체위만이면 키스 설정 숨김
  }
  function markPose() {
    showTools();
    $s("#seqMulti").checked = multi;
    $s("#seqMultiClear").classList.toggle("hidden", !multi);
    $s("#seqMultiAll").classList.toggle("hidden", !multi);
    $s("#seqWith5Box").classList.toggle("hidden", !multi);
    $s("#seqWith5").checked = with5;
    // 여러 체위 모드에서 5인을 끄면 5인 체위 목록을 숨김
    sec.querySelectorAll('.seq-pg[data-n="5"]').forEach((d) => d.classList.toggle("off5", multi && !with5));
    const order = selPoses().map((p) => p.key);
    sec.querySelectorAll(".seq-tile").forEach((b) => {
      const on = multi ? poses.includes(b.dataset.p) : b.dataset.p === pose;
      b.classList.toggle("on", on);
      const o = $s(".ord", b); if (o) o.remove();
      if (multi && on) b.prepend(Object.assign(document.createElement("span"), { className: "ord", textContent: order.indexOf(b.dataset.p) + 1 }));
    });
    const ps = selPoses();
    $s("#seqPoseName").textContent = multi
      ? (ps.length ? `${ps.length}개 체위 선택` : "여러 개를 고르세요")
      : ps[0] ? `${ps[0].g.t} · ${ps[0].it.n}` : "하나를 고르세요";
    try { countStages(); } catch {}   // 처음 그릴 땐 아직 정의 전
  }
  function poseItem() { return itemOf(pose); }
  $s("#seqPoses").onclick = (e) => {
    const b = e.target.closest(".seq-tile"); if (!b) return;
    if (multi && !with5 && headOf(G[+b.dataset.p.split("-")[0]].t) === "5") return;
    if (multi) { const k = b.dataset.p; poses = poses.includes(k) ? poses.filter((x) => x !== k) : [...poses, k]; st.set("poses", poses); }
    else { pose = b.dataset.p; st.set("pose", pose); }
    markPose();
  };
  // 여러 체위: 지금 인원(혼자/2인/전체)에 보이는 체위 전부를 선택 (5인은 "5인 포함"일 때만) — 필요 없는 건 타일을 눌러 끔
  function selectAllVisible() {
    poses = [...sec.querySelectorAll(".seq-pg")].filter((d) => (people === "all" || d.dataset.n === people) && (with5 || d.dataset.n !== "5"))
      .flatMap((d) => [...d.querySelectorAll(".seq-tile")].map((b) => b.dataset.p));
    st.set("poses", poses);
  }
  $s("#seqMulti").onchange = () => {
    multi = $s("#seqMulti").checked; st.set("multi", multi);
    if (multi) selectAllVisible();
    // 같은 캐릭터의 "여러 체위 한 번에 생성 시 사용" 버전이 있으면 그걸로 바꿈 (끄면 솔로 버전으로)
    const cur = st.get("charLabel", ""), nm = cur.replace(/\s*\((솔로|솔로 제외|여러 체위 한 번에 생성 시 사용)\)$/, "");
    if (nm !== cur) {
      const want = `${nm} (${multi ? "여러 체위 한 번에 생성 시 사용" : "솔로"})`;
      if (want !== cur && (state.defaultCharacters || []).some((c) => c.label === want)) { charSel.value = want; charSel.dispatchEvent(new Event("change")); }
    }
    if (!multi && poses.length && !poses.includes(pose)) { pose = poses[0]; st.set("pose", pose); }
    markPose();
  };
  $s("#seqWith5").onchange = () => {
    with5 = $s("#seqWith5").checked; st.set("with5", with5);
    selectAllVisible();
    markPose();
  };
  $s("#seqMultiClear").onclick =() => { poses = []; st.set("poses", poses); markPose(); };
  // 첫 키스 — 누가 먼저
  let kissBy = st.get("kissBy", "mutual");
  const drawKiss = () => sec.querySelectorAll("#seqKissBy button").forEach((b) => b.classList.toggle("on", b.dataset.v === kissBy));
  $s("#seqKissBy").onclick = (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; kissBy = b.dataset.v; st.set("kissBy", kissBy); drawKiss(); };
  drawKiss();
  $s("#seqPeople").onclick = (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; people = b.dataset.v; st.set("people", people); applyPeople(); if (multi) selectAllVisible(); markPose(); };
  $s("#seqMultiAll").onclick = () => { selectAllVisible(); markPose(); };
  applyPeople();
  renderTools();
  markPose();

  // ---------- 연출·효과 타일 ----------
  let fx = st.get("fx", {});    // key -> 시작 단계 인덱스
  let fxU = st.get("fxu", {});  // key -> 끝 단계 인덱스
  const rangeTxt = (a, b) => (b >= 4 ? `${a + 1}단계부터` : a === b ? `${a + 1}단계만` : `${a + 1}~${b + 1}단계`);
  function renderFxTiles() {
    const ok = (k) => fxList.some((f) => f.key === k);
    fx = Object.fromEntries(Object.entries(fx).filter(([k]) => ok(k)));
    fxU = Object.fromEntries(Object.entries(fxU).filter(([k]) => ok(k)));
    const all = [...new Set(fxList.map((f) => f.g))], fxGroups = all.filter((g) => !STYLE_G.includes(g));
    $s("#seqStyle").innerHTML = all.filter((g) => STYLE_G.includes(g)).map((g) => `<h4>${escH(g)}</h4><div class="sty-grid">${fxList.filter((f) => f.g === g).map((f) =>
      `<button type="button" class="seq-fx sty-t${f.img ? " th" : ""}" data-k="${escH(f.key)}"${f.full ? ` title="${escH(f.n)} — 가운데 휠 클릭: 견본 크게"` : ""}>${f.img ? `<img src="${f.img}" alt="" loading="lazy"${f.full ? ` data-full="${f.full}"` : ""}>` : ""}<span>${escH(f.n)}</span><small></small></button>`).join("")}</div>`).join("");
    $s("#seqFx").innerHTML = fxGroups.map((g) => `<h4>${escH(g)}</h4><div class="seq-grid">${fxList.filter((f) => f.g === g).map((f) =>
      `<button type="button" class="seq-fx" data-k="${escH(f.key)}">${escH(f.n)}<small>${rangeTxt(f.from, f.until)}</small></button>`).join("")}</div>`).join("");
  }
  renderFxTiles();
  addEventListener("bc-tags-changed", () => {
    renderMyFields(); renderParts();
    collectFx(); renderFxTiles(); drawFx();
    renderOutfitBg(); drawScreen();
  });
  const untilOf = (f) => fxU[f.key] ?? f.until;
  function drawFx() {
    sec.querySelectorAll(".seq-fx").forEach((b) => {
      const on = b.dataset.k in fx;
      b.classList.toggle("on", on);
      const f = fxList.find((x) => x.key === b.dataset.k);
      $s("small", b).textContent = on ? rangeTxt(fx[f.key], untilOf(f)) : rangeTxt(f.from, f.until);
    });
    $s("#seqFxSel").innerHTML = Object.keys(fx).map((k) => {
      const f = fxList.find((x) => x.key === k), u = untilOf(f);
      return `<div class="r">${escH(f.n)}<select data-k="${escH(k)}" data-w="from">${PHASES.map((s, i) => `<option value="${i}"${i === fx[k] ? " selected" : ""}>${i + 1}. ${s}부터</option>`).join("")}</select>`
        + `<select data-k="${escH(k)}" data-w="until">${PHASES.map((s, i) => `<option value="${i}"${i === u ? " selected" : ""}>${i === 4 ? "끝까지" : `${i + 1}. ${s}까지`}</option>`).join("")}</select></div>`;
    }).join("");
    st.set("fx", fx); st.set("fxu", fxU);
  }
  $s("#seqStyle").onclick = (e) => $s("#seqFx").onclick(e);
  $s("#seqStyle").addEventListener("auxclick", (e) => { const im = e.target.closest(".sty-t") && e.target.closest(".sty-t").querySelector("img[data-full]"); if (e.button === 1 && im) { e.preventDefault(); open(im.dataset.full, "_blank"); } });
  $s("#seqFx").onclick = (e) => {
    const b = e.target.closest(".seq-fx"); if (!b) return;
    const f = fxList.find((x) => x.key === b.dataset.k);
    if (f.key in fx) { delete fx[f.key]; delete fxU[f.key]; }
    else fx[f.key] = f.from;
    drawFx();
  };
  $s("#seqFxSel").onchange = (e) => {
    const s = e.target.closest("select"); if (!s) return;
    const k = s.dataset.k, v = +s.value, f = fxList.find((x) => x.key === k);
    if (s.dataset.w === "until") { fxU[k] = v; if (fx[k] > v) fx[k] = v; }
    else { fx[k] = v; if (untilOf(f) < v) fxU[k] = v; }
    drawFx();
  };
  $s("#seqFxClear").onclick = () => { fx = {}; fxU = {}; drawFx(); };
  $s("#seqFxEdit").onclick = () => window.BC_CUSTOM && window.BC_CUSTOM.open();
  // 선택 초기화 — 시퀀스의 모든 선택을 기본값으로
  $s("#seqReset").onclick = () => {
    if (!confirm("시퀀스 선택을 모두 초기화할까요?\n(체위·인원·복장·배경·옷 처리·연출 효과·내 태그 칸·스위치·단계)")) return;
    pose = null; st.set("pose", null);
    multi = false; st.set("multi", false); poses = []; st.set("poses", []); with5 = false; st.set("with5", false);
    kissBy = "mutual"; st.set("kissBy", kissBy); drawKiss();
    people = "all"; st.set("people", "all"); applyPeople(); markPose();
    outfits = []; st.set("outfits", []); bgs = []; st.set("bgs", []); renderOutfitBg();
    $s("#seqCloth").value = "expo"; st.set("seqCloth", "expo");
    for (const id of OPT) { $s("#" + id).checked = true; st.set(id, true); }
    wts = { ...WT_DEF }; st.set("wts", wts); renderWts();
    stageBoxes.forEach((b) => (b.checked = true)); saveStages();
    fx = {}; fxU = {}; drawFx();
    myf = {}; st.set("myf", {}); renderMyFields();
    parts = {}; st.set("parts", {}); renderParts();
    tools = { t1: "", t2: "", from: 0 }; st.set("tools", tools); renderTools();
    screen = "auto"; st.set("screen", screen); $s("#seqScreen").value = screen; drawScreen();
    runToken++; checkWait();   // 다음 체위 대기 중이었다면 멈춤
    $s("#seqSlots").innerHTML = ""; slots = []; byId.clear(); updProg();
    $s("#seqInfo").textContent = ""; $s("#seqSeed").textContent = "";
    toast("시퀀스 선택을 초기화했습니다", "ok");
  };
  drawFx();

  // 설정 저장/복원
  const OPT = ["seqSameSeed", "seqMale", "seqAuto", "seqKey"];
  OPT.forEach((id) => { const el = $s("#" + id); el.checked = st.get(id, el.checked); el.onchange = () => st.set(id, el.checked); });
  // 가중치: 핵심 태그(체위·키스·음문 등) / 복장 세트 / 부위별 복장
  const WT_SLOTS = [["key", "핵심 태그"], ["outfit", "복장"], ...PART_SLOTS];
  const WT_DEF = { key: 1.3, outfit: 1.2, top: 1.2, bottom: 1.2, under: 1.2, leg: 1.2, acc: 1.1 };
  const WT_VALS = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6];
  var wts = { ...WT_DEF, ...st.get("wts", {}) };
  function renderWts() {
    $s("#seqWts").innerHTML = WT_SLOTS.map(([k, n]) => `<label>${n}<select data-w="${k}">${WT_VALS.map((v) => `<option value="${v}"${v === wts[k] ? " selected" : ""}>${v.toFixed(1)}</option>`).join("")}</select></label>`).join("");
  }
  $s("#seqWts").onchange = (e) => { const s = e.target.closest("select[data-w]"); if (!s) return; wts[s.dataset.w] = +s.value; st.set("wts", wts); };
  renderWts();
  ["seqCloth"].forEach((id) => { const el = $s("#" + id); el.value = st.get(id, el.value); if (!el.value) el.selectedIndex = 0; el.onchange = () => st.set(id, el.value); });
  const stageBoxes = [...sec.querySelectorAll("#seqStages input")];
  const savedStages = st.get("stages", null);
  if (savedStages && savedStages.length === STAGES.length) stageBoxes.forEach((b, i) => (b.checked = savedStages[i] !== false));   // 예전 5단계 저장값은 무시
  else if (savedStages && savedStages.length === MAIN.length) stageBoxes.forEach((b, i) => (b.checked = i < NPRE || savedStages[i - NPRE] !== false));   // 예전 15장 저장값 → 도입 10장은 켜고 본편에 그대로
  // 장 수: 여러 체위면 도입은 인원마다 한 번 + 본편은 체위마다
  function jobCount(ps, which) {
    if (ps.length <= 1) return { total: which.length, text: `${which.length}장 생성` };
    const pre = which.filter((si) => si < NPRE).length, body = which.length - pre, heads = new Set(ps.map((p) => headOf(p.g.t))).size;
    const total = pre * heads + body * ps.length;
    return { total, text: `${pre ? `도입 ${pre}장 × 인원 ${heads} + ` : ""}본편 ${body}장 × 체위 ${ps.length} = ${total}장` };
  }
  const countStages = () => { const which = stageBoxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0); $s("#seqCount").textContent = jobCount(multi ? selPoses() : [null], which).text; };
  const saveStages = () => { st.set("stages", stageBoxes.map((x) => x.checked)); countStages(); };
  stageBoxes.forEach((b) => (b.onchange = saveStages));
  $s("#seqAll").onclick = () => { stageBoxes.forEach((b) => (b.checked = true)); saveStages(); };
  $s("#seqMain").onclick = () => { stageBoxes.forEach((b, i) => (b.checked = i >= NPRE)); saveStages(); };
  $s("#seqCore").onclick = () => { stageBoxes.forEach((b, i) => (b.checked = CORE.includes(i))); saveStages(); };
  countStages();
  drawScreen();

  // ---------- 내 태그 그룹마다 설정 칸 자동 생성 ----------
  let myf = Object.fromEntries(Object.entries(st.get("myf", {})).map(([k, v]) => [k, arr(v)]));   // 그룹 제목 -> 고른 항목 이름 배열
  const rangeLabel = (it) => { const a = it.from || 0, b = it.until == null ? 4 : it.until; return a === 0 && b === 4 ? "" : a === b ? ` · ${a + 1}단계만` : b === 4 ? ` · ${a + 1}단계부터` : ` · ${a + 1}~${b + 1}단계`; };
  function renderMyFields() {
    const box = $s("#seqMyFields");
    const groups = G.filter((g) => g.c && g.kind === "fx");
    const look = window.BC_KO_LOOKUP || (() => "");
    box.innerHTML = groups.length
      ? `<div class="field"><label>내 태그 <small class="muted">(내 태그의 '효과·연출' 그룹마다 자동으로 생기는 칸 — 여러 개 체크 가능, 고른 항목이 단계 범위에 맞춰 들어감)</small></label><div class="grid2 seq-my">${groups.map((g, i) => `<div data-gi="${i}"></div>`).join("")}</div></div>`
      : `<div class="muted small" style="margin:4px 0 10px">내 태그에서 '효과·연출' 그룹을 만들면 여기에 그룹별 선택 칸이 자동으로 생깁니다.</div>`;
    groups.forEach((g, i) => mtRender($s(`[data-gi="${i}"]`, box), {
      label: g.t, empty: "없음",
      groups: () => [{ t: "", items: g.it.map((it) => ({ v: it.n, n: (look(it.n) || it.n) + rangeLabel(it) })) }],
      get: () => myf[g.t] || [], set: (a) => { if (a.length) myf[g.t] = a; else delete myf[g.t]; st.set("myf", myf); },
    }));
  }
  renderMyFields();

  // ---------- 프롬프트 조립 ----------
  const norm = (t) => t.trim().replace(/^\(+|\)+$/g, "").replace(/:[\d.]+$/, "").toLowerCase();
  function build(si, p = poseItem()) {
    const S = STAGES[si], pre = S.pre || "";   // 도입(대화·키스·애무)이면 체위 태그 대신 인원 태그만
    const k = $s("#seqKey").checked;
    // 자위: 아래쪽을 차지하는 도구(딜도·마사지기·로터 등)를 쓰는 단계면 체위의 손가락 태그도 도구로 대신
    const lowTool = !pre && isToolPose(p) && S.phase >= (tools.from || 0) && S.phase <= 3
      && [tools.t1, tools.t2].filter(Boolean).some((n) => { const it = toolGroup() && toolGroup().it.find((x) => x.n === n); return it && it.tags.some((t) => LOW_TOOL_RE.test(t)); });
    const pt = pre ? p.it.tags.filter((t) => PEOPLE_RE.test(t.toLowerCase())) : lowTool ? p.it.tags.filter((t) => !HAND_LOW.has(t)) : p.it.tags;
    const hasBoys = pt.some((t) => /^(\dboys?|multiple boys)$/.test(t));
    const mf = $s("#seqMale").checked && hasBoys;
    const KW = wts.key || 1.2;
    const wrap = (t, w) => (w && w !== 1 && !/^\(.*\)$/.test(t) ? `(${t}:${w})` : t);
    const poseStr = pt.map((t) => (k && KEY.has(t) ? wrap(t, KW) : t)).join(", ");
    const W = new Map();   // 복장·부위 태그 → 가중치
    let base = seqEd.pos.value.trim();   // 시퀀스 전용 캐릭터 프롬프트
    const solo = p.g.t.startsWith("1인");   // 혼자 / 자위: solo 유지, 상대가 필요한 흔적 태그는 뺌
    for (const t of [...(solo ? [] : ["solo", "solo focus"]), ...(pt.includes("multiple girls") ? ["1girl"] : []), ...pt]) { const n = rm(base, t); if (n != null) base = n; }
    // 생성 탭 프롬프트에 남아 있는 다른 체위·인원·반응·효과·배경 태그는 빼고 캐릭터 태그만 남김
    const cleaned = [];
    if (base) {
      const ptSet = new Set(pt.map((x) => x.toLowerCase()));
      // 고른 캐릭터(raw)의 고유 태그는 지우지 않음 — 머리색·옷 색 등 보호
      const rc = (state.defaultCharacters || []).find((c) => c.raw && c.label === st.get("charLabel", ""));
      const prot = new Set(rc ? rc.positive.split(",").map((x) => x.trim().replace(/^\(+|\)+$/g, "").replace(/^(.+?):[\d.]+$/, "$1").toLowerCase()) : []);
      for (const x of baseStripSet()) {
        if (ptSet.has(x) || prot.has(x)) continue;
        const n = rm(base, x); if (n != null) { base = n; cleaned.push(x); }
      }
      if (solo) for (const x of SOLO_PARTNER) { const n = rm(base, x); if (n != null) { base = n; cleaned.push(x); } }
      // 시퀀스에서 복장을 골랐으면 생성 탭 프롬프트의 기본 복장 태그(오피스·바니걸 등)도 뺌 — 고른 복장이 우선
      if (pickedItems(outfits, isOutfitGroup).length || PART_SLOTS.some(([p]) => pickedItems(parts[p] || [], isOutfitGroup).length)) {
        const outfitTags = new Set(G.filter((g) => !g.c && g.m === "o").flatMap((g) => g.it.flatMap((i) => i.tags.map((x) => x.toLowerCase()))));
        for (const x of outfitTags) { if (ptSet.has(x)) continue; const n = rm(base, x); if (n != null) { base = n; cleaned.push(x); } }
        // 고른 캐릭터의 의상 태그(wear)도 빼서 고른 복장으로 교체 — 머리색·눈색(body)은 그대로
        if (rc && rc.wear) for (const raw of rc.wear.split(",")) {
          const x = raw.trim().replace(/^\(+|\)+$/g, "").replace(/^(.+?):[\d.]+$/, "$1");
          if (!x || ptSet.has(x.toLowerCase())) continue;
          const n = rm(base, x); if (n != null) { base = n; cleaned.push(x); }
        }
      }
    }
    const extra = [];
    const mine = [];   // 이 단계에 들어간 내 태그(★) 항목 — 화면에 "적용됨"으로 표시
    const cloth = $s("#seqCloth").value;
    const ph = STAGES[si].phase;   // 큰 단계 (0~4)
    const nude = cloth === "strip" && ph >= NUDE_FROM;
    const ofs = pickedItems(outfits, isOutfitGroup);   // 고른 복장 전부 (여러 개면 합쳐서)
    if (!nude) for (const of of ofs) { extra.push(...of.it.tags); of.it.tags.forEach((t) => W.set(t, wts.outfit)); if (of.g.c) mine.push({ label: `${of.g.t} · ${koName(of.it.n)}`, tags: of.it.tags }); }
    const partItems = PART_SLOTS.flatMap(([p, name]) => pickedItems(parts[p] || [], isOutfitGroup).map((hit) => ({ p, name, hit })));
    if (!nude) for (const { p: slot, name, hit } of partItems) { extra.push(...hit.it.tags); hit.it.tags.forEach((t) => W.set(t, wts[slot])); mine.push({ label: `${hit.g.t}${hit.g.t.replace(/^★\s*/, "") === name ? "" : " · " + name} · ${koName(hit.it.n)}`, tags: hit.it.tags }); }
    if (cloth === "expo" && ph >= 2) {
      const used = new Set();
      for (const h of [...ofs, ...partItems.map((x) => x.hit)]) {
        if (used.has(h.g.t)) continue; used.add(h.g.t);
        const ex = h.g.c ? h.g.expo || [] : EXPO[h.g.t] || [];
        if (ex.length) { extra.push(...ex); if (h.g.c) mine.push({ label: `${h.g.t} · 착의노출`, tags: ex }); }
      }
    }
    if (cloth === "strip" && (!pre || S.loose)) extra.push(...STRIP[ph]);   // 도입에선 애무 후반에만 옷을 풀기 시작
    const stageTags = pre
      ? (solo ? S.soloTags : S.kiss != null ? KISS[kissBy] ? KISS[kissBy][S.kiss] : KISS.mutual[S.kiss] : S.tags)
      : solo ? (S.key === "trace" ? SOLO_END : S.tags.filter((t) => !SOLO_DROP.has(t))) : S.tags;
    const scr = isToolPose(p) && SCREEN[screenKey()];   // 자위 체위 + 기기를 골랐을 때 (자동이면 배경에 맞춰)
    extra.push(...stageTags.filter((t) => !(nude && CLOTH_STATE.has(t)) && !(scr && pre && SCREEN_DROP.has(t))));
    if (scr) extra.push(...(pre ? scr.pre : S.key === "trace" ? scr.dev : scr.main));
    for (const [k, from] of Object.entries(fx)) {
      const f = fxList.find((x) => x.key === k);
      if (pre && !PRE_FX.has(f && f.g)) continue;   // 도입엔 분위기·감정·상황·연출 계열만
      if (f && ph >= from && ph <= untilOf(f)) { extra.push(...f.tags); if (k.startsWith("c:")) mine.push({ label: `${f.g} · ${f.n}`, tags: f.tags }); }
    }
    for (const g of G) {   // 자동 생성 칸(내 태그 효과·연출 그룹)에서 고른 항목 — 대화 장면엔 넣지 않음
      if (!g.c || g.kind !== "fx" || !myf[g.t] || pre === "talk") continue;
      for (const it of g.it.filter((x) => myf[g.t].includes(x.n)))   // 여러 개 고를 수 있음
      if (ph >= (it.from || 0) && ph <= (it.until == null ? 4 : it.until)) { extra.push(...it.tags); mine.push({ label: `${g.t} · ${(window.BC_KO_LOOKUP && window.BC_KO_LOOKUP(it.n)) || it.n}`, tags: it.tags }); }
    }
    if (!pre && isToolPose(p)) {   // 스스로 달아올라 손이 움직이는 흐름 (도구·비비기 체위면 아래쪽은 도구/체위가 대신, 손은 가슴에)
      const lowBusy = lowTool || p.it.tags.some((t) => /humping|grinding|riding|shower head|object insertion/.test(t));
      extra.push(...(SOLO_ACT[si - NPRE] || []).filter((t) => !(lowBusy && HAND_LOW.has(t)) && !(nude && t === "hand under shirt")));
    }
    if (!pre && isToolPose(p)) {   // 자위 도구: 고른 단계부터 절정까지, 흔적 단계엔 곁에 놓인 장난감만 (도입엔 없음)
      const tg = toolGroup();
      for (const n of [tools.t1, tools.t2].filter(Boolean)) {
        const it = tg && tg.it.find((x) => x.n === n); if (!it) continue;
        if (ph >= (tools.from || 0) && ph <= 3) extra.push(...it.tags);
        else if (ph === 4 && it.tags.includes("sex toy")) extra.push("sex toy", "after masturbation");
      }
    }
    for (const bgi of pickedItems(bgs, isBgGroup)) { extra.push(...bgi.it.tags); if (bgi.g.c) mine.push({ label: `${bgi.g.t} · ${koName(bgi.it.n)}`, tags: bgi.it.tags }); }
    if (mf) extra.push(MFP);
    const seen = new Set([...pt, ...base.split(",")].map(norm));
    const ex = extra.filter((t) => { const n = norm(t); if (seen.has(n)) return false; seen.add(n); return true; });
    const exStr = ex.map((t) => { const key = k && (KEY.has(t) || (pre && PRE_KEY.has(t)) || (solo && !pre && SOLO_KEY.has(t))); return wrap(t, Math.max(key ? KW : 1, W.get(t) || 1)); }).join(", ");   // 핵심 태그 가중치는 효과 태그(음문 등)에도
    const positive = [poseStr, base, exStr].filter(Boolean).join(", ");

    let neg = seqEd.neg.value;
    const sel = new Set([...pt, ...ex].map(norm));
    for (const t of new Set([...(solo ? ["nsfw", "nude", "naked", "explicit"] : BLK), ...sel])) { const n = rm(neg, t); if (n != null) neg = n; }   // 혼자일 땐 부정의 인원 태그는 남기고 nsfw/nude만 지움
    if (!neg.trim()) neg = NEG;
    const have = new Set(neg.split(",").map(norm));
    const must = [...new Set(["child", "loli", "shota", ...(mf ? MFN : []), ...(solo ? SOLO_NEG : []), ...(pre ? PRE_NEG[pre] : []), ...((scr && scr.neg) || [])])].filter((t) => !have.has(t) && !sel.has(t));
    const negative = [neg.trim().replace(/,\s*$/, ""), ...must].filter(Boolean).join(", ");
    const r = window.BC_HAT ? window.BC_HAT.apply(positive, negative) : { positive, negative };   // 모자 처리 (생성 시에도 같은 값으로 고정 적용)
    return { ...r, mine, cleaned };
  }
  function pickWorkflow(p = poseItem()) {
    const sel = $s("#wfSelect");
    if (!$s("#seqAuto").checked) return sel.value;
    const re = p.g.t.startsWith("1인") ? { test: (x) => !!x && x !== "builtin" && !/2people|5people|duo|party/i.test(x) } : p.g.t.startsWith("5인") ? /5people/i : /2people|duo/i;
    const LP = window.LL_PASTEL, fxNames = Object.keys(fx).map((k) => (fxList.find((f) => f.key === k) || {}).n).filter(Boolean);   // 화풍(파스텔·작가·푸른 밤)을 고르면 그 워크플로 먼저 (지금 고른 게 흰 제복판이어도 일반판으로)
    const c = [...sel.options].map((o) => o.value).filter((x) => re.test(x) && !x.includes("@")).sort((a, b) => (LP ? LP.prefer(fxNames)(a, b) : 0) || /RefStyle_IPAdapter/i.test(b) - /RefStyle_IPAdapter/i.test(a) || (b === state.defaultWorkflow) - (a === state.defaultWorkflow) || /WhiteUniform/.test(a) - /WhiteUniform/.test(b))[0];   // 1인 = RefStyle_IPAdapter 우선, 2인·5인 = 흰 제복판보다 일반판 우선
    return c || sel.value;
  }

  // ---------- 실행 · 진행 ----------
  let slots = [];   // {si, id, el}
  const byId = new Map();
  // 프롬프트를 한국어 칩으로 표시 (마우스를 올리면 영문 태그, 아래 "영문 원문"에 실제 적용될 원문)
  function koChips(str, mineSet) {
    const look = window.BC_KO_LOOKUP || (() => "");
    const out = [];
    for (const raw of String(str || "").split(",")) {
      let t = raw.trim(); if (!t) continue;
      const b = t.match(/^BREAK\s*(.*)$/i);
      if (b) { out.push('<span class="sq-brk">BREAK</span>'); t = b[1].trim(); if (!t) continue; }
      const wm = t.match(/^\((.+):([\d.]+)\)$/);
      const tag = wm ? wm[1] : t.replace(/^\(+|\)+$/g, "");
      const k = look(tag), my = mineSet && mineSet.has(tag.toLowerCase().replace(/_/g, " "));
      out.push(`<span class="sq-c${k ? "" : " en"}${my ? " mine" : ""}" title="${escH(t)}${my ? " · 내 태그" : ""}">${my ? "★ " : ""}${escH(k || tag)}${wm ? `<small>×${escH(wm[2])}</small>` : ""}</span>`);
    }
    return out.join("");
  }
  function showPrompt(el, positive, negative, mine = [], cleaned = []) {
    const set = new Set(mine.flatMap((m) => m.tags.map((t) => t.toLowerCase().replace(/_/g, " "))));
    const posTags = new Set(String(positive).split(",").map((t) => t.trim().replace(/^\(+|\)+$/g, "").replace(/^(.+?):[\d.]+$/, "$1").toLowerCase()));
    const summary = mine.length
      ? `<div class="sq-mine">★ 내 태그 적용됨 — ${mine.map((m) => `${escH(m.label)} <small>(${m.tags.filter((t) => posTags.has(t.toLowerCase().replace(/_/g, " "))).length}/${m.tags.length}개 들어감)</small>`).join(", ")}</div>`
      : `<div class="sq-mine none">내 태그: 이 단계에 들어간 항목 없음</div>`;
    const cleanNote = cleaned.length ? `<div class="sq-mine none">캐릭터 프롬프트에 있던 체위·인원·반응·배경 태그 ${cleaned.length}개는 빼고 적용 <small title="${escH(cleaned.join(", "))}">(마우스를 올리면 목록)</small></div>` : "";
    $s("details > div", el).innerHTML = summary + cleanNote + `<b>긍정</b><div class="sq-cs">${koChips(positive, set)}</div><b>부정</b><div class="sq-cs">${koChips(negative)}</div>`
      + `<details class="sq-raw"><summary>영문 원문 (실제 적용)</summary><div>${escH("긍정: " + positive + "\n\n부정: " + negative)}</div></details>`;
    const hd = $s(".hd", el);
    if (hd && mine.length && !$s(".sq-star", hd)) hd.firstChild.after(Object.assign(document.createElement("b"), { className: "sq-star", textContent: " ★", title: "내 태그가 들어간 단계" }));
  }
  function slotHTML(si, ar, key, p) {
    return `<div class="seq-slot" data-k="${key}" style="--ar:${ar}"><div class="hd">${si + 1}. ${escH(stageName(si, p))}<span>대기</span></div><div class="im">대기 중<div class="bar"></div></div><details><summary>프롬프트</summary><div></div></details></div>`;
  }
  // 체위마다 워크플로·크기를 따로 정함 (1인 = 1인용, 2인 = 2인용 …)
  function makePlan() {
    const ps = selPoses();
    const which = stageBoxes.map((b, i) => (b.checked ? i : -1)).filter((i) => i >= 0);
    const base = readParams(); base.batch = 1;
    const plan = ps.map((p, pi) => {
      const params = { ...base };
      if ($s("#seqAuto").checked && p.g.z) { const [w, h] = p.g.z.split("x").map(Number); params.width = w; params.height = h; }
      return { p, pi, wf: pickWorkflow(p), params };
    });
    return { ps, which, plan };
  }
  // 만들 장 목록. 여러 체위면 도입 1~10장(체위 태그 없이 인원 태그만 → 같은 인원끼리 똑같은 그림)은
  // 인원(1인·2인·5인)마다 한 번만 만들고, 각 체위는 11번(본편)부터
  function buildJobs(plan, which) {
    const groups = [], items = [];
    const pre = plan.length > 1 ? which.filter((si) => si < NPRE) : [];
    const body = plan.length > 1 ? which.filter((si) => si >= NPRE) : which;
    const add = (title, x, sis, tag) => {
      if (!sis.length) return;
      const gi = groups.length;
      groups.push({ pi: gi, title, wf: x.wf, w: x.params.width, h: x.params.height, params: x.params });
      for (const si of sis) {
        const j = build(si, x.p);
        items.push({ k: `${gi}-${si}`, pi: gi, si, name: (tag || "") + stageName(si, x.p), positive: j.positive, negative: j.negative, mine: j.mine, cleaned: j.cleaned, st: "todo", pid: null, img: null });
      }
    };
    const done = new Set();
    for (const x of plan) {
      const h = headOf(x.p.g.t);
      if (pre.length && !done.has(h)) { done.add(h); add(`${h === "all" ? "" : h + "인 "}도입 — 대화 → 키스 → 애무 (공통, 한 번만)`, x, pre); }
      add(`${x.p.g.t} · ${x.p.it.n}`, x, body);
    }
    return { groups, items };
  }
  function groupsHTML(plan, which) {
    return plan.map(({ p, pi, wf, params }) => `<div class="seq-grp">${plan.length > 1 ? `<div class="seq-gh">${pi + 1}. ${escH(p.g.t)} · ${escH(p.it.n)}<small>${escH(wf)} · ${params.width}×${params.height}</small></div>` : ""}<div class="seq-slots">${which.map((si) => slotHTML(si, `${params.width}/${params.height}`, `${pi}-${si}`, p)).join("")}</div></div>`).join("");
  }
  function setSlot(s, cls, text, frac) {
    s.el.classList.remove("run", "done", "err"); if (cls) s.el.classList.add(cls);
    $s(".hd span", s.el).textContent = text;
    if (frac != null) $s(".bar", s.el).style.width = Math.round(frac * 100) + "%";
    updProg();
  }
  // 전체 진행도: 완료(+오류·중단)/전체 — 결과 카드 제목과 생성 버튼에 표시
  function updProg() {
    const el = $s("#seqProg"); if (!el) return;
    if (!slots.length) { el.innerHTML = ""; return; }
    const fin = (s) => s.el.classList.contains("done") || s.el.classList.contains("err");
    const done = slots.filter((s) => s.el.classList.contains("done")).length, end = slots.filter(fin).length, bad = end - done;
    el.innerHTML = `${end}/${slots.length}${bad ? `<small>(오류·중단 ${bad})</small>` : ""}${end === slots.length ? `<small>${bad ? "종료" : "완료"}</small>` : ""}`;
    const btn = $s("#seqRun");
    if (btn.disabled) btn.innerHTML = `진행 중… <small>${end}/${slots.length}장</small>`;
  }
  // ---------- 진행 저장 · 이어서 생성 ----------
  // 시작할 때 모든 장의 프롬프트·워크플로·크기를 저장해 두고 장마다 상태를 기록 (todo 대기 / queued ComfyUI에 넣음 / done / err / stop)
  // 중단하거나 앱을 껐다 켜도 "이어서 생성"을 누르면 아직 안 끝난 장만 다시 ComfyUI에 넣음
  let run = null, saveT = 0, saveWarned = false;
  function saveRun(now) {
    clearTimeout(saveT);
    const f = () => {
      try { if (run) localStorage.setItem("seq_run", JSON.stringify(run)); else localStorage.removeItem("seq_run"); }
      catch { if (!saveWarned) { saveWarned = true; toast("진행 상황을 저장하지 못했습니다 (브라우저 저장 공간 부족) — 이어서 생성이 안 될 수 있습니다", "err"); } }
    };
    if (now) f(); else saveT = setTimeout(f, 400);
  }
  const leftOf = (r) => (r ? r.items.filter((it) => it.st !== "done").length : 0);
  function runHTML(r) {
    return r.groups.map((g) => `<div class="seq-grp">${r.groups.length > 1 ? `<div class="seq-gh">${g.pi + 1}. ${escH(g.title)}<small>${escH(g.wf)} · ${g.w}×${g.h}</small></div>` : ""}<div class="seq-slots">${r.items.filter((it) => it.pi === g.pi).map((it) =>
      `<div class="seq-slot" data-k="${it.k}" style="--ar:${g.w}/${g.h}"><div class="hd">${it.si + 1}. ${escH(it.name)}<span>대기</span><button class="re" title="이 장만 같은 프롬프트·새 시드로 다시 생성">↻</button></div><div class="im">대기 중<div class="bar"></div></div><details><summary>프롬프트</summary><div></div></details></div>`).join("")}</div></div>`).join("");
  }
  function showDone(s) {
    setSlot(s, "done", "완료", 1);
    const it = s.it; if (!it.img) return;
    const box = $s(".im", s.el);
    box.innerHTML = `<img alt="" src="${imgURL(it.img)}">`;
    $s("img", box).onclick = () => openModal((state.history || []).find((h) => h.id === it.pid) || { id: it.pid, images: [it.img] }, 0);
  }
  // 이 장만 다시 생성 (잘못 나온 그림) — 같은 프롬프트·워크플로·크기, 새 시드로 그 칸 자리에 다시 만듦
  async function regenSlot(s, btn) {
    const g = run && run.groups.find((x) => x.pi === s.pi);
    if (!g) return;
    btn.disabled = true;
    try {
      const res = await api("/api/generate", { json: { workflow: g.wf, positive: s.it.positive, negative: s.it.negative, params: { ...g.params }, randomSeed: true } });
      if (s.id) byId.delete(s.id);
      s.id = s.it.pid = res.prompt_id; s.it.st = "queued"; s.it.img = null; byId.set(res.prompt_id, s);
      state.myPrompts.add(res.prompt_id);
      $s(".im", s.el).innerHTML = '다시 생성 대기<div class="bar"></div>';
      setSlot(s, "", "다시 생성 대기열", 0); saveRun(true); drawResume();
    } catch (e) { toast("다시 생성 실패:\n" + e.message, "err"); }
    finally { btn.disabled = false; }
  }
  $s("#seqSlots").addEventListener("click", (e) => {
    const b = e.target.closest(".re"); if (!b) return;
    const s = slots.find((x) => x.el === b.closest(".seq-slot"));
    if (s && s.it) regenSlot(s, b);
  });
  function mountRun(r) {
    $s("#seqSlots").innerHTML = runHTML(r);
    slots = r.items.map((it) => ({ it, si: it.si, pi: it.pi, id: null, el: $s(`.seq-slot[data-k="${it.k}"]`) }));
    byId.clear();
    for (const s of slots) {
      showPrompt(s.el, s.it.positive, s.it.negative, s.it.mine || [], s.it.cleaned || []);
      if (s.it.st === "done") showDone(s);
      else if (s.it.st === "err") setSlot(s, "err", "오류");
      else if (s.it.st === "stop") setSlot(s, "err", "중단됨");
      else setSlot(s, "", "이어서 생성 대기", 0);
    }
    $s("#seqInfo").textContent = r.groups.length > 1 ? `${r.groups.length}개 체위 · 총 ${r.items.length}장 — 한 체위가 다 끝나면 다음 체위의 워크플로로 전환` : `워크플로: ${r.groups[0].wf} · ${r.groups[0].w}×${r.groups[0].h}`;
    $s("#seqSeed").textContent = r.same ? `시드 ${r.seed}` : "단계마다 다른 시드";
    updProg(); drawResume();
  }
  // 저장된 실행을 체위(워크플로) 순서대로 진행 — 앞 체위가 다 끝난 뒤 다음 체위를 넣음, 이미 끝난 장은 건너뜀
  async function runJobs(r) {
    const btn = $s("#seqRun"); btn.disabled = true; drawResume();
    const my = ++runToken;
    try {
      const todoOf = (g) => slots.filter((s) => s.pi === g.pi && s.it.st !== "done");
      const active = r.groups.filter((g) => todoOf(g).length);
      active.forEach((g, i) => todoOf(g).forEach((s) => setSlot(s, "", i ? "앞 체위 끝나면 시작" : "대기", 0)));
      for (const [ai, g] of active.entries()) {
        if (my !== runToken) break;
        const todo = todoOf(g);
        for (const s of todo) {
          if (my !== runToken) break;
          const res = await api("/api/generate", { json: { workflow: g.wf, positive: s.it.positive, negative: s.it.negative, params: { ...g.params, seed: r.seed }, randomSeed: !r.same } });
          s.id = s.it.pid = res.prompt_id; s.it.st = "queued"; byId.set(res.prompt_id, s);
          state.myPrompts.add(res.prompt_id);
          if (r.same && res.seed != null) r.seed = res.seed;
          setSlot(s, "", "대기열", 0); saveRun();
        }
        saveRun(true);
        if (my !== runToken) break;
        const next = active[ai + 1];
        if (next) {
          toast(`${todo.length}장 대기열에 추가 — 끝나면 "${next.title}" (${next.wf})로 전환합니다`, "ok");
          updProg();
          await waitGroup(todo, my);
          if (my !== runToken) break;
          toast(`${g.title} 완료 → ${next.title} 워크플로(${next.wf})로 전환`, "ok");
        } else toast(`${todo.length}장 대기열에 추가했습니다`, "ok");
      }
    } catch (e) {
      toast("시퀀스 요청 실패:\n" + e.message, "err");
    } finally { btn.disabled = false; btn.innerHTML = RUN_HTML; drawResume(); }
  }
  // "이어서 생성": 앱이 꺼져 있던 사이 끝난 장은 기록에서 찾아 완료로, ComfyUI에 남아 있는 예전 작업은 지우고 안 끝난 장만 다시 넣음
  async function resumeRun() {
    if (!run || !leftOf(run) || $s("#seqRun").disabled) return;
    const queued = run.items.filter((it) => it.st === "queued" && it.pid);
    if (queued.length) {
      let hist = []; try { hist = await api("/api/history"); } catch {}
      const H = new Map((Array.isArray(hist) ? hist : []).concat(state.history || []).map((h) => [h.id, h]));
      const stale = [];
      for (const it of queued) { const h = H.get(it.pid); if (h && h.images && h.images[0]) { it.st = "done"; it.img = h.images[0]; } else stale.push(it.pid); }
      if (stale.length) {
        try {
          const q = await (await fetch("/comfy/queue")).json();
          if ((q.queue_running || []).some((x) => stale.includes(x[1]))) await fetch("/comfy/interrupt", { method: "POST" });
          await fetch("/comfy/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delete: stale }) });
        } catch {}
      }
    }
    run.items.forEach((it) => { if (it.st !== "done") { it.st = "todo"; it.pid = null; } });
    saveRun(true); mountRun(run);
    await runJobs(run);
  }
  function drawResume() {
    const box = $s("#seqResume"); if (!box) return;
    const n = leftOf(run), busy = $s("#seqRun").disabled;
    box.classList.toggle("hidden", !n || busy);
    if (n && !busy) box.querySelector("span").textContent = `지난 시퀀스: ${run.items.length - n}/${run.items.length}장 완료 · 남은 ${n}장`;
  }
  $s("#seqResumeGo").onclick = () => resumeRun();
  $s("#seqResumeDrop").onclick = () => {
    if (!confirm("지난 시퀀스의 남은 장을 버릴까요?\n(이미 만든 이미지는 갤러리에 그대로 남습니다)")) return;
    run = null; saveRun(true); drawResume(); toast("지난 시퀀스를 버렸습니다");
  };
  $s("#seqRun").onclick = async () => {
    const { ps, which, plan } = makePlan();
    if (!ps.length) return toast(multi ? "체위를 하나 이상 고르세요" : "체위를 먼저 고르세요", "err");
    if (!which.length) return toast("만들 단계를 하나 이상 고르세요", "err");
    const n = leftOf(run);
    if (n && !confirm(`지난 시퀀스가 ${run.items.length - n}/${run.items.length}장에서 멈춰 있습니다.\n새로 시작하면 지난 시퀀스의 남은 ${n}장은 버려집니다 (이어서 하려면 '이어서 생성').\n새로 시작할까요?`)) return;
    const jc = jobCount(ps, which);
    if (jc.total > 50 && !confirm(`${jc.text}을 만듭니다.\n(한 장 약 1분 20초 — 대략 ${Math.round(jc.total * 78 / 360) / 10}시간)\n진행할까요?`)) return;
    const bad = plan.filter(({ p, wf }) => p.g.t.startsWith("1인") && /2people|5people|duo|party/i.test(wf));
    if (bad.length && !confirm(`혼자 장면인데 여러 명용 워크플로(${bad[0].wf})로 생성합니다.\n여러 명이 그려질 수 있습니다. 그래도 진행할까요?\n(설정의 "인원수에 맞는 워크플로·크기 자동"을 켜면 1인용으로 바뀝니다)`)) return;
    // 프롬프트는 시작할 때 전부 만들어 저장 (진행 중에 설정을 바꿔도 이번 실행엔 영향 없음)
    run = {
      at: Date.now(), same: $s("#seqSameSeed").checked,
      seed: $s("#randomSeed").checked ? Math.floor(Math.random() * 2 ** 48) : +$s("#seed").value,
      ...buildJobs(plan, which),
    };
    saveRun(true); mountRun(run);
    await runJobs(run);
  };
  // ---------- 체위별 순차 실행: 앞 체위가 끝날 때까지 기다림 ----------
  let runToken = 0, waiter = null;
  const RUN_HTML = $s("#seqRun").innerHTML;
  const finished = (s) => s.el.classList.contains("done") || s.el.classList.contains("err");
  function checkWait() { if (waiter && (waiter.my !== runToken || waiter.grp.every(finished))) { const r = waiter.res; clearInterval(waiter.t); waiter = null; r(); } }
  function waitGroup(grp, my) {
    return new Promise((res) => {
      let gone = 0;
      // 보조 확인: 이벤트를 놓쳐도 ComfyUI 대기열에서 이 체위 작업이 모두 빠지면 넘어감
      const t = setInterval(async () => {
        try {
          const q = await (await fetch("/comfy/queue")).json();
          const ids = new Set([...(q.queue_running || []), ...(q.queue_pending || [])].map((x) => x[1]));
          gone = grp.some((s) => ids.has(s.id)) ? 0 : gone + 1;
          if (gone >= 3) grp.forEach((s) => { if (!finished(s)) { if (s.it) { s.it.st = "done"; saveRun(); } setSlot(s, "done", "완료 (확인됨)", 1); } });
        } catch {}
        checkWait();
      }, 5000);
      waiter = { grp, res, my, t };
      checkWait();
    });
  }
  $s("#seqPreview").onclick = () => {   // 생성하지 않고 단계별 프롬프트만 보기
    const { ps, which, plan } = makePlan();
    if (!ps.length) return toast(multi ? "체위를 하나 이상 고르세요" : "체위를 먼저 고르세요", "err");
    const jobs = buildJobs(plan, which);
    $s("#seqSlots").innerHTML = runHTML(jobs);
    slots = []; byId.clear(); updProg();
    $s("#seqInfo").textContent = plan.length > 1 ? `${plan.length}개 체위 · 총 ${jobs.items.length}장 (미리보기 — 도입은 인원마다 한 번)` : `워크플로: ${plan[0].wf} · ${plan[0].params.width}×${plan[0].params.height}`;
    for (const it of jobs.items) {
      const el = $s(`.seq-slot[data-k="${it.k}"]`);
      $s(".hd span", el).textContent = "미리보기";
      $s(".im", el).firstChild.textContent = "생성 전";
      $s("details", el).open = plan.length === 1;
      showPrompt(el, it.positive, it.negative, it.mine, it.cleaned);
    }
  };
  $s("#seqStop").onclick = async () => {
    const pend = slots.filter((s) => s.id && !finished(s)).map((s) => s.id);
    const later = slots.filter((s) => !s.id && !finished(s));   // 아직 대기열에 안 넣은 다음 체위들
    if (!pend.length && !later.length) return toast("진행 중인 시퀀스가 없습니다");
    runToken++; checkWait();
    if (pend.length) {
      try { await fetch("/comfy/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delete: pend }) }); } catch {}
      try { await fetch("/comfy/interrupt", { method: "POST" }); } catch {}
    }
    slots.forEach((s) => { if (pend.includes(s.id) || later.includes(s)) { if (s.it) s.it.st = "stop"; setSlot(s, "err", "중단됨"); } });
    saveRun(true); drawResume();
    toast("시퀀스를 중단했습니다 — '이어서 생성'으로 남은 장부터 다시 만들 수 있습니다");
  };

  const es = new EventSource("/api/events");
  es.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    const d = m.data || {};
    const s = byId.get(d.prompt_id || d.id);
    if (!s) return;
    switch (m.type) {
      case "execution_start": setSlot(s, "run", "생성 중", 0.02); $s(".im", s.el).firstChild.textContent = "생성 중…"; break;
      case "progress": setSlot(s, "run", `샘플링 ${d.value}/${d.max}`, d.value / d.max); break;
      case "execution_error": if (s.it) { s.it.st = "err"; saveRun(); } setSlot(s, "err", "오류"); $s(".im", s.el).firstChild.textContent = d.exception_message || "오류"; break;
      case "execution_interrupted": if (s.it) { s.it.st = "stop"; saveRun(); } setSlot(s, "err", "중단됨"); break;
      case "bc_done": {
        const im = d.images && d.images[0];
        if (!im) { if (s.it) { s.it.st = "err"; saveRun(); } setSlot(s, "err", d.error ? "오류" : "이미지 없음"); break; }
        if (s.it) { s.it.st = "done"; s.it.img = im; saveRun(); }
        showDone(s);
        if (slots.every((x) => x.el.classList.contains("done") || x.el.classList.contains("err"))) { toast("시퀀스 완료", "ok"); saveRun(true); drawResume(); }
        break;
      }
    }
    checkWait();   // 체위 하나가 다 끝났으면 다음 체위로
  };
  // 앱을 다시 켰을 때: 지난 시퀀스가 남아 있으면 결과 칸을 되살리고 "이어서 생성" 안내
  try { run = JSON.parse(localStorage.getItem("seq_run") || "null"); } catch { run = null; }
  if (run && Array.isArray(run.items) && run.items.length) {
    mountRun(run);
    const n = leftOf(run);
    if (n) toast(`지난 시퀀스가 ${run.items.length - n}/${run.items.length}장에서 멈춰 있습니다\n시퀀스 탭 '4. 결과'의 '이어서 생성'으로 남은 ${n}장을 만들 수 있습니다`);
  } else run = null;
})();
