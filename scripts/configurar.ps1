$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$env:DRAGON_ADMIN_EMAIL = Read-Host 'E-mail do administrador'
$secret = Read-Host 'Senha (mínimo 12 caracteres)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:DRAGON_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    & node server.mjs --init
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível cadastrar o administrador.' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    Remove-Item Env:DRAGON_ADMIN_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:DRAGON_ADMIN_EMAIL -ErrorAction SilentlyContinue
}
