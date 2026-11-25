# 빌드 없이 대사 업데이트:  & .\patch\hot.ps1
#  대사 데이터 모듈(hunt*.js)을 하나로 묶어 BooruComfy_data\images\_ghost_hot_lines.json 에 씀
#  → 켜져 있는 Ghost가 10초 안에 알아채고 대사만 새로 불러옴 (진행 중인 생성 · 선택 · 갤러리는 그대로)
#  make.ps1도 빌드할 때 같은 스탬프로 이 파일을 만듦 (새 exe와 내용이 같으면 다시 적용하지 않음)
param([string]$Stamp = "")
$P = $PSScriptRoot
$App = Split-Path $P -Parent
$mods = @("huntlines", "huntlines2", "huntlines3", "huntctx", "huntnarr", "huntacts", "huntboth", "huntway", "huntfore", "huntpose", "huntvoice", "huntmore", "huntgen", "huntinner", "huntgen2", "huntgen3", "huntlatent", "huntreal", "huntparty", "huntrel", "huntsitu", "huntdatetoy", "huntmore2", "huntforefin", "huntcall", "huntxx", "huntchange", "huntcycle", "huntrebound", "huntsitu2")
if (-not $Stamp) { $Stamp = "hot-" + (Get-Date -Format "yyyyMMdd-HHmmss") }
$list = @()
foreach ($m in $mods) {
  $f = "$P\$m.js"
  if (Test-Path $f) { $list += [ordered]@{ n = $m; c = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) } }
}
$obj = [ordered]@{ stamp = $Stamp; time = (Get-Date -Format "MM-dd HH:mm"); mods = $list }
$json = $obj | ConvertTo-Json -Depth 5 -Compress
$dir = "$App\BooruComfy_data\images"
[IO.Directory]::CreateDirectory($dir) | Out-Null
[IO.File]::WriteAllText("$dir\_ghost_hot_lines.json", $json, (New-Object Text.UTF8Encoding $false))
"대사 업데이트 파일: $($list.Count)개 모듈 · $Stamp → 켜져 있는 Ghost에 10초 안에 적용됨"
