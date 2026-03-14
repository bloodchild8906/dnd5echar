param(
  [string]$OutputPath = '.env.local'
)

$defaultAppName = '5e Sheet Manager'
$defaultAppEnv = 'local'
$defaultDocument = '5esrd'

Write-Host 'Create or update local runtime secrets.'
Write-Host "Output file: $OutputPath"
Write-Host ''

$appName = Read-Host "App name [$defaultAppName]"
if ([string]::IsNullOrWhiteSpace($appName)) { $appName = $defaultAppName }

$appEnv = Read-Host "App environment [$defaultAppEnv]"
if ([string]::IsNullOrWhiteSpace($appEnv)) { $appEnv = $defaultAppEnv }

$open5eDocument = Read-Host "Default Open5e document [$defaultDocument]"
if ([string]::IsNullOrWhiteSpace($open5eDocument)) { $open5eDocument = $defaultDocument }

$supabaseUrl = Read-Host 'Supabase URL'
$supabaseAnonKey = Read-Host 'Supabase anon key'

@"
VITE_APP_NAME="$appName"
VITE_APP_ENV="$appEnv"
VITE_DEFAULT_OPEN5E_DOCUMENT="$open5eDocument"
VITE_SUPABASE_URL="$supabaseUrl"
VITE_SUPABASE_ANON_KEY="$supabaseAnonKey"
"@ | Set-Content $OutputPath

Write-Host ''
Write-Host "Wrote $OutputPath"
