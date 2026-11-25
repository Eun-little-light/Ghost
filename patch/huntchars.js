// Hunt 기본 인물 9명의 그림 프롬프트 — Hunt 인물 서재(window.hunt.chars.listAll)에서 가져옴 (Hunt 0.2.2)
// Hunt 시퀀스(huntseq.js) 캐릭터 목록의 "Hunt 인물" 묶음에 쓰임: 외모(anchor) · 복장(work/casual/date/officeDate) · 네거티브
// 다시 만들기: Hunt 인물 서재 API 결과(JSON)에서 make-huntchars 스크립트로 생성 (이름은 빼고 huntnames_local.js로)
window.BC_HUNT_CHARS = [
 {
  "id": "hunt_jieun",
  "name": "",
  "age": 28,
  "job": "마케팅팀 대리",
  "speech": "polite",
  "anchor": "long black hair, low ponytail, brown eyes, mole under eye, slim, medium breasts, narrow waist, slender legs, average height, neat, elegant, natural makeup",
  "negative": "short hair, blonde hair, (large breasts:1.2)",
  "outfits": {
   "work": "white blouse, black pencil skirt, office lady, black tote bag",
   "casual": "beige knit cardigan, white t-shirt, light blue straight jeans, white sneakers",
   "date": "navy wrap dress, pearl earrings, heels, small handbag",
   "officeDate": "ivory satin blouse, black slim midi skirt, pearl earrings, light makeup, office lady"
  }
 },
 {
  "id": "hunt_sera",
  "name": "",
  "age": 26,
  "job": "패션 MD",
  "speech": "casual",
  "anchor": "wavy light brown hair, medium hair, gray eyes, slim, hourglass figure, medium breasts, narrow waist, wide hips, long legs, tall female, glamorous, makeup, earrings",
  "negative": "black hair, glasses, (large breasts:1.2)",
  "outfits": {
   "work": "black cropped blazer, champagne silk camisole, white wide slacks, gold earrings",
   "casual": "oversized gray hoodie, black bike shorts, white sneakers, black baseball cap",
   "date": "black slip dress, leather jacket, heels, red lipstick",
   "officeDate": ""
  }
 },
 {
  "id": "hunt_harin",
  "name": "",
  "age": 22,
  "job": "카페 알바생",
  "speech": "polite",
  "anchor": "bob cut, black hair, blunt bangs, brown eyes, slim, small breasts, slim hips, slender legs, average height, innocent look, natural makeup",
  "negative": "long hair, heavy makeup, (large breasts:1.3), medium breasts",
  "outfits": {
   "work": "brown cafe apron, white shirt, black pants",
   "casual": "pastel pink cardigan, white pleated skirt, white sneakers, beige canvas tote bag",
   "date": "light blue floral sundress, white cardigan, white ribbon, hair ribbon, brown mary janes",
   "officeDate": ""
  }
 },
 {
  "id": "hunt_yuna",
  "name": "",
  "age": 29,
  "job": "바텐더",
  "speech": "casual",
  "anchor": "long black hair, hair bun, sharp eyes, gray eyes, slim, medium breasts, narrow waist, long legs, slender legs, tall female, cool expression, chic",
  "negative": "short hair, smile, (large breasts:1.2)",
  "outfits": {
   "work": "bartender vest, white shirt, black tie, sleeves rolled up, black slacks",
   "casual": "oatmeal loose cardigan, white t-shirt, light blue wide jeans",
   "date": "black turtleneck, camel long coat, black slim slacks, silver earrings",
   "officeDate": ""
  }
 },
 {
  "id": "hunt_minseo",
  "name": "",
  "age": 27,
  "job": "헬스 트레이너",
  "speech": "casual",
  "anchor": "ponytail, dark brown hair, brown eyes, slim, slender arms, soft feminine body, medium breasts, narrow waist, smooth flat stomach, wide hips, long legs, lightly tanned skin, healthy",
  "negative": "long skirt, pale skin, (large breasts:1.2), (muscular:1.4), (muscular female:1.4), (abs:1.3), six pack, toned, muscular arms, biceps, muscular legs, thick thighs, bodybuilder, veins, broad shoulders, athletic build",
  "outfits": {
   "work": "red cropped track jacket, black sports bra, black leggings",
   "casual": "gray zip hoodie, black jogger pants, white sneakers, ponytail",
   "date": "white fitted ribbed dress, light blue denim jacket, white sneakers",
   "officeDate": ""
  }
 },
 {
  "id": "hunt_suhyun",
  "name": "",
  "age": 34,
  "job": "기획팀 과장",
  "speech": "formal",
  "anchor": "beautiful face, mature female, long wavy hair, dark brown hair, side part, hair over one shoulder, droopy eyes, brown eyes, long eyelashes, mole under mouth, soft smile, glossy lips, red lipstick, slim, curvy, medium breasts, narrow waist, wide hips, elegant, graceful",
  "negative": "school uniform, twintails, (large breasts:1.2), thick thighs, (aged up:1.2), tired eyes, eye bags, nasolabial folds, plain face, thick eyebrows, frown",
  "outfits": {
   "work": "navy blazer, white silk blouse, navy pencil skirt, glasses",
   "casual": "charcoal cashmere sweater, beige slacks, brown loafers, glasses",
   "date": "burgundy midi dress, black long coat, black heels, gold necklace",
   "officeDate": "black silk blouse, charcoal tailored pencil skirt, pearl necklace, glasses"
  }
 },
 {
  "id": "hunt_dahye",
  "name": "",
  "age": 31,
  "job": "도예 공방 강사",
  "speech": "polite",
  "anchor": "medium hair, dark brown hair, low ponytail, loose strands, brown eyes, droopy eyes, medium build, medium breasts, soft stomach, wide hips, thick thighs, gentle smile, natural makeup",
  "negative": "blonde hair, heavy makeup, school uniform, (large breasts:1.2)",
  "outfits": {
   "work": "olive linen apron, beige knit sweater, sleeves rolled up, clay on hands, long brown skirt",
   "casual": "beige knit sweater, long brown skirt, canvas tote bag",
   "date": "white linen dress, sage green knit cardigan, brown flat shoes, hair clip",
   "officeDate": ""
  }
 },
 {
  "id": "hunt_eunbi",
  "name": "",
  "age": 25,
  "job": "편집숍 스타일리스트",
  "speech": "casual",
  "anchor": "bob cut, ash gray hair, gray eyes, sharp eyes, slim, small breasts, narrow waist, slim hips, long legs, tall female, confident smirk, earrings, eyeliner",
  "negative": "long hair, black hair, school uniform, (large breasts:1.3), medium breasts",
  "outfits": {
   "work": "oversized black leather jacket, white crop top, black wide pants, chunky white sneakers, tote bag",
   "casual": "black graphic hoodie, khaki cargo pants, white sneakers, black beanie",
   "date": "black leather mini skirt, white cropped knit top, black platform boots, silver layered necklaces",
   "officeDate": ""
  }
 },
 {
  "id": "hunt_jiwoo",
  "name": "",
  "age": 30,
  "job": "회계법인 회계사",
  "speech": "formal",
  "anchor": "long hair, black hair, straight hair, black eyes, slim, medium breasts, narrow waist, wide hips, slender legs, average height, neat, elegant, thin glasses, calm expression",
  "negative": "short hair, tanned skin, school uniform, (large breasts:1.2)",
  "outfits": {
   "work": "white blouse, gray slacks, wristwatch, office lady",
   "casual": "gray sweatshirt, straight jeans, white sneakers, glasses",
   "date": "white knit dress, cream trench coat, low heels, wristwatch",
   "officeDate": "cream blouse, navy midi skirt, cream trench coat, wristwatch"
  }
 }
];
// 인물 이름: 소스에는 없음 — 내 빌드는 patch\huntnames_local.js(저장소에 올리지 않음, window.LL_HUNT_NAMES)가 채우고,
//  누구나 Hunt 시퀀스의 '✏ 인물 이름'에서 직접 정할 수 있음(이 PC에 저장 · 내 빌드 이름보다 우선) · 둘 다 없으면 '인물 1' …
(() => {
  const L = window.LL_HUNT_NAMES || {};
  let U = {}; try { U = JSON.parse(localStorage.getItem("bc_hunt_names") || "{}") || {}; } catch {}
  (window.BC_HUNT_CHARS || []).forEach((c, i) => {
    const l = L[c.id] || [];
    c.defName = l[0] || `인물 ${i + 1}`;
    c.name = (U[c.id] || "").trim() || c.defName;
    if (l[1] && !String(c.anchor).startsWith(l[1] + ",")) c.anchor = l[1] + ", " + c.anchor;   // 내 빌드: 그림용 영문 이름 태그
  });
  window.BC_HUNT_NAME_SET = (id, name) => {
    let u = {}; try { u = JSON.parse(localStorage.getItem("bc_hunt_names") || "{}") || {}; } catch {}
    if (name && name.trim()) u[id] = name.trim(); else delete u[id];
    try { localStorage.setItem("bc_hunt_names", JSON.stringify(u)); } catch {}
    const c = (window.BC_HUNT_CHARS || []).find((x) => x.id === id); if (c) c.name = u[id] || c.defName;
  };
})();
