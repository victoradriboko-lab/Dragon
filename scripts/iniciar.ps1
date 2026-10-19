$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
& node server.mjs
exit $LASTEXITCODE
