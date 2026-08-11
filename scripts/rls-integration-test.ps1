#!/usr/bin/env pwsh
# scripts/rls-integration-test.ps1
# Runs src/db/__tests__/rls-integration.test.ts against a REAL Postgres.
#
# Requires a real Postgres reachable via $env:DATABASE_URL_TEST. If that is
# unset (or unreachable) this script boots a throwaway `embedded-postgres`
# instance locally (npm i -D embedded-postgres in a temp dir), points the test
# at it, and tears it down afterward. It NEVER skips on missing-DB — per AGENTS.md
# §2.2 the RLS suite must run against a real Postgres, and CI runs the same
# test against `pgvector/pgvector:pg16`.
#
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/rls-integration-test.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# 1. Reuse an externally-provided Postgres when available.
$pgport = 55432
$pguser = 'cerefy'
$pgpass = 'cerefy_password'
$pgdb = 'cerefy_test'
$pgdata = Join-Path $env:TEMP "opencode\pgdata"

if (-not $env:DATABASE_URL_TEST) {
  try {
    $probe = New-Object System.Net.Sockets.TcpClient
    $probe.Connect('127.0.0.1', $pgport)
    $probe.Close()
    $env:DATABASE_URL_TEST = "postgres://${pguser}:${pgpass}@127.0.0.1:${pgport}/${pgdb}"
    Write-Host "Using Postgres already listening on 127.0.0.1:${pgport}" -ForegroundColor Cyan
  } catch {
    # 2. Boot embedded-postgres.
    $temp = Join-Path $env:TEMP 'opencode'
    $epDir = Join-Path $temp 'embedded-pg-runner'
    New-Item -ItemType Directory -Force -Path $epDir | Out-Null
    if (-not (Test-Path (Join-Path $epDir 'package.json'))) {
      Write-Host "Installing embedded-postgres (first run)..." -ForegroundColor Cyan
      Set-Content (Join-Path $epDir 'package.json') '{"name":"cerefy-rls-runner","private":true}'
      Push-Location $epDir
      try { npm install embedded-postgres@18.4.0-beta.17 pg --no-audit --no-fund | Out-Null } finally { Pop-Location }
    }

    $env:DATABASE_URL_TEST = "postgres://${pguser}:${pgpass}@127.0.0.1:${pgport}/${pgdb}"

    $runner = Join-Path $temp 'start-pg.mjs'
    $script = @'
import EmbeddedPostgres from 'embedded-postgres';
import { Client } from 'pg';

const port = Number(process.env.PGPORT || 55432);
const pg = new EmbeddedPostgres({
  databaseDir: process.env.PGDATA,
  user: process.env.PGUSER || 'cerefy',
  password: process.env.PGPASSWORD || 'cerefy_password',
  port,
  persistent: false,
});
await pg.initialise();
await pg.start();
await pg.createDatabase(process.env.PGDB || 'cerefy_test').catch(() => {});
const c = new Client({ user: process.env.PGUSER || 'cerefy', password: process.env.PGPASSWORD || 'cerefy_password', host: '127.0.0.1', port, database: process.env.PGDB || 'cerefy_test' });
await c.connect();
const r = await c.query('SELECT current_user, current_database()');
console.log('READY', JSON.stringify(r.rows[0]));
await c.end();
process.on('SIGINT', () => pg.stop().catch(() => {}).finally(() => process.exit(0)));
process.on('SIGTERM', () => pg.stop().catch(() => {}).finally(() => process.exit(0)));
setInterval(() => {}, 1000);
'@
    Set-Content $runner $script
    $env:PGPORT = "$pgport"
    $env:PGDATA = $pgdata
    $env:PGUSER = $pguser
    $env:PGPASSWORD = $pgpass
    $env:PGDB = $pgdb

    Write-Host "Booting embedded-postgres on 127.0.0.1:${pgport}..." -ForegroundColor Cyan
    $proc = Start-Process -FilePath node -ArgumentList @($runner) -PassThru -WindowStyle Hidden
    try {
      $ready = $false
      for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        try {
          $c = New-Object System.Net.Sockets.TcpClient
          $c.Connect('127.0.0.1', $pgport)
          $c.Close()
          $ready = $true
          break
        } catch { }
      }
      if (-not $ready) { throw "embedded-postgres did not become reachable on port ${pgport}" }
    } catch {
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
      throw
    }
  }
}

# 3. Run the suite.
Write-Host "Running RLS integration suite..." -ForegroundColor Cyan
Push-Location $root
try {
  node --import tsx --test --test-force-exit src/db/__tests__/rls-integration.test.ts
  if ($LASTEXITCODE -ne 0) { throw "RLS integration suite FAILED (exit $LASTEXITCODE)" }
  Write-Host "RLS integration suite PASSED" -ForegroundColor Green
} finally {
  Pop-Location
  if ($proc -and -not $proc.HasExited) {
    Write-Host "Stopping embedded-postgres..." -ForegroundColor Cyan
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}
