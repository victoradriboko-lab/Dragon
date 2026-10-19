param([ValidateSet('Prepare','Stop','Register','Remove')][string]$Mode)
$ErrorActionPreference = 'Stop'
$state = Join-Path $env:ProgramData 'DragonAgent'
if ($Mode -eq 'Prepare') {
    New-Item -ItemType Directory -Path $state -Force | Out-Null
    & icacls.exe $state /inheritance:r /grant:r '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível proteger o diretório do agente.' }
    exit 0
}
if ($Mode -in @('Stop','Remove')) {
    if (Get-ScheduledTask -TaskName DragonAgent -ErrorAction SilentlyContinue) {
        Stop-ScheduledTask -TaskName DragonAgent
        if ($Mode -eq 'Remove') { Unregister-ScheduledTask -TaskName DragonAgent -Confirm:$false }
    }
    exit 0
}
$exe = Join-Path $PSScriptRoot 'DragonAgent.exe'
$config = Join-Path $state 'config.json'
if (-not (Test-Path $exe) -or -not (Test-Path $config)) { throw 'Arquivos de instalação ausentes.' }
& $exe --validate-config --config $config
if ($LASTEXITCODE -ne 0) { throw 'Configuração inválida.' }
$action = New-ScheduledTaskAction -Execute $exe -Argument ('--config "{0}"' -f $config) -WorkingDirectory $PSScriptRoot
$settings = New-ScheduledTaskSettingsSet -RestartCount 10 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName DragonAgent -Action $action -Trigger (New-ScheduledTaskTrigger -AtStartup) -Settings $settings -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName DragonAgent
