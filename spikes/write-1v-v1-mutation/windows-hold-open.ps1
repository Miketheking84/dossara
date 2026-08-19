param(
  [Parameter(Mandatory = $true)][string]$FilePath
)

$stream = [IO.File]::Open(
  $FilePath,
  [IO.FileMode]::Open,
  [IO.FileAccess]::Read,
  [IO.FileShare]::Read
)

try {
  [Console]::Out.WriteLine("READY")
  [Console]::Out.Flush()
  [Console]::In.ReadLine() | Out-Null
} finally {
  $stream.Dispose()
}
