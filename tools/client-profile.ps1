function Get-HcpClientProfile {
    param([Parameter(Mandatory = $true)][string]$GameRoot)
    [xml]$versionData = Get-Content -LiteralPath (Join-Path $GameRoot 'version.xml') -Raw
    $versionMatch = [regex]::Match([string]$versionData.DocumentElement.version, '\d+\.\d+\.\d+\.\d+')
    if (-not $versionMatch.Success) {
        throw 'Unable to determine the client resource profile from version.xml.'
    }
    $profiles = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'client-profiles.json') -Raw | ConvertFrom-Json
    $profile = $profiles.PSObject.Properties[$versionMatch.Value]
    if (-not $profile) {
        throw "No reviewed HCP resource profile for client $($versionMatch.Value)."
    }
    return @{ Version = $versionMatch.Value; Hashes = $profile.Value }
}

function Convert-HcpResourcePath {
    param([string]$Path, [string]$Version)
    if ([version]$Version -ge [version]'2.4.1.0') {
        return $Path.Replace('views/main/main.html/', 'main/').Replace('views/vehicle_tooltip/vehicle_tooltip.html/', 'vehicle_tooltip/').Replace('views/hangar/hangar.html/', 'hangar/')
    }
    return $Path
}
