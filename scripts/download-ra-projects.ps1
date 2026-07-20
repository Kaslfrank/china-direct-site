Add-Type -AssemblyName System.Drawing

$root = Join-Path $PSScriptRoot '..'
$projects = Get-Content (Join-Path $PSScriptRoot 'ra-projects.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$assetsRoot = Join-Path $root 'assets\projects'
$tmpDir = Join-Path $PSScriptRoot '_tmp'
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

function Save-OptimizedImage {
    param(
        [string]$SourcePath,
        [string]$DestJpg,
        [int]$MaxWidth = 1920,
        [int]$Quality = 85
    )
    $img = [System.Drawing.Image]::FromFile($SourcePath)
    try {
        $ratio = [math]::Min(1.0, $MaxWidth / $img.Width)
        $newW = [int]($img.Width * $ratio)
        $newH = [int]($img.Height * $ratio)
        $bmp = New-Object System.Drawing.Bitmap $newW, $newH
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($img, 0, 0, $newW, $newH)
        $g.Dispose()
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
        $bmp.Save($DestJpg, $codec, $encParams)
        $bmp.Dispose()
        $size = (Get-Item $DestJpg).Length
        if ($size -gt 900000 -and $Quality -gt 70) {
            Save-OptimizedImage -SourcePath $SourcePath -DestJpg $DestJpg -MaxWidth $MaxWidth -Quality ($Quality - 8)
        }
        elseif ($size -lt 200000 -and $img.Width -gt 1200 -and $Quality -lt 92) {
            Save-OptimizedImage -SourcePath $SourcePath -DestJpg $DestJpg -MaxWidth ([math]::Min(2400, $MaxWidth + 200)) -Quality ($Quality + 4)
        }
    } finally {
        $img.Dispose()
    }
}

function Get-ProjectImages {
    param([string]$PageUrl)
    $tmp = Join-Path $tmpDir 'page.html'
    curl.exe -sL $PageUrl -o $tmp
    $page = [IO.File]::ReadAllText($tmp)
    $matches = [regex]::Matches($page, 'data-original="(https://static\.tildacdn\.com/[^"]+)"')
    $urls = @()
    $seen = @{}
    foreach ($m in $matches) {
        $u = $m.Groups[1].Value
        if ($u -match 'noroot\.png$') { continue }
        if (-not $seen.ContainsKey($u)) {
            $seen[$u] = $true
            $urls += $u
        }
    }
    return $urls
}

$manifest = @()

foreach ($proj in $projects) {
    $folder = Join-Path $assetsRoot "project-$($proj.num)"
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    Write-Host "=== project-$($proj.num): $($proj.slug) ==="

    $urls = Get-ProjectImages -PageUrl $proj.url
    if ($urls.Count -eq 0) {
        Write-Warning "No images for $($proj.slug)"
        continue
    }

    $galleryCount = [math]::Min(12, [math]::Max(6, $urls.Count - 1))
    $coverUrl = $urls[0]
    $galleryUrls = $urls | Select-Object -Skip 1 -First $galleryCount

    $rawCover = Join-Path $tmpDir "raw-$($proj.num)-cover"
    curl.exe -sL $coverUrl -o $rawCover
    if (Test-Path $rawCover) {
        $coverDest = Join-Path $folder 'cover.jpg'
        Save-OptimizedImage -SourcePath $rawCover -DestJpg $coverDest
        $manifest += [pscustomobject]@{ Project = "project-$($proj.num)"; File = 'cover.jpg'; Bytes = (Get-Item $coverDest).Length; Source = $coverUrl }
        Remove-Item $rawCover -Force -ErrorAction SilentlyContinue
    }

    $idx = 0
    foreach ($url in $galleryUrls) {
        $idx++
        $rawFile = Join-Path $tmpDir "raw-$($proj.num)-$idx"
        curl.exe -sL $url -o $rawFile
        if (-not (Test-Path $rawFile) -or (Get-Item $rawFile).Length -lt 1000) {
            Write-Warning "Failed download: $url"
            continue
        }
        $dest = Join-Path $folder ("{0:D2}.jpg" -f $idx)
        Save-OptimizedImage -SourcePath $rawFile -DestJpg $dest
        $manifest += [pscustomobject]@{ Project = "project-$($proj.num)"; File = (Split-Path $dest -Leaf); Bytes = (Get-Item $dest).Length; Source = $url }
        Remove-Item $rawFile -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 200
    }

    Write-Host "  cover + $idx gallery images"
    Start-Sleep -Milliseconds 400
}

$manifest | Export-Csv -Path (Join-Path $root 'assets\projects\download-manifest.csv') -NoTypeInformation -Encoding UTF8
Write-Host "Total files: $($manifest.Count)"
Write-Host "Total MB: $([math]::Round(($manifest | Measure-Object Bytes -Sum).Sum / 1MB, 2))"
