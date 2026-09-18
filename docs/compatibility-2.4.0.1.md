# WoT EU 2.4.0.1 #952 compatibility

Client revision 2619847, overrides 2620046. Compared against checksum-matching 2.4.0.0 sources.

- Main carousel: native footer shadow option added; row/filter/sort hooks unchanged.
- Comp7 Light and Last Stand: updated native import aliases.
- Frontline: rebuilt imports and associated renamed references; guarded carousel contracts unchanged.
- Tooltip: rebuilt import/local aliases; DOM class anchors and appended renderer contract preserved.
- Comp7, Fun Random and tooltip CSS are byte-identical.
- All 10 bytecode fingerprints in client-api-contract.json pass without modifying the API contract.

Reviewed source hashes are recorded in `tools/client-profiles.json`.
The package is rebuilt from current client resources; user configs are not part of the replacement.
The user confirmed that the installed update works on 2026-09-18; exhaustive testing of every event mode was not claimed.
