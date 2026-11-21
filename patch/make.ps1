# 사용법:  & .\patch\make.ps1 -Ver 1.9.0
# version.js(이름 Ghost · 버전 표시 · 창 제목 · 아이콘)를 만들고 원본 v1.6.1에 모든 모듈을 넣어 Ghost_v<Ver>.exe 생성
# (v1.8.3까지의 이름은 BooruComfy_v<Ver>-ios.exe — 데이터 폴더 BooruComfy_data는 그대로 씀)
# 배포용:  & .\patch\make.ps1 -Ver 1.9.0 -Dist  → 캐릭터 기본 이름 없이 빌드해 바탕화면\[Ghost][배포용.Rev.1]에 최신 버전만 남김 — 엔진은 Ghost.exe 안에 들어가 폴더엔 창 exe만 (patch\dist.ps1)
param([Parameter(Mandatory = $true)][string]$Ver, [switch]$Dist)
$P = $PSScriptRoot
$App = Split-Path $P -Parent
$js = @"
// 빌드할 때 make.ps1이 만드는 파일 — 이름 Ghost, 좌상단 로고 옆과 창 제목에 버전 표시
(() => {
  const V = "v$Ver";
  window.BC_VER = V;$(if ($Dist) { " window.LL_DIST = true;" })
  document.title = "Ghost " + V;
  const b = document.querySelector("header .brand");
  if (b) b.innerHTML = 'Ghost<small class="bc-ver">' + V + '</small>';
  const c = document.createElement("style");
  c.textContent = ".bc-ver{margin-left:6px;font-size:11px;font-weight:600;letter-spacing:0;color:var(--accent);opacity:.85;vertical-align:1px}";
  document.head.append(c);
  const ic = document.querySelector('link[rel=icon]') || document.head.appendChild(Object.assign(document.createElement("link"), { rel: "icon" }));
  ic.href = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1d1d1f"/><path d="M8 27V14a8 8 0 0 1 16 0v13l-2.7-2.2-2.6 2.2-2.7-2.2-2.7 2.2-2.6-2.2z" fill="#f5f5f7"/><circle cx="13" cy="14" r="1.8" fill="#1d1d1f"/><circle cx="19" cy="14" r="1.8" fill="#1d1d1f"/></svg>');
  // 설정 탭 '정보'의 원래 이름 표시
  let n = 0; const t = setInterval(() => { const a = document.getElementById("about"); if (a && a.innerHTML.includes("BooruComfy v")) { a.innerHTML = a.innerHTML.replace("BooruComfy v", "Ghost " + V + " (BooruComfy 엔진 v"); a.innerHTML = a.innerHTML.replace(" · 내장 태그", ") · 내장 태그"); clearInterval(t); } else if (++n > 60) clearInterval(t); }, 500);
})();
"@
[IO.File]::WriteAllText("$P\version.js", $js, (New-Object Text.UTF8Encoding $false))
$add = @("version") + $(if (-not $Dist -and (Test-Path "$P\charnames_local.js")) { @("charnames_local") } else { @() }) + @("charnames", "tidy", "picker", "presetgrid", "hat", "bust", "faceless", "queue", "fast", "charfolder", "pastel", "pastel_items", "artists_pixiv", "artists_thumbs", "artists", "bluenight", "embed", "comfysetup", "updater", "taggroups", "hitomi", "customtags", "characters", "sequence", "regen", "editor",
  "kodict1", "kodict2", "kodict3", "kodict4", "kodict5", "kodict6", "kodict7", "kodict8", "kodict9", "kodict10", "ko", "weight", "ios", "fit") | % { "$P\$_.js" }
$DistDir = [IO.Path]::Combine([Environment]::GetFolderPath("Desktop"), "[Ghost][배포용.Rev.1]")
if ($Dist) { [IO.Directory]::CreateDirectory($DistDir) | Out-Null; foreach ($f in [IO.Directory]::GetFiles($DistDir, "*.exe")) { [IO.File]::Delete($f) } }
$dst = if ($Dist) { [IO.Path]::Combine($DistDir, "Ghost_v$Ver.exe") } else { "$App\Ghost_v$Ver.exe" }
& "$P\build2.ps1" -Src "$P\BooruComfy_v1.6.1.exe" -Dst $dst -Add $add
# 전용 창 프로그램 (Ghost.exe) — 앱 exe 옆에 둠 (patch\shell\build_shell.ps1, WebView2)
$shellOut = [IO.Path]::Combine((Split-Path $dst -Parent), "Ghost.exe")
try { & "$P\shell\build_shell.ps1" -Name "Ghost" -Id Ghost -Pattern '^Ghost_v([\d.]+)\.exe$' -Hint "Ghost_v*.exe" -Port 7865 -Icon ghost -Out $shellOut -Ver $Ver -DataName BooruComfy_data -Engine $dst -Clean:$Dist; $shellOk = $true }   # 엔진은 창 exe 안에 (내 빌드도)
catch { $shellOk = $false; Write-Warning "전용 창을 만들지 못했습니다 (실행 중이면 닫고 다시): $_" }
if ($Dist) { & "$P\dist.ps1" -App $App -Name Ghost -Exe $dst -Vbs "Ghost 실행 (ComfyUI 같이).vbs" -Data BooruComfy_data; [IO.File]::Delete($dst); "엔진은 Ghost.exe 안에 들어감 → 배포 폴더에서 $([IO.Path]::GetFileName($dst)) 지움" }
# 내 빌드: 엔진은 Ghost.exe 안에 들어갔으니 폴더의 엔진 exe는 지움 (창 exe가 .engine 숨김 폴더에 풀어 씀)
if ($shellOk) { [IO.File]::Delete($dst); "엔진은 Ghost.exe 안에 들어감 → $([IO.Path]::GetFileName($dst)) 지움" }
