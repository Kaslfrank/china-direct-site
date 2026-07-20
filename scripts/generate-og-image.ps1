Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root 'hero-penthouse.jpg'
$destDir = Join-Path $root 'assets'
$dest = Join-Path $destDir 'og-image.jpg'
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$targetW = 1200
$targetH = 630

$srcImg = [System.Drawing.Image]::FromFile($src)
try {
    $srcW = $srcImg.Width
    $srcH = $srcImg.Height
    Write-Host "Source: ${srcW}x${srcH}"

    $scale = [Math]::Max($targetW / $srcW, $targetH / $srcH)
    $scaledW = [int][Math]::Round($srcW * $scale)
    $scaledH = [int][Math]::Round($srcH * $scale)

    $scaled = New-Object System.Drawing.Bitmap $scaledW, $scaledH
    $gScale = [System.Drawing.Graphics]::FromImage($scaled)
    $gScale.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gScale.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $gScale.DrawImage($srcImg, 0, 0, $scaledW, $scaledH)
    $gScale.Dispose()

    $offsetX = [int][Math]::Round(($scaledW - $targetW) / 2)
    $offsetY = [int][Math]::Round(($scaledH - $targetH) / 2)

    $out = New-Object System.Drawing.Bitmap $targetW, $targetH
    $gOut = [System.Drawing.Graphics]::FromImage($out)
    $gOut.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gOut.DrawImage($scaled, -$offsetX, -$offsetY)
    $gOut.Dispose()
    $scaled.Dispose()

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]88)
    $out.Save($dest, $codec, $encParams)
    $out.Dispose()

    $info = Get-Item $dest
    Write-Host "Saved: $dest ($($info.Length) bytes)"
}
finally {
    $srcImg.Dispose()
}
