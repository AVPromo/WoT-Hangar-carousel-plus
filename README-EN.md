# Hangar Carousel Plus

[Українська](README.md) · English

Hangar Carousel Plus extends the native World of Tanks 2.x hangar carousel with smart filters, sorting, local statistics, and configurable row layouts.

The mod currently targets the Wargaming EU 2.3.1.x client and provides:

- filters for incomplete Field Modification, incompletely trained crews, and non-elite vehicles;
- reward/special, not-ready, no-Ace, fewer-than-three-Marks, and research-now-available filters;
- battles, win rate, average damage, mastery, and Marks of Excellence on vehicle cards and in the native hover card;
- sorting by battles, win rate, average damage, Marks of Excellence, or last played;
- one-, two-, three-, and four-row carousel layouts with an automatic mode;
- optional hiding of the Buy vehicle, Buy slot, and Restore vehicle cells;
- a settings page through ModsSettingsAPI;
- localization for all 24 EU client languages.

No account credentials or statistics are sent to an external service. HCP narrows the native vehicle list before the standard Gameface filters run. It does not create dynamic vehicle playlists.

## Requirements

- World of Tanks Wargaming client 2.3.1.x;
- `net.openwg.gameface` 1.1.5 or newer;
- ModsSettingsAPI for the settings page;
- Windows PowerShell 5.1 or PowerShell 7 for building.

The build helper downloads the official Python 2.7.18 MSI into `.tools/` and extracts a private compiler. It does not install Python system-wide.

## Build

```powershell
.\tools\build.ps1
```

The resulting package is written to:

```text
dist\com.rcooler.hangar_carousel_plus_0.8.4.wotmod
```

Build and install into a local client:

```powershell
.\tools\build.ps1 -Install -GameRoot 'E:\Games\World of Tanks'
```

The installer backs up the previous HCP package and does not overwrite the user `config.json` unless `-ForceConfig` is explicitly supplied.

## Configuration

The active configuration is stored at:

```text
<game>\res_mods\configs\hangar_carousel_plus\config.json
```

Use the ModsSettingsAPI page or edit `filters.enabled`, `cardStats`, `sorting`, and `actionCards`. The repository default is stored in `config/default.json`.

Sorting direction, last-played timestamps, and carousel row mode are stored separately in `runtime.json`.

Automatic row mode uses the final vehicle count after native and HCP filters:

- up to 8 vehicles: 1 row;
- up to 16: 2 rows;
- up to 24: 3 rows;
- more than 24: 4 rows.

## Filters

Every HCP icon is an independent toggle. Active HCP predicates are combined with logical **AND**, after which the client applies its normal nation, type, role, level, special, and name filters.

HCP deliberately does not duplicate the client’s existing filters for Premium, Elite, rented/temporary vehicles, the daily first-victory bonus, or vehicles that can still earn Battle Pass points.

Field Modification is considered incomplete only when the vehicle is eligible for the system, its tree exists, and the native completion state is not `FULL`.

A crew is considered incomplete when a required slot is empty, qualification or efficiency is below 100%, a perk is still being trained, or another learnable perk slot is available.

## Statistics

Vehicle cards show four compact, shadow-free lines containing battles and win rate, average damage, mastery, and Marks of Excellence. Metric-aware colors make the values easier to scan. The same data is injected as a native section into the vehicle hover card.

## Carousel rows

WoT 2.3.1 natively implements either one-row cards or hard-coded pairs. During the build, HCP copies the local client bundle and applies a small set of exact, guarded substitutions to support three and four rows. A checksum guard refuses to build against unknown client resources. No Wargaming bundle is committed to this repository.

## Localization

The language is detected automatically. HCP includes all 24 languages declared by the WoT EU client: Bulgarian, Czech, Danish, German, Greek, English, Spanish, Finnish, French, Croatian, Hungarian, Italian, Lithuanian, Latvian, Dutch, Norwegian, Polish, Portuguese, Romanian, Serbian, Swedish, Turkish, Russian, and Ukrainian. Missing individual strings fall back to English.

## Uninstall

Remove `com.rcooler.hangar_carousel_plus_*.wotmod` from the active `mods\<client-version>` directory. The configuration and locally tracked last-played data may be removed separately.

## Compatibility

The Python API, DOM hooks, and version-locked native bundle substitutions are private game interfaces. Rebuild and retest after every World of Tanks update. The checksum guard prevents package creation when the client resources have changed.
