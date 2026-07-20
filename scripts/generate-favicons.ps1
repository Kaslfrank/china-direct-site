Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$logoPath = Join-Path $root 'logo.png'

function Save-Icon {
    param(
        [System.Drawing.Image]$Source,
        [int]$Size,
        [string]$Dest
    )
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $padding = [int]($Size * 0.08)
    $inner = $Size - (2 * $padding)
    $g.DrawImage($Source, $padding, $padding, $inner, $inner)
    $g.Dispose()
    $bmp.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$logo = [System.Drawing.Image]::FromFile($logoPath)
try {
    Save-Icon $logo 16 (Join-Path $root 'favicon-16x16.png')
    Save-Icon $logo 32 (Join-Path $root 'favicon-32x32.png')
    Save-Icon $logo 180 (Join-Path $root 'apple-touch-icon.png')

    # favicon.ico from 32px png
    $ico32 = [System.Drawing.Image]::FromFile((Join-Path $root 'favicon-32x32.png'))
    $icoPath = Join-Path $root 'favicon.ico'
    $ico32.Save($icoPath, [System.Drawing.Imaging.ImageFormat]::Icon)
    $ico32.Dispose()
    Write-Host 'Created favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, favicon.ico'
}
finally {
    $logo.Dispose()
}
