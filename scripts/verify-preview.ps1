$root = 'C:\Users\PC\Downloads\china-direct-site-v1-working'
$disk = Join-Path $root 'index.html'
$served = Join-Path $env:TEMP 'preview-index.html'

curl.exe -s http://127.0.0.1:5500/index.html -o $served

Write-Host "=== SERVER PROCESS ==="
Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    [PSCustomObject]@{
        Port = $_.LocalPort
        PID = $_.OwningProcess
        Process = $proc.ProcessName
    }
}

Write-Host ""
Write-Host "=== DISK FILE ($disk) ==="
$diskText = Get-Content $disk -Raw -Encoding UTF8
Write-Host "bytes: $((Get-Item $disk).Length)"
Write-Host "project cards (data-open-project): $(([regex]::Matches($diskText, 'data-open-project')).Count)"
Write-Host "gallery markup (project-gallery): $(([regex]::Matches($diskText, 'project-gallery')).Count)"
Write-Host "RA Design attribution: $($diskText -match 'RA Design')"
Write-Host "project-01 cover path: $($diskText -match 'assets/projects/project-01/cover.jpg')"

Write-Host ""
Write-Host "=== SERVED FILE ($served) ==="
if (Test-Path $served) {
    $servedText = Get-Content $served -Raw -Encoding UTF8
    Write-Host "bytes: $((Get-Item $served).Length)"
    Write-Host "project cards (data-open-project): $(([regex]::Matches($servedText, 'data-open-project')).Count)"
    Write-Host "gallery markup (project-gallery): $(([regex]::Matches($servedText, 'project-gallery')).Count)"
    Write-Host "RA Design attribution: $($servedText -match 'RA Design')"
    Write-Host "project-01 cover path: $($servedText -match 'assets/projects/project-01/cover.jpg')"
    Write-Host "files_match: $($diskText -eq $servedText)"
} else {
    Write-Host "FAILED to download served index.html"
}

Write-Host ""
Write-Host "=== SERVE SCRIPT ROOT ==="
$serveScript = Join-Path $root 'scripts\serve-static.ps1'
Select-String -Path $serveScript -Pattern 'Resolve-Path' | ForEach-Object { $_.Line.Trim() }
