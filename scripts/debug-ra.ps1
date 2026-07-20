$h = [IO.File]::ReadAllText("$PSScriptRoot\..\_ra-designe.html")
Write-Host "Length: $($h.Length)"
Write-Host "Residential marker: $($h.IndexOf('ПРОЕКТЫ жилых'))"
Write-Host "Card links: $(([regex]::Matches($h, 't-card__link')).Count)"
$sample = [regex]::Match($h, 'data-original="(https://static\.tildacdn\.com/[^"]+)"[\s\S]{0,2000}?class="t-card__link"[\s\S]{0,500}?href="([^"]+)"')
Write-Host "Sample match: $($sample.Success)"
if ($sample.Success) {
    Write-Host "Cover: $($sample.Groups[1].Value)"
    Write-Host "Link: $($sample.Groups[2].Value)"
}
