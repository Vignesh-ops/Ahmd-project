$ErrorActionPreference = "Stop"

$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$mysqld = Join-Path $mysqlBin "mysqld.exe"
$mysql = Join-Path $mysqlBin "mysql.exe"
$localDbRoot = Join-Path $env:LOCALAPPDATA "UBIRemittance"
$dataDir = Join-Path $localDbRoot "mysql-data"
$logFile = Join-Path $localDbRoot "ubi-local.err"
$pidFile = Join-Path $localDbRoot "ubi-local.pid"
$port = 3307

if (-not (Test-Path $mysqld)) {
  throw "mysqld.exe was not found in $mysqlBin."
}

if (-not (Test-Path $mysql)) {
  throw "mysql.exe was not found in $mysqlBin."
}

if (-not (Test-Path $localDbRoot)) {
  New-Item -ItemType Directory -Path $localDbRoot | Out-Null
}

if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

$systemSchema = Join-Path $dataDir "mysql"
$serverArgs = @(
  "--basedir=C:/Program Files/MySQL/MySQL Server 8.0/",
  "--datadir=$dataDir",
  "--port=$port",
  "--bind-address=127.0.0.1",
  "--mysqlx=0",
  "--lower_case_table_names=1",
  "--secure-file-priv=",
  "--log-error=$logFile",
  "--pid-file=$pidFile"
)
$serverStartArgs = @(
  '--basedir="C:/Program Files/MySQL/MySQL Server 8.0/"',
  "--datadir=$dataDir",
  "--port=$port",
  "--bind-address=127.0.0.1",
  "--mysqlx=0",
  "--lower_case_table_names=1",
  "--secure-file-priv=",
  "--log-error=$logFile",
  "--pid-file=$pidFile"
) -join " "

if (-not (Test-Path $systemSchema)) {
  & $mysqld @serverArgs --initialize-insecure --console
  if ($LASTEXITCODE -ne 0) {
    throw "MySQL initialization failed."
  }
}

function Test-LocalMySqlPort {
  $tcpClient = [System.Net.Sockets.TcpClient]::new()

  try {
    $asyncResult = $tcpClient.BeginConnect("127.0.0.1", $port, $null, $null)
    $connected = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)

    if (-not $connected) {
      return $false
    }

    $tcpClient.EndConnect($asyncResult)
    return $true
  } catch {
    return $false
  } finally {
    $tcpClient.Dispose()
  }
}

if (-not (Test-LocalMySqlPort)) {
  Start-Process -FilePath $mysqld -ArgumentList $serverStartArgs -WindowStyle Hidden | Out-Null
}

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if (Test-LocalMySqlPort) {
    $ready = $true
    break
  }
}

if (-not $ready) {
  throw "Local MySQL did not start on localhost:$port."
}

Start-Sleep -Seconds 2

$bootstrapSql = @"
CREATE DATABASE IF NOT EXISTS ubi_remittance;
CREATE USER IF NOT EXISTS 'ubi_app'@'localhost' IDENTIFIED BY 'ubi_app_123';
CREATE USER IF NOT EXISTS 'ubi_app'@'127.0.0.1' IDENTIFIED BY 'ubi_app_123';
GRANT ALL PRIVILEGES ON ubi_remittance.* TO 'ubi_app'@'localhost';
GRANT ALL PRIVILEGES ON ubi_remittance.* TO 'ubi_app'@'127.0.0.1';
FLUSH PRIVILEGES;
"@

& $mysql --protocol=TCP -hlocalhost "--port=$port" -uroot -e $bootstrapSql
if ($LASTEXITCODE -ne 0) {
  throw "MySQL bootstrap SQL failed."
}

Write-Host "Local MySQL is ready at mysql://ubi_app:ubi_app_123@localhost:$port/ubi_remittance"
