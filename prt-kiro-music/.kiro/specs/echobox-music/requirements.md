# Requirements Document

## Introduction

EchoBox Music is a Spotify-inspired web music player built with React and Vite. It plays a small, curated collection of local MP3 and WAV audio files directly in the browser using the HTML5 Audio API. There is no backend, no authentication, and no external streaming service. All user data (playlists) is persisted to localStorage. The application provides a responsive, modern dark UI with track browsing, search, full playback controls, and playlist management.

---

## Glossary

- **Player**: The EchoBox Music application as a whole.
- **Track**: A single audio file (MP3 or WAV) that includes metadata: title, artist, album, duration, and a file path relative to the project's public assets.
- **Track_Catalog**: The complete, static list of all tracks available in the application. Defined at build time; not user-editable.
- **Audio_Engine**: The component responsible for loading and controlling HTML5 Audio playback.
- **Playback_Controls**: The UI component containing play/pause, previous, next, seek, and volume controls.
- **Now_Playing_Bar**: The persistent UI bar displayed at the bottom of the screen showing current track info and Playback_Controls.
- **Search**: The feature allowing users to filter tracks from the Track_Catalog by title or artist.
- **Playlist**: A named, ordered collection of Tracks created and managed by the user.
- **Playlist_Manager**: The component responsible for creating, reading, updating, and deleting Playlists.
- **LocalStorage_Store**: The browser's localStorage used to persist all Playlist data.
- **Queue**: The ordered sequence of Tracks the Audio_Engine will play through sequentially. The Queue is populated either from the Track_Catalog or from a selected Playlist.

---

## Requirements

### Requirement 1: Load and Display the Track Catalog

**User Story:** As a listener, I want to see all available tracks when I open the app, so that I can browse and choose what to play.

#### Acceptance Criteria

1. THE Player SHALL load the Track_Catalog from a static JavaScript module at application startup.
2. THE Player SHALL display each Track's title, artist, and duration in MM:SS format in the track list.
3. WHEN the Track_Catalog is empty, THE Player SHALL display a message indicating no tracks are available.
4. THE Player SHALL render the track list in a scrollable container.
5. IF the static JavaScript module fails to load at application startup, THEN THE Player SHALL display an error message indicating the Track_Catalog could not be loaded and render an empty track list.

---

### Requirement 2: Search Tracks

**User Story:** As a listener, I want to search for tracks by title or artist, so that I can quickly find a specific song.

#### Acceptance Criteria

1. WHEN a user types in the Search input, THE Search SHALL filter the displayed track list to show only Tracks whose title or artist contains the search string as a case-insensitive substring match.
2. WHEN the search string is cleared, THE Search SHALL restore the full Track_Catalog list.
3. WHEN no Tracks match the search string, THE Search SHALL display a "No results found" message.
4. WHEN a user types or deletes a character in the Search input, THE Search SHALL update the filtered results without requiring a form submission.
5. WHEN the search string contains only whitespace, THE Search SHALL treat it as an empty search and display the full Track_Catalog list.

---

### Requirement 3: Play and Pause a Track

**User Story:** As a listener, I want to play and pause a track, so that I can control when audio is playing.

#### Acceptance Criteria

1. WHEN a user selects a Track from the track list, THE Audio_Engine SHALL load that Track and begin playback.
2. WHEN a Track is playing and the user presses the pause button, THE Audio_Engine SHALL pause playback and retain the current playback position.
3. WHEN a Track is paused and the user presses the play button, THE Audio_Engine SHALL resume playback from the retained paused position.
4. WHEN a user selects a different Track while a Track is already playing, THE Audio_Engine SHALL stop the current Track, discard its playback position, and begin playback of the newly selected Track from the beginning.
5. WHILE a Track is loading, THE Playback_Controls SHALL display a loading indicator and disable the play/pause button until the Track is ready to play.
6. IF the Audio_Engine receives rapid successive play/pause actions, THE Audio_Engine SHALL process only the final action to prevent audio glitching.
7. IF the Audio_Engine fails to load a Track, THEN THE Audio_Engine SHALL stop the loading attempt, display an error message indicating the Track could not be loaded, and re-enable the play/pause button.

---

### Requirement 4: Seek Through a Track

**User Story:** As a listener, I want to seek to any position in a track, so that I can skip forward or backward.

#### Acceptance Criteria

1. THE Now_Playing_Bar SHALL display a seek bar showing the current playback position as a proportional fill from 0% to 100% of the Track's total duration.
2. WHEN a user drags or clicks the seek bar, THE Audio_Engine SHALL update the playback position to the selected time, and resume playback from that position if the Track was playing before the seek.
3. IF a seek action targets a position outside the Track's valid range, THEN THE Audio_Engine SHALL clamp the playback position to 0 or the Track's total duration.
4. WHILE the Track is playing, THE Now_Playing_Bar SHALL update the seek bar fill and elapsed time display in real time.
5. THE Now_Playing_Bar SHALL display the current elapsed time and total duration as MM:SS formatted strings alongside the seek bar.
6. WHEN a Track is not loaded, THE Now_Playing_Bar SHALL display the seek bar as non-interactive at 0% fill, with elapsed time and total duration both showing 0:00.

---

### Requirement 5: Volume Control

**User Story:** As a listener, I want to control the playback volume, so that I can adjust the audio level.

#### Acceptance Criteria

1. THE Now_Playing_Bar SHALL display a volume slider ranging from 0 (muted) to 1 (maximum).
2. WHEN a user adjusts the volume slider, THE Audio_Engine SHALL apply the new volume level immediately.
3. WHEN the application loads, THE Player SHALL read the persisted volume level from LocalStorage_Store and apply it before the first audio output occurs.
4. IF the persisted volume value is absent, non-numeric, or outside the range [0, 1], THE Player SHALL default the volume to 1.
5. WHEN a user adjusts the volume slider, THE Player SHALL persist the new volume level to LocalStorage_Store.

---

### Requirement 6: Previous and Next Track

**User Story:** As a listener, I want to skip to the previous or next track, so that I can navigate through the Queue.

#### Acceptance Criteria

1. WHEN a user presses the next button, THE Audio_Engine SHALL stop the current Track, load the next Track in the Queue, and begin playback.
2. WHEN a user presses the previous button, THE Audio_Engine SHALL stop the current Track, load the previous Track in the Queue, and begin playback.
3. WHEN the current Track is the last Track in the Queue and the user presses the next button, THE Audio_Engine SHALL stop playback and clear the active Track state.
4. WHEN the current Track is the first Track in the Queue and the user presses the previous button, THE Audio_Engine SHALL stop playback and clear the active Track state.
5. IF a next or previous button press is received and the Queue contains no Tracks, THEN THE Audio_Engine SHALL ignore the input and retain the current playback state unchanged.

---

### Requirement 7: Display Current Track Information

**User Story:** As a listener, I want to see information about the currently playing track, so that I know what I'm listening to.

#### Acceptance Criteria

1. WHILE a Track is loaded, THE Now_Playing_Bar SHALL display the Track's title and artist name.
2. WHEN no Track is loaded, THE Now_Playing_Bar SHALL display placeholder text indicating nothing is playing.
3. WHEN the Track title or artist text overflows the available display area, THE Now_Playing_Bar SHALL truncate the text with an ellipsis using CSS overflow handling.
4. WHEN a Track finishes playing and no next Track is queued, THE Now_Playing_Bar SHALL revert to displaying the placeholder text.
5. WHEN a new Track is loaded, THE Now_Playing_Bar SHALL immediately update to display the new Track's title and artist.

---

### Requirement 8: Audio Loading and Playback Error Handling

**User Story:** As a listener, I want the app to handle audio errors gracefully, so that a broken file doesn't crash my session.

#### Acceptance Criteria

1. IF the Audio_Engine fails to load a Track file due to file not found, unsupported format, or network error, THEN THE Audio_Engine SHALL display an error message identifying the Track title and the failure reason, and stop playback without clearing the current Queue.
2. IF a Track file is corrupted or produces a decode error during loading, THEN THE Audio_Engine SHALL display an error message identifying the Track title and automatically advance to the next Track in the Queue.
3. WHEN a Track is loaded successfully after a previous error, THE Audio_Engine SHALL clear the error message and resume normal playback state.
4. IF the Audio_Engine encounters an unrecoverable playback error mid-stream, THEN THE Audio_Engine SHALL pause playback, display an error message identifying the Track title and failure reason, and present a dismiss control that clears the error message when activated.
5. IF the Queue contains no next Track when a decode error occurs, THEN THE Audio_Engine SHALL display an error message indicating no further Tracks are available and stop playback without clearing the Queue.

---

### Requirement 9: Create a Playlist

**User Story:** As a listener, I want to create named playlists, so that I can organise tracks into collections.

#### Acceptance Criteria

1. WHEN a user submits a new playlist name, THE Playlist_Manager SHALL create a new Playlist with that name and an empty Track list, and persist it to LocalStorage_Store.
2. IF a user submits a playlist name that is identical (case-insensitive) to an existing Playlist name, THEN THE Playlist_Manager SHALL reject the creation and display a duplicate-name error.
3. IF a playlist name is blank or contains only whitespace, THEN THE Playlist_Manager SHALL reject the creation and display a validation error.
4. IF writing the new Playlist to LocalStorage_Store fails, THEN THE Playlist_Manager SHALL remove the Playlist from the in-memory list and display an error message indicating the Playlist could not be saved.

---

### Requirement 10: Add Tracks to a Playlist

**User Story:** As a listener, I want to add tracks to a playlist, so that I can build my own collections.

#### Acceptance Criteria

1. WHEN a user adds a Track to a Playlist, THE Playlist_Manager SHALL append the Track to the end of the Playlist and persist the updated Playlist to LocalStorage_Store.
2. IF a user attempts to add a Track that already exists in the target Playlist, THEN THE Playlist_Manager SHALL reject the action and display a duplicate-track error.
3. IF writing the updated Playlist to LocalStorage_Store fails, THEN THE Playlist_Manager SHALL revert the in-memory append and display an error message indicating the Track could not be added.
4. IF the target Playlist cannot be found at the time of the add action, THEN THE Playlist_Manager SHALL reject the action and display an error message indicating the Playlist was not found.

---

### Requirement 11: Remove Tracks from a Playlist

**User Story:** As a listener, I want to remove tracks from a playlist, so that I can keep my collections up to date.

#### Acceptance Criteria

1. WHEN a user removes a Track from a Playlist, THE Playlist_Manager SHALL remove that Track from the Playlist and persist the updated Playlist to LocalStorage_Store.
2. WHEN a user removes a Track from a Playlist and that Track is the currently playing Track in the active Queue, THE Audio_Engine SHALL continue playing that Track until it finishes, and the Track SHALL be removed from the Playlist.
3. WHEN the currently playing Track that was removed from a Playlist finishes playing, THE Audio_Engine SHALL advance to the next Track in the Queue.
4. WHEN a Playlist becomes empty after a Track is removed, THE Playlist_Manager SHALL retain the empty Playlist rather than deleting it automatically.

---

### Requirement 12: Play Tracks from a Playlist

**User Story:** As a listener, I want to play a playlist, so that I can listen to my curated collection continuously.

#### Acceptance Criteria

1. WHEN a user starts playback from a Playlist, THE Audio_Engine SHALL populate the Queue with all Tracks from that Playlist in order and begin playing from the first Track.
2. IF a Playlist is empty and the user attempts to start playback, THEN THE Playlist_Manager SHALL display an empty-playlist message and THE Audio_Engine SHALL leave the current playback state unchanged.
3. WHEN a user starts playback from a Playlist while a Track from a different Queue is playing, THE Audio_Engine SHALL stop the current Track and begin playback of the first Track of the new Playlist Queue.
4. WHEN the last Track in a Playlist Queue ends, THE Audio_Engine SHALL stop playback and THE Now_Playing_Bar SHALL display the placeholder text.

---

### Requirement 13: Delete a Playlist

**User Story:** As a listener, I want to delete a playlist I no longer need, so that I can keep my playlist list tidy.

#### Acceptance Criteria

1. WHEN a user initiates deletion of a Playlist, THE Playlist_Manager SHALL display a confirmation prompt before performing the deletion.
2. WHEN a user confirms deletion of a Playlist, THE Playlist_Manager SHALL remove the Playlist from LocalStorage_Store and remove it from the UI.
3. WHEN a user cancels the deletion prompt, THE Playlist_Manager SHALL leave the Playlist unchanged in both LocalStorage_Store and the UI.
4. IF a user confirms deletion of the Playlist whose Tracks are currently in the active Queue, THEN THE Audio_Engine SHALL continue playing the current Track until it ends, after which THE Audio_Engine SHALL stop playback and clear the Queue.

---

### Requirement 14: Persist and Restore Playlists

**User Story:** As a listener, I want my playlists to survive a page refresh, so that I don't have to recreate them every visit.

#### Acceptance Criteria

1. WHEN a Playlist is created, modified, or deleted, THE Playlist_Manager SHALL write the complete current set of Playlists to LocalStorage_Store.
2. WHEN the application starts, THE Player SHALL read Playlists from LocalStorage_Store and restore them before rendering the playlist UI.
3. IF the LocalStorage_Store data is missing, THE Player SHALL initialise with an empty Playlist list without displaying an error.
4. IF the LocalStorage_Store data is present but fails JSON parsing, THE Player SHALL discard the corrupt data, initialise with an empty Playlist list, and display a one-time warning that saved data could not be loaded.
5. IF the LocalStorage_Store data contains a Playlist with a missing or non-string name field, THE Player SHALL discard that individual Playlist entry and continue loading the remaining entries.
6. IF the LocalStorage_Store data contains a Track entry within a Playlist that is missing required fields (title, artist, or src), THE Player SHALL discard that individual Track entry and continue loading the remaining Tracks.
7. IF writing to LocalStorage_Store fails, THE Playlist_Manager SHALL retain the in-memory Playlist state unchanged and display an error message indicating the Playlist could not be saved.

---

### Requirement 15: Responsive Dark UI

**User Story:** As a listener, I want a modern, responsive interface that works on desktop and mobile, so that I can use EchoBox Music on any device.

#### Acceptance Criteria

1. THE Player SHALL use a dark visual theme in which text and interactive controls are clearly distinguishable from their backgrounds in both desktop and mobile viewports.
2. THE Player SHALL display a single-column layout on mobile viewports and a multi-column layout on desktop viewports.
3. THE Now_Playing_Bar SHALL remain fixed at the bottom of the viewport at all screen sizes, and the scrollable content area SHALL have bottom padding sufficient to prevent content from being obscured by the bar.
4. THE Player SHALL render without horizontal scrollbars on narrow mobile viewports.
5. THE Player SHALL use relative units (rem, %, vw/vh) rather than fixed pixel widths for all major layout containers to support fluid resizing.

---

### Requirement 16: Track Switching Mid-Playback

**User Story:** As a listener, I want the player to cleanly handle switching tracks, so that audio doesn't overlap or stutter.

#### Acceptance Criteria

1. WHEN a user switches to a new Track, THE Audio_Engine SHALL stop audio output, unload the current Track, and load the new Track, preserving the playback state (playing or paused) that existed before the switch.
2. WHEN a Track switch occurs, THE Audio_Engine SHALL reset the seek bar to position 0 before the new Track begins loading.
3. WHEN multiple rapid Track switch actions occur in quick succession, THE Audio_Engine SHALL cancel intermediate loads and load only the final selected Track.
4. IF the new Track fails to load after the previous Track has been unloaded, THEN THE Audio_Engine SHALL stop playback, reset the seek bar to position 0, and display an error message indicating the Track could not be loaded.
5. WHEN the new Track has finished loading and the preserved playback state was playing, THE Audio_Engine SHALL begin playback of the new Track from position 0.
