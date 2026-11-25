# Ghost (옛 이름 BooruComfy)

Danbooru 태그 기반 프롬프트 도우미 + ComfyUI 연동 도구 (Windows 단일 실행 파일). v1.9.0부터 이름이 **Ghost**로 바뀌었습니다.

> ## 대사판 · Lightning 접목판 (`lightning-dialogue` 브랜치)
>
> 이 브랜치는 Ghost에 **Hunt 시퀀스(한 번의 관계가 이어지는 연속 생성) · 장면별 대사 · Lightning(빠른 생성)** 을 접목한 성인용 파생판입니다 (버전 v1.66.2).
> 이 대사판의 코드와 대사는 **Anthropic의 Claude(Claude Code)의 도움을 받아** 작성 · 수정했습니다.
>
> - **Hunt 시퀀스**: 만남 → 키스 → 애무(삽입 없는 행위마다 절정 · 사정 장면 포함) → 체위별 절정 → 여운 → 마무리를 한 번의 흐름으로 생성. 인원 구성(여성 1~4 × 남성 1~4), 남성 선택에 1남(당신) · 1남(바람 · 불륜 상대), 당신의 역할(함께함 · 지켜보는 남편 · 장면에 없음), 관계(관심 · 썸 · 연인 · 파트너 · 부부 · 불륜 · 아내의 바람 · 주종 등), 다인 상황(순애 · 네토라레 · 네토리 · 부부 스와핑), 데이트 중 원격 로터 7단계(건네받기 · 화장실에서 넣기 · 돌아와 앉기 · 약 · 중 · 강 · 데이트 중 절정), 남편이 모르는 관계의 통화(데이트 중 · 시작 전 · 하는 중 · 끝난 뒤) · 사진 보내기 장면, 성인용 복장(란제리 · 베이비돌 · 네글리제 · 바디스타킹 · 마이크로 비키니 · 바니걸 · 메이드 · 간호사 · 차이나 드레스 · 라텍스).
> - **복장**: 데이트 · 장소 도착까지는 데이트 옷, 장소 도착 뒤 옷 갈아입기 장면(서술 포함) → 키스부터 고른 복장으로 진행.
> - **대사**: 그녀의 날(안전일 · 위험일 · 위험일인데 오히려 원함)에 따라 시작 전 · 안에 사정 대사가 달라짐 · 말한 사람별 색(그녀 · 여자 분홍 · 남자 파랑 · 당신 초록) · Hunt 방식 / Wayward 방식 서술 · 캐릭터 말투(해요 · 합니다 · 반말) · 표정 · 몸의 반응 · 상황별 확장 대사(조합 생성).
> - **빌드 없이 대사 업데이트**: `patch\hot.ps1` → 켜져 있는 Ghost가 10초 안에 새 대사를 적용 (진행 중인 생성 · 갤러리 유지).
> - **갤러리**: 새로 생성 · 캐릭터 폴더(전체 · 복장별) · 🎭 상황별(다인 플레이 인원수별 · 바람 · 네토라레 · 네토리 · 스와핑 · 지켜보는 남편 · 주종 · 연애) · 드래그 다중 선택 · 우클릭 메뉴 · 대사는 그림 옆 패널.
> - **인물 이름**: 배포용 빌드와 저장소에는 캐릭터 이름이 들어 있지 않습니다. Hunt 시퀀스의 **'✏ 인물 이름'** 에서 직접 정하세요(이 PC에 저장). 개인 빌드 전용 이름은 `patch/huntnames_local.js` · `patch/charnames_local.js`(저장소에 올리지 않음)로 넣습니다.
> - **빌드**: `& .\patch\make.ps1 -Ver 1.66.2` (개인) · `-Dist` (배포용, 이름 없음 · 바탕화면 `[Ghost-대사][배포용]`, 자동 업데이트 없음).
> - 모든 장면은 성인 간의 합의된 관계를 전제로 합니다.

## 실행

- `Ghost.exe`를 더블클릭하면 ComfyUI가 꺼져 있을 때 먼저 켜고 전용 창으로 엽니다. 프로그램 본체는 이 exe 안에 들어 있어 숨김 폴더 `.engine`에 풀어 씁니다(빌드: `make.ps1`이 엔진 exe를 창 exe에 넣고 폴더의 엔진 exe는 지움).
- 주소: `http://127.0.0.1:7865`
- 데이터 폴더는 예전 이름 `BooruComfy_data`를 그대로 씁니다. 그래서 프리셋·기록·내 태그·워크플로가 그대로 이어집니다.

## v1.9.19 변경 사항

- **예상 완료 시간** (`queue.js`): 생성 버튼 위 대기열 줄에 '약 N분 뒤 모두 완료 (시각)', 대기열 창에 작업마다 한 장 시간과 완료 시각. 작업마다 실제로 들어간 설정(인원 · KSampler/얼굴 보정/업스케일 steps · IPAdapter)으로 계산해서 빠른 모드 작업(⚡)은 짧게 잡힘. 이 PC에서 끝난 생성 시간(ComfyUI 기록)을 같은 설정끼리 배워 점점 정확해짐(처음엔 RTX 3080 측정값).

## v1.9.18 변경 사항

- **빠른 모드** (`fast.js`, 기본 켜짐 · 설정 탭과 생성 버튼 위 대기열 줄에서 끄고 켜기): 그림체·구도를 정하는 기본 생성(KSampler)은 그대로 두고, 얼굴 보정(FaceDetailer) steps를 최대 12로(원래 20), 업스케일(UltimateSDUpscale) steps를 최대 8로(원래 16) 줄인 숨김 사본 워크플로(`이름~fast`)로 생성. RTX 3080 같은 시드 비교에서 1인 약 58초 → 43초, 2인 약 66초 → 49초(약 25% 단축), 그림은 거의 같음(얼굴 표정이 살짝 다를 수 있음). charfolder보다 안쪽이라 캐릭터용 사본의 빠른 사본을 씀.
- **내 빌드도 창 exe 하나로**: `make.ps1`이 내 빌드도 엔진을 창 exe 안에 넣고 폴더의 엔진 exe는 지움. 예전 버전 exe·.vbs 실행기는 `이전 버전\`으로 옮겨 둠(창 exe는 배포용(`-Clean`)일 때만 폴더의 예전 엔진을 지움).

## v1.9.17 변경 사항

- **작은 창 대응** (`fit.js`, 맨 마지막 모듈): 창을 줄였을 때 버튼 글자가 한 글자씩 세로로 꺾이거나 화면 밖으로 넘치던 문제 정리 — 버튼·선택칸은 줄바꿈 없이 버튼 줄째 다음 줄로, 긴 설명 체크 항목은 안에서 줄바꿈, 갤러리 도구 줄 줄바꿈, 좁은 창(820px 이하)에서 태그 선택기 오른쪽 칸 높이 제한(태그 목록이 눌리지 않게), 편집 탭 빈 목록 문구.
- **창 exe 하나로** (배포용): 배포 폴더에는 `Ghost.exe`만 — 엔진 exe가 그 안에 들어 있어(`build_shell.ps1 -Engine`) 처음 켤 때 숨김 폴더 `.engine`에 풀고(빌드 번호 stamp로 바뀐 엔진만 다시 풀기), `.engine\<데이터 폴더>`를 이 폴더의 데이터 폴더로 잇는 정션을 만들어 데이터는 지금처럼 이 폴더에 쌓임. 업데이트 비교는 `update.txt`의 `version=` 줄. v1.9.14~v1.9.16(Rev.1 첫 판)는 예전 업데이트 스크립트라 자동 업데이트가 안 되니 zip을 한 번 직접 덮어써야 함.

## v1.9.16 변경 사항

- **프롬프트 자동 정리** (`tidy.js`, 설정 탭에서 끄고 켜기): 모든 생성 직전에 ① 중복·포함 태그 제거(sweat + heavy sweat → heavy sweat 등) ② 정렬 — 인원 → 작가 화풍 → 핵심 체위 → 캐릭터 외모 → 그 밖의 동작 → 복장 → 표정 → 배경 → 연출 → 품질 ③ 가중치가 붙은 태그가 8개를 넘으면 핵심(인원·작가·핵심 체위·외모) 외에는 1.0으로. SDXL은 앞쪽 태그를 더 강하게 반영해서, 뒤로 밀려 안 먹던 캐릭터 외모·핵심 체위가 잘 나옴. BREAK로 인물을 나눈 프롬프트는 순서를 유지하고 중복만 제거.

## v1.9.15 변경 사항

- **남자 얼굴 숨기기 보강** (`faceless.js`): '남자 얼굴 숨기기'가 켜져 있으면 `faceless male`을 긍정 맨 끝(100번째 이후, 거의 효과 없음) 대신 인원 태그(1boy 등) 바로 뒤에 가중치 1.3으로, 부정 `male face`·`detailed male face`도 1.3으로. 태그 선택기·시퀀스·다시 생성 등 모든 생성에 적용.

## v1.9.14 변경 사항

- **전용 창 프로그램** (`Little Light.exe` / `Ghost.exe`, `patch\shell\`): 브라우저 없이 WebView2 창으로 실행. 켜면 업데이트 확인 → ComfyUI 실행 → 앱 서버를 창 없이(`-port N -no-browser`) 켜고 전용 창에 표시, 창을 닫으면 서버도 끔. 창 크기·위치 기억, 새 창 링크는 기본 브라우저로. WebView2 부품은 exe 안에 들어 있음(`build_shell.ps1`, Windows 기본 csc로 빌드). 기록: `%LOCALAPPDATA%\<이름>\shell.log`. 시험용 `--port N`.
- **생성 우선순위** (`queue.js`): 생성 버튼 위 대기열 줄과 대기열 창 — 작업마다 맨 앞으로 · 맨 뒤로 · 취소 · 중단, '새 생성은 맨 앞으로'. 같은 작업 번호로 다시 넣는 방식이라 앱의 진행·결과 연결이 이어짐. 누끼는 항상 맨 앞.
- **누끼 보강**: 권장 값 안내(가장자리 정리 0~10 · 부드럽게 1px, 잔티가 남으면 15~25), 결과가 통째로 비면 한 번 자동 재시도.
- **배포 폴더**: 바탕화면 `[이름][배포용.Rev.1]` — 실행기(.vbs) 대신 전용 창 exe.

## v1.9.13 변경 사항

- **편집 탭 (누끼)**: 그림을 고르고(파일 열기 · 끌어다 놓기 · 최근 생성 그림 · 그림 상세 창의 '✂ 누끼 따기') '배경 제거'를 누르면, ComfyUI 기본 배경 제거 노드(BiRefNet)로 투명 배경 PNG를 만듭니다. 가장자리 정리 · 부드럽게 · 여백 자르기 · 배경색(투명/흰색/검정/색)을 고른 뒤 PNG로 다운로드합니다. 결과는 ComfyUI `output\…edit\`에도 저장되고, 생성 기록에는 남지 않습니다.
  - 필요: [birefnet.safetensors](https://huggingface.co/Comfy-Org/BiRefNet/blob/main/background_removal/birefnet.safetensors)(약 444MB) → ComfyUI `models\background_removal\` (최신 ComfyUI 기본 노드, 커스텀 노드 필요 없음)

## v1.9.11 변경 사항

- **자동 업데이트** (배포용): 실행기를 켤 때 GitHub 최신 릴리스를 확인해 새 버전이면 물어보고 바꿔서 실행합니다(`patch\update.ps1`, 배포 폴더의 `update.txt`에 저장소 이름). 앱 화면에도 새 버전 안내가 뜨고(`updater.js`), 설정 탭 '업데이트 확인' 버튼이 있습니다. 데이터는 그대로 둡니다.
- **모델 파일 이름 자동 맞춤** (v1.9.10): 워크플로가 찾는 모델이 없으면 Civitai 원래 파일 이름이나 확장자만 다른 같은 이름(`4x-AnimeSharp.pth`)으로 맞춥니다.

## v1.9.9 변경 사항

- **캐릭터 이름 · 내 캐릭터**: '기본 캐릭터 ▾'와 연작/시퀀스 캐릭터 선택 옆의 `✎ 캐릭터` 버튼을 누르거나 설정 탭에서 바꿉니다.
  - 캐릭터 이름: 기본 캐릭터마다 이름을 정하면 목록과 캐릭터별 저장 폴더에 그 이름이 쓰입니다. 배포용 빌드는 기본 이름이 없습니다.
  - 내 캐릭터: 이름, 설명, 외모 태그(항상 유지), 의상 태그(연작/시퀀스에서 복장을 고르면 교체), 인식 태그, 마녀 화풍 유지 여부를 넣어 추가·수정·삭제합니다. 기본 캐릭터처럼 솔로 / 솔로 제외 / 여럿 한 번에 세 가지로 나옵니다.
  - 성인 캐릭터만 됩니다. `adult, mature female`을 자동으로 붙이고, 어린 캐릭터를 뜻하는 태그는 거부합니다.
  - 저장 위치: 프리셋 '@캐릭터 이름'·'@내 캐릭터' (`charnames.js`)
  - 배포용 빌드: `make.ps1 -Ver X -Dist` → 바탕화면 `[이름][배포용]` 폴더에 최신 exe만 남기고 실행기·참고 그림·워크플로·README까지 최신으로 (`patch\dist.ps1`)

## v1.9.7 변경 사항

- **ComfyUI 자동 설정**: 앱 화면을 열면 ComfyUI에 연결되는 순간 한 번 실행합니다. 워크플로는 원래 exe가 갖고 있다가 생성할 때 ComfyUI API로 통째로 보내므로, ComfyUI 화면의 목록에 없어도 됩니다.
  - exe에 든 참고 그림(`ref_pastel_holo.png`, `ref_bluenight.png`)이 ComfyUI `input`에 없으면 올립니다. ComfyUI 설치 위치와 상관없이 동작합니다.
  - exe에 든 워크플로(마녀 화풍 5개 + 코드로 만드는 파스텔·Plain·푸른 밤 8개) 중 앱에 없는 것을 등록합니다.
  - 그래서 exe 파일 하나만 있어도 동작합니다. 내장 데이터는 `patch\make_embed.ps1` → `patch\embed.js`(Little Light에서 만들어 Ghost에 복사)로 만듭니다.

## v1.9.6 변경 사항

- **시퀀스 '화풍' 칸 분리**: '3. 연출·효과' 앞에 화풍 칸이 따로 생겼습니다. 파스텔 홀로그램, 작가 화풍(견본 썸네일 100명), 푸른 밤을 그림 타일로 고르고, 가운데 휠로 클릭하면 견본이 크게 열립니다. 고른 화풍은 모든 단계에 적용됩니다.
- **캐릭터 추가**:
  - **흑발 오드아이 메이드**: 흑발, 오드아이(파랑·빨강), 빨간 리본, 검은 메이드복
  - **흑발 청안 메이드**: 흑발, 파란 눈, 빨간 리본, 남색 메이드복
  - 둘 다 마녀 화풍 참조(0.9)에서 나온 모습이라 그 참조를 그대로 씁니다. 캐릭터 폴더는 `Character4`·`Character5`입니다.
- **머리색 수정**: 기본 워크플로(마녀 그림 화풍 참조 0.9)에서 마녀 캐릭터·흑발 오드아이 메이드·흑발 청안 메이드가 아닌 캐릭터(흑발 셔츠 캐릭터·은발 베레모 캐릭터·흰 긴 머리 메이드)는 참조를 0.5로 낮춥니다. 그래서 은발·흰 머리·흰 셔츠가 흑발·검은 옷으로 바뀌지 않습니다.
  - 캐릭터별 폴더 저장이 켜져 있을 때 만드는 캐릭터용 사본 워크플로에 적용됩니다.
## v1.9.3 변경 사항

- **작가 견본 썸네일**: 태그 선택기 '작가 화풍' 100명 버튼에 견본 그림이 붙었습니다. 모두 같은 프롬프트·시드 31415로 만들었고, 가운데 휠로 클릭하면 원본 크기로 열립니다.
  - 원본은 ComfyUI `output\artist_samples`에 있습니다. 다시 만드는 방법은 Little Light의 `reference\artists\make_samples.ps1` → `make_thumbs.ps1`이고, 만든 `artists_thumbs.js`를 이 폴더 `patch`에도 복사하면 됩니다.

## v1.9.2 변경 사항

- **가슴 크기 필수 선택**: 생성 탭과 시퀀스의 생성 버튼 위, 설정 탭에 `가슴 크기 [필수]`가 있습니다. 작게 / 보통(기본) / 크게 / 아주 크게 중에서 고르고, 끄는 옵션은 없습니다.
  - 모든 생성에 적용됩니다. 프롬프트에 있던 다른 가슴 크기 태그는 고른 크기 하나로 바뀌고, 인원 태그(1girl 등) 바로 뒤에 들어갑니다. 남자만 나오는 프롬프트는 건드리지 않습니다.
- **태닝 제거**: 태그 선택기 '피부 질감'(시퀀스 '피부 디테일')에 들어 있던 `tanlines`를 뺐습니다. 내 태그나 프리셋에 직접 넣은 태닝 태그는 그대로입니다.
- **푸른 밤 옷 무광**: 흰 긴 머리 메이드 캐릭터·화풍에서 `shiny clothes`를 뺐습니다. 푸른 밤으로 생성할 때는 광택 태그(shiny clothes, latex, satin…)가 부정 프롬프트에 자동으로 들어갑니다.
## v1.9.1 변경 사항

- **캐릭터 '흰 긴 머리 메이드' 추가** (흰 긴 머리 메이드): 기본 캐릭터 목록과 시퀀스 캐릭터에서 솔로 / 솔로 제외 / 여러 체위 한 번에 생성용 중에서 고릅니다. 캐릭터별 폴더 저장은 `BooruComfy_data\images\Character6`입니다. 푸른 단색 화풍은 태그 선택기 '푸른 밤' 그룹에서 함께 고르세요.

## v1.9.0 변경 사항

- **이름 변경**: 화면 로고, 창 제목, 아이콘, exe 이름(`Ghost_v1.9.0.exe`), 실행기를 Ghost로 바꿨습니다.
- **다시 생성**: 그림이 잘못 나왔을 때 같은 프롬프트·워크플로·설정에 새 시드로 다시 만듭니다.
  - 생성 탭 결과 아래와 그림 상세 창(갤러리 포함)에 버튼이 있습니다.
    - `↻ 다시 생성`
    - `↻ 다시 생성 + 이 그림 기록 삭제`: 로컬 사본은 지우고, ComfyUI 출력 폴더의 원본은 남깁니다.
  - 시퀀스 결과 칸은 완료되거나 오류가 난 칸 제목 옆에 `↻`가 있습니다. 누르면 그 장만 같은 칸 자리에 다시 생성됩니다.
- **화풍 추가** (Little Light와 같음). 태그 선택기에 그룹이 생기고, 시퀀스의 연출·효과에도 나옵니다.
  - `파스텔 홀로그램`: 파스텔 + 무지갯빛 화풍. 전용 워크플로 `Claude_Anime_PastelHolo*`로 자동 전환됩니다.
  - `작가 화풍`: 픽시브 인기 작가 중 Danbooru 태그가 있는 100명. 화풍 참조가 없는 `Claude_Anime_Plain*`으로 자동 전환됩니다.
  - `푸른 밤`: 푸른 단색조·역광·메이드 화풍. Plain 워크플로로 바뀌고, `참고 그림 화풍`을 고르면 `Claude_Anime_BlueNight_IPAdapter`로 바뀝니다.
  - 워크플로는 앱이 켜질 때 없으면 자동으로 등록됩니다. 참고 그림 `reference\ref_pastel_holo.png`·`ref_bluenight.png`는 실행기가 ComfyUI `input` 폴더에 없을 때 복사합니다.

## 저장소로 받았을 때 필요한 것

이 저장소에는 소스(`patch\*.js`·빌드 스크립트), 워크플로, 참고 그림만 들어 있습니다. 실행 파일과 개인 데이터는 들어 있지 않습니다.

- **빌드:** 원본 BooruComfy v1.6.1 exe를 `patch\BooruComfy_v1.6.1.exe`로 넣고 `& .\patch\make.ps1 -Ver X.Y.Z`를 실행하면 `Ghost_vX.Y.Z.exe`가 만들어집니다.
- **워크플로:** `workflows\*.json`을 `BooruComfy_data\workflows\`에 복사합니다. 이 데이터 폴더는 exe를 한 번 실행하면 exe 옆에 생깁니다.
  - 파스텔 홀로그램·Plain·푸른 밤 워크플로는 앱이 켜질 때 없으면 자동으로 등록됩니다.
- **참고 그림:** `reference\ref_pastel_holo.png`·`ref_bluenight.png`는 실행기가 ComfyUI `input` 폴더에 없을 때 복사합니다.
  - 마녀 화풍 그림 `ref_witch.png`는 들어 있지 않습니다. 이 그림을 쓰는 워크플로(`RefStyle_IPAdapter`, `Duo_2people`, `Party_5people`, `WhiteUniform_*`)를 쓰려면 원하는 화풍 그림을 같은 이름으로 ComfyUI `input`에 넣으세요.
- **ComfyUI 커스텀 노드** (ComfyUI Manager로 설치하거나 `ComfyUI\custom_nodes`에 받기)
  - [ComfyUI_IPAdapter_plus](https://github.com/cubiq/ComfyUI_IPAdapter_plus) — IPAdapterAdvanced, IPAdapterModelLoader
  - [ComfyUI-Impact-Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) — FaceDetailer
  - [ComfyUI-Impact-Subpack](https://github.com/ltdrdata/ComfyUI-Impact-Subpack) — UltralyticsDetectorProvider
  - [ComfyUI_UltimateSDUpscale](https://github.com/ssitu/ComfyUI_UltimateSDUpscale) — UltimateSDUpscale
- **모델 파일** (ComfyUI `models` 폴더 아래, 파일 이름을 아래와 똑같이)

  | 넣을 폴더 | 워크플로가 찾는 이름 | 받는 곳 (원래 파일 이름 그대로 넣어도 됨) |
  |---|---|---|
  | `checkpoints` | `waiIllustriousSDXL_v170.safetensors` | [WAI-illustrious-SDXL (Civitai)](https://civitai.com/models/827184) — v17.0 (`WAI-Nsfw-Illustrious-17`) |
  | `loras` | `il_saturation_slider.safetensors` · `il_color_temp_slider_d1.safetensors` | [IL Slider \| Tweaker (Civitai)](https://civitai.com/models/1093089) — saturation (`il_saturation_slider_d1`) · color_temp (`il_color_temp_slider_d1`) 판 |
  | `loras` | `Apocryphal-Pastel-IL_V18.safetensors` | [Apocryphal - Pastel Style (Civitai)](https://civitai.com/models/546281) — IL \| V1.8 판 (`HerrscherAGGA2025_Apocryphal-ULTMT-IL_V2`) |
  | `loras` | `smooth-lighting-enhancer-noobai-illustrious.safetensors` | [Smooth Lighting Enhancer (Civitai)](https://civitai.com/models/1204179) (`SLE_v2` 또는 `Smooth_Lighting_Enhancer`) |
  | `ipadapter` | `noobIPAMARK1_mark1.safetensors` | [NOOB-IPA-MARK1 (Civitai)](https://civitai.com/models/1000401) (`NOOB-IPA-MARK1`) · [Hugging Face 사본](https://huggingface.co/subby2006/noob-ipa) |
  | `clip_vision` | `CLIP-ViT-bigG-14-laion2B-39B-b160k.safetensors` | [h94/IP-Adapter — sdxl_models/image_encoder/model.safetensors](https://huggingface.co/h94/IP-Adapter/blob/main/sdxl_models/image_encoder/model.safetensors) → **받은 뒤 왼쪽 이름으로 바꾸기** |
  | `upscale_models` | `4x-AnimeSharp.safetensors` | [Kim2091/AnimeSharp (Hugging Face)](https://huggingface.co/Kim2091/AnimeSharp) · [OpenModelDB](https://openmodeldb.info/models/4x-AnimeSharp) (`4x-AnimeSharp.pth`) |
  | `background_removal` | `birefnet.safetensors` | [Comfy-Org/BiRefNet (Hugging Face)](https://huggingface.co/Comfy-Org/BiRefNet/blob/main/background_removal/birefnet.safetensors) — 편집 탭 누끼용 (선택) |
  | `ultralytics\bbox` | `anime_face_detect_v1.4_s.pt` | [deepghs/anime_face_detection — face_detect_v1.4_s/model.pt](https://huggingface.co/deepghs/anime_face_detection/blob/main/face_detect_v1.4_s/model.pt) → **받은 뒤 왼쪽 이름으로 바꾸기** |

  - **이름 자동 맞춤:** 앱 화면을 열면 ComfyUI에 있는 모델 목록을 보고, 워크플로가 찾는 파일이 없으면 괄호 안의 원래 파일 이름이나 확장자만 다른 같은 이름(`4x-AnimeSharp.pth` 등)으로 워크플로를 고칩니다. 그래서 Civitai·AnimeSharp 파일은 받은 이름 그대로 넣어도 됩니다.
  - CLIP Vision(`model.safetensors`)과 얼굴 검출(`model.pt`)은 이름이 너무 흔해서 자동으로 맞추지 않습니다. 왼쪽 이름으로 바꿔 넣으세요.- **태그 데이터:** a1111-sd-webui-tagcomplete(MIT) — `TAGDATA_LICENSE.txt`
## 빌드 (개발용)

```
& .\patch\make.ps1 -Ver 1.9.17
```
`patch\BooruComfy_v1.6.1.exe`(원본)에 `patch\*.js` 모듈을 넣어 `Ghost_v1.9.1.exe`를 만듭니다.
화풍 모듈(`pastel.js`·`artists.js`·`artists_pixiv.js`·`bluenight.js`)과 `regen.js`는 Little Light(`Desktop\LittleLight\patch`)와 같은 파일입니다. 한쪽을 고치면 다른 쪽에도 복사하세요.

---
# (예전 기록) BooruComfy v1.6.1

Danbooru 태그 기반 프롬프트 도우미 + ComfyUI 연동 도구 (Windows 단일 실행 파일)

## 실행

1. ComfyUI(Comfy Desktop 포함)를 먼저 실행합니다.
2. `BooruComfy.exe`를 더블클릭하면 브라우저에 `http://127.0.0.1:7865`가 열립니다.
   - 콘솔 창을 닫으면 프로그램이 종료됩니다.
   - 처음 실행 시 Windows SmartScreen 경고가 뜨면 "추가 정보 → 실행"을 누르세요 (서명되지 않은 exe라서 뜨는 경고).
3. ComfyUI 주소는 자동 탐지합니다 (설정값 → 127.0.0.1:8000(Comfy Desktop) → 127.0.0.1:8188). 다르면 설정 탭에서 지정하세요.

## v1.6.1 변경 사항

- 백신(Windows Defender) 오탐 줄이기: 브라우저·폴더 열기를 `rundll32` 대신 Windows 표준 API(ShellExecute)로 변경,
  디버그 정보를 지우지 않고 빌드. 기능 변화 없음.

## v1.6.0 변경 사항

- **기본 캐릭터 선택지 추가**: 긍정 프롬프트 위 `기본 캐릭터 ▾`에서 고르기
  - `마녀 (원본)` — RefStyle_IPAdapter 원문 그대로 (세로 832×1216으로 크기도 맞춤)
  - `마녀 (장소·솔로 제외)` — 원본에서 `solo`와 장소 태그(indoors, tavern, bar counter, bottles, shelves,
    wooden floor, window, sunlight, light rays, detailed background)를 뺀 버전. 다른 배경이나
    여러 인물 프롬프트에 섞어 쓰기 좋고, 크기는 현재 워크플로 설정을 유지
  - 두 가지 모두 프리셋 목록에도 등록

## v1.5.0 변경 사항

- **5인용 워크플로 추가** (둘 다 ComfyUI 연동, 1344×768 가로 구도)
  - `[5인] WhiteUniform_Party_5people` — 흰 제복 장교 5인 (여 2, 남 3)
  - `[5인] Party_5people` — 마녀가 포함된 모험가 파티 5인 (IP-Adapter 0.5)
- 워크플로 목록에 인원 표시: `[1인]`, `[2인]`, `[5인]`
- **워크플로별 프롬프트 기억**: 워크플로를 바꾸면 그 워크플로에서 마지막으로 쓴 프롬프트로 바뀝니다.
  처음 고르는 워크플로는 그 워크플로 파일의 원래 프롬프트(인물별 BREAK 블록)로 시작합니다.

## v1.4.0 변경 사항

- **기본 워크플로 = `Claude_Anime_RefStyle_IPAdapter` (ComfyUI 연동)** — 마녀 캐릭터를 처음 만든 워크플로
  (WAI Illustrious v17, 채도 +0.5, 색온도 +0.3, IP-Adapter 0.9 style transfer + `ref_witch.png`, FaceDetailer, 1.5배 업스케일)
- **시드 31415 고정**: 처음 실행 시 "매번 랜덤"이 꺼진 상태로 31415가 들어가며,
  KSampler(5)·FaceDetailer(8)·UltimateSDUpscale(10) 세 곳에 같은 시드가 적용됩니다.
  시드 옆 `31415` 버튼으로 언제든 다시 고정할 수 있습니다.
- `Claude_Anime_WhiteUniform_Duo_2people`도 계속 등록되어 있어 워크플로 목록에서 고를 수 있습니다.

## v1.2.0 변경 사항

- **기본 프롬프트 = 예전에 함께 만든 마녀 캐릭터** (ComfyUI `Claude_Anime_RefStyle_IPAdapter` 워크플로의 긍정/부정 프롬프트 원문)
  - 처음 실행할 때 이 프롬프트와 832×1216(세로) 크기로 시작합니다.
  - "기본 캐릭터" 버튼으로 언제든 다시 불러올 수 있고, 프리셋 목록에도 등록됩니다.
  - "워크플로 원본" 버튼은 선택한 워크플로 파일에 저장된 원래 프롬프트(흰 제복 2인)를 불러옵니다.
  - 참고: 원래 이미지는 IP-Adapter(가중치 0.9, `ref_witch.png`)가 켜진 워크플로에서 나왔고,
    Duo 워크플로는 IP-Adapter가 0이라 그림체가 완전히 같지는 않을 수 있습니다.

## v1.1.0 변경 사항

- **기본 워크플로 = `Claude_Anime_WhiteUniform_Duo_2people` (ComfyUI 연동)**
  - ComfyUI `Claude` 인스턴스의 `user/default/workflows/api/Claude_Anime_WhiteUniform_Duo_2people_api.json`을
    생성할 때마다 다시 읽어서 사용합니다. ComfyUI에서 워크플로를 고친 뒤 API 파일로 다시 저장하면 바로 반영됩니다.
    (ComfyUI에서 읽지 못하면 내장 사본 사용)
  - 긍정 = 노드 2, 부정 = 노드 3. 시드는 KSampler(5)·FaceDetailer(8)·UltimateSDUpscale(10)에 같은 값 적용.
  - 체크포인트(1), 크기·배치(4), 스텝·CFG·샘플러·스케줄러(5)는 생성 탭에서 바꿀 수 있고,
    LoRA·IPAdapter·FaceDetailer·업스케일 등 나머지는 워크플로 설정 그대로 실행됩니다.
  - "워크플로 기본값" 버튼: 워크플로에 저장된 원래 프롬프트(인물별 BREAK 블록)를 불러옴.
- **BREAK 지원**: BREAK로 나뉜 인물 블록을 칩에서 줄 단위로 구분 표시, BREAK 뒤에서도 자동완성,
  중복 제거는 블록별로 (두 인물에 같은 태그가 있어도 유지).
- **ComfyUI 인스턴스 자동 선택**: 8188/8000 둘 다 켜져 있으면 이 워크플로가 있는 인스턴스(Claude)를 우선 연결.
- **워크플로 탭 → ComfyUI 저장 워크플로 연동**: 다른 API 형식 워크플로도 목록에서 골라 연동 가능.
- 자동완성이 내장 목록 결과를 먼저 즉시 보여주고, 필요할 때만 온라인 결과를 덧붙임.

## 기능

- **태그 자동완성**: 내장 Danbooru 태그 약 14만 개 (게시물 수 순, 별칭 검색, 단어 중간 매칭).
  내장 목록에서 결과가 부족하면 Danbooru API로 온라인 보완 (`web` 표시).
  - Tab/Enter 삽입, ↑↓ 이동, Esc 닫기
  - 언더스코어→공백 변환, 괄호 이스케이프 `\(\)` (설정에서 변경)
- **가중치 편집**: Ctrl+↑/↓ (커서 위치 태그 ±0.05), 칩에 마우스를 올려 − / + / ×, Alt+휠.
  칩 드래그로 순서 변경, Ctrl+클릭으로 Danbooru 위키 열기. 칩 색 = 카테고리(일반/작가/작품/캐릭터/메타).
- **프리셋**: 긍정·부정 프롬프트 묶음 저장/불러오기/덧붙이기.
- **생성**: 기본 txt2img 워크플로 내장 (체크포인트, 크기, 스텝, CFG, 샘플러, 스케줄러, Clip skip, 배치, 시드).
  진행률·미리보기 실시간 표시, 중단 버튼, Ctrl+Enter 생성.
- **내 워크플로**: ComfyUI에서 `Workflow → Export (API)`로 저장한 JSON을 가져와
  긍정/부정 프롬프트·시드 입력을 지정하면 그 워크플로로 생성 (LoRA, 업스케일 등 자유롭게 구성 가능).
- **갤러리/기록**: 생성한 이미지와 프롬프트·설정 기록. 프롬프트(+설정) 다시 불러오기, 이미지로 태그 추출.
- **이미지 → 태그**: ComfyUI의 WD14 Tagger 커스텀 노드로 태그 추출 후 프롬프트에 추가.
  - 필요: ComfyUI Manager에서 `ComfyUI-WD14-Tagger` (pythongosssss) 설치 후 ComfyUI 재시작.
  - 첫 실행 시 태거 모델을 내려받으므로 시간이 걸릴 수 있습니다.

## 데이터

exe 옆 `BooruComfy_data` 폴더에 저장됩니다.

| 파일 | 내용 |
|---|---|
| settings.json | 설정 |
| presets.json | 프리셋 |
| history.json | 생성 기록 (최대 3000개) |
| workflows/ | 가져온 워크플로 |
| images/ | 생성 이미지 사본 (설정에서 끌 수 있음) |

## 실행 옵션

```
BooruComfy.exe -port 7865 -no-browser -data D:\BooruData
```

## 소스에서 빌드

Go 1.22 이상, 외부 의존성 없음 (표준 라이브러리만 사용).

```
go build -trimpath -ldflags "-s -w" -o BooruComfy.exe .
```

## 라이선스

- 내장 태그 데이터: [a1111-sd-webui-tagcomplete](https://github.com/DominikDoom/a1111-sd-webui-tagcomplete) (MIT) — `TAGDATA_LICENSE.txt`

## 만든 사람

Eun_ — 이 프로젝트는 Anthropic의 Claude(Claude Code)의 도움을 받아 만들었습니다.

## 알려 둘 점

개인이 만들어 쓰는 프로그램이라 **오류가 있을 수 있습니다.** 쓰다가 문제가 생기면 [Issues](https://github.com/Eun-little-light/Ghost/issues)에 알려 주세요. 생성한 그림과 데이터는 따로 백업해 두는 것을 권합니다.

