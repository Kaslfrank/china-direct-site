$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$input = Join-Path $root 'assets\geography\land-110m.json'
$output = Join-Path $root 'assets\geography\world-land.svg'

$topo = Get-Content $input -Raw | ConvertFrom-Json
$scale = $topo.transform.scale
$translate = $topo.transform.translate
$width = 1000
$height = 500

function Get-ProjectedPoint([double]$x, [double]$y) {
    $lon = $x * $scale[0] + $translate[0]
    $lat = $y * $scale[1] + $translate[1]
    $svgX = [math]::Round((($lon + 180) / 360) * $width, 2)
    $svgY = [math]::Round(((90 - $lat) / 180) * $height, 2)
    return ,@($svgX, $svgY)
}

function Get-ArcPoints([int]$arcIndex) {
    $reverse = $arcIndex -lt 0
    $index = [math]::Abs($arcIndex) - 1
    $arc = $topo.arcs[$index]
    $x = 0.0
    $y = 0.0
    $points = New-Object System.Collections.Generic.List[object]

    foreach ($delta in $arc) {
        $x += [double]$delta[0]
        $y += [double]$delta[1]
        $points.Add((Get-ProjectedPoint $x $y)) | Out-Null
    }

    if ($reverse) { [array]::Reverse($points) }
    return $points
}

function Get-RingPath($ring) {
    $path = New-Object System.Text.StringBuilder
    $started = $false

    foreach ($arcIndex in $ring) {
        $points = Get-ArcPoints ([int]$arcIndex)
        for ($i = 0; $i -lt $points.Count; $i++) {
            $px = $points[$i][0]
            $py = $points[$i][1]
            if (-not $started) {
                [void]$path.Append("M$px,$py")
                $started = $true
            }
            elseif ($i -eq 0) {
                [void]$path.Append("M$px,$py")
            }
            else {
                [void]$path.Append("L$px,$py")
            }
        }
    }

    [void]$path.Append('Z')
    return $path.ToString()
}

function Get-CityPoint($lon, $lat) {
    $svgX = [math]::Round((($lon + 180) / 360) * $width, 2)
    $svgY = [math]::Round(((90 - $lat) / 180) * $height, 2)
    return ,@($svgX, $svgY)
}

function Get-RoutePath($from, $to, [double]$bulge) {
    $x1 = $from[0]; $y1 = $from[1]
    $x2 = $to[0]; $y2 = $to[1]
    $mx = ($x1 + $x2) / 2
    $my = ($y1 + $y2) / 2
    $dx = $x2 - $x1
    $dy = $y2 - $y1
    $dist = [math]::Sqrt($dx * $dx + $dy * $dy)
    $cx = [math]::Round($mx, 2)
    $cy = [math]::Round($my - ($dist * $bulge), 2)
    return "M$x1,$y1 Q$cx,$cy $x2,$y2"
}

function Get-DotRect($point, $size) {
    $half = $size / 2
    $x = [math]::Round($point[0] - $half, 2)
    $y = [math]::Round($point[1] - $half, 2)
    return "x=`"$x`" y=`"$y`" width=`"$size`" height=`"$size`""
}

$paths = New-Object System.Collections.Generic.List[string]
foreach ($geometry in $topo.objects.land.geometries) {
    foreach ($polygon in $geometry.arcs) {
        foreach ($ring in $polygon) {
            $paths.Add((Get-RingPath $ring)) | Out-Null
        }
    }
}

$gz = Get-CityPoint 113.2644 23.1291
$destinations = @(
    @{ id = 'moscow'; point = (Get-CityPoint 37.6173 55.7558); bulge = 0.2 }
    @{ id = 'dubai'; point = (Get-CityPoint 55.2708 25.2048); bulge = 0.05 }
    @{ id = 'newyork'; point = (Get-CityPoint ([double]-74.006) 40.7128); bulge = 0.28 }
    @{ id = 'london'; point = (Get-CityPoint ([double]-0.1278) 51.5074); bulge = 0.16 }
)

$routeMarkup = ($destinations | ForEach-Object {
    $route = Get-RoutePath $gz $_.point $_.bulge
    $dot = Get-DotRect $_.point 7
    @"
    <g class="geo-link" data-city="$($_.id)">
      <path class="geo-route" d="$route"/>
      <rect class="geo-dot" $dot/>
    </g>
"@
}) -join "`n"

$hubDot = Get-DotRect $gz 8

$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $width $height" fill="none" aria-hidden="true">
  <style>
    .geo-land { stroke: #D4CEC6; stroke-width: 0.75; fill: none; stroke-linejoin: round; stroke-linecap: round; }
    .geo-route { fill: none; stroke: rgba(196, 178, 148, 0.34); stroke-width: 0.95; transition: stroke 0.5s ease, stroke-width 0.5s ease; }
    .geo-link:hover .geo-route { stroke: rgba(184, 169, 144, 0.78); stroke-width: 1.2; }
    .geo-dot { fill: #A89878; stroke: rgba(255, 255, 255, 0.55); stroke-width: 0.75; transition: fill 0.5s ease; }
    .geo-link:hover .geo-dot { fill: #8D806F; }
    .geo-dot--hub { fill: #8D806F; }
  </style>
  <rect width="$width" height="$height" fill="#FFFFFF"/>
  <g class="geo-land">
$(($paths | ForEach-Object { "    <path d=`"$_`"/>" }) -join "`n")
  </g>
  <g class="geo-links">
$routeMarkup
  </g>
  <g class="geo-points">
    <rect class="geo-dot geo-dot--hub" $hubDot/>
  </g>
</svg>
"@

Set-Content -Path $output -Value $svg -Encoding UTF8
Write-Host "Generated $output with $($paths.Count) land paths."
