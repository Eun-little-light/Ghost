// 그림을 보고 대사 맞추기 (대사판) — Ghost의 WD14 태거(/api/tagger, ComfyUI)로 그림에 실제로 보이는 표정·자세·날씨를 읽어서
//  장면 대사(huntlines.js) + 그림에 맞는 한마디(아래 REACT)를 이어 붙임. 그림은 PC 밖으로 나가지 않음
//  - Hunt 시퀀스: 그림이 완성될 때마다 태깅해서 그 칸 · 보기 창 대사를 바꿈
//  - 갤러리: 대사가 그림 태그로 맞춰지지 않은 그림을 열면 그 자리에서 태깅 (한 번 읽은 결과는 저장)
(() => {
  const ON = "bc_linetag";
  const enabled = () => { try { return localStorage.getItem(ON) !== "0"; } catch { return true; } };
  // 한마디 — 태그(그림에 보이는 것) → 말투별 문장 여러 개. 앞쪽이 먼저 고려됨. st: 이 단계들에서만 (없으면 아무 단계)
  const MEET = ["video1", "video2", "meet1", "meet2"];
  const REACT = [
    { k: ["tears", "crying", "teary eyes", "streaming tears", "crying with eyes open", "tears of pleasure"],
      polite: ["눈물 나는 건 싫어서가 아니에요. 너무 좋아서 그래요.", "울어서 미안해요… 그냥 벅차서요."],
      formal: ["눈물이 나는 건 싫어서가 아닙니다. 너무 좋아서요.", "울어서 죄송합니다… 그저 벅차서요."],
      casual: ["우는 거 싫어서 그런 거 아니야. 너무 좋아서 그래.", "울어서 미안… 그냥 벅차서."] },
    { k: ["ahegao", "rolling eyes", "tongue out", "drooling", "open mouth"], st: ["pose1", "pose2", "climax", "climax_both", "after1", "after2", "deny1", "deny2", "self", "hand", "oral"],
      polite: ["말이… 잘 안 나와요…", "머리가 하얘서 아무 생각도 안 나요…"],
      formal: ["말이… 제대로 나오지 않습니다…", "머릿속이 하얘서 아무 생각도 나지 않아요…"],
      casual: ["말이… 잘 안 나와…", "머리가 하얘서 아무 생각도 안 나…"] },
    { k: ["closed eyes", "eyes closed"],
      polite: ["눈 뜨면 더 부끄러울 것 같아서요. 이대로 있을게요.", "눈 감고 있으니까 당신 손길만 느껴져요."],
      formal: ["눈을 뜨면 더 부끄러울 것 같아서요. 이대로 있겠습니다.", "눈을 감으니 당신 손길만 느껴집니다."],
      casual: ["눈 뜨면 더 부끄러울 것 같아. 이대로 있을래.", "눈 감으니까 네 손만 느껴져."] },
    { k: ["looking away", "averting eyes", "looking to the side", "turning head"],
      polite: ["…지금은 얼굴 못 보겠어요.", "쳐다보지 마요. 지금 표정 이상하단 말이에요."],
      formal: ["…지금은 얼굴을 못 보겠습니다.", "보지 마세요. 지금 표정이 이상할 거예요."],
      casual: ["…지금은 얼굴 못 보겠어.", "쳐다보지 마. 지금 표정 이상하단 말이야."] },
    { k: ["covering face", "covering mouth", "hand over mouth", "covering breasts", "covering crotch", "embarrassed"],
      polite: ["보지 마요… 아니, 봐도 되는데, 그래도요.", "가리는 거 반칙 아니에요. 아직 좀 부끄러울 뿐이에요."],
      formal: ["보지 마세요… 아니, 보셔도 되는데, 그래도요.", "가리는 건 반칙이 아닙니다. 아직 조금 부끄러울 뿐이에요."],
      casual: ["보지 마… 아니, 봐도 되는데, 그래도.", "가리는 거 반칙 아니야. 아직 좀 부끄러울 뿐이야."] },
    { k: ["smile", "happy", "grin", ":d", "light smile", "smug", "laughing"],
      polite: ["웃음이 자꾸 나와요. 이상하죠?", "당신이랑 있으면 그냥 웃게 돼요."],
      formal: ["웃음이 자꾸 납니다. 이상하죠.", "당신과 있으면 저절로 웃게 됩니다."],
      casual: ["웃음이 자꾸 나와. 이상하지?", "너랑 있으면 그냥 웃게 돼."] },
    { k: ["trembling", "shaking", "legs shaking", "twitching", "spasm", "knees together feet apart"],
      polite: ["다리가 떨려서… 잡아 줘요.", "몸이 마음대로 떨려요. 꽉 안아 줘요."],
      formal: ["다리가 떨립니다… 붙잡아 주세요.", "몸이 마음대로 떨려요. 꼭 안아 주세요."],
      casual: ["다리 떨려… 잡아 줘.", "몸이 맘대로 떨려. 꽉 안아."] },
    { k: ["looking at viewer", "eye contact"],
      polite: ["계속 보고 있을 거예요. 당신도 저만 봐요.", "눈 피하지 마요. 지금 이 얼굴, 당신만 보는 거예요."],
      formal: ["계속 보고 있겠습니다. 당신도 저만 봐 주세요.", "눈을 피하지 마세요. 이 얼굴은 당신만 보시는 거예요."],
      casual: ["계속 볼 거야. 너도 나만 봐.", "눈 피하지 마. 이 얼굴 너만 보는 거야."] },
    { k: ["full-face blush", "blush", "nose blush"],
      polite: ["얼굴 빨개진 거 말하지 마요. 알고 있으니까요.", "볼이 화끈거려요. 다 당신 때문이에요."],
      formal: ["얼굴이 빨개진 건 말씀하지 마세요. 저도 압니다.", "볼이 화끈거립니다. 전부 당신 탓이에요."],
      casual: ["얼굴 빨개진 거 말하지 마. 나도 알아.", "볼 화끈거려. 다 너 때문이야."] },
    { k: ["sweat", "sweatdrop", "steaming body", "wet hair", "heavy breathing"], st: ["chest", "hand", "oral", "self", "caress", "pose1", "pose2", "climax", "climax_both", "after1", "after2", "deny1", "deny2", "finish", "finish_both"],
      polite: ["땀 범벅이에요. 그래도 떨어지지 마요.", "숨이 차요… 잠깐만, 아니 멈추진 말고요."],
      formal: ["땀투성이네요. 그래도 떨어지지 마세요.", "숨이 찹니다… 잠깐만요, 아니, 멈추지는 마시고요."],
      casual: ["땀범벅이야. 그래도 떨어지지 마.", "숨차… 잠깐, 아니 멈추진 말고."] },
    { k: ["sex from behind", "doggystyle", "from behind", "bent over"], st: ["ready", "pose1", "pose2", "climax", "climax_both", "after1", "after2", "deny1", "deny2"],
      polite: ["뒤에서 그러면 얼굴이 안 보여서 불안해요. 이름 불러 줘요."],
      formal: ["뒤에서 그러시면 얼굴이 안 보여 불안합니다. 이름을 불러 주세요."],
      casual: ["뒤에서 그러면 얼굴 안 보여서 불안해. 이름 불러 줘."] },
    { k: ["girl on top", "cowgirl position", "straddling"], st: ["pose1", "pose2", "climax", "climax_both", "after1", "after2", "deny1", "deny2"],
      polite: ["오늘은 제가 정할래요. 가만히 있어요."], formal: ["오늘은 제가 정하겠습니다. 가만히 계세요."], casual: ["오늘은 내가 정할래. 가만있어."] },
    { k: ["hug", "hugging", "embrace", "arms around neck", "cuddling", "head on chest"],
      polite: ["조금만 더 이렇게 안고 있어요."], formal: ["조금만 더 이렇게 안아 주세요."], casual: ["조금만 더 이렇게 안고 있어."] },
    { k: ["holding hands", "hand holding", "interlocked fingers"],
      polite: ["손 놓지 마요. 오늘은 계속 잡고 있을 거예요."], formal: ["손 놓지 마세요. 오늘은 계속 잡고 있겠습니다."], casual: ["손 놓지 마. 오늘은 계속 잡고 있을 거야."] },
    { k: ["rain", "umbrella", "wet clothes"], st: MEET,
      polite: ["비 오니까 더 꼭 붙어 있고 싶어요. 우산 핑계예요."], formal: ["비가 오니 더 가까이 있고 싶습니다. 우산 핑계예요."], casual: ["비 오니까 더 붙어 있고 싶어. 우산 핑계야."] },
    { k: ["snow", "snowing", "winter clothes", "scarf", "breath"], st: MEET,
      polite: ["추운데 당신 손은 따뜻하네요. 주머니에 같이 넣어도 돼요?"], formal: ["추운데 당신 손은 따뜻하시네요. 주머니에 같이 넣어도 될까요."], casual: ["추운데 네 손은 따뜻하다. 주머니에 같이 넣자."] },
    { k: ["night", "night sky", "city lights", "neon lights"], st: MEET,
      polite: ["밤이라 그런지 평소보다 솔직해지고 싶어요."], formal: ["밤이어서인지 평소보다 솔직해지고 싶습니다."], casual: ["밤이라 그런가, 평소보다 솔직해지고 싶어."] },
    { k: ["cup", "holding cup", "drinking", "alcohol", "beer", "cocktail glass", "wine glass"], st: MEET,
      polite: ["한 잔 더 마시면 하고 싶은 말 다 해 버릴 것 같아요."], formal: ["한 잔 더 마시면 하고 싶은 말을 다 해 버릴 것 같습니다."], casual: ["한 잔만 더 마시면 하고 싶은 말 다 해 버릴 것 같아."] },
  ];
  const GUESS = [
    ["deny1", /orgasm denial|edging/], ["video2", /video call.*(open shirt|unbuttoned|cleavage)/], ["video1", /video call|selfie/],
    ["care", /under blanket|fixing clothes|cuddling|head on chest/], ["finish", /ejaculation|cumshot|cum in pussy|cum on|cum overflow/],
    ["after2", /body jerk|legs shaking/], ["after1", /afterglow|post-orgasm/], ["climax", /orgasm|ahegao/],
    ["ready", /imminent (vaginal|penetration)|penis on pussy/], ["self", /female masturbation/], ["oral", /fellatio|penis in mouth|oral/],
    ["pose1", /vaginal|sex from behind|cowgirl|missionary|girl on top|doggystyle|spooning/],
    ["hand", /fingering|fingers in pussy/], ["chest", /breast sucking|grabbing another's breast|groping|fondling|nipple/], ["caress", /petting|vibrator|dildo|sex toy/],
    ["undress3", /taking off panties|skirt lift|panties aside/], ["undress2", /taking off shirt|topless|no shirt/],
    ["undress1", /unbuttoning|unbuttoned|open shirt|undressing/], ["neck", /kissing neck|neck kiss|kissing her neck/], ["kiss", /kiss/],
    ["meet2", /sofa|hotel|stairwell|bedroom/], ["meet1", /restaurant|cafe|bar|park|street|cinema|karaoke|izakaya|amusement/],
  ];
  const norm = (t) => String(t).trim().replace(/_/g, " ").toLowerCase();
  const hash = (s) => { let n = 0; for (const c of String(s)) n = (n * 31 + c.charCodeAt(0)) >>> 0; return n; };
  const pickOf = (a, seed) => (a && a.length ? a[seed % a.length] : "");
  function stageOf(tags, positive) {
    const txt = tags.join(", ") + " | " + String(positive || "").toLowerCase();
    const hit = GUESS.find(([, re]) => re.test(txt));
    return hit ? hit[0] : "meet1";
  }
  // 장면 대사 + 그림 한마디 (최대 2개, 장면 대사가 짧으면 2개)
  function compose(tags, o) {
    const set = new Set(tags.map(norm)), seed = hash(o.id || "");
    const sid = o.sid || stageOf([...set], o.positive), sp = o.sp || "polite";
    const L = (window.BC_HUNT_LINES || {})[sid] || {};
    const base = o.base || pickOf(L[sp] || L.polite, seed);
    const used = [];
    for (const r of REACT) {
      if (r.st && !r.st.includes(sid)) continue;
      if (!r.k.some((k) => set.has(k))) continue;
      const t = pickOf(r[sp] || r.polite, seed + used.length);
      if (t && !String(base).includes(t)) used.push(t);
      if (used.length >= (String(base).length < 45 ? 2 : 1)) break;
    }
    // 서술 대사면 한마디를 따옴표 안("…") 끝에 넣음
    const b = String(base || "");
    const qi = b.lastIndexOf('"');
    if (used.length && qi > 0 && (b.slice(0, qi).split('"').length % 2 === 0)) return { t: b.slice(0, qi) + " " + used.join(" ") + b.slice(qi), sid };
    return { t: [b, ...used].filter(Boolean).join(" "), sid };
  }
  // 그림 한 장 태깅 (한 번에 하나씩 — ComfyUI를 붙잡지 않게)
  let chain = Promise.resolve();
  function tagImage(im) {
    const run = async () => {
      // 지워진 그림이면 태거(ComfyUI)로 보내지 않음 — 보내면 ComfyUI 오류 알림이 뜸
      const r = await fetch(imgURL(im));
      if (!r.ok || !String(r.headers.get("content-type") || "").startsWith("image/")) return [];
      const blob = await r.blob();
      const fd = new FormData();
      fd.append("image", new File([blob], im.filename || "image.png", { type: blob.type || "image/png" }));
      const msel = document.querySelector("#taggerModel");
      fd.append("model", (msel && msel.value) || "wd-eva02-large-tagger-v3");
      fd.append("threshold", "0.35"); fd.append("charThreshold", "0.85"); fd.append("exclude", "");
      const res = await api("/api/tagger", { method: "POST", body: fd });
      return (res && res.tags) || [];
    };
    const p = chain.then(run, run);
    chain = p.catch(() => {});
    return p;
  }
  // id: 프롬프트 id · im: 이미지 · o: { sid, sp, base, n, cid, cn, of, positive }
  async function lineFor(id, im, o = {}) {
    if (!enabled() || !window.BC_LINE) return null;
    const m = BC_LINE.get(id) || {};
    if (m.vt) return m.t;
    let tags;
    try { tags = await tagImage(im); } catch (e) { console.warn("대사용 태깅 실패", e); return null; }
    if (!tags.length) return null;
    const r = compose(tags, { ...o, id, base: o.base || m.base || m.t || "" });
    BC_LINE.set(id, { ...m, ...pick(o, ["n", "cid", "cn", "of"]), n: m.n || o.n || "", t: r.t, base: o.base || m.base || m.t || "", sid: r.sid, vt: 1, tg: tags.slice(0, 40) });
    return r.t;
  }
  const pick = (o, ks) => Object.fromEntries(ks.filter((k) => o[k] != null).map((k) => [k, o[k]]));
  window.BC_LINE_TAG = { lineFor, compose, enabled };

  // 설정 탭: 켜기/끄기
  function addSetting() {
    const anchor = document.querySelector("#tab-settings .field, #tab-settings .card");
    if (!anchor || document.querySelector("#bcLineTag")) return !!anchor;
    const row = document.createElement("div");
    row.className = "field";
    row.innerHTML = `<label>그림 보고 대사 맞추기</label><label class="check"><input type="checkbox" id="bcLineTag"> 완성된 그림을 태거로 읽어 표정·자세·날씨에 맞는 한마디를 대사에 붙임 <small class="muted">(ComfyUI WD14 태거 · 그림은 PC 밖으로 안 나감 · 장당 1초 안팎)</small></label>`;
    anchor.parentElement.insertBefore(row, anchor);
    const cb = row.querySelector("input");
    cb.checked = enabled();
    cb.onchange = () => { try { localStorage.setItem(ON, cb.checked ? "1" : "0"); } catch {} };
    return true;
  }
  { let n = 0; const t = () => { if (!addSetting() && ++n < 20) setTimeout(t, 500); }; t(); }
})();
