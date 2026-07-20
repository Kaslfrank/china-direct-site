$h = [IO.File]::ReadAllText("$PSScriptRoot\..\_ra-designe.html")

function ExtractCards($html, $startId, $endId, $sectionName) {
    $start = $html.IndexOf($startId)
    if ($start -lt 0) { return @() }
    $end = $html.IndexOf($endId, $start + $startId.Length)
    if ($end -lt 0) { $end = $html.Length }
    $section = $html.Substring($start, $end - $start)
    $pattern = 'data-original="(https://static\.tildacdn\.com/[^"]+)"[\s\S]*?href="([^"]+)"[\s\S]*?class="t-card__link"[\s\S]*?>\s*([^<]+?)\s*</a>'
    $cards = [regex]::Matches($section, $pattern)
    $results = @()
    foreach ($c in $cards) {
        $title = ($c.Groups[3].Value -replace '\s+', ' ').Trim()
        $results += [pscustomobject]@{
            Section = $sectionName
            Title = $title
            Cover = $c.Groups[1].Value
            Link = $c.Groups[2].Value
        }
    }
    return $results
}

$residential = ExtractCards $h 'rec313016845' 'rec365857027' 'Residential'
$commercial = ExtractCards $h 'rec856505128' 'rec313030359' 'Commercial'
$all = $residential + $commercial

Write-Output "=== ALL PROJECT CARDS ($($all.Count)) ==="
$i = 0
foreach ($p in $all) {
    $i++
    Write-Output "$i. [$($p.Section)] $($p.Title) | $($p.Link)"
}

Write-Output ""
Write-Output "=== IMAGE COUNTS (residential) ==="
foreach ($p in $residential) {
    $url = $p.Link
    if ($url -notmatch '^https?://') { $url = "https://ra-designe.ru$url" }
    $tmp = Join-Path $PSScriptRoot "_page-tmp.html"
    curl.exe -sL $url -o $tmp 2>$null
    if (Test-Path $tmp) {
        $page = [IO.File]::ReadAllText($tmp)
        $imgs = [regex]::Matches($page, 'data-original="(https://static\.tildacdn\.com/[^"]+)"')
        $unique = $imgs | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
        $gallery = $unique | Where-Object { $_ -notmatch 'noroot\.png$' }
        Write-Output "$($p.Title) => $($gallery.Count) images | $url"
        Remove-Item $tmp -Force
    }
    Start-Sleep -Milliseconds 400
}
