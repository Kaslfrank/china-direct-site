param(
    [int]$Port = 8080,
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Serving $Root"
Write-Host "Preview URL: ${prefix}index.html"
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

function Get-LocalPath([string]$absolutePath) {
    $path = [System.Uri]::UnescapeDataString($absolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
    return Join-Path $Root ($path -replace '/', [IO.Path]::DirectorySeparatorChar)
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
        $localPath = Get-LocalPath $request.Url.AbsolutePath
        $fullPath = [IO.Path]::GetFullPath($localPath)

        if (-not $fullPath.StartsWith($Root, [StringComparison]::OrdinalIgnoreCase)) {
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
