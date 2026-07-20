$root = Join-Path $PSScriptRoot '..'
$files = Get-ChildItem (Join-Path $root 'assets\projects') -Recurse -File | Sort-Object FullName
foreach ($f in $files) {
    $rel = $f.FullName.Substring($root.Length + 1) -replace '\\','/'
    $kb = [math]::Round($f.Length / 1KB, 1)
    Write-Output "$rel`t$kb KB"
}
Write-Output ""
Write-Output "TOTAL: $($files.Count) files, $([math]::Round(($files | Measure-Object Length -Sum).Sum / 1MB, 2)) MB"
