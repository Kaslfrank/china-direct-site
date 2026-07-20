$projects = Get-Content (Join-Path $PSScriptRoot 'ra-projects.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$tmp = Join-Path $env:TEMP 'ra-audit'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

function Get-Images($html) {
    $matches = [regex]::Matches($html, 'data-original="(https://static\.tildacdn\.com/[^"]+)"')
    $urls = @(); $seen = @{}
    foreach ($m in $matches) {
        $u = $m.Groups[1].Value
        if ($u -match 'noroot\.png$') { continue }
        if (-not $seen.ContainsKey($u)) { $seen[$u] = $true; $urls += $u }
    }
    return $urls
}

$homePath = Join-Path $env:TEMP 'ra-home.html'
if (-not (Test-Path $homePath)) { curl.exe -sL https://ra-designe.ru/ -o $homePath }
$homeHtml = [IO.File]::ReadAllText($homePath)

$realizedStart = $homeHtml.IndexOf('rec313030359')
$realizedEnd = $homeHtml.IndexOf('rec313032026', $realizedStart)
if ($realizedEnd -lt 0) { $realizedEnd = $homeHtml.Length }
$realizedSection = $homeHtml.Substring($realizedStart, $realizedEnd - $realizedStart)
$realizedImages = Get-Images $realizedSection

$resStart = $homeHtml.IndexOf('rec313016845')
$resEnd = $homeHtml.IndexOf('rec365857027', $resStart)
$residentialSection = $homeHtml.Substring($resStart, $resEnd - $resStart)

Write-Host "REALIZED_SECTION_IMAGES=$($realizedImages.Count)"

$results = @()
foreach ($p in $projects) {
    $slug = ($p.url -replace '.*/','')
    $file = Join-Path $tmp "$slug.html"
    curl.exe -sL $p.url -o $file
    Start-Sleep -Milliseconds 350
    $html = [IO.File]::ReadAllText($file)
    $images = Get-Images $html
    $overlap = @($images | Where-Object { $realizedImages -contains $_ })
    $title = ([regex]::Match($html, '<title>([^<]+)</title>')).Groups[1].Value.Trim()
    $desc = ([regex]::Match($html, 'meta name="description" content="([^"]*)"')).Groups[1].Value.Trim()

    $inResidentialCards = $residentialSection -match [regex]::Escape("/$slug")
    $has3dMarker = $html -match '(?i)3d|render|cgi|visualiz'
    $hasRealizedMarker = $html -match '(?i)realiz|completed interior|photo of'

    $classification = 'UNCERTAIN'
    $reason = @()
    if ($overlap.Count -gt 0) {
        $classification = 'REAL PHOTOGRAPHY'
        $reason += "overlap_with_realized_section=$($overlap.Count)"
    }
    elseif ($inResidentialCards -and $overlap.Count -eq 0) {
        $classification = '3D VISUALIZATION'
        $reason += 'residential_project_card_no_realized_section_overlap'
    }
    elseif ($has3dMarker -and -not $hasRealizedMarker) {
        $classification = '3D VISUALIZATION'
        $reason += 'page_contains_3d_visualization_markers'
    }
    else {
        $reason += 'no_realized_section_overlap_and_no_explicit_realized_label'
    }

    $results += [PSCustomObject]@{
        Title = $p.title
        Url = $p.url
        PageTitle = $title
        Description = $desc
        Classification = $classification
        ProjectPageImages = $images.Count
        ConfirmedRealPhotos = $overlap.Count
        InResidentialCards = $inResidentialCards
        Reason = ($reason -join '; ')
    }
}

$results | Format-Table -AutoSize
$out = Join-Path $tmp 'audit-results.json'
$results | ConvertTo-Json -Depth 4 | Set-Content $out -Encoding UTF8
Write-Host "JSON=$out"
