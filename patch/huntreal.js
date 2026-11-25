// 사실적인 표정 조합 · 분명한 행위 서술 (대사판) — 모두 새로 쓴 글
//  BC_EXPR_PARTS: 표정 묶음마다 눈 · 입 · 그 밖(눈썹 · 볼 · 땀 등)을 따로 골라 이어 붙임 → 단계마다 수십~백여 가지
//   (풀린 눈 · 깜빡이는 눈꺼풀 · 반쯤 감긴 눈 · 졸린 눈 · 젖은 눈 …)
//  BC_WAY.gen.phys(sid): 지금 장면에서 실제로 일어나는 일을 분명하게 적는 서술 (비유 없이)
(() => {
  const S = (s) => s.split("/");
  // e 눈 · m 입 · b 눈썹 · x 볼 · 피부 · y 몸의 반응 (체위에 상관없이 어울리는 것만 · 단계가 오를수록 세게)
  // 그림 모델이 잘 아는 Danbooru 표준 태그 위주 (실제 생성 · 태거 비교로 확인: 표준이 아닌 말은 거의 안 따름)
  window.BC_EXPR_PARTS = {
    sweet: { e: S("looking at viewer/half-closed eyes/closed eyes/happy tears/sparkling eyes/eye contact"),
      m: S("smile/light smile/closed mouth/parted lips/:)/gentle smile"),
      b: S("raised eyebrows/eyebrows visible through hair"), x: S("blush/light blush/nose blush"), y: S("head tilt/hand on own cheek/own hands together/leaning forward") },
    shy: { e: S("looking away/looking down/looking to the side/averting eyes/side glance/looking up/half-closed eyes"),
      m: S("closed mouth/lip biting/pout/wavy mouth/parted lips/nervous smile/:o"),
      b: S("raised eyebrows/frown/v-shaped eyebrows/worried"), x: S("blush/full-face blush/nose blush/ear blush/sweatdrop"),
      y: S("hand on own chest/covering mouth/fidgeting/hand to own mouth/covering face") },
    teasing: { e: S("half-closed eyes/looking at viewer/one eye closed/side glance/narrowed eyes/bedroom eyes"),
      m: S("smirk/smug/seductive smile/tongue out/licking lips/:3/naughty face"),
      b: S("raised eyebrow/v-shaped eyebrows"), x: S("light blush/blush/shiny lips"), y: S("head tilt/hand on own chin/finger to mouth/leaning forward") },
    needy: { e: S("tears/teary eyes/half-closed eyes/looking at viewer/looking up/upturned eyes/tearing up"),
      m: S("open mouth/parted lips/lip biting/drooling/saliva/clenched teeth/panting"),
      b: S("furrowed brow/frown/worried/v-shaped eyebrows"), x: S("blush/full-face blush/sweat/steam"),
      y: S("heavy breathing/trembling/squirming/sheet grab/arched back/breath") },
    pleasure: { e: S("half-closed eyes/empty eyes/closed eyes/rolling eyes/upturned eyes/eyes rolled back/tears/one eye closed/@_@"),
      m: S("open mouth/parted lips/drooling/saliva/tongue out/lip biting/clenched teeth/moaning/heavy breathing"),
      b: S("furrowed brow/frown/v-shaped eyebrows"), x: S("blush/full-face blush/sweat/sweaty/steam/steaming body/wet skin"),
      y: S("trembling/curled toes/arched back/sheet grab/head back/clenched hands/twitching/goosebumps/motion lines") },
    intense: { e: S("rolling eyes/eyes rolled back/closed eyes/tears/streaming tears/empty eyes/wide-eyed/crying"),
      m: S("open mouth/screaming/clenched teeth/tongue out/drooling/saliva trail/heavy breathing"),
      b: S("furrowed brow/frown"), x: S("full-face blush/sweat/sweaty/steaming body/wet hair/messy hair"),
      y: S("trembling/arched back/curled toes/head back/female orgasm/twitching/legs up/clenched hands/back arched") },
    dazed: { e: S("half-closed eyes/empty eyes/sleepy/closed eyes/tired/unfocused eyes/blank stare"),
      m: S("parted lips/open mouth/drooling/saliva/light smile/heavy breathing"),
      b: S("relaxed eyebrows/raised eyebrows"), x: S("blush/sweat/sweaty/messy hair/tear stains/afterglow"),
      y: S("lying/limp/exhausted/twitching/after sex/spread legs/arm up") },
  };
  // f 감정 (표준 태그 · 모델이 아는 말) · mix: 쾌감 · 애탐 표정에 가끔 섞이는 부끄러움
  const F = {
    sweet: S("happy/smile/relieved/content"),
    shy: S("embarrassed/shy/nervous/flustered/surprised"),
    teasing: S("smug/seductive smile/naughty face/confident"),
    needy: S("in heat/frustrated/aroused/desperate"),
    pleasure: S("torogao/in heat/aroused/ecstasy"),
    intense: S("torogao/female orgasm/ecstasy"),
    dazed: S("torogao/afterglow/tired/sleepy/satisfied"),
  };
  for (const [k, v] of Object.entries(F)) if (window.BC_EXPR_PARTS[k]) window.BC_EXPR_PARTS[k].f = v;
  window.BC_EXPR_MIX = S("embarrassed/shy/flustered/covering face/hand over own mouth");
  // ---------- 분명한 행위 서술 ----------
  const W = window.BC_WAY; if (!W || !W.gen) return;
  const R = (a) => a[Math.floor(Math.random() * a.length)];
  const PH = {
    caress: S("당신의 손가락이 속옷 위에서 그녀의 보지 갈라진 곳을 따라 위아래로 문지른다/속옷 가운데가 젖어 색이 짙어져 있다/당신이 속옷을 옆으로 밀자 젖은 보지가 그대로 드러난다/당신의 손가락 끝이 부어오른 클리토리스를 찾아 누른다/문지를 때마다 그녀의 허리가 당신 손 쪽으로 밀려온다/허벅지 안쪽까지 애액이 번져 있다"),
    hand: S("당신의 손가락 두 개가 그녀의 보지 안으로 끝까지 들어간다/손가락을 굽혀 안쪽 위를 누르자 그녀의 엉덩이가 들린다/손가락을 뺄 때마다 애액이 실처럼 늘어진다/당신의 엄지가 클리토리스를 원을 그리며 문지른다/안이 손가락을 조이며 움찔거린다/젖은 소리가 손가락이 움직이는 박자대로 난다"),
    chest: S("당신이 젖꼭지를 입에 물고 혀로 굴린다/단단하게 선 젖꼭지가 당신 입술 사이에서 젖어 반짝인다/당신의 손바닥 안에서 그녀의 가슴이 모양을 바꾼다/다른 쪽 젖꼭지를 손가락으로 집어 살짝 당긴다/가슴 위로 당신의 침 자국이 번들거린다"),
    nipple: S("당신이 젖꼭지를 손가락 사이에 끼우고 비튼다/젖꼭지가 금세 단단하게 선다/혀끝으로 젖꼭지 주위를 천천히 돈다"),
    toy: S("진동기 머리가 클리토리스에 바로 닿아 있다/진동이 오를 때마다 그녀의 허벅지가 덜덜 떨린다/진동기를 떼자 그녀의 허리가 따라 올라온다/보지 입구에서 애액이 흘러 시트를 적신다"),
    cunni: S("당신의 혀가 그녀의 보지를 아래에서 위로 길게 핥아 올린다/당신이 클리토리스를 입술로 머금고 빨아들인다/혀끝이 입구 안으로 들어가자 그녀의 다리가 당신 머리를 조인다/당신의 턱까지 애액이 묻어 있다"),
    oral: S("그녀의 입술이 당신의 자지 끝을 감싸고 천천히 내려간다/그녀가 혀를 납작하게 대고 기둥을 핥아 올린다/침이 기둥을 타고 흘러내려 그녀의 손을 적신다/그녀의 볼이 안쪽으로 오목하게 들어간다/목 안쪽에 닿을 때마다 그녀의 눈가에 눈물이 맺힌다"),
    handjob: S("그녀의 손이 당신의 자지를 쥐고 위아래로 훑는다/엄지로 끝을 문지르자 맑은 액이 번진다/그녀의 손놀림이 점점 빨라진다/미끈거리는 소리가 손바닥 사이에서 난다"),
    paizuri: S("그녀가 양쪽 가슴으로 당신의 자지를 감싸 꽉 모은다/가슴 사이로 끝이 드나든다/그녀가 침을 떨어뜨려 미끄럽게 만든다"),
    self: S("그녀의 손가락이 젖은 보지를 벌리고 클리토리스를 문지른다/그녀가 손가락 두 개를 안으로 밀어 넣는다/다른 손으로는 제 젖꼭지를 비튼다/손가락이 드나들 때마다 젖은 소리가 난다/그녀의 허리가 제 손을 따라 들썩인다"),
    ready: S("당신의 자지 끝이 그녀의 젖은 입구에 닿아 있다/당신이 끝으로 보지 갈라진 곳을 위아래로 문지른다/입구가 끝을 머금었다 놓는다/애액에 젖은 끝이 클리토리스를 스친다"),
    pose: S("당신의 자지가 그녀 안으로 뿌리까지 들어간다/뺄 때마다 젖은 소리가 나고 애액이 기둥에 묻어 나온다/그녀의 보지가 당신을 꽉 조인다/허리를 박을 때마다 살이 부딪치는 소리가 난다/깊이 박힐 때마다 그녀의 가슴이 흔들린다/결합한 곳 주위가 애액으로 번들거린다/끝이 안쪽 깊은 곳을 누를 때마다 그녀의 배가 움찔한다/당신이 속도를 올리자 침대가 박자대로 흔들린다"),
    poseBack: S("허리를 박을 때마다 그녀의 엉덩이 살이 출렁인다/당신이 엉덩이를 양손으로 벌린 채 깊이 박아 넣는다/뒤에서 박힐 때마다 그녀의 상체가 앞으로 밀려난다"),
    poseTop: S("그녀가 허리를 내릴 때마다 당신의 자지가 끝까지 삼켜진다/그녀가 엉덩이를 돌리며 안을 휘젓는다/그녀가 몸을 들어 올렸다 떨어뜨릴 때마다 가슴이 출렁인다"),
    deny: S("당신이 끝까지 박아 넣은 채 움직이지 않는다/당신이 끝만 걸친 채 빠져나온다/그녀의 보지가 비어 버린 자리를 찾듯 움찔거린다/그녀가 엉덩이를 밀어 다시 넣으려 한다"),
    climax: S("그녀의 보지가 경련하듯 당신을 몇 번이고 조인다/그녀의 허리가 튀어 오르고 다리가 덜덜 떨린다/애액이 한꺼번에 흘러넘쳐 허벅지를 적신다/그녀의 배가 몇 번이고 들썩인다/조여 오는 힘에 당신도 숨을 멈춘다"),
    climax_both: S("당신의 자지가 그녀 안에서 맥박치며 정액을 쏟아낸다/그녀의 보지가 쏟아지는 것을 짜내듯 조인다/둘의 허리가 맞붙은 채 함께 떨린다"),
    after: S("당신이 빠져나오자 그녀의 보지가 천천히 닫힌다/그녀의 허벅지가 아직 가늘게 경련한다/젖은 시트가 엉덩이 밑에서 식어 간다/숨을 쉴 때마다 그녀의 가슴이 크게 오르내린다"),
    finish: S("당신의 자지가 마지막으로 크게 맥박친다/뜨거운 정액이 몇 번에 걸쳐 쏟아진다/그녀가 쏟아지는 것을 피하지 않고 받아낸다"),
  };
  const KEY = { caress: "caress", hand: "hand", chest: "chest", nipple: "nipple", toy: "toy", cunni: "cunni", oral: "oral", handjob: "handjob", paizuri: "paizuri", self: "self", ready: "ready", pose1: "pose", pose2: "pose", deny1: "deny", deny2: "deny", climax: "climax", climax_both: "climax_both", after1: "after", after2: "after", finish: "finish", finish_both: "after", undress3: "caress", grind: "ready", thighjob: "ready", sixtynine: "oral", analtoy: "toy" };
  // pose: { back, top } — 뒤에서 · 그녀가 위인 체위면 그 체위 문장도 섞음
  W.gen.phys = (sid, pose) => {
    const k = KEY[sid]; if (!k) return "";
    let pool = PH[k] || [];
    if (k === "pose" && pose) pool = [...pool, ...(pose.back && !pose.top ? PH.poseBack : []), ...(pose.top ? PH.poseTop : [])];
    return pool.length ? `${R(pool)}.` : "";
  };
})();
