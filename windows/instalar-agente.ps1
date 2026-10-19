param([string]$InstallPath = "$env:ProgramData\DragonAgent")
$ErrorActionPreference = 'Stop'
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Execute o PowerShell como administrador.' }
$node = (Get-Command node -ErrorAction Stop).Source
$major = [int]((& $node --version).TrimStart('v').Split('.')[0])
if ($major -lt 24) { throw 'Instale Node.js 24 LTS antes de continuar.' }
$source = Join-Path $PSScriptRoot '..\agents'
if (Get-ScheduledTask -TaskName 'DragonAgent' -ErrorAction SilentlyContinue) { Stop-ScheduledTask -TaskName 'DragonAgent' -ErrorAction Stop }
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
# Arquivos locais protegidos: apenas SYSTEM e administradores. O token nunca vai para argumentos da tarefa.
& icacls.exe $InstallPath /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Falha ao proteger a pasta do agente.' }
foreach ($file in @('agent.mjs','snmp.mjs','config.example.json')) { Copy-Item (Join-Path $source $file) (Join-Path $InstallPath $file) -Force }
$configPath = Join-Path $InstallPath 'config.json'
if (-not (Test-Path $configPath)) {
    Copy-Item (Join-Path $InstallPath 'config.example.json') $configPath
    Write-Host "Edite $configPath com servidor, token, comunidade e redes. Depois execute este instalador novamente."
    exit 0
}
# Validar sem executar varredura nem revelar credenciais.
$config = Get-Content $configPath -Raw | ConvertFrom-Json
if ($config.token -notmatch '^[a-f0-9]{64}$') { throw 'Informe o token válido da plataforma no config.json.' }
$action = New-ScheduledTaskAction -Execute $node -Argument ('"{0}" --config "{1}"' -f (Join-Path $InstallPath 'agent.mjs'), $configPath) -WorkingDirectory $InstallPath
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -RestartCount 10 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName 'DragonAgent' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName 'DragonAgent'
Write-Host 'Agente registrado e iniciado na tarefa DragonAgent. Nenhuma porta de entrada foi aberta.'
