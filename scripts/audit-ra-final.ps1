$root = Split-Path $PSScriptRoot -Parent
$projects = Get-Content (Join-Path $PSScriptRoot 'ra-projects.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$manifest = Import-Csv (Join-Path $root 'assets\projects\download-manifest.csv')

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

# Realized photos gallery blocks
$realizedStart = $homeHtml.IndexOf('rec313031279')
$realizedEnd = $homeHtml.IndexOf('rec313032026', $realizedStart)
if ($realizedEnd -lt 0) { $realizedEnd = $homeHtml.Length }
$realizedSection = $homeHtml.Substring($realizedStart, $realizedEnd - $realizedStart)
$realizedSet = [System.Collections.Generic.HashSet[string]]::new()
foreach ($u in (Get-Images $realizedSection)) { [void]$realizedSet.Add($u) }

$resStart = $homeHtml.IndexOf('rec313016845')
$resEnd = $homeHtml.IndexOf('rec365857027', $resStart)
$residentialSection = $homeHtml.Substring($resStart, $resEnd - $resStart)

Write-Host "REALIZED_GALLERY_IMAGES=$($realizedSet.Count)"

foreach ($p in $projects) {
    $slug = ($p.url -replace '.*/','')
    $projKey = "project-$($p.num)"
    $importedSources = $manifest | Where-Object { $_.Project -eq $projKey } | ForEach-Object { $_.Source }
    $importedOverlap = @($importedSources | Where-Object { $realizedSet.Contains($_) })

    $pageFile = Join-Path $env:TEMP "ra-audit-$slug.html"
    curl.exe -sL $p.url -o $pageFile
    Start-Sleep -Milliseconds 300
    $pageHtml = [IO.File]::ReadAllText($pageFile)
    $pageImages = Get-Images $pageHtml
    $pageOverlap = @($pageImages | Where-Object { $realizedSet.Contains($_) })

    $title = ([regex]::Match($pageHtml, '<title>([^<]+)</title>')).Groups[1].Value.Trim()
    $desc = ([regex]::Match($pageHtml, 'meta name="description" content="([^"]*)"')).Groups[1].Value.Trim()
    $inResidential = $residentialSection.Contains("/$slug")

    $confirmed = [Math]::Max($importedOverlap.Count, $pageOverlap.Count)
    $classification = 'UNCERTAIN'
    $reason = ''

    if ($confirmed -gt 0) {
        $classification = 'REAL PHOTOGRAPHY'
        $reason = 'Confirmed by URL overlap with homepage gallery FOTO REALIZOVANNYKH OB EKTOV (rec313031279)'
    }
    elseif ($inResidential) {
        $classification = '3D VISUALIZATION'
        $reason = 'Listed in PROEKTY zhilykh intererov portfolio; zero overlap with FOTO REALIZOVANNYKH section; RA Design presents these as interior design project pages'
    }
    else {
        $reason = 'No FOTO REALIZOVANNYKH overlap; project placement on RA site unclear'
    }

    Write-Host "---"
    Write-Host "TITLE=$($p.title)"
    Write-Host "URL=$($p.url)"
    Write-Host "CLASS=$classification"
    Write-Host "CONFIRMED_REAL_PHOTOS=$confirmed"
    Write-Host "IMPORTED_IMAGES=$($importedSources.Count)"
    Write-Host "PAGE_IMAGES=$($pageImages.Count)"
    Write-Host "IN_RESIDENTIAL_CARDS=$inResidential"
    Write-Host "META=$desc"
    Write-Host "REASON=$reason"
}
