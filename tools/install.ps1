[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$GameRoot,
    [Parameter(Mandatory = $true)]
    [string]$PackagePath,
    [switch]$ForceConfig
)

$ErrorActionPreference = 'Stop'
$repo = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$GameRoot = [IO.Path]::GetFullPath($GameRoot)
$PackagePath = [IO.Path]::GetFullPath($PackagePath)

$versionXml = Join-Path $GameRoot 'version.xml'
if (-not (Test-Path -LiteralPath $versionXml)) {
    throw "Not a World of Tanks root: $GameRoot"
}
[xml]$versionData = Get-Content -LiteralPath $versionXml -Raw
$clientVersion = [string]$versionData.DocumentElement.version
$match = [regex]::Match($clientVersion, '\d+\.\d+\.\d+\.\d+')
if (-not $match.Success) {
    throw "Could not determine the client version from $versionXml"
}
$modsVersion = $match.Value
$modsDir = Join-Path $GameRoot "mods\$modsVersion"
New-Item -ItemType Directory -Force -Path $modsDir | Out-Null

$destination = Join-Path $modsDir ([IO.Path]::GetFileName($PackagePath))
$backupDir = Join-Path $GameRoot ('mod_install_backup_' + (Get-Date -Format 'yyyyMMdd_HHmmss') + '\hangar_carousel_plus')
$existing = Get-ChildItem -LiteralPath $modsDir -Filter 'com.rcooler.hangar_carousel_plus_*.wotmod' -ErrorAction SilentlyContinue
if ($existing) {
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    foreach ($file in $existing) {
        Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $backupDir $file.Name)
        Remove-Item -LiteralPath $file.FullName -Force
    }
}
Copy-Item -LiteralPath $PackagePath -Destination $destination

$configDir = Join-Path $GameRoot 'mods\configs\RCooLeR'
$configPath = Join-Path $configDir 'hangar_carousel_plus.json'
$legacyConfigPath = Join-Path $GameRoot 'res_mods\configs\hangar_carousel_plus\config.json'
$runtimePath = Join-Path $configDir 'hangar_carousel_plus.runtime.json'
$legacyRuntimePath = Join-Path $GameRoot 'res_mods\configs\hangar_carousel_plus\runtime.json'
if ($ForceConfig -or -not (Test-Path -LiteralPath $configPath)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    if ($ForceConfig -and (Test-Path -LiteralPath $configPath)) {
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
        Copy-Item -LiteralPath $configPath -Destination (Join-Path $backupDir 'hangar_carousel_plus.json')
    }
    if (-not $ForceConfig -and (Test-Path -LiteralPath $legacyConfigPath)) {
        Copy-Item -LiteralPath $legacyConfigPath -Destination $configPath
    }
    else {
        Copy-Item -LiteralPath (Join-Path $repo 'config\default.json') -Destination $configPath
    }
}
if (-not (Test-Path -LiteralPath $runtimePath) -and (Test-Path -LiteralPath $legacyRuntimePath)) {
    New-Item -ItemType Directory -Force -Path $configDir | Out-Null
    Copy-Item -LiteralPath $legacyRuntimePath -Destination $runtimePath
}

$openWg = Get-ChildItem -LiteralPath $modsDir -Recurse -Filter 'net.openwg.gameface_*.wotmod' -ErrorAction SilentlyContinue
if (-not $openWg) {
    Write-Warning 'net.openwg.gameface is not installed; the Python mod will fail closed and no controls will be injected.'
}

Write-Output "Installed: $destination"
Write-Output "Config: $configPath"
Write-Output "Runtime: $runtimePath"
if (Test-Path -LiteralPath $backupDir) {
    Write-Output "Backup: $backupDir"
}
