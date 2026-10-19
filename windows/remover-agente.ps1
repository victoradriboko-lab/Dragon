$ErrorActionPreference = 'Stop'
Stop-ScheduledTask -TaskName 'DragonAgent' -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'DragonAgent' -Confirm:$false
Write-Host 'Tarefa removida. Revogue também o coletor na plataforma. Arquivos e fila local foram preservados.'
