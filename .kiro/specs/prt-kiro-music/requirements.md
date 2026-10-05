# Requirements Document

## Introduction

EchoBox Music is a Spotify-inspired web music player built with React and Vite. It plays a small, curated collection of local MP3 and WAV audio files directly in the browser using the HTML5 Audio API. There is no backend, no authentication, and no external streaming service. All user data (playlists) is persisted to localStorage. The application provides a responsive, modern dark UI with track browsing, search, full playback controls, and playlist management.

---

## Glossary

- **Track**: A single audio file (MP3 or WAV) with metadata: title, artist, album, duration, and file path.
- **Track_Catalog**: The complete static list of all tracks. Defined at build time; not user-editable.
- **Audio_Engine**: The component responsible for loading and controlling HTML5 Audio playback.
- **Playback_Controls**: The UI component containing play/pause, previous, next, seek, and volume controls.
- **Now_Playing_Bar**: The persistent UI bar at the bottom showing current track info and Playback_Controls.
- **Playlist**: A named, ordered collection of Tracks created and managed by the user.
- **Queue**: The ordered sequence of Tracks the Audio_Engine will play through sequentially.

---

## Requirements

### Requirement 1: Load and Display the Track Catalog

**User Story:** As a listener, I want to see all available tracks when I open the app, so that I can browse and choose what to play.

#### Acceptance Criteria

1. THE Player SHALL load the Track_Catalog from a static JavaScript module at application startup.
2. THE Player SHALL display each Track's title, artist, and duration in MM:SS format.
3. WHEN the Track_Catalog is empty, THE Player SHALL display a message indicating no tracks are available.
4. THE Player SHALL render the track list in a scrollable container.

---

### Requirement 2: Search Tracks

**User Story:** As a listener, I want to search for tracks by title or artist so I can quickly find a specific song.

#### Acceptance Criteria

1. WHEN a user types in the Search input, THE Search SHALL filter displayed tracks by case-insensitive substring match on title or artist.
2. WHEN the search string is cleared, THE Search SHALL restore the full Track_Catalog list.
3. WHEN no Tracks match, THE Search SHALL display a "No results found" message.
4. WHEN the search string contains only whitespace, THE Search SHALL display the full Track_Catalog list.

---

### Requirement 3: Play and Pause a Track

**User Story:** As a listener, I want to play and pause a track so I can control when audio is playing.

#### Acceptance Criteria

1. WHEN a user selects a Track, THE Audio_Engine SHALL load and begin playback.
2. WHEN a Track is playing and the user presses pause, THE Audio_Engine SHALL pause and retain playback position.
3. WHEN a Track is paused and the user presses play, THE Audio_Engine SHALL resume from the retained position.
4. IF the Audio_Engine receives rapid successive play/pause actions, THE Audio_Engine SHALL process only the final action.
5. IF the Audio_Engine fails to load a Track, THEN THE Audio_Engine SHALL display an error message.

---

### Requirement 4: Seek Through a Track

**User Story:** As a listener, I want to seek to any position in a track so I can skip forward or backward.

#### Acceptance Criteria

1. THE Now_Playing_Bar SHALL display a seek bar showing current playback position as a proportional fill.
2. WHEN a user drags or clicks the seek bar, THE Audio_Engine SHALL update the playback position.
3. IF a seek targets a position outside valid range, THE Audio_Engine SHALL clamp to [0, duration].

---

### Requirement 5: Volume Control

**User Story:** As a listener, I want to control the playback volume.

#### Acceptance Criteria

1. THE Now_Playing_Bar SHALL display a volume slider from 0 to 1.
2. WHEN a user adjusts the volume, THE Audio_Engine SHALL apply the new level immediately.
3. WHEN the application loads, THE Player SHALL read the persisted volume from localStorage.
4. IF the persisted volume is absent or invalid, THE Player SHALL default to 1.

---

### Requirement 6: Playlist Management

**User Story:** As a listener, I want to create and manage playlists so I can organize my favorite tracks.

#### Acceptance Criteria

1. THE Player SHALL allow users to create a named playlist.
2. THE Player SHALL allow users to add tracks to a playlist.
3. THE Player SHALL allow users to remove tracks from a playlist.
4. THE Player SHALL allow users to delete a playlist.
5. Playlists SHALL be persisted to localStorage and restored on app load.
