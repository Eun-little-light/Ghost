// 대사 회귀 점검 — 이미 고친 오류가 다시 나오지 않는지 (릴리스 전에: bun patch/tests/dialogue_check.js)
//  브라우저 없이 huntpost.js만 읽어 장면 검사기(BC_POST · BC_SCENE_FIX)를 돌림. 실패하면 종료 코드 1
const fs = require('fs'), path = require('path');
globalThis.window = globalThis;
eval(fs.readFileSync(path.join(__dirname, '..', 'huntmore2.js'), 'utf8'));   // 반말 변환기(BC_GEN2.lv)
eval(fs.readFileSync(path.join(__dirname, '..', 'huntpost.js'), 'utf8'));
const NTR = { rel: 'lover', situ: 'ntr', absent: true, nb: 1, ng: 1, place: { n: '호텔 스위트룸', bg: 'hotel room, bed' }, pose: { n: '정상위' } };
const LOVE = { rel: 'lover', place: { n: '호텔 스위트룸', bg: 'hotel room, bed' }, pose: { n: '정상위' } };
const run = (sid, t, o = NTR, on = '타이트 오피스룩') => BC_POST(t, sid, o, { si: 0, lw: 'crude', on });
const fails = [];
let dateHits = 0, ntoriHits = 0;
const check = (name, cond) => { if (!cond) fails.push(name); };
for (let i = 0; i < 30; i++) {   // 무작위가 섞여서 여러 번
  // 이라마치오: 그녀는 말 못 함 · 말하거나 메시지 보내는 서술 없음 · 그의 말은 남음
  const irr = run('irrumatio', '[목 안까지]그는 끝까지 밀어 넣는다. "으응—안, 안 돼" 그녀가 어깨에 얼굴을 묻고 소리친다. "꽉 안아 줘요…!" 그가 숨 섞인 목소리로 말을 건넨다. "눈 떠"\n그녀가 당신에게 \'조금 늦어\'라고 보내고, 셔츠를 벗긴다.\n"불알도 빨아 줄까요?"');
  check('irrumatio: 그녀가 말함', !/안 돼|꽉 안아|불알도|소리친다|보내고/.test(irr));
  check('irrumatio: 그의 말 사라짐', /눈 떠/.test(irr));
  // 입으로: 문단 안 신음은 막힌 소리 · 또렷한 말엔 입을 떼는 머리말 · 받는 쪽 반응 없음 · 그의 말(건넨다)은 그대로
  const oral = run('oral', '[입으로]그녀가 머금는다. "하앙… 더, 더… 좋아…!" 그녀의 등이 멋대로 휜다. 그가 숨 섞인 목소리로 말을 건넨다. "꽉 잡아"\n"아… 남자친구는 여기 이렇게 안 만져요"\n"이런 방 처음 와 봐요…"\n"남자친구는 이 반도 안 돼요"');
  check('oral: 문단 안 신음말', !/더, 더… 좋아/.test(oral.split('\n')[0]));
  check('oral: 받는 쪽 반응', !/안 만져|등이 멋대로 휜|처음 와 봐요/.test(oral));
  check('oral: 그의 말이 바뀜', /"꽉 잡아"/.test(oral));
  const face = run('oral', '[입으로]그녀가 머금는다. 그녀가 시트에 뺨을 비비며 소리를 삼킨다. 그가 이마를 맞댄 채 중얼거린다. "조금 더 갈게." 그러고는 먼저 입술을 포갠다.');
  check('oral: 얼굴 맞대는 동작', !/뺨을 비비|이마를 맞댄|입술을 포갠/.test(face) && /그가 중얼거린다\. "조금 더 갈게\."/.test(face));
  check('oral: 입 안 떼고 말함', oral.split('\n').slice(1).every((ln) => !/^"(?!(으읍|읍|컥|음|응|쭈|츄|으음))[^"]*[가-힣]{2,} [가-힣]{2,}/.test(ln)));
  // 머금기: 또렷한 말 없음 · 그의 말 남음
  const hold = run('oral_hold', '[머금기]그녀가 볼을 부풀린다.\n"으응… (고개를 젓는다)"\n"오늘 하루 종일 이 생각만 했어요."\n그가 그녀의 턱을 들어 올리며 말한다. "착하네"');
  check('hold: 또렷한 말', !/하루 종일/.test(hold));
  check('hold: 그의 말 사라짐', /착하네/.test(hold));
  // 손으로 해 주기: 받는 쪽 반응 · 입으로 하는 말 없음
  const hj = run('handjob', '[손으로]그녀가 손을 움직인다. 그녀의 등이 활처럼 휜다. "거기 계속요…!"\n"침 범벅 된 자지 얼굴에 문질러 줘요"\n"이렇게 쥐면 돼요?"');
  check('handjob: 받는 반응/입으로 말', !/거기 계속|등이 활처럼|침 범벅/.test(hj));
  // 애무(받는 장면): 입으로 하는 말 · 삽입 말 없음
  const ca = run('caress', '[애무]그녀가 웃는다. "입에 넣어도 돼요?" 그녀가 낯선 자지에 박힐 때마다 운다.\n"오늘 하루 종일 이 생각만 했어요."');
  check('caress: 입으로/삽입 말', !/입에 넣|박힐/.test(ca));
  // 1명인데 여러 명 표현
  const one = run('caress', '[애무]남자들 사이에 누운 채 그녀가 웃는다. 그녀의 입과 아래가 동시에 채워진다.\n"둘이 같이 만지니까 미칠 것 같아요"');
  check('1명인데 여럿', !/남자들|입과 아래|둘이 같이/.test(one));
  // 집이 아닌 장소: 집 전제 문장 없음
  const home = run('after1', '[여운]그녀가 당신 칫솔 옆에 그 남자의 칫솔을 하나 더 꽂아 둔다. 그녀가 숨을 고른다.\n"여기… 남편이 자는 자리야."');
  check('호텔에 집 전제 문장', !/칫솔|자는 자리/.test(home));
  // 여운: 절정 말 없음
  const af = run('after1', '[여운]그녀가 숨을 고른다.\n"가요, 가요…!"\n"오늘 자고 가요."', LOVE);
  check('여운에 절정 말', !/가요, 가요/.test(af));
  // 대사 속 옷 전체 이름 없음 (서술은 그대로)
  const ot = run('pose1', '[정상위]타이트 오피스룩 차림의 그녀가 눕는다.\n"타이트 오피스룩 걷어 올리고 핥아 줘"', LOVE);
  check('대사 속 옷 이름', !/"[^"]*타이트 오피스룩/.test(ot) && /타이트 오피스룩 차림의/.test(ot));
  // 상황별 데이트 말: 네토라레 데이트엔 '빨리 보고 싶었다 · 거짓말하고 나왔다' 결의 말이 자주 나옴
  if (i < 10) ntoriHits += /남자친구 약속|반지|동창|생각만 나요|일주일|부르니까|휴대폰을 엎는다/.test(run('meet1', '[데이트 · 레스토랑]그녀가 앉는다.', { rel: 'lover', situ: 'ntori', nb: 1, ng: 1, place: { n: '호텔 스위트룸', bg: 'hotel room, bed' } })) ? 1 : 0;
  if (i < 10) dateHits +=/거짓말|하루 종일|휴대폰만|생각했어요|보고 싶었어요|못 보니까|기다렸어|일찍 나온|달려온|'야근'/.test(run('meet1', '[데이트 · 레스토랑]그녀가 앉는다.')) ? 1 : 0;
  // 상황별 영상통화: 그의 받아침이 있고 · 네토라레(남자친구)에 부부 생활 말 없음 · 네토리엔 남자친구 맥락
  const P = { n: '그녀의 원룸', bg: 'bedroom, bed' };
  const vn = run('video1', '[영상통화]', { rel: 'lover', situ: 'ntr', absent: true, nb: 1, place: P });
  check('영상통화 네토라레: 그의 말 없음', /화면 너머로/.test(vn));
  check('영상통화 네토라레: 부부 생활 말', !/출근하면|자는 옆|샤워해요|안으려고/.test(vn));
  check('영상통화 네토리: 남자친구 맥락 없음', /남자친구/.test(run('video1', '[영상통화]', { rel: 'lover', situ: 'ntori', nb: 1, place: P })));
  check('영상통화 홧김: 존댓말 캐릭터에 반말', !/싸웠어…|들어 줘"|안 나"|해 줘"/.test(run('video1', '[영상통화]', { rel: 'rebound', absent: true, nb: 1, place: P })));
  const vr = run('video1', '[영상통화]', { rel: 'rebound', absent: true, nb: 1, place: P }), vc = BC_POST('[영상통화]', 'video2', { rel: 'lover', situ: 'ntori', nb: 1, place: P }, { si: 2, lw: 'crude' });
  const vw = run('video1', '[영상통화]', { rel: 'cheat', absent: true, nb: 1, place: P });
  check('영상통화: 조사 (남편는)', !/남편는|남자친구은/.test(vr + vw));
  check('영상통화: 반말 변환 깨짐 (너이)', !/너이\b|너이"/.test(vc));
  check('영상통화: 짝 위치 말이 엇갈림', (vw.match(/샤워|옆에 누워|자는 옆|잠든|TV 보는/g) || []).length <= 1);
  // 그림 보고 맞추기 경로도 검사기를 거침
  check('BC_SCENE_FIX 없음', typeof window.BC_SCENE_FIX === 'function' && !/안 돼/.test(BC_SCENE_FIX('[목 안까지]"안 돼, 빼 줘요"', 'irrumatio', null)));
}
if (ntoriHits < 7) fails.push(`네토리 데이트에 상황 말이 드묾 (${ntoriHits}/10)`);
if (dateHits < 7) fails.push(`네토라레 데이트에 상황 말이 드묾 (${dateHits}/10)`);
if (window.BC_GEN2 && BC_GEN2.lv) { const c = BC_GEN2.lv('당신이 보라고 하면… 당신을 좋아해요. 당신은 몰라요', 2); if (!/네가 보라고/.test(c) || /너이|너을|너은/.test(c)) fails.push('반말 변환: ' + c); }
const uniq = [...new Set(fails)];
console.log(uniq.length ? 'FAIL\n- ' + uniq.join('\n- ') : 'ALL OK (30회)');
process.exit(uniq.length ? 1 : 0);
