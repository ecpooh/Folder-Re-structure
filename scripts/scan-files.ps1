#Requires -Version 3.0
<#
.SYNOPSIS
  Recursive file inventory → CSV (streamed). Called by scan-files.bat.

.DESCRIPTION
  Read-only scan. Does not delete, move, or modify user files.
  Skips inventory CSVs named file-inventory-*.csv and _file-inventory.csv.
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $Root,

  [Parameter(Mandatory = $true)]
  [string] $OutFile
)

$ErrorActionPreference = 'Continue'

if (-not (Test-Path -LiteralPath $Root)) {
  Write-Error "Root not found: $Root"
  exit 1
}

$utf8 = New-Object System.Text.UTF8Encoding $false
$sw = New-Object System.IO.StreamWriter $OutFile, $false, $utf8

try {
  $sw.WriteLine('FullPath,FileName,Directory,Extension,SizeBytes,LastWriteTime')
  $count = [int64]0
  $errors = [int64]0
  $lastEcho = [DateTime]::UtcNow
  $outLeaf = [System.IO.Path]::GetFileName($OutFile)

  Get-ChildItem -LiteralPath $Root -Recurse -File -Force -ErrorAction SilentlyContinue |
    ForEach-Object {
      try {
        $name = $_.Name
        if ($name -eq $outLeaf) { return }
        if ($name -eq '_file-inventory.csv') { return }
        if ($name -like 'file-inventory-*.csv') { return }

        $full = $_.FullName
        $dir  = $_.DirectoryName
        $ext  = $_.Extension
        $size = $_.Length
        $lwt  = $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')

        $qf = '"' + ($full -replace '"', '""') + '"'
        $qn = '"' + ($name -replace '"', '""') + '"'
        $qd = '"' + ($dir  -replace '"', '""') + '"'
        $qe = '"' + ($ext  -replace '"', '""') + '"'
        $qt = '"' + ($lwt  -replace '"', '""') + '"'

        $sw.WriteLine($qf + ',' + $qn + ',' + $qd + ',' + $qe + ',' + $size + ',' + $qt)
        $count++

        if ((([DateTime]::UtcNow - $lastEcho).TotalSeconds -ge 5) -or (($count % 5000) -eq 0)) {
          Write-Host ("  ... {0:N0} files so far" -f $count)
          $lastEcho = [DateTime]::UtcNow
          $sw.Flush()
        }
      }
      catch {
        $errors++
      }
    }

  $sw.Flush()
  Write-Host ""
  Write-Host ("Done. Files listed: {0:N0}" -f $count)
  if ($errors -gt 0) {
    Write-Host ("Rows skipped due to errors: {0:N0}" -f $errors)
  }
  Write-Host ("CSV: {0}" -f $OutFile)
}
finally {
  $sw.Close()
}

exit 0
