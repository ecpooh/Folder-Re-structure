#Requires -Version 3.0
<#
.SYNOPSIS
  Recursive file inventory → multi-part CSV (streamed). Called by scan-files.bat.

.DESCRIPTION
  Read-only scan. Does not delete, move, or modify user files.
  Skips inventory CSVs named file-inventory-*.csv and _file-inventory.csv.
  Rolls to a new part before exceeding MaxPartBytes (default 8 MiB).
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $Root,

  # Directory + stem, no extension. Parts become: <OutBase>-part001.csv, …
  [Parameter(Mandatory = $true)]
  [string] $OutBase,

  # Production default: 8 MiB. Tests may pass a tiny value.
  [Parameter(Mandatory = $false)]
  [long] $MaxPartBytes = 8388608
)

$ErrorActionPreference = 'Continue'

if (-not (Test-Path -LiteralPath $Root)) {
  Write-Error "Root not found: $Root"
  exit 1
}

if ($MaxPartBytes -lt 1024) {
  Write-Error "MaxPartBytes must be at least 1024 (got $MaxPartBytes)"
  exit 1
}

$utf8 = New-Object System.Text.UTF8Encoding $false
$header = 'FullPath,FileName,Directory,Extension,SizeBytes,LastWriteTime'
$headerBytes = $utf8.GetByteCount($header) + 1  # + LF from WriteLine

$count = [int64]0
$errors = [int64]0
$partNum = 0
$partBytes = [int64]0
$lastEcho = [DateTime]::UtcNow
$sw = $null
$currentPath = $null

function Get-PartPath([int] $n) {
  return ('{0}-part{1:D3}.csv' -f $OutBase, $n)
}

function Open-NextPart {
  if ($script:sw -ne $null) {
    $script:sw.Flush()
    $script:sw.Close()
    $script:sw = $null
  }
  $script:partNum++
  $script:currentPath = Get-PartPath $script:partNum
  $script:sw = New-Object System.IO.StreamWriter $script:currentPath, $false, $utf8
  $script:sw.WriteLine($header)
  $script:partBytes = [int64]$headerBytes
  Write-Host ("  Opened part {0:D3}: {1}" -f $script:partNum, $script:currentPath)
}

try {
  Open-NextPart

  Get-ChildItem -LiteralPath $Root -Recurse -File -Force -ErrorAction SilentlyContinue |
    ForEach-Object {
      try {
        $name = $_.Name
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

        $line = $qf + ',' + $qn + ',' + $qd + ',' + $qe + ',' + $size + ',' + $qt
        $lineBytes = [int64]($utf8.GetByteCount($line) + 1)

        # Roll before writing when the next row would exceed the cap.
        # If this part has only the header so far, write anyway (oversized row).
        if (($script:partBytes + $lineBytes) -gt $MaxPartBytes -and $script:partBytes -gt $headerBytes) {
          Open-NextPart
        }

        $script:sw.WriteLine($line)
        $script:partBytes += $lineBytes
        $count++

        if ((([DateTime]::UtcNow - $lastEcho).TotalSeconds -ge 5) -or (($count % 5000) -eq 0)) {
          Write-Host ("  ... {0:N0} files so far (part {1:D3})" -f $count, $script:partNum)
          $lastEcho = [DateTime]::UtcNow
          $script:sw.Flush()
        }
      }
      catch {
        $errors++
      }
    }

  if ($sw -ne $null) {
    $sw.Flush()
  }

  Write-Host ""
  Write-Host ("Done. Files listed: {0:N0}  Parts written: {1}" -f $count, $partNum)
  if ($errors -gt 0) {
    Write-Host ("Rows skipped due to errors: {0:N0}" -f $errors)
  }
  if ($partNum -eq 1) {
    Write-Host ("CSV: {0}" -f (Get-PartPath 1))
  }
  else {
    Write-Host ("CSV parts: {0} … {1}" -f (Get-PartPath 1), (Get-PartPath $partNum))
  }
}
finally {
  if ($sw -ne $null) {
    $sw.Close()
    $sw = $null
  }
}

exit 0
