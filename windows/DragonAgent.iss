#ifndef AgentVersion
  #define AgentVersion "0.3.0"
#endif
[Setup]
AppId={{5700EF71-0C63-4AD3-8275-0851F95CB0AD}
AppName=Dragon Agent
AppVersion={#AgentVersion}
AppPublisher=Dragon
DefaultDirName={autopf}\DragonAgent
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=..\build\installer
OutputBaseFilename=DragonAgentSetup-{#AgentVersion}-x64
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
WizardStyle=modern
Compression=lzma2
SolidCompression=yes
SetupLogging=no
UninstallDisplayIcon={app}\DragonAgent.exe
CloseApplications=no

[Languages]
Name: "portuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Files]
Source: "..\build\payload\DragonAgent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "setup-support.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\build\payload\NODE-LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\setup-support.ps1"" -Mode Remove"; Flags: runhidden waituntilterminated; RunOnceId: "DragonAgentRemoveTask"

[Code]
var
  AccountPage, NetworkPage: TInputQueryWizardPage;
  TransportPage: TInputOptionWizardPage;

function JsonString(Value: String): String;
begin
  StringChangeEx(Value, '\', '\\', True);
  StringChangeEx(Value, '"', '\"', True);
  StringChangeEx(Value, #13, '\r', True);
  StringChangeEx(Value, #10, '\n', True);
  StringChangeEx(Value, #9, '\t', True);
  Result := '"' + Value + '"';
end;

function RunSupport(ScriptPath, Mode: String): Boolean;
var Code: Integer;
begin
  Result := Exec(ExpandConstant('{sys}\WindowsPowerShell\v1.0\powershell.exe'),
    '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "' + ScriptPath + '" -Mode ' + Mode,
    '', SW_HIDE, ewWaitUntilTerminated, Code);
  Result := Result and (Code = 0);
end;

procedure InitializeWizard;
begin
  AccountPage := CreateInputQueryPage(wpWelcome, 'Conectar à sua plataforma Dragon',
    'Informe o servidor e o token de instalação do cliente.',
    'Use o mesmo token do cliente em todos os PCs dele. Cada PC terá uma identidade própria.');
  AccountPage.Add('Endereço do Dragon (ex.: https://dragon.suaempresa.com.br):', False);
  AccountPage.Add('Token de instalação do cliente:', True);
  AccountPage.Add('Nome deste ponto (PC, unidade ou local):', False);
  AccountPage.Values[0] := 'https://';
  AccountPage.Values[2] := GetEnv('COMPUTERNAME');
  NetworkPage := CreateInputQueryPage(AccountPage.ID, 'Impressoras da rede',
    'Defina quais redes este PC pode consultar.',
    'Informe IPs ou redes privadas separados por vírgula. Ex.: 192.168.1.0/24, 192.168.2.50. Revise em cada cliente.');
  NetworkPage.Add('IPs ou redes autorizadas (IPv4):', False);
  NetworkPage.Add('Comunidade SNMP v2c somente leitura:', True);
  NetworkPage.Values[1] := 'public';
  TransportPage := CreateInputOptionPage(NetworkPage.ID, 'Segurança da conexão',
    'Preferir HTTPS para enviar os relatórios.',
    'Se usar HTTP, somente em LAN ou VPN confiável. HTTPS valida o certificado do servidor.', False, False);
  TransportPage.Add('Permitir HTTP sem criptografia nesta rede confiável');
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if CurPageID = AccountPage.ID then begin
    if (Trim(AccountPage.Values[0]) = '') or (Length(Trim(AccountPage.Values[1])) <> 64) or (Trim(AccountPage.Values[2]) = '') then begin
      MsgBox('Preencha o endereço, o token de 64 caracteres e o nome deste PC.', mbError, MB_OK); Result := False;
    end;
  end;
  if CurPageID = NetworkPage.ID then begin
    if (Trim(NetworkPage.Values[0]) = '') or (Trim(NetworkPage.Values[1]) = '') then begin
      MsgBox('Informe as redes/IPs e a comunidade SNMP.', mbError, MB_OK); Result := False;
    end;
  end;
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  State, Input, Json, Item, Networks: String;
  Parts: TArrayOfString;
  I, Code: Integer;
  ErrorText: AnsiString;
begin
  Result := '';
  ExtractTemporaryFile('DragonAgent.exe');
  ExtractTemporaryFile('setup-support.ps1');
  if not RunSupport(ExpandConstant('{tmp}\setup-support.ps1'), 'Prepare') then begin Result := 'Não foi possível preparar a pasta protegida do agente.'; Exit; end;
  State := ExpandConstant('{commonappdata}\DragonAgent');
  Input := State + '\enrollment.json';
  Parts := StringSplit(NetworkPage.Values[0], [','], stExcludeEmpty);
  Networks := '';
  for I := 0 to GetArrayLength(Parts) - 1 do begin
    Item := Trim(Parts[I]);
    if Networks <> '' then Networks := Networks + ',';
    Networks := Networks + JsonString(Item);
  end;
  Json := '{"server_url":' + JsonString(Trim(AccountPage.Values[0])) +
    ',"client_token":' + JsonString(Trim(AccountPage.Values[1])) +
    ',"name":' + JsonString(Trim(AccountPage.Values[2])) +
    ',"community":' + JsonString(NetworkPage.Values[1]) + ',"networks":[' + Networks +
    '],"allow_insecure_http":';
  if TransportPage.Values[0] then Json := Json + 'true}' else Json := Json + 'false}';
  if not SaveStringToFile(Input, Utf8Encode(Json), False) then begin Result := 'Não foi possível gravar a configuração temporária.'; Exit; end;
  if not Exec(ExpandConstant('{tmp}\DragonAgent.exe'), '--enroll-file "' + Input + '" --state "' + State + '"', '', SW_HIDE, ewWaitUntilTerminated, Code) then begin
    DeleteFile(Input); Result := 'Não foi possível executar o agente de instalação.'; Exit;
  end;
  DeleteFile(Input);
  if Code <> 0 then begin
    if LoadStringFromFile(State + '\installation-status.txt', ErrorText) then Result := Utf8Decode(ErrorText)
    else Result := 'O servidor não confirmou esta instalação. Confira endereço, token e conexão.';
    Exit;
  end;
  if not RunSupport(ExpandConstant('{tmp}\setup-support.ps1'), 'Stop') then Result := 'Não foi possível parar a instalação anterior.';
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then begin
    if not RunSupport(ExpandConstant('{app}\setup-support.ps1'), 'Register') then
      RaiseException('Não foi possível iniciar a tarefa DragonAgent. Verifique no Agendador de Tarefas.');
  end;
end;

procedure CurPageChanged(CurPageID: Integer);
var Status: AnsiString;
begin
  if CurPageID = wpFinished then begin
    if LoadStringFromFile(ExpandConstant('{commonappdata}\DragonAgent\installation-status.txt'), Status) then
      WizardForm.FinishedLabel.Caption := WizardForm.FinishedLabel.Caption + #13#10#13#10 + Utf8Decode(Status);
    AccountPage.Values[1] := '';
  end;
end;
