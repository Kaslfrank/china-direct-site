param(
    [int]$Port = 8080,
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
try {
    $listener.Start()
}
catch {
    Write-Error "Cannot listen on $prefix`: $($_.Exception.Message)"
    Write-Host "Port may be in use. Try: .\scripts\serve-static.ps1 -Port 8766"
    exit 1
}

Write-Host "Serving $Root"
Write-Host "Local URL: $prefix"
Write-Host "Press Ctrl+C to stop."

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.png'  = 'image/png'
    '.webp' = 'image/webp'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
    '.xml'  = 'application/xml; charset=utf-8'
    '.webmanifest' = 'application/manifest+json; charset=utf-8'
}

function Send-Response {
    param(
        [System.Net.HttpListenerResponse]$Response,
        [int]$StatusCode,
        [byte[]]$Body,
        [string]$ContentType = 'text/plain; charset=utf-8'
    )
    $Response.StatusCode = $StatusCode
    $Response.ContentType = $ContentType
    $Response.ContentLength64 = $Body.Length
    $Response.OutputStream.Write($Body, 0, $Body.Length)
    $Response.OutputStream.Close()
}

function Test-SafePath([string]$fullPath) {
    $rootFull = [IO.Path]::GetFullPath($Root)
    $normalized = [IO.Path]::GetFullPath($fullPath)
    return $normalized.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase)
}

function Get-LocalPath([string]$absolutePath) {
    $path = [System.Uri]::UnescapeDataString($absolutePath.TrimStart('/')).TrimEnd('/')
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
    $relative = $path -replace '/', [IO.Path]::DirectorySeparatorChar

    $candidates = @(
        (Join-Path $Root $relative),
        (Join-Path (Join-Path $Root 'public') $relative)
    )

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate -PathType Leaf) {
            return $candidate
        }

        if (Test-Path $candidate -PathType Container) {
            $indexInDir = Join-Path $candidate 'index.html'
            if (Test-Path $indexInDir -PathType Leaf) {
                return $indexInDir
            }
        }

        $indexPath = Join-Path $candidate 'index.html'
        if (Test-Path $indexPath -PathType Leaf) {
            return $indexPath
        }
    }

    return Join-Path $Root $relative
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
        $localPath = Get-LocalPath $request.Url.AbsolutePath
        $fullPath = [IO.Path]::GetFullPath($localPath)

        if (-not (Test-SafePath $fullPath)) {
            Send-Response -Response $response -StatusCode 403 -Body ([Text.Encoding]::UTF8.GetBytes('403 Forbidden'))
            continue
        }

        if (-not (Test-Path $fullPath -PathType Leaf)) {
            Send-Response -Response $response -StatusCode 404 -Body ([Text.Encoding]::UTF8.GetBytes('404 Not Found'))
            continue
        }

        $ext = [IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
        $bytes = [IO.File]::ReadAllBytes($fullPath)
        Send-Response -Response $response -StatusCode 200 -Body $bytes -ContentType $contentType
    }
    catch {
        try {
            Send-Response -Response $response -StatusCode 500 -Body ([Text.Encoding]::UTF8.GetBytes('500 Internal Server Error'))
        }
        catch {
            $response.OutputStream.Close()
        }
    }
}
