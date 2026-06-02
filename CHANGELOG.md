# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - WIP

### Release Summary
TBD

### Added
- Proxying of c3nav tiles with insertion of the tile_access_token
- Support for a separate c3nav api key for the frontend
- Custom leaflet marker with 3 different styles supporting all [Material Design Icons](https://pictogrammers.com/library/mdi/)
- Animated visual feedback for the current state of creating/updating device positions
- Error messages in the UI if placing a device fails
- Custom feedback element for drag-and-drop operation
- Removed DragDropMarker since we don't need it anymore
- Respects prefers-reduced-motion in CSS and JS
- Changes the mouse cursor into a crosshair while placing devices

### Fixed
- Navigation items now have the correct permissions set and only show the actions the user is authorized to do
- Graceful handling of the user having no access to the overlays

### Changed
- Configuration keys have changed see adf23ed1ebfec8608c44c0b9b3c283488a2aef74 for details

### Deprecated
- N/A

### Removed
- N/A

### Security
- N/A


## [0.1.0] - 2026-05-31

### Release Summary
Initial release of NetBox c3nav. This is a **minor** release introducing basic functionality placing device on a c3nav map in NetBox.

### Added
- Initial plugin structure with models for device positions (`DevicePosition`) and overlays (`Overlay`)
- Placing devices on map backed by c3nav through the NetBox UI
- Adding overlays to the map, i.e. building CAD plans
- Navigate to a device's position in c3nav from the device detail view
- REST API endpoints for programmatic access
- Integration with NetBox's permission system
- Basic CRUD operations through NetBox UI
- Change logging and journaling support (partialy)
- Custom fields and tags support (partially)

### Fixed
- N/A (initial release)

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Security
- N/A (initial release)

---

## Release Notes Template for Future Versions

When creating a new release, use this template:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Release Summary
Brief narrative summary describing the release type (major/minor/patch) and key highlights.

### **Breaking Changes**
<!-- Only include this section if there are breaking changes -->
- **[#issue]** Description of breaking change and migration path
- Link to detailed migration guide if needed

### Added
- New features and capabilities

### Fixed
- Bug fixes with issue references

### Changed
- Changes to existing functionality

### Deprecated
- Features marked for future removal

### Removed
- Features that have been removed

### Security
- Security improvements and fixes
```

---

**Best Practice**: For clear release communication, ensure each release includes:
1. Narrative summary characterizing the release type (major/minor/patch)
2. Clear indicators for bugs, features, or enhancements
3. Bold "Breaking Changes" header when applicable with migration guidance
4. Detailed changelog with issue references
