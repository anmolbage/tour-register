# Changelog

## [Unreleased]

### Added

#### Manual Tour Entry
- Floating action button (+) on all main screens (Home, Visits, Dashboard, Export) to add tour entries manually
- Manual entry form with fields for:
  - Date (defaults to today)
  - Time Out / Time In (time out defaults to current time)
  - Location / Address (free text with "Use Current Location" GPS autofill)
  - Distance in KM
  - Purpose (same 9 categories as auto-detection)
  - Optional notes
  - Optional photo attachment
- Validation: date, time out, and purpose are required; time in must be after time out
- Manual entries are saved to IndexedDB with a `manual: true` flag and appear in visit history and stats like GPS-detected entries

#### Exclusion Zones
- New "Excluded Places" section in the Settings screen to manage locations where visit prompts should be skipped
- Add excluded places with:
  - Custom name (e.g. "My Room", "Lunch Spot")
  - Location via GPS or manual latitude/longitude entry
  - Configurable radius (50m - 1000m, default 200m)
- View and delete saved exclusion zones from the settings list
- GPS stop detection now checks if the stop falls within any exclusion zone radius (Haversine distance) and silently skips the classification modal if it does
- Exclusion zones are persisted in IndexedDB and work offline
