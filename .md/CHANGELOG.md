# Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - Architecture Overhaul

### Added
- Created `.md` folder at project root containing `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`, and `CHANGELOG.md`.
- Added dedicated `src/providers` to wrap the application globally.
- Added dedicated `src/routes` module to decouple routing from application entry.
- Added dedicated `src/constants` and `src/hooks` directories for global state variables and custom hooks.

### Changed
- **Major Refactor**: Transitioned the entire repository to a Feature-Sliced Architecture.
- Migrated all standalone pages into self-contained modules under `src/features/`.
- Shifted component logic into feature-specific `components/` subdirectories.
- Reorganized `src/auth` to properly encapsulate Role-Based Access Control (RBAC), contexts, and Auth UI.
- Rewrote `App.tsx` to serve purely as the entry wrapper, delegating routing and providers.
- Updated all internal imports across 40+ files to reflect new paths.

## [1.0.0] - Initial Release

### Added
- Comprehensive Dashboard.
- Personnel Directory and Communications Feed.
- Leave of Absence (LOA) and Strike Management workflows.
- HR Requests and Rank Management modules.
- Admin Panel Command Center and Audit Logs.
- Secure Supabase authentication integration.
