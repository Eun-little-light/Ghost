// "Hunt 시퀀스" 탭 — Hunt(연애 시뮬레이션)가 실제로 쓰는 장면 태그와 흐름으로 한 장씩 자동 생성 (Ghost 전용)
//  흐름: 만남 2장(1인) → 키스 → 목덜미 → [옷 벗기기 3장] → 가슴 → 손 → 입 → (체위마다) 삽입 직전 → 체위 2장 → 절정 → 여운 2장 → 사정 → 뒷정리 (2인)
//  한 번에 생성: 체위를 여러 개 고르면 공통 단계는 한 번만, 체위 단계(삽입 직전~사정)는 체위마다, 뒷정리는 마지막에 한 번
//  태그 출처: Hunt가 보낸 프롬프트(이미지 캐시·ComfyUI 기록)의 장소 배경 · 단계 · 옷 상태(t0 다 입음 → unbuttoned → no shirt → completely nude / Hunt 기본 t2) · 연출
//  캐릭터: Ghost 기본·내 캐릭터 + Hunt 인물(huntchars.js, Hunt 인물 서재의 외모·상황별 복장)
//  그림 공방(미리 뽑기) 목록: 데이트 장소 10곳 · 때(낮/저녁/밤) · 날씨(바깥만) · 집에서 입는 옷 · 영상통화 2장 · 분위기(호감 70)
//   (잠든 사이 · 최면 · 몰래 보기 · 방치 카메라는 동의 없는 상황이라 넣지 않음)
//  Hunt의 '잠든 그녀'·최면 장면은 동의 없는 상황이라 넣지 않음
//  생성은 시퀀스와 같은 api("/api/generate") → 캐릭터 폴더·가슴 크기·남자 얼굴 숨기기·초고속(Lightning) 등 공통 기능이 그대로 적용
(() => {
  const $q = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ls = { get(k, d) { try { const v = localStorage.getItem("hseq_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem("hseq_" + k, JSON.stringify(v)); } catch {} } };
  const QUALITY = "masterpiece, best quality, amazing quality, very aesthetic, absurdres, anime coloring";
  const NEG_BASE = "realistic, photorealistic, 3d, real life, photo, semi-realistic, bad quality, worst quality, worst detail, lowres, sketch, censor, censored, mosaic censoring, bar censor, bad anatomy, bad hands, extra fingers, missing fingers, text, watermark, signature, logo, blurry, jpeg artifacts, child, loli, shota";
  const NEG_PRE = "sex, penis, nude, nipples, pussy, cum, orgasm";   // 만남·키스 단계: 아직 아님
  const DUO = "1girl, (1boy:1.2), (only one man:1.15), adult male, (faceless male:1.35), (head out of frame:1.25), (male face out of frame:1.2), hetero";
  const DUO_FX = "depth of field, dynamic pose, clothes wrinkles, unobstructed view, (uncensored:1.2), game cg, anime coloring, two people in frame";
  // 옷 상태 (Hunt)
  const CLOTH = {
    top: "shirt lift, top pulled up, exposed breasts, bare nipples, breasts out, bra lift, partially undressed",          // t2 위
    low: "skirt hiked up to waist, skirt_lift, exposed thighs, (panties_aside:1.3), exposed pussy",                        // t2 아래
    unbutton: "(unbuttoned:1.2), open shirt, bra visible, cleavage, undressing, partially undressed",                      // 단추 풀기
    noshirt: "(no shirt:1.2), (bra lift:1.2), bra pulled up, exposed breasts, bare nipples, topless",                       // t3 위
    nude: "(completely nude:1.2), no clothes, naked, clothes on floor",                                                    // 다 벗음
  };

  // 본편 옷 상태 (Hunt 옷 단계 t2 · unbutton · no shirt · nude를 참고) — 체위·애무 등 본편 장면에 쓰임
  // 복장 종류에 맞는 벗기기 태그 — Hunt는 복장과 상관없이 셔츠 태그(open shirt · unbuttoned · shirt lift · skirt lift)를 써서
  //  원피스 · 니트 · 캐미솔 · 바지 복장에도 단추가 생기거나 치마가 나타남. 여기서는 복장 글에서 위(단추 셔츠 / 머리로 입는 옷 / 원피스)
  //  · 겉옷 · 아래(치마 / 바지 / 반바지 / 원피스)를 읽어서 태그를 고름
  function garment(w) {
    const t = String(w || "").toLowerCase();
    if (/lingerie|garter belt|bikini|bodystocking|babydoll|negligee/.test(t) && !/\b(dress|shirt|blouse|skirt|pants|shorts)\b/.test(t)) return { top: "linger", bot: "linger", outer: "" };   // 란제리만 입음
    const dress = /\bdress\b|sundress|leotard|bodysuit|qipao/.test(t);
    const button = /\b(shirt|blouse)\b/.test(t.replace(/t-shirt|sweatshirt/g, ""));
    const pull = /t-shirt|sweatshirt|sweater|knit|turtleneck|hoodie|camisole|crop top|cropped knit|tank top|sports bra|ribbed/.test(t);
    let outer = /blazer|jacket|coat|cardigan|\bvest\b/.test(t) && !/zip hoodie/.test(t) ? (t.match(/blazer|jacket|coat|cardigan|vest/) || ["jacket"])[0] : "";
    const sepTop = /crop top|cropped knit top|knit top|tank top|camisole/.test(t) && /skirt/.test(t);   // 치마 + 따로 입은 윗옷
    let top = dress && !sepTop ? "dress" : button ? "button" : pull ? "pull" : "button";
    if (top === "button" && !button && outer === "cardigan") outer = "";   // 가디건만 입었으면 가디건 단추를 품
    return { top, bot: /skirt/.test(t) ? "skirt" : /shorts/.test(t) ? "shorts" : /pants|slacks|jeans|leggings|jogger|cargo/.test(t) ? "pants" : dress ? "dress" : "skirt", outer };
    // eslint-disable-next-line no-unreachable
    const bot = /skirt/.test(t) ? "skirt" : /shorts/.test(t) ? "shorts" : /pants|slacks|jeans|leggings|jogger|cargo/.test(t) ? "pants" : dress ? "dress" : "skirt";
    return { top, bot, outer };
  }
  const G = {
    open: { button: "(unbuttoned:1.2), open shirt, bra visible, cleavage", pull: "(clothes lift:1.15), top lifted to chest, bra peek, navel, midriff", dress: "(strap slip:1.2), off shoulder, dress slipping down, bra visible, cleavage", linger: "(bra strap slip:1.1), unhooked bra, loose lace bra, cleavage, garter belt" },
    openAct: { button: "(his hands unbuttoning her shirt:1.2)", pull: "(his hands lifting the hem of her top:1.2)", dress: "(his hands unzipping her dress:1.2), dress zipper", linger: "(his hands unhooking her bra from behind:1.2), bra hook" },
    openName: { button: "단추 풀기", pull: "옷자락 걷기", dress: "지퍼 내리기", linger: "브라 후크 풀기" },
    off: { button: "(no shirt:1.2), (bra lift:1.2), bra pulled up, exposed breasts, bare nipples, topless", pull: "(no shirt:1.2), (bra lift:1.2), bra pulled up, exposed breasts, bare nipples, topless", dress: "(dress pulled down to waist:1.2), bare shoulders, (bra lift:1.2), exposed breasts, bare nipples, topless", linger: "(no bra:1.2), bra removed, exposed breasts, bare nipples, topless, garter belt, garter straps, thighhighs" },
    offAct: { button: "(taking off shirt:1.2), shirt removed", pull: "(taking off top:1.2), top pulled over head", dress: "(pulling her dress down:1.2), dress around waist", linger: "(taking off her bra:1.2), holding bra" },
    offName: { button: "위 벗기기", pull: "위 벗기기", dress: "원피스 내리기", linger: "브라 벗기기" },
    lift: { button: "shirt lift, top pulled up, exposed breasts, bare nipples, breasts out, bra lift, partially undressed", pull: "(clothes lift:1.2), top pulled up, exposed breasts, bare nipples, breasts out, bra lift, partially undressed", dress: "(strap slip:1.2), dress pulled down, exposed breasts, bare nipples, breasts out, bra lift, partially undressed", linger: "(bra lift:1.2), lace bra pulled up, exposed breasts, bare nipples, breasts out, garter belt, garter straps" },
    low: { skirt: "skirt hiked up to waist, skirt_lift, exposed thighs, (panties_aside:1.3), exposed pussy", pants: "(pants pulled down:1.25), pants around thighs, (panties_aside:1.3), exposed pussy", shorts: "(shorts pulled down:1.2), shorts around thighs, (panties_aside:1.3), exposed pussy", dress: "(dress lift:1.2), hem lifted to waist, exposed thighs, (panties_aside:1.3), exposed pussy", linger: "lace panties pulled aside, (panties_aside:1.3), exposed pussy, garter belt, garter straps, thighhighs" },
    lowAct: { skirt: "(lifting her skirt:1.1)", pants: "(pulling down her pants:1.2), unbuttoned pants", shorts: "(pulling down her shorts:1.2)", dress: "(lifting her dress hem:1.2)", linger: "(his finger hooking her lace panties:1.2)" },
    lowName: { skirt: "치마 올리기", pants: "바지 내리기", shorts: "반바지 내리기", dress: "원피스 걷어 올리기", linger: "팬티 젖히기" },
  };
  const outerOff = (g) => (g.outer ? `open ${g.outer}, (${g.outer} slipping off shoulders:1.1), ` : "");
  const CLOTH_MAIN = {
    half: { n: "상의 걷어 올림 · 치마 올림 (Hunt 기본)", tags: (w) => { const g = garment(w); return `${w}, ${outerOff(g)}${G.lift[g.top]}, ${g.top === "dress" && g.bot === "dress" ? G.low.dress : G.low[g.bot]}`; } },
    unbutton: { n: "단추만 풀고 (원피스는 지퍼 · 니트는 걷어서)", tags: (w) => { const g = garment(w); return `${w}, ${outerOff(g)}${G.open[g.top]}, (open clothes:1.1), exposed breasts, bare nipples, bra pulled down, ${G.low[g.bot]}`; } },
    topless: { n: "상의만 벗김", tags: (w) => { const g = garment(w); return `${w}, ${G.off[g.top]}, ${G.low[g.bot]}`; } },
    bottomless: { n: "아래만 (상의 입은 채)", tags: (w) => { const g = garment(w); return `${w}, (clothed top:1.2), ${G.low[g.bot]}, bottomless`; } },
    nude: { n: "다 벗음", tags: () => CLOTH.nude },
  };
  // 옷 액션 — 고르면 해당 단계가 시퀀스에 들어가고, 그 뒤 장면에는 결과(찢어진 스타킹 · 풀어 내린 머리 등)가 이어짐
  //  after: 이 단계 뒤에 들어감 · keep: 이후 장면에 붙는 태그 · neg: 이후 장면 부정 · skip: 복장상 안 맞으면 건너뜀
  const ACTS = {
    hair: { n: "머리 풀기", after: "neck", keep: "(hair down:1.1), loose hair", tags: () => "(untying her hair:1.2), letting hair down, hair tie in mouth, his hand in her hair, hair spread, blush, looking at viewer, upper body, from side" },
    glasses: { n: "안경 벗기기", after: "kiss", keep: "no eyewear", neg: "glasses, eyewear", skip: (o) => !/glasses/.test(wearOf(o.ch, o.outfit) + " " + o.ch.body), tags: () => "(his hand taking off her glasses:1.2), holding glasses, removing glasses, close-up, face focus, blush, looking at viewer, upper body" },
    strap: { n: "어깨끈 내리기", after: "undress1", tags: () => "(his finger hooking her bra strap:1.2), (strap slip:1.2), bra strap pulled off shoulder, bare shoulder, shoulder kiss, blush, upper body, from side" },
    tear: { n: "스타킹 찢기", after: "undress3", keep: "(torn pantyhose:1.25), black pantyhose, crotch hole", wear: "black pantyhose", skip: (o) => !["skirt", "dress", "linger"].includes(garment(wearOf(o.ch, o.outfit)).bot), tags: () => "(his hands tearing her pantyhose:1.3), (torn pantyhose:1.3), ripping, crotch hole, pantyhose, thighs, legs apart, blush, embarrassed, lower body focus, from above" },
    cuffs: { n: "수갑 (묶기)", after: "neck", keep: "(handcuffs:1.2), fur-lined handcuffs, cuffed wrists, wrists behind back", tags: () => "(his hands putting fur-lined handcuffs on her wrists:1.2), (handcuffs:1.2), wrists behind back, blush, nervous smile, looking at viewer, upper body, from side" },
    blind: { n: "눈가리개 (묶기)", after: "neck", keep: "(blindfold:1.1), (cloth blindfold:1.1), covered eyes", tags: () => "(his hands tying a cloth blindfold over her eyes:1.2), (cloth blindfold:1.2), covered eyes, parted lips, blush, upper body, from side" },
    panties: { n: "팬티 내리기", after: "undress3", keep: "(panties around one leg:1.2)", swap: [/\(panties_aside:1\.3\)/g, "(panties around one leg:1.2)"], tags: () => "(his hands pulling down her panties:1.25), panties around knees, lifting one leg, blush, covering face, lower body focus, from front" },
  };
  // 표정 — 단계마다 어울리는 묶음 중 장마다 하나를 고름 (같은 표정이 줄줄이 나오지 않게)
  // 표정 스타일 — 사실적(자연스러운 얼굴) / 과장(아헤가오 · 하트 눈 · 흰자 · 혀 · 침 · 윙크 · 만화식 홍조) / 섞어서
  const FACES = { real: "사실적", loud: "과장 (아헤가오 · 하트 눈 등)", mix: "섞어서" };
  const EXPR = {
    sweet: ["soft smile, relaxed expression, light blush", "gentle smile, warm eyes, looking at viewer", "small smile, eyes slightly narrowed, faint blush", "calm expression, faint smile, half-lidded eyes"],
    shy: ["looking away, slight blush, lips pressed together", "glancing at viewer, shy smile, light blush", "downcast eyes, blush, closed mouth", "biting lower lip, avoiding eye contact, flushed cheeks"],
    teasing: ["smirk, raised eyebrow, looking at viewer", "playful smile, half-lidded eyes, looking at viewer", "slight smile, confident gaze, head tilt", "suppressed smile, side glance, light blush"],
    needy: ["parted lips, furrowed brow, flushed cheeks", "pleading look, glistening eyes, blush", "slightly open mouth, intense gaze, flushed", "worried eyebrows, biting lip, heavy breathing"],
    pleasure: ["parted lips, half-closed eyes, flushed cheeks", "eyes closed, brow slightly furrowed, mouth slightly open", "biting lip, eyes shut, flushed", "looking at viewer, parted lips, heavy blush, sweat", "head tilted back, eyes closed, lips parted"],
    intense: ["eyes squeezed shut, open mouth, furrowed brow, flushed", "head back, mouth open, tense expression, sweat", "teary eyes, open mouth, gasping, flushed", "clenched teeth, eyes shut, trembling, sweat"],
    dazed: ["unfocused eyes, lips slightly parted, flushed", "tired smile, half-lidded eyes, sweat", "relaxed expression, heavy eyelids, light blush", "content expression, eyes half-closed, catching breath"],
  };
  const EXPR_LOUD = {
    sweet: ["happy, closed eyes smile, ^_^, blush", "(heart-shaped pupils:1.05), happy, smile, blush", "wink, big smile, blush"],
    shy: ["(full-face blush:1.2), wavy mouth, flustered, sweatdrop", "@_@, flustered, blush, steam", "covering mouth, flustered, full-face blush, nose blush"],
    teasing: ["playful smile, wink, blush", "mischievous grin, tongue out, blush", "smug, :3, half-closed eyes, looking at viewer", "seductive smile, licking lips, bedroom eyes"],
    needy: ["(heart-shaped pupils:1.1), pleading eyes, open mouth, blush", "teary eyes, wavy mouth, begging, flushed", "open mouth, drooling, needy expression, heavy blush"],
    pleasure: ["crying with pleasure, tears, open mouth", "half-closed eyes, open mouth, drooling, flushed", "(heart-shaped pupils:1.1), open mouth, moaning, flushed", "tongue out, half-closed eyes, heavy blush, sweat"],
    intense: ["rolling eyes, tongue out, drooling", "ahegao, heart-shaped pupils", "(heart-shaped pupils:1.1), open mouth, tongue out, flushed", "ahegao, rolling eyes, tears, drooling, sweat"],
    dazed: ["half-closed eyes, drooling, exhausted", "(heart-shaped pupils:1.05), dazed smile, flushed", "empty eyes, tongue out, drooling, slack expression", "@_@, dazed, sweat, heavy blush"],
  };
  const FACE = "(expressive face:1.1), detailed eyes";   // 예전 natural facial expression은 표정을 늘 비슷하게 눌러서 바꿈   // 절정 표정과 부딪치지 않게 'subtle'은 뺌   // 사실적인 표정일 때만 붙임
  const EXPR_USE = {
    video1: ["sweet", "shy", "teasing"], video2: ["shy", "teasing"], meet1: ["sweet", "shy", "teasing"], meet2: ["shy", "sweet", "teasing"],
    kiss: ["shy", "sweet"], neck: ["shy", "teasing", "pleasure"], caress: ["shy", "needy", "teasing"],
    undress1: ["shy", "teasing"], undress2: ["shy", "teasing", "needy"], undress3: ["shy", "needy"], self: ["shy", "needy", "pleasure", "teasing"],
    chest: ["shy", "pleasure", "teasing"], hand: ["needy", "pleasure", "shy"], oral: ["teasing", "shy", "needy"], ready: ["needy", "shy", "sweet"],
    pose1: ["pleasure", "sweet", "shy"], pose2: ["pleasure", "needy", "intense"], deny1: ["needy"], deny2: ["needy", "pleasure"],
    climax: ["intense", "pleasure"], climax_both: ["intense", "pleasure"], finish_both: ["dazed", "sweet"], after1: ["dazed", "pleasure"], after2: ["dazed", "sweet"], finish: ["dazed", "pleasure", "intense"], care: ["sweet", "dazed"],
    act_hair: ["shy", "sweet"], act_glasses: ["shy", "sweet"], act_strap: ["shy", "teasing"], act_tear: ["shy", "needy", "teasing"], act_panties: ["shy", "needy"], act_cuffs: ["shy", "teasing", "needy"], act_blind: ["shy", "needy"],
    nipple: ["shy", "pleasure"], toy: ["needy", "pleasure", "intense"], cunni: ["pleasure", "needy", "shy"], analtoy: ["shy", "needy", "pleasure"], handjob: ["teasing", "sweet", "shy"], paizuri: ["teasing", "shy"], footjob: ["teasing", "sweet"], thighjob: ["shy", "needy"], sixtynine: ["pleasure", "teasing"], grind: ["needy", "pleasure"],
  };
  const EXPR_LOUD_SET = new Set(Object.values(EXPR_LOUD).flat());
  let lastExpr = "";
  // 표정 앞쪽 3개 태그에 가중치 (다른 태그에 묻혀 표정이 늘 비슷하게 나오지 않게) · 이미 가중치가 있으면 그대로
  const emphExpr = (ex) => String(ex || "").split(/,\s*/).filter(Boolean).map((t, i) => (i < 3 && !/[()]/.test(t) ? `(${t}:1.2)` : t)).join(", ");
  const exprFor = (sid, mode, tone) => {
    const src = mode === "real" ? [EXPR] : mode === "loud" ? [EXPR_LOUD] : [EXPR, EXPR_LOUD];
    const use = EXPR_USE[sid] || [], cats = [...use, ...use.filter((k) => (tone || []).includes(k))];   // 캐릭터 성격에 맞는 표정은 두 배로
    if (/^(pose|climax|deny|finish_both)/.test(sid) && Math.random() < 0.5) cats.push("intense", "intense");   // 체위 · 절정은 절반 확률로 더 격한 표정 쪽으로
    const XP = window.BC_EXPR_PARTS;
    if (XP && mode !== "loud" && cats.length && Math.random() < (mode === "real" ? 0.8 : 0.55)) {
      const cats0 = cats[Math.floor(Math.random() * cats.length)], P = XP[cats0];
      if (P) { const r = (a) => a[Math.floor(Math.random() * a.length)]; for (let i = 0; i < 4; i++) { const mixE = window.BC_EXPR_MIX && ["pleasure", "needy"].includes(cats0) && Math.random() < 0.3 ? r(window.BC_EXPR_MIX) : "";
          const t = [P.f && Math.random() < 0.8 ? r(P.f) : "", mixE, r(P.e), r(P.m), P.b && Math.random() < 0.7 ? r(P.b) : "", r(P.x), P.y && Math.random() < 0.75 ? r(P.y) : ""].filter(Boolean).join(", "); if (t !== lastExpr) { lastExpr = t; return t; } }   /* 눈 · 입 · 눈썹 · 볼 · 몸의 반응 */ }
    }
    const pool = cats.flatMap((k) => src.flatMap((E) => E[k] || [])).filter((t) => t !== lastExpr);
    if (!pool.length) return "";
    lastExpr = pool[Math.floor(Math.random() * pool.length)]; return lastExpr;
  };
  // 가슴 크기 — 공통 설정(생성 탭 · 설정 탭의 '가슴 크기')을 따르거나, 이 시퀀스만 따로 · 캐릭터 프롬프트 그대로
  // 머리 색 · 눈 색 — 캐릭터 프롬프트의 색 태그를 바꿔 끼움 (없으면 붙임)
  const HAIRS = { char: "캐릭터 그대로", black: "검정", brown: "갈색", blonde: "금발", silver: "은발", white: "흰색", grey: "회색", pink: "분홍", red: "빨강", blue: "파랑", purple: "보라" };
  const EYES = { char: "캐릭터 그대로", brown: "갈색", black: "검정", grey: "회색", blue: "파랑", green: "초록", red: "빨강", purple: "보라", yellow: "금색", pink: "분홍" };
  const COLOR_W = "(?:light |dark |platinum |ash |pale )?(?:black|brown|blonde|blond|silver|white|grey|gray|pink|red|blue|purple|orange|green|aqua|yellow|golden|amber|violet|hazel)";
  const recolor = (body, kind, k) => {
    if (!k || k === "char") return body;
    const tag = kind === "hair" ? `${k} hair` : `${k} eyes`;
    const re = new RegExp(`\\b${COLOR_W}\\s+${kind === "hair" ? "hair" : "eyes"}\\b`, "gi");
    return re.test(body) ? body.replace(re, tag) : `${body}, (${tag}:1.1)`;
  };
  const BUSTS = { global: "공통 설정 따름", char: "캐릭터 그대로", small: "작게", medium: "보통", large: "크게", huge: "아주 크게" };
  const CLIMAXES = { yes: { n: "바로 절정" }, no: { n: "애태우다가 절정 (애태우기 2장 추가)" }, both: { n: "동시 절정" }, denyBoth: { n: "애태우다가 동시 절정" } };
  const isBoth = (o) => o.cx === "both" || o.cx === "denyBoth";
  // 사정 위치 태그에서 '사정하는 순간' 태그를 뺀 결과(어디에 묻었는지)만
  const cumLoc = (o) => o.fin.tags.split(", ").filter((t) => !/ejaculation|cumshot|pulling out|^penis$|hips pressed|penis deep|^sweat$|upper body|from above/.test(t)).join(", ");
  const PLACES = {
    stairs: {
      n: "회사 비상계단", bg: "(emergency stairwell:1.25), concrete stairs, handrail, green exit sign, dim fluorescent light, indoors",
      meet: [
        ["일터 · 마주침", "standing near desk, holding documents, neutral expression, slight smile, looking at viewer, modern open plan office, rows of desks, computer monitors, office chairs, glass partition, indoors, daytime"],
        ["비상계단 · 둘만 남음", "nervous, looking around, blush, biting lip, standing, back against wall, (emergency stairwell:1.25), concrete stairs, handrail, green exit sign, dim fluorescent light, indoors, cowboy shot"],
      ],
      lie: false, care: "fixing clothes, flushed, dazed, afterglow, leaning against wall, sitting on stairs, heavy breathing, messy hair",
      floor: "clothes on stairs",
    },
    home: {
      n: "그녀의 원룸", bg: "bedroom, bed, pillow, modern studio apartment, double bed, sofa, clean white interior, kitchenette, large window, city view, indoors, night, warm artificial lights",
      meet: [
        ["데이트 · 마주 앉음", "sitting across table, hands on table, first date, smile, casual restaurant interior, small table for two, two cups of water, menu, pendant light, window with street lights, indoors, evening"],
        ["그녀의 집 · 소파", "sitting on sofa, light blush, smile, looking at viewer, holding cup, modern studio apartment, sofa, clean white interior, large window, city view, indoors, night, warm artificial lights"],
      ],
      lie: true, care: "naked under blanket, bare shoulders, eyes closed, peaceful, afterglow, soft smile, lying in bed, under blanket, cuddling, head on chest, arm around shoulder, messy hair",
      floor: "clothes on floor",
    },
    hotel: {
      n: "러브호텔", bg: "love hotel room, double bed with white sheets, headboard with led strip, pink neon light through window, mirror on wall, dim lighting, indoors, night",
      meet: [
        ["바 · 한잔", "sitting on bar stool at counter, holding cocktail glass, leaning on hand, light blush, smile, dim cocktail bar interior, long wooden bar counter, shelves of liquor bottles backlit, warm amber lighting, indoors, night"],
        ["호텔 · 문 앞", "standing, blush, looking away, nervous, holding bag, love hotel room, double bed with white sheets, pink neon light through window, dim lighting, indoors, night, cowboy shot"],
      ],
      lie: true, care: "naked under blanket, bare shoulders, eyes closed, peaceful, afterglow, soft smile, lying in bed, under blanket, cuddling, head on chest, arm around shoulder, messy hair, pink neon light",
      floor: "clothes on floor",
    },
    // ↓ Hunt 장소(place_* 풍경 · 일터 장면)에서 가져온 배경 태그
    office: {
      n: "야근 사무실", bg: "modern open plan office after hours, empty desks, single desk lamp, monitor glow, large windows, city lights outside, dim, indoors, night",
      meet: [
        ["일터 · 야근", "sitting at desk, looking at monitor, tired, then looking up at viewer, light blush, modern open plan office after hours, empty desks, single desk lamp, monitor glow, indoors, night"],
        ["사무실 · 둘만 남음", "standing, leaning on desk, nervous, looking around, blush, biting lip, modern open plan office after hours, empty desks, single desk lamp, monitor glow, large windows, city lights outside, dim, indoors, night, cowboy shot"],
      ],
      lie: false, care: "fixing clothes, flushed, dazed, afterglow, sitting on office chair, buttoning up, messy hair, scattered documents, desk lamp light",
      floor: "clothes on office floor",
    },
    meeting: {
      n: "빈 회의실", bg: "empty office meeting room, long conference table, office chairs, closed blinds, fluorescent light dimmed, whiteboard, indoors, night",
      meet: [
        ["일터 · 회의 끝", "office lady, sitting at conference table, holding documents, neutral expression, slight smile, looking at viewer, empty office meeting room, long conference table, blinds, fluorescent light, indoors"],
        ["회의실 · 블라인드 내림", "standing by window, pulling down blinds, looking back at viewer, nervous, blush, empty office meeting room, long conference table, closed blinds, dim, indoors, cowboy shot"],
      ],
      lie: false, care: "fixing clothes, flushed, dazed, afterglow, sitting on conference table, smoothing skirt, messy hair, closed blinds",
      floor: "clothes on meeting room floor",
    },
    myhome: {
      n: "내 원룸", bg: "small studio apartment, single bed, bedside lamp, kitchenette, window with city lights, dim, cozy, indoors, night, warm artificial lights",
      meet: [
        ["데이트 · 마주 앉음", "sitting across table, hands on table, first date, smile, casual restaurant interior, small table for two, pendant light, window with street lights, indoors, evening"],
        ["내 방 · 처음 와 봄", "sitting on edge of single bed, looking around room curiously, hands on knees, light blush, shy smile, small studio apartment, bedside lamp, kitchenette, window with city lights, dim, cozy, indoors, night"],
      ],
      lie: true, care: "naked under blanket, bare shoulders, eyes closed, peaceful, afterglow, soft smile, lying in single bed, under blanket, cuddling, head on chest, messy hair, bedside lamp",
      floor: "clothes on floor",
    },
    pension: {
      n: "바닷가 펜션", bg: "seaside pension room at night, wooden interior, double bed, large window, moonlight on ocean, warm lamp, indoors",
      meet: [
        ["여행 · 밤바다", "standing on beach at night, wind in hair, holding sandals, smile, looking back at viewer, moonlight on water, starry sky, distant town lights, outdoors, night"],
        ["펜션 · 창가", "sitting on windowsill, knees up, looking at ocean then at viewer, light blush, seaside pension room at night, wooden interior, large window, moonlight on ocean, warm lamp, indoors"],
      ],
      lie: true, care: "naked under blanket, bare shoulders, eyes closed, peaceful, afterglow, soft smile, lying in bed, under blanket, cuddling, head on chest, moonlight through window, messy hair",
      floor: "clothes on wooden floor",
    },
    gym: {
      n: "마감 후 헬스장", bg: "fitness gym interior after closing, treadmills, dumbbell rack, weight benches, wall mirrors, rubber floor, half the ceiling lights off, dim, indoors, night",
      meet: [
        ["헬스장 · 운동 중", "sportswear, sweat, ponytail, wiping sweat with towel, water bottle, smile, looking at viewer, fitness gym interior, treadmills, dumbbell rack, wall mirrors, ceiling lights, indoors"],
        ["헬스장 · 불 꺼진 뒤", "sitting on weight bench, sweat, flushed, looking up at viewer, nervous, fitness gym interior after closing, wall mirrors, half the ceiling lights off, dim, indoors, night, cowboy shot"],
      ],
      lie: false, care: "fixing clothes, flushed, dazed, afterglow, sitting on weight bench, sweat, towel around neck, messy hair, wall mirrors",
      floor: "clothes on rubber floor",
    },
    class: {
      n: "저녁 강의실", bg: "evening class studio after class, long tables, chairs, whiteboard, projector screen, fluorescent light, window with dark sky, indoors, night",
      meet: [
        ["강의 · 옆자리", "sitting at long table, notebook, pen, glancing sideways at viewer, small smile, evening class studio, whiteboard, projector screen, fluorescent light, indoors, night"],
        ["강의실 · 모두 나간 뒤", "sitting on edge of table, legs crossed, looking at viewer, light blush, nervous smile, evening class studio after class, empty chairs, whiteboard, window with dark sky, indoors, night, cowboy shot"],
      ],
      lie: false, care: "fixing clothes, flushed, dazed, afterglow, sitting on table, messy hair, notebooks scattered, empty classroom",
      floor: "clothes on classroom floor",
    },
  };
  const POSES = {
    wall: { n: "벽 (선 채로)", stand: true, tags: "woman upright, back against wall, male standing, his hand holding her thigh up, one leg raised, (vaginal sex:1.2), man penetrating woman, penis in pussy, penetration, from side, full body, standing" },
    doggy: { n: "뒤에서", stand: true, back: true, tags: "sex from behind, (woman bent over:1.3), hands on wall, back arched, ass out, (vaginal sex:1.2), man penetrating woman, penis in pussy, penetration, from behind" },
    cowgirl: { n: "위에서 (그녀가 위)", stand: false, top: true, tags: "girl on top, cowgirl position, straddling, (vaginal sex:1.2), penis in pussy, penetration, hands on his chest, from below, pov" },
    press: { n: "누르기 (정상위)", stand: false, tags: "missionary, lying on back, legs up, spread legs, man above her, (vaginal sex:1.2), penis in pussy, penetration, from above, pov, full body" },
    side: { n: "옆으로 누워", stand: false, back: true, tags: "lying on side, spooning, sex from behind, (vaginal sex:1.2), penis in pussy, penetration, his one hand on her breast, from side" },
    lifted: { n: "들어올리기", stand: true, tags: "standing sex, carrying, legs wrapped around, arms around neck, (vaginal sex:1.2), penis in pussy, penetration, from side, full body, floor visible" },
    // Hunt 체위에서 더 가져옴 (Hunt 프롬프트의 자세 태그)
    wallBack: { n: "벽에 기대 뒤에서 (다리 들고)", stand: true, back: true, tags: "(standing sex:1.2), (leg lift:1.3), pinned against wall from behind, (woman pressed against wall:1.3), her chest and cheek against wall, (standing on one leg:1.2), (one leg lifted:1.3), behind woman, male standing, his hand holding her thigh up, (vaginal sex:1.2), man penetrating woman, penis in pussy, penetration, from side, full body, standing" },
    allfours: { n: "네 발로 (뒤에서)", stand: false, back: true, tags: "doggystyle, sex from behind, (woman on all fours:1.35), on hands and knees, back arched, behind woman, male kneeling, (vaginal sex:1.2), man penetrating woman, penis in pussy, penetration, on bed, from behind, pov" },
    reverse: { n: "등 돌려 올라타기", stand: false, back: true, top: true, tags: "(reverse cowgirl position:1.2), woman on top, (woman straddling man facing away:1.3), below woman, male lying on back, (vaginal sex:1.2), man penetrating woman, penis in pussy, penetration, ass focus, from behind, pov, from below" },
    fold: { n: "접어 누르기 (깊이)", stand: false, tags: "(mating press:1.35), face-to-face, (man on top of woman:1.3), (knees pressed beside shoulders:1.3), (thighs folded against torso:1.25), (deep penetration:1.2), folded, (woman lying on back:1.3), above woman, male leaning over woman, (vaginal sex:1.2), man penetrating woman, penis in pussy, penetration, from above, pov, full body" },
    prone: { n: "엎드려 눌러서", stand: false, back: true, tags: "(prone bone:1.2), sex from behind, (woman lying face down:1.35), prone, chest down, above woman, male leaning over woman, (vaginal sex:1.2), man penetrating woman, penis in pussy, penetration, from above, from behind" },
  };
  // 애무 더하기 (Hunt 애무 목록) — 고른 것만 한 시퀀스 안에 이어서 들어감
  // 숨은 성향 (Wayward latent traits · huntlatent.js) — 고른 성향은 한 시퀀스에 다 들어감 (조합 아님)
  const LATENT = window.BC_LATENT || {};
  const TRAITS = Object.fromEntries(Object.entries(LATENT).map(([k, v]) => [k, { n: v.n }]));
  const latGroup = (s) => { const lv = ((window.BC_WAY || {}).LV || {})[s.id]; if (s.date || s.meet != null || s.solo || lv == null || lv <= 1) return 0; if (lv === 5 || ["finish", "finish_both", "care", "after1", "after2"].includes(s.id)) return 3; if (s.part === "pose") return 2; return 1; };
  // 인원수 · 구성 (3 · 4 · 5인) — fem: 당신 + 여성 여러 명 · male: 그녀 + 남성 여러 명 (서로 원해서 함께)
  // 인원 구성: 여성 수 × 남성 수 (예: 3여 1남 · 1여 4남 · 2여 2남) — 당신은 남성 중 한 명 · 모두 서로 원해서 함께
  const GIRLS = { 1: "1여", 2: "2여", 3: "3여", 4: "4여" };
  const BOYS = { 1: "1남 (당신)", "1o": "1남 (바람 · 불륜 상대)", 2: "2남", 3: "3남", 4: "4남" };
  const PARTIES = GIRLS, PMODES = BOYS;
  // 당신의 역할 (남성 2명 이상일 때): 함께함 / 지켜보는 남편 — 남편이 허락한 관계 · 당신은 남성 수에 들어가지만 행위엔 다른 남자들만
  // 관계 지정 (Hunt처럼): 그림 분위기 태그 · 관계가 드러나는 서술 · 그녀의 말
  const RELS = { none: "지정 안 함", interest: "관심 있음", some: "썸", lover: "연인", partner: "파트너 (몸이 맞는 사이)", married: "부부", affair: "불륜 (그녀는 남의 아내 · 당신이 상대)", cheat: "아내의 바람 (당신은 남편 · 장면엔 다른 남자)", cheatwatch: "아내의 바람 → 알고 허락해 지켜봄", dom: "주인(당신) · 복종(그녀)", sub: "주인(그녀) · 복종(당신)" };
  // 다인원(3인 이상) 상황 설정
  const SITUS = { none: "지정 안 함", pure: "순애", ntr: "네토라레 (그녀가 넘어감 · 당신은 장면에 없음)", ntori: "네토리 (남자친구 있는 그녀를 당신들이)", swap: "부부 스와핑 (2여 2남 이상 · 당신은 상대 아내와)" };
  let callJagi = false;   // 호칭 옵션 (UI가 그려진 뒤 저장값으로 채움)
  const ROLES = { join: "함께함", watch: "지켜보는 남편 (허락한 관계)", absent: "장면에 없음 (당신은 모름 · 상대는 다른 남자)" };
  const watchOn = (o) => !!(o && o.watch && o.nb > 1);
  // 지켜보는 남편: 서술에서 행위하는 '당신'을 '그'(다른 남자)로 — 따옴표 안의 말은 그대로
  const unYou = (t) => String(t).split('"').map((seg, i) => (i % 2 ? seg : seg.replace(/당신은/g, "그는").replace(/당신이/g, "그가").replace(/당신의/g, "그의").replace(/당신을/g, "그를").replace(/당신에게/g, "그에게").replace(/당신과/g, "그와").replace(/당신도/g, "그도").replace(/당신만/g, "그만").replace(/당신/g, "그"))).join('"');
  const sidG = (sid) => (/^(meet|kiss|date|video)/.test(sid) ? 0 : /^(pose|climax|deny|ready)/.test(sid) ? 2 : /^(after|finish|care)/.test(sid) ? 3 : 1);
  const givenName = (ch) => { const n = String(ch.n || "").split(" · ")[0].replace(/\s*\(.*\)$/, ""); return /^[가-힣]{3}$/.test(n) ? n.slice(1) : n; };
  const gTag = (n) => (n === 1 ? "1girl" : `${n}girls`), bTag = (n) => (n === 1 ? "1boy" : `${n}boys`);
  // 서술 · 말 묶음: 여성 여럿이면 fem, 남성 여럿이면 male, 둘 다면 그때그때 섞음
  const PT_OF = (o) => { const k = o.ng > 1 && o.nb > 1 ? (Math.random() < 0.5 ? "male" : "fem") : o.nb > 1 ? "male" : "fem"; return (window.BC_PARTY || {})[k]; };
  // 인원수 고정: 맞는 인원 태그는 세게, 틀린 인원 태그는 부정어로
  const wrongCount = (o, noMen) => {
    const w = [];
    const W = (s, i, k) => (Math.abs(i - k) === 1 ? `(${s}:${/girls/.test(s) ? 1.45 : 1.3})` : s);   // 여자가 한 명 더 생기는 경우가 많아 여성 쪽을 더 세게
    for (let i = 2; i <= 6; i++) { if (i !== o.ng) w.push(W(`${i}girls`, i, o.ng)); if (!noMen && i !== o.nb) w.push(W(`${i}boys`, i, o.nb)); }
    if (o.ng === 1) w.push("multiple girls"); if (!noMen && o.nb === 1) w.push("multiple boys");
    w.push(`${o.ng + o.nb + 1} people`, "crowd");
    return w.join(", ");
  };
  const partyHead = (o) => {
    const both = o.ng > 1 && o.nb > 1, W = both || o.nb >= 4 ? 1.45 : 1.35;
    const lay = o.ng === 1
      ? (o.nb >= 4 ? "(gangbang:1.1), (spitroast:1.15), (double handjob:1.2), surrounded by men" : o.nb === 3 ? "(spitroast:1.1), (handjob:1.1)" : o.nb === 2 ? "(spitroast:1.05)" : "")
      : o.nb === 1 ? (o.ng === 2 ? "ffm threesome" : "harem, girls around one man")
      : `(orgy:1.15), (side-by-side:1.15), (multiple couples:1.1), each girl paired with a man${o.nb > o.ng ? ", (spitroast:1.05)" : ""}`;
    return [`(${gTag(o.ng)}:${W})`, `(${bTag(o.nb)}:${W})`, o.ng > 1 ? "(multiple girls:1.15)" : "", o.nb > 1 ? "(multiple boys:1.15)" : "", "(group sex:1.15)", o.ng + o.nb === 3 && o.nb > 1 ? "mmf threesome" : "", lay,
      "adult male, (faceless male:1.35), (head out of frame:1.25), (male face out of frame:1.2), hetero"].filter(Boolean).join(", ");
  };
  // 그림 속 인원수 (태거): 여성 · 남성 수를 읽음 — 못 읽으면 null
  const countOf = (tags) => {
    const T = (tags || []).map((x) => String(typeof x === "string" ? x : x.tag || x.name || "").toLowerCase().replace(/_/g, " ").trim());
    const pick = (re) => { const s = new Set(); for (const x of T) { const m = x.match(re); if (m) s.add(m[1] ? +m[1] : 1); } return s.size ? s : null; };
    return { g: pick(/^(?:(\d)\+?girls|1girl)$/), b: pick(/^(?:(\d)\+?boys|1boy)$/) };
  };
  // 구경꾼 없이 전원 참여
  const partyAct = (o) => o.ng > 1 && o.nb > 1
    // 여성 여럿 + 남성 여럿: 짝마다 따로 (여성끼리 · 손 태그는 사람을 더 그리게 만들어서 뺌)
    ? `(everyone participating:1.15), (each couple having sex:1.2), ${o.ng} women and ${o.nb} men, bodies pressed together`
    : ["(everyone participating:1.15)", o.ng === 2 && o.nb === 1 ? "(ffm threesome:1.2)" : "",
    o.nb > 1 ? (o.nb === 2 && o.ng === 1 ? "(fellatio:1.0), (groping:1.05), both men touching her" : "(multiple penises:1.1), handjob, (fellatio:0.9), (groping:1.05), all men touching the girls") : "",
    o.ng > 1 ? "(girl on girl:1.1), yuri, (breast sucking:0.95), (french kiss:0.9), (fingering:0.9), all girls touching each other" : "", "bodies pressed together"].filter(Boolean).join(", ");
  const FORES = { nipple: "젖꼭지", toy: "진동기", cunni: "그가 입으로", analtoy: "애널 비즈", handjob: "손으로 해 주기", paizuri: "가슴으로", footjob: "발로", thighjob: "허벅지 사이로", sixtynine: "69", grind: "비비기 (넣지 않고)" };
  // 하면서 (Hunt '하면서') — 체위 장마다 돌아가며 하나씩 붙음 · 애널로는 체위 전체에 적용
  const DURING = {
    np: { n: "젖꼭지 만지며", tags: "(nipple tweak:1.15), his fingers on her nipple" },
    grope: { n: "가슴 움켜쥐며", tags: "(grabbing another's breast:1.1), breast grab, his one hand on her breast" },
    hair: { n: "머리 쓰다듬으며", tags: "his one hand in her hair, stroking hair" },
    neck: { n: "목에 키스하며", tags: "(man kissing her neck:1.2), his lips on the side of her neck, her head tilted to the side" },
    kiss: { n: "키스하며", tags: "(kissing:1.2), kiss during sex, lips touching", ok: (p) => !p.back || p === POSES.side },
    vibe: { n: "진동기 대고", tags: "(vibrator:1.2), (vibrator on clitoris:1.1), sex toy, thin cord" },
    look: { n: "뒤돌아보며", tags: "(looking back over shoulder:1.25), (face visible:1.2)", ok: (p) => !!p.back },
    hands: { n: "손깍지 끼고", tags: "(holding hands:1.2), interlocked fingers" },
    anal: { n: "애널로 (체위 전체)" },
  };
  const FINISH = {
    inside: { n: "안에", tags: "(ejaculation:1.3), (cum in pussy:1.4), (internal cumshot:1.3), (cum overflow:1.1), penis deep inside, hips pressed together, sweat" },
    stomach: { n: "배 위", tags: "(ejaculation:1.3), (cumshot:1.3), (pulling out:1.2), penis, (cum on stomach:1.3), cum string, sweat" },
    thighs: { n: "허벅지", tags: "(ejaculation:1.3), (cumshot:1.3), (pulling out:1.2), penis, (cum on thighs:1.2), cum on pussy, cum string, sweat" },
    breasts: { n: "가슴", tags: "(ejaculation:1.3), (cumshot:1.3), penis, (cum on breasts:1.2), cum string, sweat, upper body, from above" },
  };
  // 도구 (애무 · 자위 단계) — 서로 원해서 쓰는 성인용품
  const TOOLS = {
    none: { n: "손만", caress: "his fingers rubbing her crotch over panties", self: "(fingering:1.2), hand between legs, fingers in pussy" },
    wand: { n: "전동 마사지기", caress: "(holding magic wand:1.2), (vibrator on crotch:1.2), vibrator over panties", self: "(holding magic wand:1.25), (vibrator on pussy:1.2), sex toy" },
    egg: { n: "로터", caress: "(egg vibrator:1.25), vibrator cord, remote control vibrator, vibrator under panties", self: "(egg vibrator:1.25), vibrator on clitoris, vibrator cord, sex toy" },
    dildo: { n: "딜도", caress: "(holding dildo:1.2), teasing with dildo, rubbing dildo against panties, sex toy", self: "(dildo:1.3), (dildo in pussy:1.2), holding dildo, sex toy" },
  };
  const OUTFITS = { work: "일터", casual: "평상복", date: "데이트", officeDate: "퇴근 데이트", lounge: "집에서 입는 옷", lingerieBlack: "란제리 (검정)", lingerieWhite: "란제리 (흰색)",
    babydoll: "비치는 베이비돌", negligee: "비치는 네글리제", bodystocking: "바디스타킹", microBikini: "마이크로 비키니", bunny: "바니걸", maid: "메이드복", nurse: "간호사복", china: "차이나 드레스", latex: "라텍스 바디슈트" };
  // 란제리 — 브라 · 팬티 · 가터벨트 · 밴드 스타킹 한 벌. 만남(데이트 · 장소 도착 · 영상통화)은 데이트 옷 차림, 키스부터 란제리
  const LINGERIE = {
    lingerieBlack: "(black lace lingerie:1.2), black lace bra, black lace panties, (black garter belt:1.2), garter straps, black thighhighs, lace-trimmed legwear",
    lingerieWhite: "(white lace lingerie:1.2), white lace bra, white lace panties, (white garter belt:1.2), garter straps, white thighhighs, lace-trimmed legwear",
    babydoll: "(see-through babydoll:1.2), sheer pink lingerie, frilled babydoll, lace panties, bare shoulders, navel visible through fabric",
    negligee: "(see-through negligee:1.2), white sheer nightgown lingerie, thin straps, lace trim, nipples visible through fabric, bare legs",
    bodystocking: "(black bodystocking:1.25), fishnet bodystocking lingerie, see-through, full-body fishnet, high heels",
    microBikini: "(micro bikini:1.25), string bikini, side-tie bikini bottom, tiny triangle bikini top, navel, shiny skin, oiled skin",
    bunny: "(playboy bunny:1.25), black strapless leotard, fake rabbit ears, (fishnet pantyhose:1.1), detached collar, bowtie, wrist cuffs, high heels",
    maid: "(maid:1.2), black short maid dress, frilled white apron, maid headdress, puffy short sleeves, white thighhighs, mary janes",
    nurse: "(nurse:1.2), white short nurse dress, nurse cap, white thighhighs, unbuttoned collar, cleavage",
    china: "(china dress:1.2), red qipao, side slit, pelvic curtain, bare legs, sleeveless, high heels",
    latex: "(black latex bodysuit:1.25), shiny clothes, front zipper, elbow gloves, high-heeled boots, cleavage",
  };
  const LOUNGE = "loungewear, oversized white t-shirt, black dolphin shorts, barefoot";   // Hunt 그림 공방 '집에서 입는 옷'
  // 그림 공방(미리 뽑기)의 데이트 장면 — 배경은 Hunt 장소 풍경(때별), 자세는 Hunt 데이트 장면(없는 곳은 같은 형식으로 만듦), out: 바깥(날씨 적용)
  const MOOD = "happy, gentle smile, loving gaze, blush, shy, intimate atmosphere";   // 그림 공방 기준(호감 70)
  const DATES = {
    cafe: { n: "카페", pose: "sitting at cafe table, holding coffee cup with both hands", bg: { day: "cozy cafe interior, wooden tables, cushioned chairs, espresso machine, pastry display case, hanging plants, chalkboard menu, large window, street view outside, indoors, daytime, bright", evening: "cozy cafe interior, wooden tables, cushioned chairs, edison bulbs, warm lights, hanging plants, large window, dusk street outside, indoors, evening, dusk", night: "cozy cafe interior, wooden tables, cushioned chairs, espresso machine, hanging plants, large window, street view outside, indoors, night, warm artificial lights" } },
    bar: { n: "바·라운지", pose: "sitting on bar stool at counter, holding cocktail glass, leaning on hand", bg: { day: "dim cocktail bar interior, long wooden bar counter, bar stools, shelves of liquor bottles backlit, pendant lamps, warm amber lighting, cocktail glasses, moody, indoors" } },
    club: { n: "클럽", pose: "dancing, arms raised, dynamic pose", bg: { day: "crowded night club interior, dance floor, dj booth, colorful laser lights, neon lights, fog machine haze, disco ball, bar counter in background, silhouettes of crowd, dark, indoors" } },
    amusement: { n: "놀이공원", out: true, pose: "holding cotton candy, ferris wheel behind, cheerful", bg: { day: "amusement park, ferris wheel, carousel, roller coaster track, balloons, food stalls, colorful flags, crowd in distance, outdoors, daytime, bright", evening: "amusement park at dusk, ferris wheel lights, carousel lights, string lights, food stalls, purple sky, outdoors, evening, dusk", night: "amusement park at night, illuminated ferris wheel, carousel lights, string lights, glowing signs, food stalls, dark sky, outdoors, night" } },
    restaurant: { n: "레스토랑", pose: "sitting across table, hands on table, first date", bg: { day: "casual restaurant interior, small table for two, two cups of water, menu, pendant light, other tables in background, window with street lights, indoors, daytime, bright", evening: "casual restaurant interior, small table for two, two cups of water, menu, pendant light, other tables in background, window with street lights, indoors, evening, dusk", night: "casual restaurant interior, small table for two, two cups of water, menu, pendant light, other tables in background, window with street lights, indoors, night, warm artificial lights" } },
    izakaya: { n: "이자카야", pose: "sitting at small wooden table, holding beer mug, cheeks flushed from drinking, leaning forward", bg: { day: "japanese izakaya interior, wooden counter, grill smoke, red paper lanterns, noren curtain, sake bottles on shelf, handwritten menu strips on wall, small wooden tables, warm light, indoors" } },
    karaoke: { n: "노래방", pose: "holding microphone, singing, sitting on sofa, one hand raised", bg: { day: "karaoke room, l-shaped sofa, low table with tambourine and remote, wall mounted tv screen with lyrics, colorful led lights, disco ball, microphones, indoors" } },
    cinema: { n: "영화관", pose: "sitting in theater seat, holding popcorn, screen light on face, leaning toward viewer", bg: { day: "movie theater auditorium, rows of red velvet seats, cup holders, large screen glow, aisle floor lights, dark, indoors" } },
    street: { n: "쇼핑몰·거리", out: true, pose: "walking, holding shopping bag, looking back at viewer", bg: { day: "shopping street, storefronts, display windows, pedestrians in distance, outdoors, daytime, bright", evening: "city sidewalk, office buildings, street lights turning on, sunset sky, outdoors, evening, dusk", night: "shopping street at night, neon signs, glowing storefronts, outdoors, night" } },
    river: { n: "한강 공원", out: true, pose: "sitting on picnic mat, holding canned drink, wind in hair", bg: { day: "riverside park, wide river, grass lawn, picnic mats, bicycle path, bridge in distance, city skyline, trees, outdoors, daytime, bright", evening: "riverside park at sunset, wide river, grass lawn, bicycle path, bridge silhouette, orange sky, city skyline, outdoors, evening, dusk", night: "riverside park at night, river with city light reflections, lit bridge, street lamps, grass lawn, benches, outdoors, night" } },
  };
  const TIMES = { day: "낮", evening: "저녁", night: "밤" };
  const WEATHER = { clear: { n: "☀️ 맑음", tags: "" }, rain: { n: "🌧 비", tags: "rain, holding umbrella, wet ground, overcast" }, snow: { n: "❄️ 눈", tags: "snowing, snowflakes, winter coat, scarf, breath visible" }, heat: { n: "🔥 폭염", tags: "summer, intense sunlight, sweat, holding hand fan" } };
  const dateBg = (d, t) => d.bg[t] || d.bg.day + (t === "evening" ? ", evening" : t === "night" ? ", night" : "");

  // 단계 — part: "pre"(공통, 한 번) · "pose"(체위마다) · "end"(마지막 한 번), duo: 2인, cloth: 옷 상태 키, undress: 옷 벗기기 단계
  // cloth "main" = 본편 옷 상태(반쯤 입은 채 = 위·아래 올림 / 다 벗은 채)
  const STAGES = [
    // 영상통화 (그림 공방 '영상통화' — 1인, 휴대폰 화면 구도). 기본은 꺼짐
    { id: "video1", part: "pre", video: 1, solo: 1, n: () => "영상통화 · 1", tags: () => "video call, (phone screen:1.1), selfie angle, holding phone, looking at viewer, close-up, sitting on bed, bedroom, warm light, shy smile, light blush" },
    { id: "video2", part: "pre", video: 1, solo: 1, n: () => "영상통화 · 2", tags: (o) => `video call, (phone screen:1.1), selfie angle, holding phone, looking at viewer, close-up, sitting on bed, bedroom, warm light, ${G.open[garment(wearOf(o.ch, o.outfit)).top]}, (lace bra:1.3), blush, biting lip` },
    // 만남 첫 장 = 그림 공방의 데이트 장면 (장소 · 때 · 날씨)
    { id: "meet1", part: "pre", n: (o) => `데이트 · ${o.date.n}`, date: 1 },
    { id: "datetoy", part: "pre", optIn: 1, date: 1, toy: 1, n: (o) => `몰래 로터 ① 건네받기 (${o.date.n})`, tp: "sitting at table, upper body", tt: "(man's hand offering a small pink vibrator:1.2), remote control vibrator, (surprised:1.15), (blush:1.15), looking down at the vibrator, flustered, hand over mouth" },
    { id: "dt_wear", part: "pre", after: "datetoy", date: 1, toy: 1, lewd: 1, n: () => "몰래 로터 ② 화장실에서 넣기", tp: "(public restroom:1.2), toilet stall, standing, one leg raised, from side", tt: "(inserting vibrator:1.25), (skirt lift:1.15), (panties pulled down:1.15), pink vibrator, (embarrassed:1.2), biting lip, heavy blush, looking back nervously, door" },
    { id: "dt_back", part: "pre", after: "datetoy", date: 1, toy: 1, n: () => "몰래 로터 ③ 넣고 돌아와 앉기", tp: "sitting at table, (knees together:1.15), hands on lap, upper body", tt: "(hidden vibrator:1.1), (nervous smile:1.15), (blush:1.15), avoiding eye contact, fidgeting, adjusting skirt" },
    { id: "dt_low", part: "pre", after: "datetoy", date: 1, toy: 1, n: () => "몰래 로터 ④ 약하게", tp: "sitting at table, upper body", tt: "(remote control vibrator:1.1), (vibrator under clothes:1.1), (surprised:1.2), wide-eyed, (light blush:1.1), squirming, holding cup, trying to act normal" },
    { id: "dt_mid", part: "pre", after: "datetoy", date: 1, toy: 1, n: () => "몰래 로터 ⑤ 중간", tp: "sitting, leaning forward, cowboy shot", tt: "(vibrator under clothes:1.1), (trembling:1.2), (heavy blush:1.2), biting lip, teary eyes, (legs pressed together:1.2), clutching table edge, sweat, wavy mouth, people in background" },
    { id: "dt_high", part: "pre", after: "datetoy", date: 1, toy: 1, n: () => "몰래 로터 ⑥ 강하게", tp: "standing, hunched over, cowboy shot", tt: "(vibrator under clothes:1.15), (trembling:1.3), (full-face blush:1.25), (open mouth:1.15), drooling, (teary eyes:1.2), (knees shaking:1.2), covering mouth, hand between legs, people in background" },
    { id: "dt_cum", part: "pre", after: "datetoy", date: 1, toy: 1, n: () => "몰래 로터 ⑦ 데이트 중 절정", tp: "(crouching:1.1), squatting, full body", tt: "(female orgasm:1.3), (public orgasm:1.2), (trembling:1.35), (covering mouth:1.2), (wet panties:1.1), (pussy juice trickle:1.15), wet thighs, legs shaking, half-closed eyes, tears, (heavy blush:1.3), people in background, outdoors" },
    { id: "meet2", part: "pre", n: (o) => o.place.meet[1][0], meet: 1 },
    { id: "kiss", part: "pre", duo: 1, cloth: "wear", neg: NEG_PRE, n: () => "키스", tags: (o) => `(kiss:1.2), lips touching, his face turned away from viewer, back of his head, (kissing:1.2), face-to-face, ${o.place.lie ? "woman lying on back, supine, man above her, his hand beside her head" : "(woman standing against wall:1.25), back against wall, man standing close in front of her, leaning down to her"}, man kissing woman, body contact, mouth focus, fully clothed, blush, from side, close-up, upper body` },
    { id: "act_glasses", part: "pre", act: "glasses", duo: 1, cloth: "wear", neg: NEG_PRE, n: () => "안경 벗기기", tags: (o) => ACTS.glasses.tags(o) },
    { id: "neck", part: "pre", duo: 1, cloth: "wear", neg: NEG_PRE, n: () => "목덜미 · 귓가", tags: () => "(man kissing her neck from behind:1.3), (his lips pressed against the side of her neck:1.25), (his mouth at her ear:1.2), nibbling her earlobe, (her head tilted to the side:1.2), exposed neck, male hugging woman from behind, his arms around her waist, her eyes closed, shivering, (neck focus:1.2), fully clothed, her cheeks flushed, heavy breathing, from side, upper body" },
    { id: "act_cuffs", part: "pre", act: "cuffs", duo: 1, cloth: "wear", neg: NEG_PRE, n: () => "수갑 채우기", tags: (o) => ACTS.cuffs.tags(o) },
    { id: "act_blind", part: "pre", act: "blind", duo: 1, cloth: "wear", neg: NEG_PRE, n: () => "눈가리개", tags: (o) => ACTS.blind.tags(o) },
    { id: "caress", part: "pre", duo: 1, cloth: "wear", toolable: 1, neg: "sex, penis, cum", n: (o) => `애무 · ${TOOLS[o.tool || "none"].n}`, tags: (o) => `(petting:1.2), ${({ skirt: "(his hand under her skirt:1.1)", dress: "(his hand under her dress:1.1)", pants: "(his hand on her crotch over pants:1.1), hand down pants", shorts: "(his hand inside her shorts:1.1)", linger: "(his hand inside her lace panties:1.1), finger under garter strap" })[garment(wearOf(o.ch, o.outfit)).bot]}, groping over clothes, his other hand on her thigh, caressing, ${TOOLS[o.tool || "none"].caress}, ${o.place.lie ? "lying on bed, man beside her" : "back against wall, man standing close in front of her"}, her cheeks flushed, heavy breathing, squirming, biting lip, from side, cowboy shot` },
    { id: "act_hair", part: "pre", act: "hair", duo: 1, cloth: "wear", neg: NEG_PRE, n: () => "머리 풀기", tags: (o) => ACTS.hair.tags(o) },
    { id: "undress1", part: "pre", undress: 1, skip: (o) => o.cm === "bottomless", duo: 1, cloth: "unbutton", neg: "sex, penis, pussy, cum", n: (o) => { const g = garment(wearOf(o.ch, o.outfit)); return `옷 벗기기 · ${g.outer ? "겉옷 벗기고 " : ""}${G.openName[g.top]}`; }, tags: (o) => { const g = garment(wearOf(o.ch, o.outfit)); return `${g.outer ? `(taking off her ${g.outer}:1.1), ` : ""}${G.openAct[g.top]}, undressing her, ${o.place.lie ? "sitting on bed" : "back against wall"}, blush, looking away, embarrassed, biting lip, heavy breathing, face-to-face, upper body, from side`; } },
    { id: "act_strap", part: "pre", act: "strap", duo: 1, cloth: "unbutton", neg: "sex, penis, pussy, cum", n: () => "어깨끈 내리기", tags: (o) => ACTS.strap.tags(o) },
    { id: "undress2", part: "pre", undress: 1, skip: (o) => o.cm === "bottomless" || o.cm === "unbutton", duo: 1, cloth: "noshirt", neg: "sex, penis, pussy, cum", n: (o) => `옷 벗기기 · ${G.offName[garment(wearOf(o.ch, o.outfit)).top]}`, tags: (o) => `${G.offAct[garment(wearOf(o.ch, o.outfit)).top]}, ${o.place.floor}, covering breasts with arm, blush, flustered, looking away, his hands on her waist, ${o.place.lie ? "sitting on bed" : "back against wall"}, upper body, from side` },
    // 셋째 단계는 본편 옷 상태를 따라감: 다 벗은 채 → 다 벗기 / 반쯤 입은 채(Hunt 기본) → 치마 올리기
    { id: "undress3", part: "pre", undress: 1, duo: 1, cloth: "main", neg: "sex, penis, cum", n: (o) => (o.nudeMain ? "옷 벗기기 · 다 벗기" : `옷 벗기기 · ${G.lowName[garment(wearOf(o.ch, o.outfit)).bot]}`),
      tags: (o) => o.nudeMain
        ? `(taking off panties:1.1), pulling down, ${o.place.floor}, discarded clothes, embarrassed, heavy blush, legs together, hand between legs, ${o.place.lie ? "lying on bed" : "standing, back against wall"}, full body, from front`
        : `${G.lowAct[garment(wearOf(o.ch, o.outfit)).bot]}, his hand on her thigh, pulling panties aside, embarrassed, heavy blush, legs together, ${o.place.lie ? "lying on bed" : "standing, back against wall"}, cowboy shot, from front` },
    // 자위 — 그가 보는 앞에서 그녀가 스스로 (1인 구도 · 본편 옷 상태)
    { id: "act_tear", part: "pre", act: "tear", duo: 1, cloth: "main", neg: "sex, penis, cum", n: () => "스타킹 찢기", tags: (o) => ACTS.tear.tags(o) },
    { id: "act_panties", part: "pre", act: "panties", duo: 1, cloth: "main", neg: "sex, penis, cum", n: () => "팬티 내리기", tags: (o) => ACTS.panties.tags(o) },
    { id: "self", part: "pre", self: 1, cloth: "main", toolable: 1, n: (o) => `자위 · ${TOOLS[o.tool || "none"].n}`, tags: (o) => `(female masturbation:1.3), ${TOOLS[o.tool || "none"].self}, ${o.place.lie ? "lying on bed, spread legs" : "sitting against wall, spread legs"}, looking at viewer, embarrassed, heavy blush, heavy breathing, trembling, pussy juice, pov, from above` },
    { id: "chest", part: "pre", duo: 1, cloth: "top", neg: "sex, vaginal, penis, penetration, cum", n: () => "가슴", tags: (o) => `(breast sucking:1.1), (his hands cupping her breasts from the front:1.15), ${o.place.lie ? "(woman lying on back:1.3), supine, male leaning over woman" : "(woman standing against wall:1.25), back against wall"}, man fondling woman, groping, breast focus, her cheeks flushed, heavy breathing, from side, upper body` },
    { id: "nipple", part: "pre", fore: "nipple", duo: 1, cloth: "top", n: () => "젖꼭지 애무", tags: (o) => `(nipple tweak:1.2), (his fingers pinching her nipples:1.2), nipple play, (his mouth on her other breast:1.1), breast focus, ${o.place.lie ? "woman lying on back, male leaning over woman" : "back against wall"}, her cheeks flushed, heavy breathing, from side, upper body` },
    { id: "hand", part: "pre", duo: 1, cloth: "main", neg: "sex, vaginal, penis, penetration, (penis in pussy:1.2), cum", n: () => "손길 아래로", tags: (o) => `${o.place.lie ? "lying on back, spread legs, man beside her" : "back against wall, one leg raised, legs apart, man crouching in front of her"}, (man fingering woman's vagina:1.3), (man's fingers at woman's vulva:1.25), fingers in pussy, pussy focus, (grabbing another's breast:1.1), her cheeks flushed, heavy breathing, trembling, pov, from above` },
    { id: "toy", part: "pre", fore: "toy", duo: 1, cloth: "main", n: () => "진동기로", tags: () => "(vibrator:1.3), (sex toy:1.2), clitoral stimulation, (woman lying on back:1.3), supine, knees bent, legs apart, (his hand holding a vibrator against her clitoris:1.25), (vibrator on clitoris:1.2), (pov hands:1.15), pussy focus, trembling, from above, pov" },
    { id: "cunni", part: "pre", fore: "cunni", duo: 1, cloth: "main", n: () => "그가 입으로", tags: () => "(cunnilingus:1.25), (man licking pussy:1.2), his head between her thighs, (woman lying on back:1.3), spread legs, her hand on his head, thighs around his head, pussy focus, arched back, from above, pov" },
    { id: "analtoy", part: "pre", fore: "analtoy", duo: 1, cloth: "main", n: () => "애널 비즈", tags: () => "(anal beads:1.3), (anal beads in anus:1.25), sex toy, (woman on all fours:1.35), on hands and knees, looking back over shoulder, behind woman, man inserting anal beads into her anus, ass focus, from behind, close-up" },
    { id: "oral", part: "pre", duo: 1, cloth: "main", n: () => "입으로", tags: () => "fellatio, oral, kneeling, (penis in mouth:1.1), looking up at viewer, hand on his thigh, mouth focus, her cheeks flushed, from above, pov" },
    { id: "handjob", part: "pre", fore: "handjob", hands: 1, duo: 1, cloth: "main", n: () => "손으로 해 주기", tags: () => "(handjob:1.25), (her hand on penis:1.2), stroking penis, sitting beside him, looking at viewer, smile, penis, pov, from above" },
    { id: "paizuri", part: "pre", fore: "paizuri", hands: 1, duo: 1, cloth: "main", n: () => "가슴으로", tags: () => "(paizuri:1.2), man receiving paizuri from woman, breast sex, breast press, her hands pressing her breasts together, kneeling, looking up at viewer, breast focus, from above, pov, upper body" },
    { id: "footjob", part: "pre", fore: "footjob", duo: 1, cloth: "main", n: () => "발로", tags: () => "barefoot, (footjob:1.2), (woman sitting leaning back:1.25), leaning back on her hands, (both legs extended forward toward viewer:1.3), (feet raised:1.2), knees slightly bent, foreshortening, (two-footed footjob:1.15), penis between her feet, soles, toes, pov, from above, feet focus" },
    { id: "thighjob", part: "pre", fore: "thighjob", duo: 1, cloth: "main", n: () => "허벅지 사이로", tags: () => "(thigh sex:1.25), (penis between thighs:1.2), thighs together, (woman lying on back:1.2), legs up, legs together, his hands holding her legs, (no penetration:1.2), from side" },
    { id: "sixtynine", part: "pre", fore: "sixtynine", duo: 1, cloth: "main", n: () => "69", tags: () => "(69:1.3), sixty-nine, (woman on top of man:1.2), (fellatio:1.1), (cunnilingus:1.1), her face at his crotch, his face between her thighs, lying, from side, full body" },
    { id: "grind", part: "pre", fore: "grind", duo: 1, cloth: "main", n: () => "비비기 (넣지 않고)", tags: () => "(grinding:1.2), (sumata:1.2), (penis rubbing pussy:1.25), (no penetration:1.25), penis between labia, lying on back, spread legs, pussy juice, pussy focus, from above, pov" },
    { id: "ready", part: "pose", duo: 1, cloth: "main", n: () => "삽입 직전", tags: (o) => `${o.pose.stand ? "standing, hands on wall, back arched" : "lying on back, spread legs"}, (imminent vaginal:1.3), (imminent penetration:1.25), (penis on pussy:1.25), tip of penis touching pussy, (no penetration:1.2), pussy juice, pussy focus, her cheeks flushed, heavy breathing, trembling` },
    { id: "pose1", part: "pose", duo: 1, cloth: "main", n: (o) => `${o.pose.n} · 1`, tags: (o) => `${o.pose.tags}, sweat, her cheeks flushed, heavy breathing, motion lines` },
    { id: "pose2", part: "pose", duo: 1, cloth: "main", n: (o) => `${o.pose.n} · ${o.again ? "한 번 더" : 2}`, tags: (o) => `${o.pose.tags}, sweat, wet hair, her cheeks flushed, heavy breathing, motion lines, trembling, moaning` },
    // 애태우기: 절정 직전에 멈춰서 애태우는 2장 → 그다음 절정 · 여운 (애태우기를 고른 경우만)
    { id: "deny1", part: "pose", skip: (o) => o.cx !== "no" && o.cx !== "denyBoth", duo: 1, cloth: "main", n: () => "애태우기 · 1", tags: (o) => `${o.pose.tags}, (edging:1.2), (orgasm denial:1.2), movement stopped, frustrated, pleading eyes, needy, biting lip, her cheeks flushed, heavy breathing, sweat, trembling` },
    { id: "deny2", part: "pose", skip: (o) => o.cx !== "no" && o.cx !== "denyBoth", duo: 1, cloth: "main", n: () => "애태우기 · 2", tags: (o) => `${o.pose.tags}, (orgasm denial:1.25), (begging:1.1), teary eyes, desperate, squirming, ${o.place.lie ? "gripping sheets" : "hands on wall"}, her cheeks flushed, heavy breathing, sweat, wet hair, unsatisfied` },
    { id: "climax", part: "pose", skip: isBoth, duo: 1, cloth: "main", n: () => "절정", tags: (o) => `${o.pose.tags}, sweat, wet hair, her cheeks flushed, orgasm, arched back, trembling, tears of pleasure` },
    // 동시 절정: 그녀와 그가 함께 — 사정 위치(안에 / 배 위 …)는 '사정 위치'에서 고른 대로
    { id: "climax_both", part: "pose", skip: (o) => !isBoth(o), duo: 1, cloth: "main", n: (o) => `동시 절정 · ${o.fin.n}`, tags: (o) => `${o.pose.tags}, (simultaneous orgasm:1.25), (ejaculation:1.25), ${o.fin === FINISH.inside ? "(internal cumshot:1.2), cum in pussy, penis deep inside, hips pressed together" : `(pulling out:1.1), cumshot, ${cumLoc(o)}`}, both climaxing, her orgasm, arched back, trembling, holding each other, sweat, wet hair, her cheeks flushed, tears of pleasure` },
    { id: "after1", part: "pose", duo: 1, cloth: "main", n: () => "여운 · 1", tags: (o) => `${o.pose.tags}, flushed, dazed, (afterglow:1.05), wet pussy, ${isBoth(o) ? cumLoc(o) + ", " : ""} (overstimulation:1.1), post-orgasm, sensitive, twitching, sweat` },
    { id: "after2", part: "pose", duo: 1, cloth: "main", n: () => "여운 · 2", tags: (o) => `${o.pose.tags}, flushed, dazed, (afterglow:1.05), ${isBoth(o) ? cumLoc(o) + ", " : ""} (overstimulation:1.2), post-orgasm, body jerk, legs shaking, ${o.place.lie ? "gripping sheets" : "hands on wall"}, sweat, wet hair` },
    { id: "finish", part: "pose", skip: isBoth, duo: 1, cloth: "main", n: (o) => `사정 · ${o.fin.n}`, tags: (o) => `${o.pose.stand && !o.place.lie ? "standing, back against wall" : "lying on back, spread legs"}, ${o.fin.tags}, her cheeks flushed, heavy breathing` },
    // 동시 절정이면 사정은 이미 끝났으니 '마무리' — 빼낸 뒤 · 끌어안고 숨 고르기
    { id: "finish_both", part: "pose", skip: (o) => !isBoth(o), duo: 1, cloth: "main", n: (o) => `마무리 · ${o.fin.n}`, tags: (o) => `${o.place.lie ? "lying on back, legs apart, man lying beside her" : "sitting on floor, leaning against wall, man beside her"}, (after sex:1.2), ${cumLoc(o)}, cum drip, penis out, exhausted, satisfied, heavy breathing, her cheeks flushed, sweat, holding hands, full body` },
    { id: "care", part: "end", duo: 1, cloth: "none", n: () => "뒷정리", tags: (o) => o.place.care },
  ];
  // 남편(연인)이 모르는 관계(아내의 바람 · 불륜 · 네토라레 · 장면에 없음): 하는 중에 남편 전화 받기 · 남편에게 사진 보내기
  const unaware = (o) => /^(cheat|affair)$/.test(o.rel) || o.situ === "ntr" || !!o.absent;
  { const i = STAGES.findIndex((s) => s.id === "ready");
    STAGES.splice(i + 1, 0,
      { id: "ntrcall_pre", part: "pre", optIn: 1, duo: 1, cloth: "main", skip: (o) => !unaware(o), n: () => "시작 전 남편에게 전화 걸기", tags: () => "(talking on phone:1.3), (holding phone to ear:1.2), cellphone, sitting on bed, (man behind her:1.15), (his hands groping her breasts:1.15), partially undressed, (biting lip:1.1), blush, nervous smile, from front" },
      { id: "ntrcall", part: "pre", optIn: 1, duo: 1, cloth: "main", skip: (o) => !unaware(o), n: () => "하는 중 남편 전화 받기", tags: () => "(talking on phone:1.3), (holding phone to ear:1.2), cellphone, (covering mouth:1.15), trying to stay quiet, (sex:1.1), missionary, vaginal, lying on back, man above her, (nervous:1.1), blush, sweat, tears, from above" },
      { id: "ntrphoto", part: "pre", optIn: 1, duo: 1, cloth: "main", skip: (o) => !unaware(o), n: () => "하면서 남편에게 사진 보내기", tags: () => "(selfie:1.3), (holding phone up:1.2), cellphone, phone screen, (taking photo:1.15), peace sign, (sex:1.1), girl on top, straddling, vaginal, (blush:1.15), half-closed eyes, smile, from below" });
  }
  { const k = STAGES.findIndex((s) => s.id === "kiss");
    STAGES.splice(k, 0, { id: "change", part: "pre", solo: 1, change: 1, skip: (o) => o.outfit === "date", n: (o) => `옷 갈아입기 · ${OUTFITS[o.outfit] || ""}`, tags: () => "(showing off outfit:1.15), standing, full body, (shy:1.1), blush, hands behind back, looking at viewer, bathroom doorway, hotel room, warm light" });
  }
  { const i = STAGES.findIndex((s) => s.id === "meet1");
    STAGES.splice(i + 1, 0, { id: "ntrcall_date", part: "pre", optIn: 1, date: 1, call: 1, skip: (o) => !unaware(o), n: (o) => `데이트 중 남편에게 전화 걸기 (${o.date.n})` });
    const j = STAGES.findIndex((s) => s.id === "after1");
    STAGES.splice(j + 1, 0, { id: "ntrcall_after", part: "end", optIn: 1, duo: 1, cloth: "main", skip: (o) => !unaware(o), n: () => "끝난 뒤 남편에게 전화 걸기", tags: () => "(talking on phone:1.3), (holding phone to ear:1.2), cellphone, lying in bed, after sex, (man's arm around her:1.15), messy hair, sweat, (cum on body:1.1), satisfied smile, half-closed eyes, from above" });
  }
  // 삽입 없는 행위에도 절정 · 사정 장면을 바로 뒤에 한 장 (그 행위를 고른 경우에만 · '만들 단계'에서 따로 끌 수 있음)
  //  m: 그의 사정 (입 · 얼굴 · 가슴 · 손 · 발 · 허벅지 · 배) / f: 그녀의 절정
  const FORE_FIN = {
    oral: ["m", "(cum in mouth:1.25), (facial:1.1), cum on face, cum on tongue, tongue out, (ejaculation:1.15), penis, cum string, half-closed eyes, (heavy breathing:1.1), looking up at viewer"],
    handjob: ["m", "(handjob:1.15), (ejaculation:1.25), cum on hands, cum on breasts, cum on clothes, penis, (surprised:1.05), blush, looking at viewer"],
    paizuri: ["m", "(paizuri:1.15), (ejaculation between breasts:1.25), (cum on breasts:1.2), cum on face, penis, breasts squeezed together, looking up at viewer"],
    footjob: ["m", "(footjob:1.15), (ejaculation:1.2), (cum on feet:1.2), soles, toes, penis, smug, blush"],
    thighjob: ["m", "(thigh sex:1.15), (ejaculation:1.2), (cum on thighs:1.2), cum on stomach, legs together, penis"],
    grind: ["m", "(sumata:1.15), (ejaculation:1.2), (cum on stomach:1.2), cum on pussy, (no penetration:1.2), penis, pussy juice"],
    sixtynine: ["m", "(69:1.2), (ejaculation:1.15), (cum in mouth:1.15), (female orgasm:1.15), trembling, cunnilingus"],
    hand: ["f", "(female orgasm:1.3), (fingering:1.15), (trembling:1.2), arched back, (pussy juice:1.2), squirting, toes curled, open mouth, tears, heavy breathing"],
    toy: ["f", "(female orgasm:1.3), (vibrator:1.15), (trembling:1.2), arched back, (pussy juice:1.2), squirting, legs shaking, toes curled, open mouth, tears"],
    cunni: ["f", "(female orgasm:1.3), (cunnilingus:1.15), thighs squeezing his head, (trembling:1.2), arched back, pussy juice, hand on his head, toes curled, open mouth"],
    nipple: ["f", "(female orgasm:1.2), (nipple stimulation:1.15), (trembling:1.2), arched back, heavy breathing, blush, open mouth, sweat"],
    analtoy: ["f", "(female orgasm:1.25), (anal beads:1.15), (trembling:1.2), ass focus, pussy juice, looking back, tears, open mouth"],
  };
  for (const [id, [who, tg]] of Object.entries(FORE_FIN)) {
    const i = STAGES.findIndex((s) => s.id === id); if (i < 0) continue;
    const b = STAGES[i];
    STAGES.splice(i + 1, 0, { ...b, id: id + "_fin", after: id, finWho: who, n: (o) => `${b.n(o)} · ${who === "m" ? "사정" : "절정"}`, tags: (o) => `${b.tags(o)}, ${tg}` });
  }

  // ---------- 캐릭터 (Ghost 기본·내 캐릭터 + Hunt 인물) ----------
  const PEOPLE = /^(\d+(girl|boy)s?|multiple (girls|boys)|solo|solo focus|hetero|\dpeople)$/i;
  const stripQ = (s) => String(s || "").split(",").map((t) => t.trim()).filter((t) => t && !PEOPLE.test(t) && !QUALITY.includes(t)).join(", ");
  function chars() {
    const list = typeof state !== "undefined" && Array.isArray(state.defaultCharacters) ? state.defaultCharacters : [];
    const seen = new Set(), out = [];
    for (const c of list) {
      const id = c.cid || c.witch || c.label; if (seen.has(id)) continue; seen.add(id);
      const body = c.body ? c.body : stripQ(c.positive), wear = c.body ? (c.wear || "") : "";
      out.push({ id, group: "ghost", speech: ({ c2: "polite", c3: "casual", c4: "formal", c5: "polite", c6: "polite", witch: "casual" })[id] || "polite", n: String(c.label || id).replace(/ \((솔로|솔로 제외|여러 .*)\)$/, ""), body, wear, neg: c.negative || "" });
    }
    for (const h of window.BC_HUNT_CHARS || []) {
      const adult = Number(h.age) >= 25 ? "adult woman" : "young adult woman";
      out.push({ id: h.id, group: "hunt", speech: h.speech || "polite", n: `${h.name} · ${h.age} ${h.job}`, body: `${adult}, ${h.anchor}`, wear: h.outfits.work || "", outfits: h.outfits, neg: h.negative || "" });
    }
    return out;
  }
  const wearOf = (ch, key) => (key === "lounge" ? LOUNGE : LINGERIE[key] || (ch.outfits && ch.outfits[key]) || ch.wear);

  // ---------- 워크플로 (1인 = 화풍 참조 우선, 2인 = Duo) ----------
  function pickWf(duo) {
    const opts = [...document.querySelectorAll("#wfSelect option")].map((o) => o.value).filter((x) => x && x !== "builtin" && !x.includes("@") && !/~fast$|~lightning$/.test(x));
    // Hunt 시퀀스 통일 워크플로가 있으면 1인 · 2인 모두 그것으로 (화풍 참조 세기 0.75 하나로 — 그림체 · 인체 비율이 장마다 오가지 않게)
    const uni = opts.find((x) => /Hunt_Unified/i.test(x)); if (uni) return uni;
    const c = duo
      ? opts.filter((x) => /2people|duo/i.test(x)).sort((a, b) => /WhiteUniform|Pastel/i.test(a) - /WhiteUniform|Pastel/i.test(b))[0]
      : opts.filter((x) => !/2people|5people|duo|party/i.test(x)).sort((a, b) => /RefStyle_IPAdapter/i.test(b) - /RefStyle_IPAdapter/i.test(a) || /Pastel|BlueNight/i.test(a) - /Pastel|BlueNight/i.test(b))[0];
    return c || ($q("#wfSelect") || {}).value;
  }

  // ---------- 프롬프트 ----------
  function clothTags(key, wear, o) {
    const main = (CLOTH_MAIN[o.cm] || (o.nudeMain ? CLOTH_MAIN.nude : CLOTH_MAIN.half)).tags(wear);
    switch (key) {
      case "wear": return wear;
      case "unbutton": { const g = garment(wear); return `${wear}, ${outerOff(g)}${G.open[g.top]}, undressing, partially undressed`; }
      case "noshirt": { const g = garment(wear); return `${wear}, ${G.off[g.top]}`; }
      case "nude": return CLOTH.nude;
      case "top": return o.undress && o.cm !== "bottomless" ? main : `${wear}, ${G.lift[garment(wear).top]}`;   // 옷 벗기기를 했으면 이미 본편 옷 상태
      case "main": return main;
      default: return "";
    }
  }
  function build(s, o) {
    if (watchOn(o)) o = { ...o, nb: o.nb - 1, party: o.ng + o.nb - 1, watchP: true };
    if (o.ch && o.ch.body && !/\(\w+ eyes:/.test(o.ch.body)) o = { ...o, ch: { ...o.ch, body: o.ch.body.replace(/\b([a-z]+ eyes)\b/, "($1:1.15)") } };   // 눈 색이 바뀌지 않게
    const acts = (o.acts || []).filter((k) => ACTS[k] && !(ACTS[k].skip && ACTS[k].skip(o)));
    const linger = !!LINGERIE[o.outfit];
    let wear = wearOf(o.ch, s.date || s.meet != null || (linger && s.solo && !s.change) ? "date" : o.outfit);   // 데이트 · 장소 도착은 데이트 옷, 키스부터 고른 복장으로 갈아입음
    for (const k of acts) if (ACTS[k].wear && !/pantyhose|stockings|thighhighs|tights/.test(wear)) wear += ", " + ACTS[k].wear;
    const neg = [NEG_BASE, o.ch.neg];
    let pos;
    if (s.date) {
      const w = o.date.out ? WEATHER[o.weather].tags : "";
      pos = ["1girl, solo", o.ch.body, wear, s.toy ? s.tt : "intimate atmosphere, blush", s.toy ? s.tp : s.call ? "(talking on phone:1.3), holding phone to ear, (man's hand on her thigh:1.1), sitting close, (nervous smile:1.1), blush, glancing sideways" : o.date.pose, dateBg(o.date, o.time), w, "cowboy shot", QUALITY];
      neg.push(s.lewd ? "(completely nude:1.2), nipples, sex, penis" : NEG_PRE);
    } else if (s.self) {
      pos = ["1girl, solo", o.ch.body, clothTags(s.cloth, wear, o), s.tags(o), o.place.bg, QUALITY];
      neg.push("1boy, penis, cum");
    } else if (s.solo) {
      pos = ["1girl, solo", o.ch.body, wear, s.tags(o), QUALITY];
      neg.push(s.id === "video1" ? NEG_PRE : "sex, penis, pussy, cum");
    } else if (s.meet != null) {
      pos = ["1girl, solo", o.ch.body, wear, o.place.meet[s.meet][1], QUALITY];
      neg.push(NEG_PRE);
    } else {
      pos = [o.party > 2 ? partyHead(o) : DUO, o.ch.body, clothTags(s.cloth, wear, o), s.tags(o), o.place.bg, DUO_FX, QUALITY];
      if (s.neg) neg.push(s.neg);
      neg.push("male face, man's face, detailed male face, male eyes, male mouth, male head, bearded man, male focus");   // 남성은 얼굴 없이
    }
    // 3인 이상: 여성 여러 명이면 다른 그녀들의 외모 · 복장을 BREAK로 나눠 붙임 (데이트 · 만남 장면도 함께)
    if (o.party > 2) {
      if (o.ng > 1 && !s.self && !s.solo) {
        if (s.date || s.meet != null) pos[0] = `(${gTag(o.ng)}:1.3), (multiple girls:1.1)`;
        for (const e of o.extras || []) pos.push(`BREAK 1girl, ${e.body}, ${s.date || s.meet != null ? wearOf(e, "date") : clothTags(s.cloth, wearOf(e, o.outfit), o)}`);
      }
      if (!s.self && !s.solo && !(o.ng === 1 && (s.date || s.meet != null))) neg.push(wrongCount(o, s.date || s.meet != null));
      // 구경꾼 없이 전원 참여 — 행위 장면에서는 모두가 서로 닿아 있게
      if (!s.date && !s.self && !s.solo && s.meet == null) {
        pos.splice(1, 0, partyAct(o));
        neg.push("watching, onlooker, spectator, voyeurism, background characters, crowd, people in background, sitting on chair, standing in background, arms crossed, idle, waiting");
      }
    }
    // 다인원 상황 분위기
    if (o.situ && o.situ !== "none" && o.party > 2 && window.BC_SITU && BC_SITU[o.situ] && !s.solo && !s.date && s.meet == null) pos.splice(pos.length - 1, 0, BC_SITU[o.situ].tags);
    // 관계 분위기 (부부면 반지)
    if (o.rel && o.rel !== "none" && window.BC_REL && BC_REL[o.rel] && !s.solo) pos.splice(pos.length - 1, 0, BC_REL[o.rel].tags);
    // 지켜보는 남편: 그녀가 화면 너머 남편과 눈을 맞춤 (남편은 화면 밖 · 시점)
    if (o.watchP && !s.date && !s.self && !s.solo && s.meet == null) pos.splice(1, 0, "(looking at viewer:1.25), eye contact, (pov:1.05), viewer out of frame");
    // 위험일 (오히려 원함) · 안에 사정: 그녀가 다리로 허리를 감아 껴안음
    if (cycleSel === "riskyWant" && /^(climax|finish)/.test(s.id) && o.fin === FINISH.inside && !s.solo) pos.splice(pos.length - 1, 0, "(leg lock:1.25), (legs wrapped around his waist:1.2), crossed ankles, holding him close");
    // 다인(3인 이상): 머리 · 얼굴이 하나 더 생기거나 몸이 붙는 것 막기
    if (o.party > 2 && !s.solo && !s.self) neg.push("(extra head:1.3), (two heads:1.3), multiple heads, conjoined, extra face, fused bodies, extra arms, extra legs");
    // 여성 여럿 + 남성 여럿 (2:2 스와핑 · 난교): 1인칭(pov)이 아니라 모두가 보이는 넓은 구도
    if (o.party > 2 && o.ng >= 2 && o.nb >= 2 && !o.watchP && !s.solo && !s.self && !s.date && s.meet == null) {
      for (let k = 0; k < pos.length; k++) pos[k] = String(pos[k]).replace(/,\s*\(?(pov hands|pov|looking up at viewer|looking at viewer|first-person view)(:[\d.]+\))?(?=,|$)/g, "");
      pos.splice(1, 0, "(wide shot:1.25), (full body:1.15), from side, (third-person view:1.15), everyone visible, (two couples side by side:1.2)");
      neg.push("(pov:1.35), pov hands, first-person view, close-up, cropped, out of frame");
    }
    // 액션 결과: 그 액션 단계부터 뒤 장면에 이어 붙임 (만남 · 영상통화 · 데이트 제외)
    const si = STAGES.indexOf(s);
    if (!s.date && !s.solo && s.meet == null) for (const k of acts) {
      const ai = STAGES.findIndex((x) => x.act === k);
      if (ai < 0 || si < ai) continue;
      if (k === "cuffs" && s.hands) continue;
      if (ACTS[k].keep && s.cloth !== "none") pos.push(ACTS[k].keep);
      if (ACTS[k].neg) neg.push(ACTS[k].neg);
    }
    if (o.dur && DURING[o.dur] && DURING[o.dur].tags) pos.push(DURING[o.dur].tags);
    for (const k of o.traits || []) { const L = LATENT[k]; if (L && L.t && !s.solo) pos.push(L.t[latGroup(s)] || ""); }
    const ex = exprFor(s.id, o.face || "mix", [...(((window.BC_VOICE || {})[o.ch && o.ch.id] || {}).tone || []), ...(o.traits || []).flatMap((k) => (LATENT[k] || {}).tone || [])]); pos.push(emphExpr(ex), ex && !EXPR_LOUD_SET.has(ex) ? FACE : "");
    let P = pos.filter(Boolean).join(", ");
    for (const k of acts) if (ACTS[k].swap && si >= STAGES.findIndex((x) => x.act === k)) P = P.replace(ACTS[k].swap[0], ACTS[k].swap[1]);
    if (o.anal && s.part === "pose") P = P.replace(/\(vaginal sex:1\.2\)/g, "(anal sex:1.3), anal").replace(/penis in pussy/g, "penis in anus").replace(/pussy focus/g, "ass focus").replace(/\(cum in pussy:1\.4\)/g, "(cum in ass:1.3)").replace(/cum in pussy/g, "cum in ass").replace(/\(penis on pussy:1\.25\)/g, "(penis on anus:1.2)").replace(/imminent vaginal/g, "imminent anal");
    if (linger && garment(LINGERIE[o.outfit]).top === "linger" && !s.date && !s.solo && s.meet == null) P = P.replace(/fully clothed/g, "wearing only lingerie").replace(/, crotch hole/g, "").replace(/pantyhose/g, "thighhighs");
    return { positive: P, negative: neg.filter(Boolean).join(", "), duo: !!s.duo, phone: !!s.solo };
  }

  // ---------- 화면 ----------
  const anchorBtn = $q('#tabs button[data-tab="seq"]') || $q('#tabs button[data-tab="gen"]');
  if (!anchorBtn) return;
  const tabBtn = document.createElement("button");
  tabBtn.dataset.tab = "hseq"; tabBtn.textContent = "Hunt 시퀀스";
  anchorBtn.after(tabBtn);
  tabBtn.addEventListener("click", () => showTab("hseq"));
  const sec = document.createElement("section");
  sec.id = "tab-hseq"; sec.className = "tab";
  // 고른 값은 모두 배열 (여러 개 한 번에 끄면 첫 값만 씀)
  const arr = (k, old, def, ok) => { let v = ls.get(k, null); if (!Array.isArray(v)) v = [ls.get(old, def)]; v = v.filter(ok); return v.length ? v : [def]; };
  const sel = {
    poses: arr("poses", "pose", "press", (p) => POSES[p]),
    places: arr("places", "place", "home", (p) => PLACES[p]),
    fins: arr("fins", "fin", "stomach", (p) => FINISH[p]),
    dates: arr("dates", "date", "restaurant", (p) => DATES[p]),
    outfits: arr("outfits", "outfit", "work", (p) => OUTFITS[p]),
    tools: arr("tools", "tool", "none", (p) => TOOLS[p]),
    times: arr("times", "time", "night", (p) => TIMES[p]),
    weathers: arr("weathers", "weather", "clear", (p) => WEATHER[p]),
    faces: (() => { let v = ls.get("faces", null); if (!Array.isArray(v)) v = ["mix"]; v = v.filter((k) => FACES[k]); return v.length ? v : ["mix"]; })(),
    hairs: (() => { let v = ls.get("hairs", null); if (!Array.isArray(v)) v = ["char"]; v = v.filter((k) => HAIRS[k]); return v.length ? v : ["char"]; })(),
    eyes: (() => { let v = ls.get("eyes", null); if (!Array.isArray(v)) v = ["char"]; v = v.filter((k) => EYES[k]); return v.length ? v : ["char"]; })(),
    pgirls: (() => { let v = ls.get("pgirls", null); if (!Array.isArray(v)) v = ["1"]; v = v.map(String).filter((k) => GIRLS[k]); return v.length ? v : ["1"]; })(),
    situs: (() => { let v = ls.get("situs", null); if (!Array.isArray(v)) v = ["none"]; v = v.filter((k) => SITUS[k]); return v.length ? v : ["none"]; })(),
    rels: (() => { let v = ls.get("rels", null); if (!Array.isArray(v)) v = ["none"]; v = v.filter((k) => RELS[k]); return v.length ? v : ["none"]; })(),
    proles: (() => { let v = ls.get("proles", null); if (!Array.isArray(v)) v = ["join"]; v = v.filter((k) => ROLES[k]); return v.length ? v : ["join"]; })(),
    pboys: (() => { let v = ls.get("pboys", null); if (!Array.isArray(v)) v = ["1"]; v = v.map(String).filter((k) => BOYS[k]); return v.length ? v : ["1"]; })(),
    busts: (() => { let v = ls.get("busts", null); if (!Array.isArray(v)) v = ["global"]; v = v.filter((k) => BUSTS[k]); return v.length ? v : ["global"]; })(),
    traits: (() => { const v = ls.get("traits", []); return Array.isArray(v) ? v.filter((k) => LATENT[k]) : []; })(),
    fores: (() => { const v = ls.get("fores", []); return Array.isArray(v) ? v.filter((k) => FORES[k]) : []; })(),
    durs: (() => { const v = ls.get("durs", []); return Array.isArray(v) ? v.filter((k) => DURING[k]) : []; })(),
    acts: (() => { const v = ls.get("acts", []); return Array.isArray(v) ? v.filter((k) => ACTS[k]) : []; })(),
    climaxes: (() => { let v = ls.get("climaxes", null); if (!Array.isArray(v)) v = ["yes"]; v = v.filter((k) => CLIMAXES[k]); return v.length ? v : ["yes"]; })(),
    clothes: (() => { let v = ls.get("clothes", null); if (!Array.isArray(v)) v = [ls.get("nudeMain", false) ? "nude" : "half"]; v = v.filter((k) => CLOTH_MAIN[k]); return v.length ? v : ["half"]; })(),
    chars: (() => { let v = ls.get("chars", null); if (!Array.isArray(v)) { const c = ls.get("char", ""); v = c ? [c] : []; } return v; })(),
  };
  const saveSel = (k) => ls.set(k, sel[k]);
  let multi = ls.get("multi", false), undress = ls.get("undress", true);
  let video = ls.get("video", false);
  let on = ls.get("on", {});
  let lineOn = ls.get("lineOn", true), speechSel = ls.get("speech", "auto"), cycleSel = ls.get("cycle", "none"), narrOn = ls.get("narrOn", true);
  // 대사 형식: Hunt 방식([장소] · 서술 · "말") / Wayward 방식([단계]서술 "소리" … "말" 『속마음』 — huntway.js)
  const FMTS = { hunt: "Hunt 방식", wayward: "Wayward 방식" };
  let fmtSel = FMTS[ls.get("fmt", "hunt")] ? ls.get("fmt", "hunt") : "hunt";
  let secs = Number(ls.get("secs", 14)) || 14;   // 한 장 평균 시간(초) — 실제 생성 시간으로 계속 고쳐짐
  const SPEECH = { auto: "캐릭터 말투", polite: "존댓말", formal: "격식체", casual: "반말" };
  const CYCLES = { none: "그녀의 날 지정 안 함", safe: "안전일", risky: "위험일", riskyWant: "위험일 (오히려 원함)" };   // 안에 사정 · 시작 전 대사가 달라짐 (한 가지만 고름)
  // 대사 = 장면 대사(huntlines.js) + 고른 선택지 문장(huntctx.js — 장소·체위·도구·옷 상태·사정 위치·복장·날씨) 최대 2개
  const keyOf = (obj, v) => Object.keys(obj).find((k) => obj[k] === v) || "";
  const CTX_KEY = { dur: (o) => o.dur || (o.anal ? "anal" : ""), date: (o) => keyOf(DATES, o.date), time: (o) => o.time, weather: (o) => (o.date && o.date.out ? o.weather : ""), outfit: (o) => o.outfit, place: (o) => keyOf(PLACES, o.place), tool: (o) => o.tool, cloth: (o) => o.cm, pose: (o) => keyOf(POSES, o.pose), fin: (o) => keyOf(FINISH, o.fin) };
  const speechOf = (ch) => (speechSel !== "auto" ? speechSel : (ch && ch.speech) || "polite");
  let usedLines = new Map();   // 문장 → 쓴 횟수
  let fitCtx = null;
  const POSE_SIDS = ["ready", "pose1", "pose2", "deny1", "deny2", "climax", "climax_both", "after1", "after2", "finish", "finish_both"];
  const FACE_RE = /등을 끌어안|등에 손톱|어깨에 손톱|당신 등|이쪽 등|어깨를 붙잡|목에 팔|당신을 끌어안|이쪽을 끌어안|목을 끌어안|매달|눈을 맞|눈을 마주|표정을 놓치|품으로|어깨에 기대|어깨에 이마|어깨에 얼굴|가슴에 얼굴|올려다|얼굴을 두 손|허리에 다리를 감|허리를 다리로|다리로 당신 허리|다리로 이쪽 허리|올라오/;
  const unfit = (t) => {
    if (!fitCtx || !fitCtx.o) return false;
    const { o, sid } = fitCtx, inPose = POSE_SIDS.includes(sid), p = inPose ? o.pose : null;
    if (o.ch && !/팀|과장|대리|회계|사원|법인/.test(o.ch.n || "") && /회사|업무복|출근|대리님|회의/.test(t)) return true;
    if (/^video/.test(sid) && /의자|당신 쪽으로|당신 손|당신 셔츠|당신 소매|이쪽 손|맞은편/.test(t)) return true;   // 영상통화는 화면 너머
    if (p && p.back && ["ready", "pose1", "pose2", "deny1", "deny2", "climax", "climax_both", "after1"].includes(sid) && FACE_RE.test(t)) return true;
    if (p && p.top && /올려다|무게에 눌|밀어 눕/.test(t)) return true;
    const standing = p ? !!p.stand : !!(o.place && !o.place.lie);
    if (standing && /시트|베개|이불|침대/.test(t)) return true;
    if (/벽/.test(t) && (p ? !/wall/.test(p.tags) : !!(o.place && o.place.lie))) return true;
    return false;
  };
  // 캐릭터 말투: Hunt 인물이면 그 인물의 말 · 속마음 · 말버릇 · 호칭을 섞음 (말투를 따로 바꾸면 공통 대사만)
  const voiceOf = (ch) => { const V = (window.BC_VOICE || {})[ch && ch.id]; return V && (speechSel === "auto" || speechSel === ch.speech) ? V : null; };
  const lvOf = (sid) => { const L = (window.BC_WAY || {}).LV || {}; return L[sid] != null ? L[sid] : 2; };
  const hasB = (w) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0; };
  const callIn = (t, call) => {
    if (!call) return t; const b = hasB(call);
    return String(t).replace(/당신이에요/g, call + (b ? "이에요" : "예요")).replace(/당신이라서/g, call + (b ? "이라서" : "라서")).replace(/당신이니까/g, call + (b ? "이니까" : "니까"))
      .replace(/당신이랑/g, call + (b ? "이랑" : "랑")).replace(/당신이라면/g, call + (b ? "이라면" : "라면")).replace(/당신이/g, call + (b ? "이" : "가")).replace(/당신은/g, call + (b ? "은" : "는"))
      .replace(/당신을/g, call + (b ? "을" : "를")).replace(/당신과/g, call + (b ? "과" : "와")).replace(/당신께/g, call + "한테").replace(/당신/g, call);
  };
  const styleSay = (t, V, lv) => {
    if (!t || !V) return t; let x = callIn(t, V.call);
    const k = V.tics && V.tics[Math.floor(Math.random() * V.tics.length)], bare = k ? k.replace(/[,.…\s]/g, "") : "";
    if (k && (lv == null || lv < 4) && Math.random() < 0.3 && !x.includes(bare)) x = k + " " + x;
    return x;
  };
  const stageWear = (sid, ch, o) => (/^meet/.test(sid) || (LINGERIE[o.outfit] && /^video/.test(sid)) ? wearOf(ch, "date") : wearOf(ch, o.outfit));
  const rnd = (a, wear, onlyFresh) => {
    if (!a || !a.length) return "";
    let c = a;
    if (wear != null && garment(wear).top === "linger") { const f = c.filter((t) => !/옷깃|블라우스|원피스|니트|소매|재킷|겉옷|업무복|회사 옷|티셔츠|지퍼|옷이 바닥|제 옷|옷에 손/.test(t)); if (f.length) c = f; }
    if (wear != null && garment(wear).top !== "button") { const f = c.filter((t) => !/단추/.test(t)); if (f.length) c = f; }
    if (wear != null && garment(wear).bot !== "skirt") { const f = c.filter((t) => !/치마/.test(t)); if (f.length) c = f; }
    if (fitCtx) { const f = c.filter((t) => !unfit(t)); if (f.length) c = f; }
    const fresh = c.filter((t) => !usedLines.get(t)); if (onlyFresh && !fresh.length) return "";
    let min = Infinity; for (const t of c) min = Math.min(min, usedLines.get(t) || 0);
    const pool = c.filter((t) => (usedLines.get(t) || 0) === min);
    const t = pool[Math.floor(Math.random() * pool.length)]; usedLines.set(t, (usedLines.get(t) || 0) + 1); return t;
  };
  let usedWhole = new Set();
  // 서술 대사 (Hunt 대화창 형식): [장소] 장소 서술 → 그녀의 행동 서술 → "말" (huntnarr.js)
  const josa = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1); return w + (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? a : b); };
  function narrate(sid, ch, o, speech) {
    const N = "그녀";
    const fill = (t) => String(t || "").replace(/\{n\}/g, josa(N, "이", "가")).replace(/\{e\}/g, josa(N, "은", "는")).replace(/\{N\}/g, N);
    const w = stageWear(sid, ch, o), lg = garment(w).top === "linger";
    const own = lg ? ((window.BC_HUNT_NARR_LINGER || {})[sid] || []) : [];
    const PR = ["pose1", "pose2", "deny1", "deny2", "climax", "climax_both"].includes(sid) ? ((window.BC_POSE_REACT || {})[keyOf(POSES, o.pose)] || []).map((t) => t.replace(/당신/g, "이쪽")) : [];
    const pool = own.length && /^undress/.test(sid) ? own : [...((window.BC_HUNT_NARR || {})[sid] || []), ...own, ...PR];   // 란제리 벗기기는 란제리 문장만 · 체위 장엔 그 체위 반응도
    const G = (window.BC_WAY || {}).gen, lvN = lvOf(sid);
    const trs = (o.traits || []).map((k) => LATENT[k]).filter(Boolean), g4 = lvN <= 1 ? 0 : lvN === 5 ? 3 : lvN === 4 ? 2 : 1;
    const trN = trs.filter((L) => L.narr && L.narr[g4] && L.narr[g4].length);
    if (trN.length && Math.random() < 0.35) { const t = rnd(trN[Math.floor(Math.random() * trN.length)].narr[g4], w); if (t) return [sid === "meet2" ? fill(rnd((window.BC_HUNT_NARR_PLACE || {})[keyOf(PLACES, o.place)])) : "", t.replace(/당신/g, "이쪽"), speech ? `"${speech}"` : ""].filter(Boolean).join("\n"); }
    if (o.party > 2 && window.BC_PARTY && (lvN >= 2 || Math.random() < 0.4)) { const MSx = BC_PARTY.men, mline = o.nb > 1 && MSx && Math.random() < 0.8 ? `${rnd(MSx.lead, w)}. "${rnd(MSx.say[lvN <= 1 ? 0 : lvN === 5 ? 3 : lvN >= 3 ? 2 : 1] || [], w)}"` : "", PT = PT_OF(o), g4 = lvN <= 1 ? 0 : lvN === 5 ? 3 : lvN >= 3 ? 2 : 1; const nm = (o.extras || []).map(givenName); const a = nm.length ? nm[Math.floor(Math.random() * nm.length)] : "다른 그녀"; const t0 = rnd(PT.narr[g4] || [], w); if (t0) return [String(t0).replace(/\{a\}/g, josa(a, "이", "가")).replace(/\{e\}/g, josa(a, "은", "는")).replace(/\{A\}/g, a).replace(/당신/g, "이쪽") + ".", mline, speech ? `"${speech}"` : ""].filter(Boolean).join("\n"); }
    if (G && G.phys && Math.random() < 0.4) { const t = gfit(() => G.phys(sid, o.pose)); if (t) return [sid === "meet2" ? fill(rnd((window.BC_HUNT_NARR_PLACE || {})[keyOf(PLACES, o.place)])) : "", t.replace(/당신/g, "이쪽"), speech ? `"${speech}"` : ""].filter(Boolean).join("\n"); }
    const act = G && Math.random() < 0.4 ? (gfit(() => (G.react(lvN) || "").replace(/당신/g, "이쪽")) || fill(rnd(pool, w))) : fill(rnd(pool, w));
    const pl = sid === "meet2" ? fill(rnd((window.BC_HUNT_NARR_PLACE || {})[keyOf(PLACES, o.place)])) : "";
    return [pl, act, speech ? `"${speech}"` : ""].filter(Boolean).join("\n");
  }
  // Wayward 방식 한 장: [단계]당신의 행동 · 반응 "소리" 서술 "말" (당신의 말) 『속마음』 + 선택지 문장 한 줄
  const s0Pose = (sid) => ["pose1", "pose2", "climax", "climax_both"].includes(sid);
  const gfit = (fn) => {
    let ok = "";
    for (let i = 0; i < 10; i++) { const t = fn(); if (!t) return ""; if (fitCtx && unfit(t)) continue; if (!usedLines.get(t)) { usedLines.set(t, 1); return t; } if (!ok) ok = t; }
    if (ok) usedLines.set(ok, (usedLines.get(ok) || 0) + 1);
    return ok;
  };
  function wayLine(sid, ch, o) {
    const W = window.BC_WAY, lv = W.LV[sid] != null ? W.LV[sid] : 2, sp = speechOf(ch), w = stageWear(sid, ch, o);
    const N = "그녀";
    const fill = (t) => String(t || "").replace(/\{n\}/g, josa(N, "이", "가")).replace(/\{e\}/g, josa(N, "은", "는")).replace(/\{N\}/g, N);
    const st = STAGES.find((x) => x.id === sid); let head = ""; try { head = st ? st.n(o) : ""; } catch {}
    if (o.dur && DURING[o.dur] && DURING[o.dur].tags && (s0Pose(sid) || /^deny/.test(sid))) head += ` · ${DURING[o.dur].n}`;
    else if (o.anal && s0Pose(sid)) head += " · 애널로";
    const lg = garment(w).top === "linger", NL = (window.BC_HUNT_NARR_LINGER || {})[sid];
    const leads = lg && NL && /^undress/.test(sid) ? NL.map((t) => t.replace(/이쪽/g, "당신")) : (W.LEAD[sid] || []);
    const C = window.BC_HUNT_CTX || {}, use = (window.BC_HUNT_CTX_USE || {})[sid] || [];
    const V = voiceOf(ch);
    const G = W.gen || null;
    const lg4 = lv <= 1 ? 0 : lv === 5 ? 3 : lv === 4 ? 2 : 1, SPI = { polite: 0, formal: 1, casual: 2 };
    const trs = (o.traits || []).map((k) => LATENT[k]).filter(Boolean);
    const trSay = () => { const c = trs.filter((L) => L.say && L.say[lg4] && L.say[lg4].length); if (!c.length) return ""; const L = c[Math.floor(Math.random() * c.length)]; const x = rnd(L.say[lg4]).split("|"); return x[SPI[sp] != null ? SPI[sp] : 0] || x[0]; };
    const trNarr = () => { const c = trs.filter((L) => L.narr && L.narr[lg4] && L.narr[lg4].length); if (!c.length) return ""; const L = c[Math.floor(Math.random() * c.length)]; return rnd(L.narr[lg4], w); };
    const PT = o.party > 2 ? PT_OF(o) : null;
    const others = (o.extras || []).map(givenName);
    const fillP = (t) => { const a = others.length ? others[Math.floor(Math.random() * others.length)] : "다른 그녀"; return String(t).replace(/\{a\}/g, josa(a, "이", "가")).replace(/\{e\}/g, josa(a, "은", "는")).replace(/\{A\}/g, a); };
    const pg = lv <= 1 ? 0 : lv === 5 ? 3 : lv >= 3 ? 2 : 1;   // 함께하는 사람 서술 단계 (체위 · 절정은 2)
    const MS = window.BC_PARTY && BC_PARTY.men;
    const manSay = () => (MS && o.nb > 1 ? `${rnd(MS.lead, w)}. "${rnd(MS.say[pg] || MS.say[1], w)}"` : "");
    const partyNarr = () => (PT ? fillP(rnd(PT.narr[pg] || [], w)) + "." : "");
    const pickAsk = (k) => {
      const r = Math.random();
      if (PT && r < 0.2) { const x = rnd(PT.say[pg] || []); if (x) return styleSay(fillP(x.split("|")[SPI[sp] != null ? SPI[sp] : 0]), V, k); }
      if (trs.length && r < 0.3) { const t = trSay(); if (t) return styleSay(t, V, k); }
      if (V && V.say[k] && r < 0.35) return styleSay(rnd(V.say[k], w), V, k);
      if (G && r < 0.8) { const t = gfit(() => G.ask(k, sp)); if (t) return styleSay(t, V, k); }
      const A = W.ASK[k] || {}; return styleSay(rnd(A[sp] || A.polite, w), V, k);
    };
    let line = "";
    for (let tries = 0; tries < 8; tries++) {
      const PR = s0Pose(sid) || /^deny/.test(sid) ? ((window.BC_POSE_REACT || {})[keyOf(POSES, o.pose)] || []) : [];
      const reacts = PR.length && Math.random() < 0.3 ? PR : [...W.REACT[lv], ...PR];
      const react = G && !(PR.length && reacts === PR) && Math.random() < 0.8 ? gfit(() => G.react(lv)) || fill(rnd(reacts, w)) : fill(rnd(reacts, w));
      const touchT = G && lv >= 1 && !/^(video|meet)/.test(sid) && Math.random() < 0.45 ? gfit(() => G.touch(lv)) : "";
      const leadT = G && G.lead && G.hasLead(sid) && !(lg && /^undress/.test(sid)) && Math.random() < 0.8 ? gfit(() => G.lead(sid)) || fill(rnd(leads, w)) : fill(rnd(leads, w));
      const dk = o.dur || (o.anal && s0Pose(sid) ? "anal" : "");
      const durT = dk ? (G && G.dur && Math.random() < 0.95 ? gfit(() => G.dur(dk)) : "") || (W.DUR && W.DUR[dk] ? rnd(W.DUR[dk]) : "") : "";
      const parts = [`[${head}]${leadT}`, durT, touchT, react];
      // 한 문단 안에서 끝맺음이 같은 서술이 두 번 나오지 않게 (예: '…소리를 숨기지 않는다'가 두 번)
      const tailOf = (t) => String(t || "").replace(/[\s.!?…"]/g, "").slice(-7);
      const tails = new Set(parts.filter(Boolean).flatMap((x) => String(x).split(/(?<=[.!?])\s+/)).map(tailOf));
      const pushU = (fn) => { for (let i = 0; i < 6; i++) { const t = fn(); if (!t) return; const k = tailOf(t); if (!tails.has(k)) { tails.add(k); parts.push(t); return; } } };
      if (G && lv >= 2 && Math.random() < 0.6) pushU(() => gfit(() => G.react(lv)));
      if (G && G.phys) { pushU(() => gfit(() => G.phys(sid, o.pose))); if (lv >= 3 && Math.random() < 0.7) pushU(() => gfit(() => G.phys(sid, o.pose))); }   // 분명한 행위 서술
      if (G && G.cont && lv >= 2 && sid !== "ready" && Math.random() < 0.15) pushU(() => gfit(() => G.cont(lv)));
      if (G && G.eye && Math.random() < 0.07) pushU(() => gfit(() => G.eye(lv)));
      if (trs.length && Math.random() < 0.55) pushU(() => trNarr());   // 숨은 성향이 드러나는 서술
      if (o.party > 2 && !/^(video|self)/.test(sid)) { pushU(() => partyNarr()); if (lv >= 2) pushU(() => partyNarr()); }   // 함께하는 사람들
      if (o.nb > 1 && !/^(video|self|meet|date)/.test(sid) && Math.random() < 0.8) { pushU(() => manSay()); if (lv >= 3 && Math.random() < 0.5) pushU(() => manSay()); }   // 다른 남자들의 말
      if (G && G.pause && lv >= 1 && lv <= 3 && !POSE_SIDS.includes(sid) && Math.random() < 0.1) parts.push(gfit(() => G.pause()));
      else if (G && G.bound && /^(caress|undress|chest|nipple|hand|toy|cunni)/.test(sid) && Math.random() < 0.1) parts.push(gfit(() => G.bound(sp)));
      if (G && G.after && ["finish", "finish_both", "climax_both"].includes(sid) && Math.random() < 0.75) parts.push(gfit(() => G.after(keyOf(FINISH, o.fin), garment(w).top, o.cm === "nude" || o.nudeMain)));
      const snd = W.soundGen ? gfit(() => W.soundGen(lv)) || rnd(W.SOUND[lv]) : rnd(W.SOUND[lv]), ask = pickAsk(lv);   // 소리는 늘 조합으로 (한 번 쓴 소리는 다시 안 씀)
      if (lv >= 2) {
        const rounds = lv === 2 ? 2 : lv === 3 ? 2 + (Math.random() < 0.5 ? 1 : 0) : lv === 4 ? 3 : 1;
        for (let k = 0; k < rounds; k++) {
          const s2 = k === 0 ? snd : (W.soundGen ? gfit(() => W.soundGen(lv)) : "");
          if (s2) parts.push(`"${s2}"`);
          pushU(() => (G ? gfit(() => G.bridge(lv)) || fill(rnd(W.BRIDGE[lv])) : fill(rnd(W.BRIDGE[lv]))));
          if (k < rounds - 1 && G && Math.random() < 0.6) pushU(() => gfit(() => (G.phys && Math.random() < 0.5 ? G.phys(sid, o.pose) : G.react(lv))));   // 사이사이 몸의 반응 · 행위
        }
        if (ask) parts.push(`"${ask}"`);
      }
      else { const q = [snd, ask].filter(Boolean).join(" "); if (q) parts.push(`"${q}"`); }
      if (lv >= 1 && Math.random() < 0.35) { const y = G && Math.random() < 0.7 ? gfit(() => G.you(lv)) || rnd(W.YOU[lv]) : rnd(W.YOU[lv]); if (y) parts.push(`${G && G.youLead ? G.youLead(y) : rnd(W.YOU_V)} "${y}"`); }
      const rI = Math.random();
      // 속마음: 인물이면 손으로 쓴 인물 속마음 · 인물 조각 조합 · 공통 조합 · 공통 묶음을 섞음
      const inner = V && V.inner[lv] && rI < 0.15 ? rnd(V.inner[lv], w)
        : V && G && G.innerOf && rI < 0.55 ? gfit(() => G.innerOf(ch.id, lv)) || gfit(() => G.inner(lv))
        : G && rI < 0.9 ? gfit(() => G.inner(lv)) || rnd(W.INNER_LV[lv], w)
        : rnd([...(W.INNER[sid] || []), ...W.INNER_LV[lv]], w);
      void inner;   // 속마음은 넣지 않음 (서술 · 신음 위주)
      let ctx = "";
      if (Math.random() < 0.6) for (const kind of use) { const v = CTX_KEY[kind] ? CTX_KEY[kind](o) : "", e = C[kind] && C[kind][v]; const t = e && rnd(e[sp] || e.polite, w, true); if (t) { ctx = t; break; } }
      line = [parts.filter(Boolean).join(" "), ctx ? `"${V ? callIn(ctx, V.call) : ctx}"` : ""].filter(Boolean).join("\n");
      if (!usedWhole.has(line)) break;
    }
    usedWhole.add(line);
    return line;
  }
  // 바람 · 네토라레 · 네토리 · 스와핑 · 지켜보는 남편: 확장 대사(huntmore2 · BC_GEN2) — 도발 · 안에 사정 · 상대 남자의 말 · 서술
  const ML_NEAR = ["그 남자가 당신 쪽을 힐끗 보며 말한다", "그 남자가 낮게 웃으며 말한다", "그 남자가 허리를 멈추고 당신에게 말한다", "그 남자가 그녀의 턱을 당신 쪽으로 돌리며 말한다", "그 남자가 숨을 몰아쉬며 말한다"];
  const ML_FAR = ["그 남자가 낮게 웃으며 말한다", "그 남자가 그녀의 귓가에 속삭인다", "그 남자가 허리를 멈추고 말한다", "그 남자가 숨을 몰아쉬며 말한다", "그 남자가 그녀의 머리칼을 쓸어 넘기며 말한다"];
  const gen2Add = (sid, g, si, near, who, menOn) => {
    const G = window.BC_GEN2; if (!G || g < 1) return "";
    const pk = (a) => a[Math.floor(Math.random() * a.length)];
    const out = [];
    if (!/^ntr(call|photo)/.test(sid) && Math.random() < 0.45) out.push(G.narr(g, near) + ".");
    if (Math.random() < (near ? 0.6 : 0.4)) out.push(`"${G.taunt(g, si, near, who)}"`);   // 남편 · 남자친구가 없을 땐 이름이 너무 자주 나오지 않게
    if (/^(climax|finish)/.test(sid) && Math.random() < 0.8) out.push(`"${G.cream(si, near, who)}"`);
    if (menOn && Math.random() < 0.6) out.push(`${pk(near ? ML_NEAR : ML_FAR)}. "${G.men(g, near, who)}"`);
    return out.length ? "\n" + out.join("\n") : "";
  };
  // 관계가 드러나는 서술 한 줄(앞) + 그녀의 말 한 줄(뒤)
  const relLine = (t, sid, ch, o) => {
    const R = o && o.rel && o.rel !== "none" && window.BC_REL && BC_REL[o.rel];
    if (!R || !t || /^video/.test(sid)) return t;
    const g = sidG(sid), si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0;
    const pk = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
    const m = String(t).match(/^(\[[^\]]*\])?([\s\S]*)$/);
    const third = o.rel === "cheat" || o.rel === "cheatwatch";   // 행위하는 사람은 '그'(다른 남자) · 서술 속 '당신'은 남편
    let body = m[2];
    const callSc = /^ntr(call|photo)/.test(sid);   // 전화 · 사진 장면은 앞 서술이 장면과 엇갈려서 뺌
    if (!callSc && (third || Math.random() < 0.7)) body = pk(R.narr[g]) + ". " + body;
    if (Math.random() < (o.rel === "cheatwatch" ? 0.75 : 0.55)) body += `\n"${String(pk(R.say[g])).split("|")[si] || ""}"`;
    if (g >= 1 && window.BC_YOUCMP && /^(cheatwatch|cheat|affair)$/.test(o.rel) && Math.random() < 0.55) body += `\n"${BC_YOUCMP(o.rel === "cheatwatch" ? (Math.random() < 0.5 ? "당신" : "여보") : "남편", si, g)}"`;
    if (/^(cheat|cheatwatch|affair)$/.test(o.rel) && !(o.rel === "cheatwatch" && watchOn(o))) body += gen2Add(sid, g, si, o.rel === "cheatwatch", "남편", o.rel !== "affair");
    if (R.men && g >= 1 && Math.random() < 0.4) body += `\n그 남자가 당신 쪽을 보며 말한다. "${pk(R.men)}"`;
    // 불륜 · 아내의 바람: 관계 중 남편과 상대를 비교하는 말
    if (R.cmp && R.cmp[g] && R.cmp[g].length && (g >= 1 ? Math.random() < 0.75 : Math.random() < 0.3)) body += `\n"${String(pk(R.cmp[g])).split("|")[si] || ""}"`;
    return (m[1] || "") + body;
  };
  // 다인원 상황: 상황 서술(앞) · 그녀의 말 · 비교하는 말 · "○○보다 ~해서 더 좋아"
  const situLine = (t, sid, ch, o) => {
    const R = o && o.situ && o.situ !== "none" && o.party > 2 && window.BC_SITU && BC_SITU[o.situ];
    if (!R || !t || /^(video|self)/.test(sid)) return t;
    const g = sidG(sid), si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0;
    const pk = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
    const m = String(t).match(/^(\[[^\]]*\])?([\s\S]*)$/);
    // {A} = 다른 그녀(스와핑: 상대 아내) 이름
    const others = (o.extras || []).map(givenName), A = others[0] || "그 여자";
    const fill = (x) => String(x).replace(/\{a\}/g, josa(A, "이", "가")).replace(/\{e\}/g, josa(A, "은", "는")).replace(/\{l\}/g, josa(A, "을", "를")).replace(/\{A\}/g, A);
    let body = m[2];
    if (!/^ntr(call|photo)/.test(sid)) body = fill(pk(R.narr[g])) + ". " + body;
    if (Math.random() < 0.6) body += `\n"${String(pk(R.say[g])).split("|")[si] || ""}"`;
    // 부부 스와핑: 상대 아내의 말 — 원래 아내(그녀)를 놀리는 말 · 당신에게 "내가 더 좋지?"
    if (R.wife && g >= 1) {
      if (Math.random() < 0.6) body += `\n${fill(pk(R.wife.lead))}. "${fill(pk(R.wife.tease[g] || R.wife.tease[1]))}"`;
      if (Math.random() < 0.65) body += `\n${fill(pk(R.wife.lead2))}. "${fill(pk(R.wife.you[g] || R.wife.you[1]))}"`;
    }
    const c = R.cmp && R.cmp[g] && String(pk(R.cmp[g])).split("|")[si];
    if (c && Math.random() < 0.55) body += `\n"${c}"`;
    if ((o.situ === "ntr" || o.situ === "ntori") && g >= 2 && window.BC_YOUCMP && Math.random() < 0.3) body += `\n"${BC_YOUCMP("남자친구", si, g)}"`;
    // 떠날 수 있음을 암시: 돌아가지 못할 것 같다는 말 · 서술 (체위 · 절정, 여운)
    if (R.leave && g >= 2) {
      const li = g >= 3 ? 1 : 0;
      if (Math.random() < 0.55) body += `\n"${String(pk(R.leave[li])).split("|")[si] || ""}"`;
      if (R.leaveN && Math.random() < 0.45) body += `\n${fill(pk(R.leaveN[li]))}.`;
    }
    if (/^(swap|ntr|ntori)$/.test(o.situ)) { const nr = nearOf(o); body += gen2Add(sid, g, si, nr, nr ? "남편" : "남자친구", true); }
    if (o.situ === "swap" && g >= 2 && window.BC_YOUCMP && Math.random() < 0.4) body += `\n그녀가 당신 쪽을 보며 말한다. "${BC_YOUCMP("여보", si, g)}"`;
    return (m[1] || "") + body;
  };
  const dateToyLine = (ch, o, sid = "datetoy") => {
    const D = window.BC_DATETOY; if (!D) return "";
    const step = sid === "datetoy" ? "give" : sid.slice(3), ST = D.steps && D.steps[step];
    const si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0;
    const pk = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
    const SRx = o && o.situ && o.party > 2 && window.BC_SITU && BC_SITU[o.situ];
    const other = /^(cheat)$/.test(o && o.rel) || (SRx && SRx.third) || ((watchOn(o) || (o && o.rel === "cheatwatch")) && Math.random() < 0.5);
    const W = other ? D.other : D.you, place = (o && o.date && o.date.n) || "데이트";
    const fill = (x) => String(x).replace(/\{P\}/g, place);
    if (ST) {   // 단계별: {M} 리모컨을 쥔 사람 (당신 / 그 남자)
      const M = other ? { i: "그 남자가", ui: "그 남자의", ege: "그 남자에게", n: "그 남자", l: "그 남자를" } : { i: "당신이", ui: "당신의", ege: "당신에게", n: "당신", l: "당신을" };
      const fm = (x) => fill(x).replace(/\{M이\}/g, M.i).replace(/\{M의\}/g, M.ui).replace(/\{M에게\}/g, M.ege).replace(/\{M을\}/g, M.l).replace(/\{M\}/g, M.n);
      const sv = (a) => { const v = String(pk(a)).split("|"); return fm(v[si] || v[0] || ""); };
      const out = [fm(pk(ST.narr)) + ". " + fm(pk(ST.narr2 || ST.narr)) + "."];
      if (ST.pub && Math.random() < 0.6) out[0] += " " + fm(pk(ST.pub)) + ".";
      if (ST.snd) out.push(`"${sv(ST.snd)}"`);
      if (ST.say) out.push(`"${sv(ST.say)}"`);
      if (other && ST.husb && !watchOn(o) && o.rel !== "cheatwatch" && Math.random() < 0.6) out.push(fm(pk(ST.husb)) + ".");
      const stg = STAGES.find((x) => x.id === sid);
      return `[${stg ? stg.n(o) : "몰래 로터"}]` + out.join("\n");
    }
    const parts = [fill(pk(W.setup)) + ".", fill(pk(D.jolt)) + ".", fill(pk(D.cover)) + "."];
    if (Math.random() < 0.6) parts.push(fill(pk(D.public)) + ".");
    const say1 = String(pk(W.say)).split("|")[si] || "", say2 = String(pk(D.after)).split("|")[si] || "";
    if (other && /^(cheatwatch)$/.test(o && o.rel) === false && !watchOn(o)) parts.push(fill(pk(D.husband)) + ".");
    return `[몰래 로터 · ${place}]` + parts.join(" ") + `\n"${say1}"` + (Math.random() < 0.7 ? `\n"${say2}"` : "");
  };
  // 남편(당신)이 그 자리에서 보고 있는 조건: 지켜보는 남편 · 알고 허락해 지켜봄 · 부부 스와핑
  const nearOf = (o) => !!o && (watchOn(o) || o.rel === "cheatwatch" || o.situ === "swap");
  // 마지막 손질: 남편이 보고 있으면 남자친구 · 전화 · 몰래 얘기가 든 문장은 뺌 + 빌드 없이 바꿀 수 있는 후처리(BC_POST · 대사 업데이트로 들어옴)
  const NEAR_BAN = /남자친구|남친|전화|휴대폰|메시지|문자|야근|출장|들킬|몰래|답장|핑계/;
  const postLine = (t, sid, ch, o) => {
    if (!t) return t;
    if (nearOf(o) && !/^(video|date|datetoy)/.test(sid)) {
      const m = String(t).match(/^(\[[^\]]*\])?([\s\S]*)$/);
      // 따옴표 안 말은 통째로, 서술은 문장 단위로 걸러냄 (말 가운데가 잘려 따옴표가 깨지지 않게)
      const body = m[2].split("\n").map((ln) => (ln.match(/"[^"]*"|[^"]+/g) || []).map((tk) => (tk[0] === '"' ? (NEAR_BAN.test(tk) ? "" : tk) : tk.split(/(?<=[.!?…])\s+/).filter((c) => !NEAR_BAN.test(c)).join(" "))).join(" ").replace(/\s{2,}/g, " ").trim()).filter((ln) => ln && ln !== '""').join("\n");
      t = (m[1] || "") + body;
    }
    // 부부 스와핑: 내 아내(그녀)가 말할 때 상대 아내는 늘 '언니' (따옴표 안 · 상대 아내 자신의 말은 원래 '언니'로 부름)
    if (o && o.situ === "swap" && (o.extras || []).length) {
      for (const e of o.extras) {
        const a = givenName(e); if (!a) continue;
        t = String(t).split('"').map((seg, i) => (i % 2 ? seg.replace(new RegExp(a + "\\s?씨", "g"), "언니").replace(new RegExp(a + "(이랑|과|와|이|가|은|는|을|를|도|하고|한테)?", "g"), (m0, j) => "언니" + ({ 이랑: "랑", 과: "랑", 와: "랑", 이: "가", 가: "가", 은: "는", 는: "는", 을: "를", 를: "를" }[j] || j || "")) : seg)).join('"');
      }
    }
    // 그녀의 날 (안전일 · 위험일)
    if (cycleSel !== "none" && window.BC_CYCLE && BC_CYCLE[cycleSel] && t) {
      const C = BC_CYCLE[cycleSel], si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0, pk = (a) => a[Math.floor(Math.random() * a.length)];
      const sv = (a) => { const v = String(pk(a)).split("|"); return v[si] || v[0]; };
      const SRc = o && o.situ && o.party > 2 && window.BC_SITU && BC_SITU[o.situ];
      const otherP = !!o && (watchOn(o) || /^(cheat|cheatwatch)$/.test(o.rel) || o.absent || o.situ === "swap" || !!(SRc && SRc.third));
      if (/^(kiss|ready)$/.test(sid) && Math.random() < 0.7) t += `\n"${sv(C.pre)}"`;
      if (/^(climax|finish)/.test(sid) && o && o.fin === FINISH.inside) t += `\n${otherP ? pk(C.narr) : pk(C.narr).replace(/그가/g, "당신이").replace(/그의/g, "당신의")}.\n"${sv(otherP ? C.cumOther : C.cum)}"`;   // 상대가 당신이면 서술 속 그 → 당신
    }
    // 상대 남자 호칭은 맨 마지막에 (뒤에 붙는 그녀의 날 · 지켜보는 남편 대사까지) (뒤에 붙는 지켜보는 남편 대사까지): 한 명이면 이이 · 여럿이면 이분들 · '자기' 옵션
    if (o && o.nb) {
      const SRp = o.situ && o.party > 2 && window.BC_SITU && BC_SITU[o.situ], sw = o.situ === "swap", third = (o && o.absent) || watchOn(o) || /^(cheat|cheatwatch)$/.test(o.rel) || (SRp && SRp.third);
      const others = sw ? o.nb - 1 : third ? (watchOn(o) ? o.nb - 1 : o.nb) : o.nb - 1;
      if (others >= 2) t = String(t).replace(/이이가/g, "이분들이").replace(/이이는/g, "이분들은").replace(/이이를/g, "이분들을").replace(/이이(?!들)/g, "이분들");
      else if (callJagi) t = String(t).split('"').map((seg, i) => (i % 2 ? seg.replace(/이분(?!들)|이이/g, "자기") : seg)).join('"');
    }
    if (window.BC_POST) { try { t = BC_POST(t, sid, o, { near: nearOf(o) }) || t; } catch {} }
    return t;
  };
  const lineOf = (sid, ch, o) => postLine(lineOfA(sid, ch, o), sid, ch, o);
  const lineOfA = (sid, ch, o) => {
    fitCtx = o ? { o, sid } : null;
    if (sid === "datetoy" || /^dt_/.test(sid)) { try { return dateToyLine(ch, o, sid); } finally { fitCtx = null; } }
    try {
      let t = lineOf0(sid, ch, watchOn(o) ? { ...o, nb: o.nb - 1, party: o.party - 1 } : o);   // 행위하는 남자 수는 한 명 적게
      // 당신이 행위하지 않는 경우(지켜보는 남편 · 아내의 바람 · 네토라레 · 부부 스와핑): 기본 서술의 행위자 '당신' → '그'를 한 번만 (뒤에 붙는 서술 속 '당신'은 그대로)
      const SR = o && o.situ && o.party > 2 && window.BC_SITU && BC_SITU[o.situ];
      if (t && ((o && o.absent) || watchOn(o) || /^(cheat|cheatwatch)$/.test(o && o.rel) || (SR && SR.third)) && !/^(video|self|ntrcall|ntrphoto)/.test(sid)) { const m0 = String(t).match(/^(\[[^\]]*\])?([\s\S]*)$/); t = (m0[1] || "") + unYou(m0[2]); }
      t = relLine(t, sid, ch, o);
      t = situLine(t, sid, ch, o);
      // 남편(당신)을 뺀 다른 남자가 둘 이상이면 그녀가 부르는 '이이' → '이분들'
      { const sw = o && o.situ === "swap", third = (o && o.absent) || watchOn(o) || /^(cheat|cheatwatch)$/.test(o && o.rel) || (SR && SR.third);
        const others = !o || !o.nb ? 0 : sw ? o.nb - 1 : third ? (watchOn(o) ? o.nb - 1 : o.nb) : o.nb - 1;
        if (others >= 2 && t) t = String(t).replace(/이이가/g, "이분들이").replace(/이이는/g, "이분들은").replace(/이이를/g, "이분들을").replace(/이이(?!들)/g, "이분들").replace(/이분(?!들)/g, "이분들");   // 그녀가 부르는 상대 남자: 한 명이면 이이 · 여럿이면 이분들
        // 호칭 옵션: 남편은 '여보', 상대 남자는 '자기' (상대가 한 명일 때) — 그녀가 하는 말(따옴표 안)에만
        if (callJagi && t && others >= 1 && (sw || third)) t = String(t).split('"').map((seg, i) => (i % 2 ? (others === 1 ? seg.replace(/이분|이이/g, "자기") : seg).replace(/당신께서|당신께|당신한테|당신에게/g, "여보한테").replace(/당신이랑/g, "여보랑").replace(/당신과/g, "여보랑").replace(/당신이/g, "여보가").replace(/당신은/g, "여보는").replace(/당신을/g, "여보를").replace(/당신/g, "여보") : seg)).join('"'); }
      if (!watchOn(o) || /^(video|self|date)/.test(sid) || !window.BC_PARTY || !BC_PARTY.watch) return t;
      const W = BC_PARTY.watch, g = sidG(sid), si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0;
      const pk = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
      const add = [pk(W.narr[g]) + "."];
      if (Math.random() < 0.6) add.push(`그녀가 당신을 보며 말한다. "${String(pk(W.say[g])).split("|")[si] || ""}"`);
      if (g >= 1 && window.BC_YOUCMP && Math.random() < 0.55) add.push(`그녀가 당신과 눈을 맞춘 채 말한다. "${BC_YOUCMP(Math.random() < 0.5 ? "당신" : "여보", si, g)}"`);
      if (g > 0 && Math.random() < 0.45) add.push(`남자가 당신 쪽을 돌아보며 말한다. "${pk(W.men[g])}"`);
      { const x = gen2Add(sid, g, si, true, "남편", true); if (x) add.push(x.slice(1)); }
      const m = String(t).match(/^(\[[^\]]*\])?([\s\S]*)$/);
      return (m[1] || "") + add[0] + " " + m[2] + (add.length > 1 ? "\n" + add.slice(1).join("\n") : "");
    } finally { fitCtx = null; }
  };
  const foreFinLine = (sid, ch, o) => {
    const F = window.BC_FOREFIN, base = sid.replace(/_fin$/, ""), st = STAGES.find((x) => x.id === sid);
    if (!F || !st) return "";
    const K = F[base] || F[st.finWho === "m" ? "_m" : "_f"]; if (!K) return "";
    const si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0;
    const pk = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
    const parts = [pk(K.narr) + ".", pk(K.narr2 || K.narr) + ".", pk(F.react[st.finWho]) + "."];
    const snd = F.sound && F.sound[st.finWho] ? `"${pk(F.sound[st.finWho])}"` : "";
    const sv = String(pk(K.say)).split("|"), say = sv[si] || sv[0] || "";   // 말투가 하나뿐인 문장은 그대로
    return `[${st.n(o)}]` + [...new Set(parts)].join(" ") + (snd ? " " + snd : "") + (say ? `\n"${say}"` : "");
  };
  const callLine = (sid, ch, o) => {
    const KEY = { ntrcall: "call", ntrcall_date: "callDate", ntrcall_pre: "callPre", ntrcall_after: "callAfter", ntrphoto: "photo" }[sid];
    const C = window.BC_NTRCALL && BC_NTRCALL[KEY]; if (!C) return "";
    const si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0;
    const pk = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
    const H = o && o.rel === "affair" ? "남편" : "당신", Cn = o && o.situ === "ntr" ? "자기" : "여보";
    const aff = o && o.rel === "affair";   // 불륜: 바람 상대가 당신이라 서술 속 '그'를 '당신'으로
    const f = (x) => { let s = String(x).replace(/\{H\}/g, H).replace(/\{C\}/g, Cn).replace(/남편가/g, "남편이"); if (aff) s = s.replace(/그가/g, "당신이").replace(/그에게/g, "당신에게").replace(/그는/g, "당신은").replace(/그의/g, "당신의"); return s; };
    const sp = (a) => { const v = String(pk(a)).split("|"); return f(v[si] || v[0] || ""); };
    const out = [f(pk(C.narr)) + ". " + f(pk(C.during)) + "."];
    if (/^ntrcall/.test(sid)) {
      out.push(`전화기 너머 ${H === "당신" ? "당신" : "남편"}의 목소리. "${f(pk(C.husb))}"`, `"${sp(C.say)}"`, `${aff ? "당신이" : "그가"} 그녀의 귓가에 속삭인다. "${f(pk(C.whisper))}"`);
      if (C.after && Math.random() < 0.7) out.push(f(pk(C.after)) + ".", `"${sp(C.after_say)}"`);
    } else {
      out.push(`그녀가 보낸 메시지: '${f(pk(C.msg))}'`, `${H === "당신" ? "당신" : "남편"}의 답장: '${f(pk(C.reply))}'`, `"${sp(C.say)}"`);
      if (Math.random() < 0.6) out.push(`${aff ? "당신이" : "그가"} 그녀의 귓가에 속삭인다. "${f(pk(C.whisper))}"`);
    }
    const st = STAGES.find((x) => x.id === sid);
    return `[${st ? st.n(o) : sid}]` + out.join("\n");
  };
  const lineOf0 = (sid, ch, o) => {
    if (/_fin$/.test(sid)) return foreFinLine(sid, ch, o);
    if (/^ntr(call|photo)/.test(sid)) return callLine(sid, ch, o);
    if (sid === "change" && window.BC_CHANGE) {
      const w = wearOf(ch, o.outfit), kind = garment(w).top === "linger" ? "linger" : LINGERIE[o.outfit] ? "costume" : "normal";
      const si = { polite: 0, formal: 1, casual: 2 }[speechOf(ch)] || 0, pk = (a) => a[Math.floor(Math.random() * a.length)];
      const nm = ({ work: "업무복", casual: "평상복", officeDate: "퇴근 데이트 옷", lounge: "집에서 입는 옷" })[o.outfit] || OUTFITS[o.outfit] || "옷", f = (x) => String(x).replace(/\{O\}/g, nm).replace(/(복|옷)으로/g, "$1으로").replace(/([^복옷])으로/g, "$1로");
      const v = String(pk(BC_CHANGE.say[kind])).split("|");
      return `[옷 갈아입기 · ${nm}]${f(pk(BC_CHANGE.narr[kind]))}.\n"${f(v[si] || v[0])}"`;
    }
    if (fmtSel === "wayward" && o && window.BC_WAY) return wayLine(sid, ch, o);
    const L = (window.BC_HUNT_LINES || {})[sid]; if (!L) return "";
    const w = o ? stageWear(sid, ch, o) : "", sp = speechOf(ch);
    const C = window.BC_HUNT_CTX || {}, use = (window.BC_HUNT_CTX_USE || {})[sid] || [];
    let line = "";
    // 처음엔 안 쓴 문장끼리, 문장이 바닥나면 조합을 바꿔 가며 — 한 시퀀스 안에서 대사 전체가 똑같이 나오지 않게
    for (let tries = 0; tries < 8; tries++) {
      const V = voiceOf(ch), lv = lvOf(sid), G = (window.BC_WAY || {}).gen;
      const out = [V && V.say[lv] && Math.random() < 0.5 ? rnd(V.say[lv], w) : rnd(L[sp] || L.polite, w)];
      if (G && Math.random() < 0.4) { const x = gfit(() => G.ask(lv, sp)); if (x) out.push(x); }
      { const trs = (o && o.traits || []).map((k) => LATENT[k]).filter(Boolean), g4 = lv <= 1 ? 0 : lv === 5 ? 3 : lv === 4 ? 2 : 1;
        const c = trs.filter((L) => L.say && L.say[g4] && L.say[g4].length);
        if (c.length && Math.random() < 0.4) { const x = rnd(c[Math.floor(Math.random() * c.length)].say[g4]).split("|"); out.push(x[{ polite: 0, formal: 1, casual: 2 }[sp] || 0] || x[0]); } }
      for (const kind of use) {
        if (out.length >= 3 || !o) break;
        const v = CTX_KEY[kind] ? CTX_KEY[kind](o) : "", e = C[kind] && C[kind][v];
        const t = e && rnd(e[sp] || e.polite, w, tries === 0);
        if (t) out.push(t);
      }
      line = V ? styleSay(out.filter(Boolean).map((x) => callIn(x, V.call)).join(" "), V, lv) : out.filter(Boolean).join(" ");
      if (narrOn && o) line = narrate(sid, ch, o, line);
      if (!usedWhole.has(line)) break;
    }
    usedWhole.add(line);
    return line;
  };
  let planText = "";
  const fmt = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h}시간 ${m}분` : m ? `${m}분 ${r ? r + "초" : ""}`.trim() : `${r}초`; };
  // 목록마다 끝에 "전부" 버튼 (누르면 여러 개 한 번에 켜고 그 목록을 전부 고름 · 다시 누르면 첫 값만)
  const seg = (id, obj, cur, all = true) => `<div class="seq-seg" id="${id}">${Object.entries(obj).map(([k, v]) => `<button type="button" data-v="${k}"${(Array.isArray(cur) ? cur.includes(k) : k === cur) ? ' class="on"' : ""}>${esc(typeof v === "string" ? v : v.n)}</button>`).join("")}${all ? `<button type="button" class="all" data-all="1" title="이 목록 전부 고르기">✚ 전부</button>` : ""}</div>`;
  sec.innerHTML = `
<div class="seq-layout">
  <div class="card seq-opts">
    <div class="card-head"><h3>1. 장면</h3><span class="muted" id="hsCount"></span></div>
    <div class="field">
      <label class="check"><input type="checkbox" id="hsMulti"${multi ? " checked" : ""}> 여러 개 한 번에 <small class="muted">(아래 목록마다 여러 개 골라 조합을 전부 생성 — 복장·장소마다 따로 묶어서 그림이 섞이지 않음)</small></label>
      <button type="button" class="mini" id="hsAll">전부 한 번에 고르기</button></div>
    <div class="field"><label>데이트 장소 <small class="muted">(만남 첫 장 · Hunt 그림 공방의 데이트 장면)</small></label>${seg("hsDate", DATES, sel.dates)}
      ${seg("hsTime", TIMES, sel.times)}
      ${seg("hsWeather", WEATHER, sel.weathers)}
      <small class="muted" id="hsWeatherHint"></small>
      <label class="check"><input type="checkbox" id="hsVideo"${video ? " checked" : ""}> 영상통화 장면 넣기 <small class="muted">(맨 앞 2장 · 옷 입은 채 → 셔츠 풀고)</small></label></div>
    <div class="field"><label>관계 장소</label>${seg("hsPlace", PLACES, sel.places)}</div>
    <div class="field"><label>표정 <small class="muted">(사실적 = 자연스러운 얼굴 · 과장 = 아헤가오 · 하트 눈 · 흰자 · 혀 · 침 · 윙크 · 만화식 홍조 · 여러 개 고르면 스타일마다 따로 묶어서 생성)</small></label>${seg("hsFace", FACES, sel.faces)}</div>
    <div class="field"><label>관계 <small class="muted">(그녀와 당신의 사이 · 그림 분위기와 서술 · 그녀의 말이 달라짐 · 부부면 반지 · 여러 개 고르면 관계마다 따로 묶어서 생성)</small></label>${seg("hsRel", RELS, sel.rels)}</div>
    <div class="field"><label>인원 구성 <small class="muted">(여성 수 × 남성 수 · 여러 개 고르면 조합마다 따로 묶어서 생성 · 1여 1남 = 그녀와 당신 둘)</small></label>
      <small class="muted">여성 — 고른 캐릭터들이 순서대로 함께 (모자라면 다른 Hunt 인물로 채움)</small>${seg("hsParty", GIRLS, sel.pgirls)}
      <small class="muted">남성 — 당신도 그중 한 명 · 남성은 얼굴 없이</small>${seg("hsPmode", BOYS, sel.pboys)}
      <small class="muted">당신의 역할 (남성 2명 이상일 때) — 지켜보는 남편: 남편이 허락한 관계 · 당신은 남성 수에 들어가지만 바로 앞에서 지켜보기만 하고 나머지 남자들이 함께함 (3남 = 당신 + 남자 2명) · 장면에 없음: 당신은 그 자리에 없고(모름) 남성 수는 모두 다른 남자</small>${seg("hsRole", ROLES, sel.proles)}
      <label class="muted" style="display:flex;gap:6px;align-items:center;margin-top:4px"><input type="checkbox" id="hsCallJagi"${ls.get("calljagi", false) ? " checked" : ""}> 호칭: 남편은 '여보', 상대 남자는 '자기'로 부르기 (끄면 '이이 · 이분들')</label>
      <small class="muted">상황 설정 (3인 이상일 때) — 네토라레는 당신이 장면에 없어서 남성 수 = 그녀와 함께하는 남자 수 · 스와핑은 2여 2남 이상만</small>${seg("hsSitu", SITUS, sel.situs)}
</div>
    <div class="field"><label>머리 색 <small class="muted">(캐릭터 프롬프트의 머리 색을 바꿈 · 여러 개 고르면 색마다 따로 묶어서 생성)</small></label>${seg("hsHair", HAIRS, sel.hairs)}</div>
    <div class="field"><label>눈 색</label>${seg("hsEye", EYES, sel.eyes)}</div>
    <div class="field"><label>가슴 크기 <small class="muted">(이 시퀀스만 · '공통 설정 따름'은 생성 탭의 가슴 크기 · 여러 개 고르면 크기마다 따로 묶어서 생성)</small></label>${seg("hsBust", BUSTS, sel.busts)}</div>
    <div class="field"><label>옷 액션 · 묶기 <small class="muted">(여러 개 골라도 한 시퀀스에 다 들어감 · 고른 뒤 장면엔 결과가 이어짐 · 복장에 안 맞으면 건너뜀)</small></label>${seg("hsAct", ACTS, sel.acts)}</div>
    <div class="field"><label>숨은 성향 <small class="muted">(Wayward의 숨은 성향 — 여러 개 골라도 한 시퀀스에 다 들어감 · 그림 태그 · 표정 · 대사에 반영 · 낭만에 굶주림은 여운 · 뒷정리, 자기 몸에 솔직함은 자위 장면을 꼭 넣음)</small></label>${seg("hsLatent", TRAITS, sel.traits)}<small class="muted" id="hsLatentHint"></small></div>
    <div class="field"><label>애무 더하기 <small class="muted">(Hunt 애무 — 키스 · 목덜미 · 애무 · 가슴 · 손 · 입은 아래 단계 목록에 있음 · 고른 것은 한 시퀀스 안에 차례로 이어짐)</small></label>${seg("hsFore", FORES, sel.fores)}</div>
    <div class="field"><label>하면서 <small class="muted">(Hunt '하면서' — 체위 장마다 돌아가며 하나씩 · 뒤돌아보며는 뒤에서 하는 체위만 · 애널로는 체위 전체)</small></label>${seg("hsDur", DURING, sel.durs)}</div>
    <div class="field"><label>도구 <small class="muted">(애무 · 자위 단계)</small></label>${seg("hsTool", TOOLS, sel.tools)}</div>
    <div class="field"><label>체위</label>${seg("hsPose", POSES, sel.poses)}<small class="muted">그녀의 절정</small>${seg("hsClimax", CLIMAXES, sel.climaxes)}</div>
    <div class="field"><label>사정 위치</label>${seg("hsFin", FINISH, sel.fins)}</div>
    <div class="field"><label>옷</label>
      <label class="check"><input type="checkbox" id="hsUndress"${undress ? " checked" : ""}> 옷 벗기는 단계 넣기 <small class="muted">(단추 풀기 → 위 벗기기 → 다 벗기 / 반쯤 입은 채면 치마 올리기)</small></label>
      <small class="muted">본편 옷 상태</small>${seg("hsNude", CLOTH_MAIN, sel.clothes)}</div>
    <div class="field"><label>캐릭터 <small class="muted">(Ghost 캐릭터 · Hunt 인물 — 여러 개 한 번에 켜면 여러 명을 골라 각자 따로 연달아 생성)</small></label><div id="hsChar"></div>
      <button type="button" class="mini" id="hsNameBtn" style="margin-top:6px">✏ 인물 이름</button>
      <div id="hsNames" class="hidden" style="margin-top:6px"></div></div>
    <div class="field" id="hsOutfitBox"><label>복장 <small class="muted">(Hunt 인물은 상황별 복장 · 모두 '집에서 입는 옷' · 란제리 가능 — 란제리는 만남 장면까진 데이트 옷, 키스부터 란제리)</small></label><div id="hsOutfit"></div></div>
    <div class="field"><label>대사 <small class="muted">(Hunt 형식 · 그림 아래 그녀의 한마디 · 보기 창 대사창에도 나옴)</small></label>
      <label class="check"><input type="checkbox" id="hsLineOn"${lineOn ? " checked" : ""}> 장면마다 대사 붙이기</label>
      <div><small class="muted">대사 형식 — Hunt: [장소] · 그녀의 행동 서술 · "말" / Wayward: [단계]당신의 행동 · 반응 · "신음"과 서술이 번갈아 · "말"</small>${seg("hsFmt", FMTS, fmtSel, false)}</div>
      <label class="check"><input type="checkbox" id="hsNarrOn"${narrOn ? " checked" : ""}> 서술 넣기 <small class="muted">(Hunt 방식일 때)</small></label>
      ${seg("hsSpeech", SPEECH, speechSel, false)}
      <div style="margin-top:6px"><small class="muted">그녀의 날 — 시작 전 · 안에 사정할 때 대사가 달라짐</small>${seg("hsCycle", CYCLES, cycleSel, false)}</div></div>
    <div class="field"><label>만들 단계 <small class="muted">(1인 장면은 화풍 참조 워크플로, 2인은 Duo 워크플로)</small> <button type="button" class="mini" id="hsStagesAll">✚ 전부 켜기/끄기</button></label><div id="hsStages" class="hs-stages"></div></div>
    <div class="field"><button type="button" id="hsRun">Hunt 시퀀스 생성</button> <button type="button" class="mini" id="hsStop">중단</button> <button type="button" class="mini" id="hsResume" disabled>이어서 생성</button> <button type="button" class="mini" id="hsDiscard" disabled>시퀀스 삭제</button></div>
  </div>
  <div class="card">
    <div class="card-head"><h3>2. 결과</h3><span class="muted" id="hsProg"></span></div>
    <div class="seq-grid" id="hsGrid"></div>
  </div>
</div>`;
  ($q("#tab-seq") || $q("#tab-gen")).after(sec);
  const css = document.createElement("style");
  css.textContent = `#tab-hseq .seq-seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}#tab-hseq .seq-seg button{padding:5px 10px}#tab-hseq .seq-seg button.on{background:var(--accent);color:#000}
#tab-hseq .hs-stages{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:2px 10px;font-size:12px}#tab-hseq .hs-stages h5{grid-column:1/-1;margin:6px 0 0;font-size:12px;opacity:.8}
#tab-hseq .seq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}#tab-hseq .seq-grid h5{grid-column:1/-1;margin:4px 0 0}#tab-hseq .seq-grid h4{grid-column:1/-1;margin:12px 0 0;padding-top:8px;border-top:1px solid var(--line,#444)}
#tab-hseq .hs-slot{border:1px solid var(--line,#444);border-radius:8px;overflow:hidden;font-size:12px}#tab-hseq .hs-slot .hd{display:flex;justify-content:space-between;padding:4px 6px;gap:6px}
#tab-hseq .hs-slot .im{aspect-ratio:var(--ar);display:flex;align-items:center;justify-content:center;background:#0002;position:relative}#tab-hseq .hs-slot .im img{width:100%;height:100%;object-fit:cover;cursor:zoom-in}
#tab-hseq .hs-slot .ln{padding:5px 7px;font-size:12.5px;line-height:1.4;border-top:1px solid var(--line,#444);white-space:pre-wrap}#tab-hseq .hs-slot .ln:empty{display:none}
#tab-hseq .hs-slot .bar{position:absolute;left:0;bottom:0;height:3px;width:0;background:var(--accent)}#tab-hseq .hs-slot.err .hd span{color:#f66}#tab-hseq .hs-slot.done .hd span{color:var(--accent)}
#tab-hseq #hsAll{margin-top:6px}#tab-hseq .seq-seg button.all{opacity:.75;border-style:dashed}#tab-hseq .seq-seg button.all.on{opacity:1;border-style:solid}`;
  document.head.append(css);

  const selChars = () => { const cs = chars(); return sel.chars.map((id) => cs.find((c) => c.id === id)).filter(Boolean); };
  const curChar = () => selChars()[0];
  // 데이트 옷은 데이트 · 장소 도착 장면에서만 입으므로 고를 복장 목록에서 뺌
  const availOutfits = (ch) => (ch && ch.outfits ? Object.fromEntries(Object.entries(OUTFITS).filter(([k]) => k !== "date" && (k === "lounge" || LINGERIE[k] || ch.outfits[k]))) : { work: "기본 복장", lounge: OUTFITS.lounge, ...Object.fromEntries(Object.keys(LINGERIE).map((k) => [k, OUTFITS[k]])) });
  const unionOutfits = () => Object.assign({}, ...selChars().map(availOutfits));
  const base = () => ({ place: PLACES[sel.places[0]], fin: FINISH[sel.fins[0]], pose: POSES[sel.poses[0]], ch: curChar() || { body: "", wear: "", neg: "" }, outfit: sel.outfits[0], tool: sel.tools[0], cx: sel.climaxes[0], undress, cm: sel.clothes[0], nudeMain: sel.clothes[0] === "nude", date: DATES[sel.dates[0]], time: sel.times[0], weather: sel.weathers[0], video });
  // 만들 장 목록: 복장 × 관계 장소마다 → 공통(pre, 데이트 장소·도구마다) → 체위마다(pose, 사정 위치마다) → 마지막(end)
  const MAX_GROUPS = 400, MAX_JOBS = 4000;   // 한 번에 만들 수 있는 묶음 · 장 수 상한
  const overText = (j) => `⚠ 조합이 너무 많아요 (${j.over.groups ? `묶음 약 ${j.over.groups.toLocaleString()}개` : `${j.over.jobs.toLocaleString()}장 넘음`}) — 최대 묶음 ${MAX_GROUPS}개 · ${MAX_JOBS}장까지. 관계 · 인원 · 상황 · 복장 같은 선택을 줄여 주세요`;
  function plan(o, s0, on) {
    const S = s0 || sel;
    const forced = new Set((S.traits || []).flatMap((k) => (LATENT[k] || {}).force || []));
    const use = (s) => (!s.after || use(STAGES.find((x) => x.id === s.after))) && ((s.optIn ? on[s.id] === true : on[s.id] !== false) || forced.has(s.id)) && (!s.undress || o.undress) && (!s.video || o.video) && (!s.act || (S.acts || []).includes(s.act)) && (!s.fore || (S.fores || []).includes(s.fore));
    const ok = (s, b) => !(s.skip && s.skip(b)) && !(s.act && ACTS[s.act].skip && ACTS[s.act].skip(b));
    const jobs = [];
    const cs = S === sel ? selChars() : [o.ch];
    const many = cs.length > 1 || S.outfits.length > 1 || S.places.length > 1 || (S.clothes || []).length > 1 || (S.busts || []).length > 1 || (S.faces || []).length > 1 || (S.hairs || []).length > 1 || (S.eyes || []).length > 1;
    const GN = (S.pgirls && S.pgirls.length ? S.pgirls : ["1"]).map(Number), BN = (S.pboys && S.pboys.length ? S.pboys : ["1"]).map(String);
    const huntCs = chars().filter((c) => c.group === "hunt");
    const units = [];
    const RL = S.proles && S.proles.length ? S.proles : ["join"];
    const RS = S.rels && S.rels.length ? S.rels : ["none"];
    const SU = S.situs && S.situs.length ? S.situs : ["none"];
    for (const rel of RS) for (const ng of GN) for (const bk of BN) for (const nb of [bk === "1o" ? 1 : Number(bk)]) for (const rl of (bk === "1o" ? ["absent"] : nb > 1 ? RL : ["join"])) for (const situ of (ng + nb > 2 ? SU : ["none"])) {
      if (situ === "swap" && !(ng >= 2 && nb >= 2)) continue;
      const watch = rl === "watch", absent = rl === "absent";
      if (ng > 1) { const pool = [...cs, ...huntCs.filter((c) => !cs.some((x) => x.id === c.id))]; units.push({ ch: cs[0], ng, nb, watch, absent, rel, situ, extras: pool.slice(1, ng) }); }
      else for (const ch of cs) units.push({ ch, ng, nb, watch, absent, rel, situ, extras: [] });
    }
    const manyP = units.some((u) => u.absent) || SU.some((x) => x !== "none") || RS.length > 1 || RS[0] !== "none" || GN.length * BN.length > 1 || units.some((u) => u.ng + u.nb > 2);
    // 조합이 너무 많으면 계산하지 않음 (전부 고르면 수억 묶음 → 프로그램이 멈춤) — 묶음 수만 세서 알려 줌
    {
      const L = (a, d = 1) => (a && a.length) || d;
      const rest = L(S.places) * L(S.clothes) * L(S.busts) * L(S.faces) * L(S.hairs) * L(S.eyes);
      let groups = 0;
      for (const U of units) { if (!U.ch) continue; const av = availOutfits(U.ch); groups += (S.outfits.filter((k) => av[k]).length || 1) * rest; if (groups > MAX_GROUPS) break; }
      if (groups > MAX_GROUPS) { jobs.over = { groups: units.length * L(S.outfits) * rest }; return jobs; }
    }
    for (const U of units) {
    if (jobs.length > MAX_JOBS) { jobs.over = { jobs: jobs.length }; return jobs; }
    const ch = U.ch; if (!ch) continue;
    const av = availOutfits(ch), outs = S.outfits.filter((k) => av[k]);
    for (const of of (outs.length ? outs : ["work"])) for (const pl of S.places) for (const cm of (S.clothes || [o.cm || "half"])) for (const bs of (S.busts || [o.bust || "global"])) for (const fc of (S.faces || [o.face || "mix"])) for (const hc of (S.hairs || ["char"])) for (const ec of (S.eyes || ["char"])) {
      const pLab = U.ng + U.nb > 2 ? ` · ${U.ng}여 ${U.nb}남${U.ng > 1 ? ` (${[ch, ...U.extras].map(givenName).join("·")})` : ""}${U.watch ? " · 남편은 지켜봄" : U.absent ? " · 당신은 없음" : ""}` : U.absent ? " · 상대는 다른 남자" : "";
      const rLab = (U.rel && U.rel !== "none" ? ` · ${RELS[U.rel].split(" (")[0]}` : "") + (U.situ && U.situ !== "none" ? ` · ${SITUS[U.situ].split(" (")[0]}` : "");
      const g = many || manyP ? `${String(ch.n).split(" · ")[0]}${rLab}${pLab} · ${OUTFITS[of]} · ${PLACES[pl].n} · ${CLOTH_MAIN[cm].n.split(" (")[0]}${(S.busts || []).length > 1 ? " · 가슴 " + BUSTS[bs] : ""}${(S.faces || []).length > 1 ? " · 표정 " + FACES[fc].split(" (")[0] : ""}${(S.hairs || []).length > 1 ? " · 머리 " + HAIRS[hc] : ""}${(S.eyes || []).length > 1 ? " · 눈 " + EYES[ec] : ""}` : "";
      const chx = hc === "char" && ec === "char" ? ch : { ...ch, body: recolor(recolor(ch.body, "hair", hc), "eye", ec) };
      const b = { ...o, ch: chx, outfit: of, place: PLACES[pl], cm, nudeMain: cm === "nude", acts: S.acts || [], traits: S.traits || [], bust: bs, face: fc, party: U.ng + U.nb, ng: U.ng, nb: U.nb, pmode: U.nb > 1 ? (U.ng > 1 ? "mix" : "male") : "fem", watch: !!U.watch, absent: !!U.absent, rel: U.rel || "none", situ: U.situ || "none", extras: U.extras };
      for (const s of STAGES.filter((s) => s.part === "pre" && use(s) && ok(s, b))) {
        if ((outs.length ? outs : ["work"]).indexOf(of) > 0 && (s.video || s.date || s.meet != null)) continue;   // 갈아입기 전(영상통화 · 데이트 · 장소 도착)은 데이트 옷이라 복장마다 같음 → 첫 복장에서만
        if (s.date) for (const d of S.dates) for (const t of S.times) for (const w of (DATES[d].out ? S.weathers : ["clear"])) jobs.push({ s, o: { ...b, date: DATES[d], time: t, weather: w }, g });
        else if (s.toolable) for (const t of S.tools) jobs.push({ s, o: { ...b, tool: t }, g });
        else jobs.push({ s, o: b, g });
      }
      // 한 번에 생성 = 한 번의 관계가 이어지는 흐름: 삽입 직전(한 번) → 고른 체위를 차례로(체위마다 2장) →
      //  절정은 체위 사이에 나눠서(마지막이 아닌 절정 뒤엔 숨 고르기 1장) → 마지막 절정 뒤 여운 2장 · 마무리 →
      //  사정 위치가 더 남았으면 '한 번 더'(마지막 체위 1장 + 사정)
      const poses = S.poses.length ? S.poses : ["press"];
      const cxs = ["yes", "no", "both", "denyBoth"].filter((k) => (S.climaxes || [o.cx || "yes"]).includes(k));
      if (!cxs.length) cxs.push("yes");
      const fins = S.fins.length ? S.fins : ["stomach"];
      const durs = (S.durs || []).filter((k) => k !== "anal"), anal = (S.durs || []).includes("anal");
      let di = 0, fi = 0;
      const durNext = (pk) => { const c = durs.filter((d) => !DURING[d].ok || DURING[d].ok(POSES[pk])); return c.length ? c[di++ % c.length] : ""; };
      const push = (id, oo) => { const s = STAGES.find((x) => x.id === id); if (s && use(s)) jobs.push({ s, o: oo, pk: oo.pk, g }); };
      const PO = (pk, x) => ({ ...b, pose: POSES[pk], pk, anal, cx: cxs[cxs.length - 1], fin: FINISH[fins[0]], ...x });
      // 체위마다 절정: 마지막 전 체위는 그 체위에서 그녀가 절정 → 다음 체위로 이어짐 (고른 절정 방식을 앞에서부터 하나씩, 모자라면 '바로 절정')
      //  마지막 체위는 남은 절정 방식을 차례로 → 마지막 절정 뒤 여운 2장 · 마무리
      const K = poses.length, M = cxs.length;
      const climaxAt = (pk, cx, last) => {
        const both = cx === "both" || cx === "denyBoth";
        const oo = PO(pk, { cx, fin: FINISH[fins[both ? fi++ % fins.length : fi % fins.length]] });
        if (cx === "no" || cx === "denyBoth") { push("deny1", { ...oo, dur: durNext(pk) }); push("deny2", { ...oo, dur: durNext(pk) }); }
        push(both ? "climax_both" : "climax", { ...oo, dur: durNext(pk) });
        if (last) { push("after1", oo); push("after2", oo); if (both) push("finish_both", oo); else push("finish", { ...oo, fin: FINISH[fins[fi++ % fins.length]] }); }
      };
      push("ready", PO(poses[0]));
      for (let j = 0; j < K; j++) {
        const pk = poses[j];
        push("pose1", PO(pk, { dur: durNext(pk) })); push("pose2", PO(pk, { dur: durNext(pk) }));
        if (j < K - 1) climaxAt(pk, j < M - 1 ? cxs[j] : "yes", false);
        else { const rest = cxs.slice(Math.min(j, M - 1)); rest.forEach((cx, i) => climaxAt(pk, cx, i === rest.length - 1)); }
      }
      while (fi < fins.length) { const pk = poses[K - 1], oo = PO(pk, { cx: "yes", fin: FINISH[fins[fi++]], again: 1 }); push("pose2", { ...oo, dur: durNext(pk) }); push("finish", oo); }
      for (const s of STAGES.filter((s) => s.part === "end" && use(s))) jobs.push({ s, o: { ...b, pose: POSES[S.poses[S.poses.length - 1]] }, g });
    }
    }
    return jobs;
  }
  const SEGS = { hsParty: ["pgirls", GIRLS], hsPmode: ["pboys", BOYS], hsRole: ["proles", ROLES], hsRel: ["rels", RELS], hsSitu: ["situs", SITUS], hsLatent: ["traits", TRAITS], hsHair: ["hairs", HAIRS], hsEye: ["eyes", EYES], hsFore: ["fores", FORES], hsDur: ["durs", DURING], hsFace: ["faces", FACES], hsBust: ["busts", BUSTS], hsAct: ["acts", ACTS], hsClimax: ["climaxes", CLIMAXES], hsNude: ["clothes", CLOTH_MAIN], hsTime: ["times", TIMES], hsWeather: ["weathers", WEATHER], hsDate: ["dates", DATES], hsPlace: ["places", PLACES], hsTool: ["tools", TOOLS], hsPose: ["poses", POSES], hsFin: ["fins", FINISH] };
  const ADDS = ["acts", "fores", "durs", "traits"];   // 조합이 아니라 한 시퀀스에 더하는 목록 (0개도 됨)
  function draw() {
    if (!multi) for (const k of Object.keys(sel)) if (!ADDS.includes(k) && sel[k].length > 1) { sel[k] = [sel[k][0]]; saveSel(k); }
    for (const [id, [k, obj]] of Object.entries(SEGS)) {
      $q("#" + id).querySelectorAll("button[data-v]").forEach((b) => b.classList.toggle("on", sel[k].includes(b.dataset.v)));
      $q("#" + id + " .all").classList.toggle("on", Object.keys(obj).every((x) => sel[k].includes(x)));
    }
    const ch = curChar();
    $q("#hsChar").querySelectorAll("button[data-v]").forEach((b) => b.classList.toggle("on", sel.chars.includes(b.dataset.v)));
    { const a = $q("#hsCharSeg .all"); if (a) a.classList.toggle("on", chars().every((c) => sel.chars.includes(c.id))); }
    if (ch) {
      const avail = unionOutfits();
      sel.outfits = sel.outfits.filter((k) => avail[k]); if (!sel.outfits.length) sel.outfits = ["work"];
      $q("#hsOutfit").innerHTML = seg("hsOutfitSeg", avail, sel.outfits);
      // 고른 순서(= 생성 순서) 번호
      if (sel.outfits.length > 1) sel.outfits.forEach((k, i) => { const b = $q(`#hsOutfitSeg button[data-v="${k}"]`); if (b) b.insertAdjacentHTML("afterbegin", `<b style="margin-right:4px">${i + 1}</b>`); });
      $q("#hsOutfitSeg .all").classList.toggle("on", Object.keys(avail).every((x) => sel.outfits.includes(x)));
      $q("#hsOutfit").title = sel.outfits.map((k) => wearOf(ch, k)).join("\n") || "";
    }
    const D = DATES[sel.dates[0]];
    const anyOut = sel.dates.some((d) => DATES[d].out);
    $q("#hsWeather").classList.toggle("hidden", !anyOut);
    $q("#hsWeatherHint").textContent = anyOut ? "" : "(날씨는 바깥 장소 — 놀이공원 · 쇼핑몰·거리 · 한강 공원 — 에서만 달라져요)";
    const o = base(), jobs = plan(o, sel, on);
    $q("#hsCount").textContent = jobs.over ? overText(jobs) : `${jobs.length}장 · 예상 약 ${fmt(jobs.length * secs)}`;
    $q("#hsCount").style.color = jobs.over ? "#ff8a7a" : "";
    planText = jobs.over ? "조합이 너무 많음" : `${jobs.length}장 · 예상 약 ${fmt(jobs.length * secs)}`; floatUpd();
    const row = (s, oo) => `<label class="check"><input type="checkbox" data-id="${s.id}"${(s.optIn ? on[s.id] === true : on[s.id] !== false) ? " checked" : ""}> ${esc(s.n(oo))}</label>`;
    const vis = (s) => (!s.undress || undress) && (!s.video || video) && (!s.act || sel.acts.includes(s.act)) && (!s.fore || sel.fores.includes(s.fore));
    $q("#hsStages").innerHTML = `<h5>공통</h5>` + STAGES.filter((s) => s.part === "pre" && vis(s)).map((s) => row(s, o)).join("")
      + `<h5>체위 (한 번의 관계로 이어서${sel.poses.length > 1 ? ` · ${sel.poses.length}개 체위 차례로` : ""})</h5>` + STAGES.filter((s) => s.part === "pose").map((s) => row(s, o)).join("")
      + `<h5>마지막</h5>` + STAGES.filter((s) => s.part === "end").map((s) => row(s, o)).join("");
    void D;
  }
  const bindSeg = (id, fn) => $q("#" + id).addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; fn(b.dataset.v, b); draw(); });
  const pick = (id, v) => $q("#" + id).querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.v === v));
  const toggle = (k, v) => { const a = sel[k];
    if (ADDS.includes(k)) { sel[k] = a.includes(v) ? a.filter((x) => x !== v) : [...a, v]; saveSel(k); return; } sel[k] = multi ? (a.includes(v) ? (a.length > 1 ? a.filter((x) => x !== v) : a) : [...a, v]) : [v]; saveSel(k); };
  for (const [id, [k]] of Object.entries(SEGS)) bindSeg(id, (v) => toggle(k, v));
  // 목록별 "전부" 버튼
  sec.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-all]"); if (!b) return;
    e.stopPropagation();
    const id = b.parentElement.id, k = id === "hsOutfitSeg" ? "outfits" : id === "hsCharSeg" ? "chars" : (SEGS[id] || [])[0]; if (!k) return;
    const keys = k === "outfits" ? Object.keys(unionOutfits()) : k === "chars" ? chars().map((c) => c.id) : Object.keys(SEGS[id][1]);
    const full = keys.every((x) => sel[k].includes(x));
    if (!multi) { multi = true; ls.set("multi", true); $q("#hsMulti").checked = true; }
    const first = keys.includes(sel[k][0]) ? sel[k][0] : keys[0];   // 처음 고른 값을 맨 앞에 둬서, 다시 누르거나 한 개 모드로 돌아가면 그 값만 남음
    sel[k] = full ? [first] : [first, ...keys.filter((x) => x !== first)]; saveSel(k);
    draw();
  }, true);
  $q("#hsStagesAll").addEventListener("click", (e) => {
    e.preventDefault();
    const allOn = STAGES.every((s) => on[s.id] !== false);
    on = allOn ? Object.fromEntries(STAGES.map((s) => [s.id, false])) : {};
    ls.set("on", on); draw();
  });
  $q("#hsVideo").addEventListener("change", (e) => { video = e.target.checked; ls.set("video", video); draw(); });
  $q("#hsOutfit").addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; toggle("outfits", b.dataset.v); draw(); });
  $q("#hsMulti").addEventListener("change", (e) => { multi = e.target.checked; ls.set("multi", multi); draw(); });
  $q("#hsAll").addEventListener("click", () => {
    multi = true; ls.set("multi", true); $q("#hsMulti").checked = true;
    for (const [, [k, obj]] of Object.entries(SEGS)) { sel[k] = Object.keys(obj); saveSel(k); }
    sel.outfits = Object.keys(unionOutfits()); saveSel("outfits");
    draw();
  });
  $q("#hsLineOn").addEventListener("change", (e) => { lineOn = e.target.checked; ls.set("lineOn", lineOn); });
  $q("#hsNarrOn").addEventListener("change", (e) => { narrOn = e.target.checked; ls.set("narrOn", narrOn); });
  bindSeg("hsSpeech", (v) => { speechSel = v; ls.set("speech", v); pick("hsSpeech", v); });
  bindSeg("hsCycle", (v) => { cycleSel = v; ls.set("cycle", v); pick("hsCycle", v); });
  bindSeg("hsFmt", (v) => { fmtSel = v; ls.set("fmt", v); pick("hsFmt", v); });
  $q("#hsUndress").addEventListener("change", (e) => { undress = e.target.checked; ls.set("undress", undress); draw(); });
  $q("#hsStages").addEventListener("change", (e) => { const id = e.target.dataset.id; if (id) { on[id] = e.target.checked; ls.set("on", on); draw(); } });
  function fillChars() {
    const cs = chars(), btn = (c) => `<button type="button" data-v="${esc(c.id)}">${esc(c.n)}</button>`;
    sel.chars = sel.chars.filter((id) => cs.some((c) => c.id === id));
    if (!sel.chars.length && cs.length) sel.chars = [cs[0].id];
    $q("#hsChar").innerHTML = `<div class="seq-seg" id="hsCharSeg"><small class="muted" style="width:100%">Ghost 캐릭터</small>${cs.filter((c) => c.group === "ghost").map(btn).join("")}<small class="muted" style="width:100%">Hunt 인물</small>${cs.filter((c) => c.group === "hunt").map(btn).join("")}<button type="button" class="all" data-all="1" title="캐릭터 전부 고르기">✚ 전부</button></div>`;
    draw();
  }
  $q("#hsChar").addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; toggle("chars", b.dataset.v); ls.set("char", sel.chars[0]); draw(); });
  fillChars(); setTimeout(fillChars, 1500); addEventListener("bc-chars-changed", fillChars);

  // ---------- 실행 ----------
  // 한 번 돌린 목록(장마다 프롬프트·대사·결과)은 localStorage "hseq_run"에 남김 → 중단하거나 앱을 껐다 켜도 "이어서 생성"으로 남은 장만 다시 넣음
  const byId = new Map();
  let token = 0, recs = [], saveT = 0;
  try { recs = JSON.parse(localStorage.getItem("hseq_run") || "[]") || []; } catch { recs = []; }
  const saveRun = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem("hseq_run", JSON.stringify(recs)); } catch {} }, 300); };
  const left = () => recs.filter((r) => !r.img).length;
  const resumeBtn = () => { const dz = $q("#hsDiscard"); if (dz) dz.disabled = !recs.length; const b = $q("#hsResume"), n = left(); b.disabled = !n; b.textContent = n ? `이어서 생성 (남은 ${n}장 · 약 ${fmt(n * secs)})` : "이어서 생성"; };
  // 떠 있는 장수 · 예상 시간 표시: 오른쪽 아래 고정 · 생성 중이면 어느 탭에서든 진행 · 남은 시간, Hunt 시퀀스 탭에선 만들 장수 · 예상 시간
  //  누르면 Hunt 시퀀스 탭으로
  const flo = document.createElement("div"); flo.id = "hsFloat"; flo.className = "hidden"; flo.title = "Hunt 시퀀스 탭으로";
  document.body.append(flo);
  flo.onclick = () => showTab("hseq");
  const fcss = document.createElement("style");
  fcss.textContent = `#hsFloat{position:fixed;right:16px;bottom:16px;z-index:9996;display:flex;flex-direction:column;gap:2px;min-width:180px;background:rgba(24,24,30,.94);color:#eee;border:1px solid #555;border-radius:10px;padding:7px 12px 9px;font-size:13px;line-height:1.35;box-shadow:0 6px 20px #0008;cursor:pointer;overflow:hidden;backdrop-filter:blur(3px)}
#hsFloat.hidden{display:none}#hsFloat small{opacity:.7;font-size:11px}#hsFloat b{font-weight:700}#hsFloat i{position:absolute;left:0;bottom:0;height:3px;background:var(--accent,#7cf)}#hsFloat.paused{border-color:#a86}`;
  document.head.append(fcss);
  let live = false;
  function floatUpd() { try { floatUpd0(); } catch {} }   // 화면을 처음 그릴 때(아직 준비 전)는 건너뜀
  function floatUpd0() {
    const all = recs.length, end = recs.filter((r) => r.img || r.err).length, left = all - end;
    const onTab = !!(document.querySelector("#tab-hseq") || {}).classList && document.querySelector("#tab-hseq").classList.contains("active");
    let html = "", paused = false;
    if (all && left > 0 && live) html = `<small>Hunt 시퀀스 생성 중</small><b>${end} / ${all}장</b><span>남은 시간 약 ${fmt(left * secs)}</span><i style="width:${Math.round((end / all) * 100)}%"></i>`;
    else if (all && left > 0 && onTab) { paused = true; html = `<small>멈춤 · 이어서 생성 가능</small><b>남은 ${left}장</b><span>약 ${fmt(left * secs)}</span><i style="width:${Math.round((end / all) * 100)}%"></i>`; }
    else if (onTab && planText) html = `<small>만들 장수</small><b>${planText}</b>`;
    flo.innerHTML = html; flo.classList.toggle("hidden", !html); flo.classList.toggle("paused", paused);
  }
  setInterval(floatUpd, 1000);   // 탭을 옮겨도 맞게
  const prog = () => {
    const all = recs.length, end = recs.filter((r) => r.img || r.err).length;
    $q("#hsProg").textContent = all ? `${end}/${all}${end < all ? ` · 남은 시간 약 ${fmt((all - end) * secs)}` : " · 끝"}` : "";
    if (all && end >= all) live = false;
    resumeBtn(); floatUpd();
  };
  const setSlot = (s, cls, text, frac) => {
    s.el.classList.remove("run", "done", "err"); if (cls) s.el.classList.add(cls);
    $q(".hd span", s.el).textContent = text;
    if (frac != null) $q(".bar", s.el).style.width = Math.round(frac * 100) + "%";
    if (s.rec) s.rec.err = cls === "err" ? 1 : 0;
    prog();
  };
  const showImg = (s, im) => {
    const box = $q(".im", s.el);
    box.innerHTML = `<img alt="" src="${imgURL(im)}">`;
    const ent = (state.history || []).find((h) => h.id === s.id) || { id: s.id, images: [im], time: Date.now() / 1000, positive: s.rec ? s.rec.pos : "", negative: s.rec ? s.rec.neg : "" };
    const img = $q("img", box); img._bc = { e: ent, i: 0 };
    img.onclick = () => openModal(ent, 0);
  };
  // 목록 만들기: 장마다 프롬프트와 대사를 지금 정해 둠
  function makeRecs(jobs) {
    usedLines = new Map(); usedWhole = new Set();
    return jobs.map((j, i) => {
      const b = build(j.s, j.o), jc = j.o.ch, cname = String(jc.n).split(" · ")[0];
      return { i: i + 1, n: j.s.n(j.o), pos: b.positive, neg: b.negative, duo: b.duo, bust: j.o.bust || "global", line: lineOn ? lineOf(j.s.id, jc, j.o) : "", sid: j.s.id, sp: speechOf(jc), cid: jc.id, cn: cname, of: OUTFITS[j.o.outfit] || j.o.outfit, g: j.g || "", rel: j.o.rel && j.o.rel !== "none" ? j.o.rel : "", situ: j.o.situ && j.o.situ !== "none" ? j.o.situ : "", ng: j.o.ng || 1, nb: j.o.nb || 1, watch: !!j.o.watch, mem: [cname, ...((j.o.extras || []).map((e) => String(e.n).split(" · ")[0]))],
        pc: (() => { const nE = watchOn(j.o) ? j.o.nb - 1 : j.o.nb; return j.o.ng + nE > 2 && !j.s.self && !j.s.solo ? ((j.s.date || j.s.meet != null) ? (j.o.ng > 1 ? [j.o.ng, 0] : null) : [j.o.ng, nE]) : null; })(),
        ph: sel.poses.length > 1 ? (j.pk ? POSES[j.pk].n : j.s.part === "end" ? "마무리" : "") : "" };
    });
  }
  // 칸 그리기 (이미 끝난 장은 그림, 나머지는 대기)
  function drawGrid() {
    const grid = $q("#hsGrid"); byId.clear(); grid.innerHTML = "";
    let lastG = null, lastPh = null;
    for (const r of recs) {
      if (r.g && r.g !== lastG) { grid.insertAdjacentHTML("beforeend", `<h4>${esc(r.g)}</h4>`); lastG = r.g; lastPh = null; }
      if (r.ph && r.ph !== lastPh) { grid.insertAdjacentHTML("beforeend", `<h5>${esc(r.ph)}</h5>`); lastPh = r.ph; }
      const w = r.duo ? 1216 : 832, h = r.duo ? 832 : 1216;
      const el = document.createElement("div");
      el.className = "hs-slot"; el.style.setProperty("--ar", `${w}/${h}`);
      el.dataset.sid = r.sid || ""; el.dataset.n = r.n || ""; el.dataset.g = r.g || "";   // 체위별 덱 나누기용
      el.innerHTML = `<div class="hd">${r.i}. ${esc(r.n)}<span>${r.img ? "완료" : r.pid ? "멈춤" : "대기"}</span></div><div class="im">${r.img ? "" : "대기 중"}<div class="bar"></div></div><div class="ln">${window.BC_SAY_HTML ? BC_SAY_HTML(r.vline || r.line) : esc(r.vline || r.line)}</div>`;
      el.title = "긍정: " + r.pos + "\n\n부정: " + r.neg;
      grid.append(el);
      r._el = el;
      const s = { el, id: r.pid, rec: r };
      if (r.img) { el.classList.add("done"); showImg(s, r.img); }
      if (r.pid) byId.set(r.pid, s);
    }
    prog();
  }
  // 아직 안 끝난 장을 대기열에 넣음 (이미 ComfyUI 대기열에 있거나 끝나 있으면 다시 넣지 않음)
  async function queueLeft() {
    live = true; floatUpd();
    const my = ++token, btn = $q("#hsRun"), rb = $q("#hsResume");
    btn.disabled = rb.disabled = true;
    let inQueue = new Set();
    try { const q = await (await fetch("/comfy/queue")).json(); for (const it of [...(q.queue_running || []), ...(q.queue_pending || [])]) inQueue.add(it[1]); } catch {}
    try { state.history = await api("/api/history"); } catch {}
    let sent = 0;
    try {
      for (const r of recs) {
        if (my !== token) break;
        if (r.img) continue;
        const s = { el: r._el, id: r.pid, rec: r };
        if (r.pid) {
          const h = (state.history || []).find((x) => x.id === r.pid && x.images && x.images.length);
          if (h) { r.img = h.images[0]; setSlot(s, "done", "완료", 1); showImg(s, r.img); saveRun(); continue; }
          if (inQueue.has(r.pid)) { byId.set(r.pid, s); setSlot(s, "", "대기열"); continue; }
        }
        const params = r.duo ? { width: 1216, height: 832, batch: 1 } : { width: 832, height: 1216, batch: 1 };
        const res = await api("/api/generate", { json: { workflow: pickWf(r.duo), positive: r.pos, negative: r.neg, params, randomSeed: true, ...(r.bust && r.bust !== "global" ? { bust: r.bust } : {}) } });
        r.pid = res.prompt_id; s.id = r.pid; r.err = 0; saveRun();
        // 보기 창 · 갤러리 폴더용 정보 (대사 · 캐릭터 · 복장)
        if (window.BC_LINE) BC_LINE.set(r.pid, { t: r.line, n: r.cn, cid: r.cid, cn: r.cn, of: r.of, rel: r.rel, situ: r.situ, ng: r.ng, nb: r.nb, watch: r.watch, mem: r.mem });
        byId.set(r.pid, s); state.myPrompts && state.myPrompts.add(r.pid);
        setSlot(s, "", "대기열"); sent++;
      }
      if (my === token && sent) toast(`Hunt 시퀀스 ${sent}장을 대기열에 넣었습니다`, "ok");
    } catch (e) { toast("Hunt 시퀀스 요청 실패:\n" + e.message, "err"); }
    finally { btn.disabled = false; resumeBtn(); }
  }
  // 확인 창: 앱의 iOS 알림창을 직접 기다림 (동기 confirm은 '확인' 때 클릭을 다시 실행해서, 질문이 둘이면 창이 계속 뜸)
  const askOk = async (msg) => {
    if (!window.iosAlert) return confirm(msg);
    const [a, ...b] = String(msg).split("\n"), red = /삭제|지울|지우/.test(msg);
    const r = await iosAlert({ title: a, message: b.join("\n"), buttons: [{ text: "취소", cancel: true }, red ? { text: /지울|지우/.test(a) ? "지우기" : "삭제", red: true } : { text: "확인", def: true }] });
    return !!(r && r.ok);
  };
  $q("#hsRun").onclick = async () => {
    const ch = curChar();
    if (!ch) return toast("캐릭터를 고르세요", "err");
    const jobs = plan(base(), sel, on);
    if (jobs.over) return toast(overText(jobs), "err");
    if (!jobs.length) return toast("만들 단계를 하나 이상 고르세요", "err");
    if (jobs.length > 60 && !(await askOk(`${jobs.length}장을 만듭니다. 예상 약 ${fmt(jobs.length * secs)} 걸려요. 시작할까요?`))) return;
    if (left() && recs.some((r) => r.img) && !(await askOk(`이전 시퀀스에 아직 ${left()}장이 남아 있어요. 버리고 새로 시작할까요? (이어서 하려면 '이어서 생성')`))) return;
    recs = makeRecs(jobs); saveRun();
    drawGrid();
    await queueLeft();
  };
  $q("#hsResume").onclick = async () => {
    if (!left()) return toast("남은 장이 없어요");
    if (!$q("#hsGrid .hs-slot")) drawGrid();
    await queueLeft();
  };
  // 시퀀스 삭제: 남은 대기열을 빼고 목록·칸을 지움. 원하면 이미 만든 그림도 기록에서 지움 (ComfyUI 출력 폴더 원본은 그대로)
  $q("#hsDiscard").onclick = async () => {
    if (!recs.length) return;
    setTimeout(() => { live = !!recs.length && live; floatUpd(); }, 0);
    const done = recs.filter((r) => r.img && r.pid);
    if (!(await askOk(`이 시퀀스(${recs.length}장, 남은 ${left()}장)를 삭제할까요?\n남은 장은 대기열에서 빠지고 이어서 생성할 수 없게 돼요.`))) return;
    const alsoImgs = done.length && (await askOk(`이미 만든 그림 ${done.length}장도 갤러리 기록에서 지울까요?\n(지우기 = 그림도 지움 · 취소 = 그림은 남김)`));
    token++;
    const pend = recs.filter((r) => r.pid && !r.img).map((r) => r.pid);
    if (pend.length) { try { await fetch("/comfy/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delete: pend }) }); } catch {} }
    let gone = 0;
    if (alsoImgs) for (const r of done) { try { await api("/api/history?id=" + encodeURIComponent(r.pid), { method: "DELETE" }); gone++; } catch {} }
    if (gone) state.history = (state.history || []).filter((h) => !done.some((r) => r.pid === h.id));
    recs = []; byId.clear(); clearTimeout(saveT);
    try { localStorage.removeItem("hseq_run"); } catch {}
    $q("#hsGrid").innerHTML = ""; prog();
    toast(gone ? `시퀀스를 삭제했어요 (그림 ${gone}장도 기록에서 지움)` : "시퀀스를 삭제했어요", "ok");
  };
  $q("#hsStop").onclick = async () => {
    token++; live = false; setTimeout(floatUpd, 0);
    const pend = recs.filter((r) => r.pid && !r.img).map((r) => r.pid);
    if (pend.length) { try { await fetch("/comfy/queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delete: pend }) }); } catch {} }
    byId.forEach((s) => { if (pend.includes(s.id)) setSlot(s, "err", "멈춤"); });
    saveRun(); resumeBtn();
    toast("Hunt 시퀀스를 멈췄어요. '이어서 생성'으로 남은 장을 계속 만들 수 있어요 (그리던 한 장은 끝까지 그려질 수 있음)");
  };
  // 인원수 자동 확인: 다인원 장면은 태거로 여성 · 남성 수를 세어 틀리면 다시 그림
  let countFix = false;   // 인원수 자동 확인은 뺌 (태거 연산 때문에 생성이 느려짐) — 다인 장면도 바로 완료
  async function checkCount(s, im) {
    const r = s.rec;
    setSlot(s, "run", "인원 확인 중", 0.98);
    let c = null;
    try {
      const b = await (await fetch(imgURL(im))).blob();
      const fd = new FormData();
      fd.append("image", new File([b], im.filename || "x.png", { type: b.type || "image/png" }));
      fd.append("model", "wd-eva02-large-tagger-v3"); fd.append("threshold", "0.3"); fd.append("charThreshold", "0.85"); fd.append("exclude", "");
      const t = await api("/api/tagger", { method: "POST", body: fd });
      c = countOf((t && t.tags) || []);
    } catch {}
    const [wg, wb] = r.pc;
    const bad = c && ((c.g && !c.g.has(wg)) || (wb && c.b && !c.b.has(wb)));
    r.cnt = c ? `${c.g ? [...c.g].join("·") : "?"}여 ${c.b ? [...c.b].join("·") : "?"}남` : "";
    if (!bad) { r.img = im; saveRun(); setSlot(s, "done", r.tries ? `완료 (${r.tries}번 다시)` : "완료", 1); showImg(s, im); return; }
    // 틀린 그림은 기록에서 뺌 (ComfyUI 출력 폴더 원본은 그대로) → 같은 장을 새 시드로
    r.tries = (r.tries || 0) + 1;
    try { await api("/api/history?id=" + encodeURIComponent(s.id), { method: "DELETE" }); state.history = (state.history || []).filter((h) => h.id !== s.id); } catch {}
    byId.delete(s.id);
    try {
      const params = r.duo ? { width: 1216, height: 832, batch: 1 } : { width: 832, height: 1216, batch: 1 };
      const res = await api("/api/generate", { json: { workflow: pickWf(r.duo), positive: r.pos, negative: r.neg, params, randomSeed: true, ...(r.bust && r.bust !== "global" ? { bust: r.bust } : {}) } });
      r.pid = res.prompt_id; s.id = r.pid; s.checked = 0; saveRun();
      if (window.BC_LINE) BC_LINE.set(r.pid, { t: r.line, n: r.cn, cid: r.cid, cn: r.cn, of: r.of, rel: r.rel, situ: r.situ, ng: r.ng, nb: r.nb, watch: r.watch, mem: r.mem });
      byId.set(r.pid, s); state.myPrompts && state.myPrompts.add(r.pid);
      setSlot(s, "", `인원 다시 ${r.tries}/3 (${r.cnt} → ${wg}여${wb ? ` ${wb}남` : ""})`);
    } catch (e) { r.img = im; saveRun(); setSlot(s, "done", "완료 (다시 요청 실패)", 1); showImg(s, im); }
  }
  // ✏ 인물 이름: Hunt 인물 이름을 직접 정함 (이 PC에 저장 · 비우면 기본 이름) — 배포용엔 이름이 없어서 여기서 붙임
  { const btn = $q("#hsNameBtn"), box = $q("#hsNames");
    const paint = () => { box.innerHTML = `<div class="muted" style="font-size:12px;margin-bottom:4px">Hunt 인물 이름 — 목록 · 묶음 이름 · 대사(함께하는 그녀 이름)에 쓰임. 비우면 기본 이름</div>` + (window.BC_HUNT_CHARS || []).map((c) => `<label style="display:flex;gap:6px;align-items:center;margin:2px 0"><span class="muted" style="width:110px;font-size:12px">${esc(c.age + "세 " + c.job)}</span><input type="text" data-hid="${c.id}" value="${esc(c.name === c.defName ? "" : c.name)}" placeholder="${esc(c.defName)}" style="flex:1"></label>`).join("") + `<button type="button" class="mini" id="hsNameSave">저장</button>`; };
    btn.onclick = () => { box.classList.toggle("hidden"); if (!box.classList.contains("hidden")) paint(); };
    box.addEventListener("click", (e) => { if (e.target.id !== "hsNameSave") return; box.querySelectorAll("input[data-hid]").forEach((i) => window.BC_HUNT_NAME_SET && BC_HUNT_NAME_SET(i.dataset.hid, i.value)); toast("인물 이름을 저장했어요", "ok"); paint(); try { fillChars(); } catch {} try { draw(); } catch {} }); }
  callJagi = !!ls.get("calljagi", false);
  { const cj = $q("#hsCallJagi"); if (cj) cj.onchange = () => { callJagi = cj.checked; ls.set("calljagi", callJagi); }; }
  { const cb = $q("#hsCountFix"); if (cb) cb.onchange = () => { countFix = cb.checked; ls.set("countfix", countFix); }; }
  const es = new EventSource("/api/events");
  es.onmessage = (e) => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    const d = m.data || {}, s = byId.get(d.prompt_id || d.id);
    if (!s) return;
    if (m.type === "execution_start") { s.t0 = Date.now(); setSlot(s, "run", "생성 중", 0.02); }
    else if (m.type === "progress") setSlot(s, "run", `샘플링 ${d.value}/${d.max}`, d.value / d.max);
    else if (m.type === "execution_error") setSlot(s, "err", "오류");
    else if (m.type === "execution_interrupted") setSlot(s, "err", "멈춤");
    else if (m.type === "bc_done") {
      const im = d.images && d.images[0];
      if (!im) { setSlot(s, "err", "이미지 없음"); return; }
      if (s.t0) { const dt = (Date.now() - s.t0) / 1000; if (dt > 1 && dt < 600) { secs = Math.round((secs * 0.7 + dt * 0.3) * 10) / 10; ls.set("secs", secs); } }
      if (s.rec && s.rec.pc && countFix && (s.rec.tries || 0) < 3 && !s.checked) { s.checked = 1; checkCount(s, im); return; }
      if (s.rec) { s.rec.img = im; saveRun(); }
      setSlot(s, "done", "완료", 1);
      showImg(s, im);
      // 그림을 태거로 읽어 표정·자세에 맞는 한마디를 대사에 붙임
      const r = s.rec;
      if (r && r.line && window.BC_LINE_TAG && BC_LINE_TAG.enabled()) BC_LINE_TAG.lineFor(s.id, im, { sid: r.sid, sp: r.sp, base: r.line, n: r.cn, cid: r.cid, cn: r.cn, of: r.of }).then((t) => {
        if (!t) return; r.vline = t; saveRun(); const ln = $q(".ln", s.el); if (ln) ln.innerHTML = window.BC_SAY_HTML ? BC_SAY_HTML(t) : esc(t);
      });
    }
  };
  // 생성이 하다가 멈추는 경우 자동으로 이어 감 — 20초마다: 끝났는데 알림을 놓친 장은 기록에서 찾아 '완료'로,
  //  남은 장이 있는데 ComfyUI 대기열이 비었고 90초 넘게 아무 소식이 없으면 남은 장을 다시 대기열에 넣음 (최대 5번)
  let lastAct = Date.now(), revives = 0;
  es.addEventListener("message", () => { lastAct = Date.now(); });
  es.onerror = () => { lastAct = Date.now(); };   // 연결이 끊기면 EventSource가 스스로 다시 붙음 — 그동안 놓친 건 아래에서 메움
  setInterval(async () => {
    if (!live || !recs.length || !left()) { revives = 0; return; }
    let hist = null; try { hist = await api("/api/history"); state.history = hist; } catch { return; }
    let fixed = 0;
    for (const r of recs) if (!r.img && r.pid) {
      const h = (hist || []).find((x) => x.id === r.pid && x.images && x.images.length);
      if (h) { r.img = h.images[0]; fixed++; const s = byId.get(r.pid); if (s) { setSlot(s, "done", "완료", 1); showImg(s, r.img); } }
    }
    if (fixed) { saveRun(); lastAct = Date.now(); }
    if (!left() || Date.now() - lastAct < 90000 || revives >= 5) return;
    let busy = true; try { const q = await (await fetch("/comfy/queue")).json(); busy = (q.queue_running || []).length + (q.queue_pending || []).length > 0; } catch { busy = false; }
    if (busy) return;
    revives++; lastAct = Date.now();
    try { toast(`생성이 멈춘 것 같아 남은 ${left()}장을 다시 이어서 만들어요 (${revives}/5)`, "ok"); } catch {}
    queueLeft();
  }, 20000);
  // 앱을 다시 켰을 때 남은 시퀀스가 있으면 칸을 다시 그려 둠 (그림은 기록에서)
  if (recs.length) setTimeout(async () => { try { state.history = await api("/api/history"); } catch {} for (const r of recs) if (!r.img && r.pid) { const h = (state.history || []).find((x) => x.id === r.pid && x.images && x.images.length); if (h) r.img = h.images[0]; } saveRun(); drawGrid(); }, 1200);
  else resumeBtn();
    // 이미 만든 그림의 대사 다시 쓰기 — 저장된 장면(sid) · 캐릭터를 쓰고, 장소 · 체위 · 사정 위치 · 복장 · 하면서 등은 프롬프트 태그로 알아냄
  const has = (p, t) => t && p.includes(String(t).toLowerCase());
  const firstTags = (s, n) => String(s || "").toLowerCase().replace(/[()]/g, "").replace(/:[\d.]+/g, "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, n);
  const hitAll = (p, s, n) => { const t = firstTags(s, n); return t.length > 0 && t.every((x) => p.includes(x)); };
  function sceneOf(entry) {
    const p = String(entry.positive || "").toLowerCase().replace(/[()]/g, "").replace(/:[\d.]+/g, "");
    const meta = (window.BC_LINE && BC_LINE.get(entry.id)) || {};
    const g = window.BC_GROUP ? BC_GROUP(entry) : { cid: meta.cid, cn: meta.cn, of: meta.of };
    const cs = chars();
    let ch = cs.find((c) => c.id === (meta.cid || g.cid));
    if (!ch) ch = { id: g.cid || "x", n: g.cn || "그녀", speech: "polite", body: "", wear: "", neg: "" };
    const sid = meta.sid || (window.BC_GUESS_SID ? BC_GUESS_SID(p) : "meet1");
    const pick = (obj, test, def) => { const k = Object.keys(obj).find((x) => test(obj[x], x)); return obj[k || def]; };
    const place = pick(PLACES, (v) => hitAll(p, v.bg, 3), "home");
    const pose = pick(POSES, (v) => hitAll(p, v.tags, 2), "press");
    const fin = /cum in pussy|internal cumshot/.test(p) ? FINISH.inside : /cum on thighs/.test(p) ? FINISH.thighs : /cum on breasts/.test(p) ? FINISH.breasts : FINISH.stomach;
    const outfit = /white lace lingerie/.test(p) ? "lingerieWhite" : /black lace lingerie/.test(p) ? "lingerieBlack" : (Object.keys(OUTFITS).find((k) => OUTFITS[k] === (meta.of || g.of)) || (has(p, "loungewear") ? "lounge" : "work"));
    const date = pick(DATES, (v) => hitAll(p, v.pose, 2), "restaurant");
    const dur = Object.keys(DURING).find((k) => DURING[k].tags && hitAll(p, DURING[k].tags, 1)) || "";
    const cm = /completely nude/.test(p) ? "nude" : /no shirt/.test(p) ? "topless" : "half";
    const tool = /magic wand/.test(p) ? "wand" : /egg vibrator/.test(p) ? "egg" : /dildo/.test(p) ? "dildo" : "none";
    const o = { ch, place, pose, fin, outfit, date, dur, cm, tool, nudeMain: cm === "nude", time: /evening|dusk/.test(p) ? "evening" : /daytime|morning/.test(p) ? "day" : "night", weather: /rain/.test(p) ? "rain" : /snow/.test(p) ? "snow" : "clear", cx: /simultaneous orgasm/.test(p) ? "both" : "yes", anal: /anal sex/.test(p), acts: [], undress: true };
    return { sid, ch, o, meta, g };
  }
  function rewrite(entry, fmt, noSave, keepPrev) {
    if (!entry || !entry.images || !entry.images.length || !window.BC_LINE) return false;
    const { sid, ch, o, meta, g } = sceneOf(entry);
    const keep = fmtSel; fmtSel = fmt || fmtSel;
    let t = "";
    try { t = lineOf(sid, ch, o); } finally { fmtSel = keep; }
    if (!t) return false;
    BC_LINE.set(entry.id, { ...meta, cid: meta.cid || g.cid, cn: meta.cn || g.cn, of: meta.of || g.of, sid, sp: speechOf(ch), n: meta.n || g.cn, t, base: t, prev: (keepPrev && meta.prev) || meta.t || "", vt: 0, tg: undefined }, noSave);
    return true;
  }
  // 처음 한 번: 이미 만든 그림 대사를 모두 Wayward 방식으로 다시 씀 (이전 대사는 '이전 대사로'로 되돌릴 수 있게 남김)
  (function migrate() {
    // v2: 중복을 줄인 대사로 한 번 더 (v1으로 다시 쓴 그림은 그 전 원래 대사를 '이전 대사'로 유지)
    let v1 = false;
    try { if (localStorage.getItem("bc_way_rewrite_v9")) return; v1 = !!(localStorage.getItem("bc_way_rewrite_v1") || localStorage.getItem("bc_way_rewrite_v2") || localStorage.getItem("bc_way_rewrite_v3") || localStorage.getItem("bc_way_rewrite_v4") || localStorage.getItem("bc_way_rewrite_v5") || localStorage.getItem("bc_way_rewrite_v6") || localStorage.getItem("bc_way_rewrite_v7") || localStorage.getItem("bc_way_rewrite_v8")); } catch { return; }
    const tryRun = () => {
      const hs = typeof state !== "undefined" && Array.isArray(state.history) ? state.history : [];
      if (!hs.length || !window.BC_LINE || !window.BC_GROUP) return false;
      usedLines = new Map(); usedWhole = new Set();
      let n = 0; for (const h of hs) if (rewrite(h, "wayward", true, v1)) n++;
      BC_LINE.save();
      try { localStorage.setItem("bc_way_rewrite_v9", String(Date.now())); localStorage.setItem("bc_way_rewrite_v8", "1"); localStorage.setItem("bc_way_rewrite_v1", "1"); } catch {}
      if (n && typeof toast === "function") toast(`이미 만든 그림 ${n}장의 대사를 Wayward 방식으로 다시 썼어요 (우클릭 → '이전 대사로'로 되돌릴 수 있어요)`, "ok");
      return true;
    };
    const t = setInterval(() => { if (tryRun()) clearInterval(t); }, 2000);   // 갤러리 기록을 불러올 때까지 기다림
  })();
  window.BC_HUNTSEQ = { SITUS, RELS, ROLES, PARTIES, PMODES, LATENT, TRAITS, rewrite, sceneOf, HAIRS, EYES, recolor, FORES, DURING, ACTS, EXPR, EXPR_LOUD, FACES, garment, CLIMAXES, CLOTH_MAIN, build, plan, STAGES, PLACES, POSES, FINISH, DATES, WEATHER, TOOLS, OUTFITS, LOUNGE, chars, wearOf };
})();
