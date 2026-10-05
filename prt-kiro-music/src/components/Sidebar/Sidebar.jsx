import '../../styles/Sidebar.css';
import { PlaylistList } from './PlaylistList';
import { CreatePlaylistForm } from './CreatePlaylistForm';

/**
 * Sidebar — fixed left panel containing the user's playlists.
 *
 * Renders a labelled landmark (`<aside>`) that wraps:
 *   - `PlaylistList`  — scrollable list of user playlists (Req 9.1, 12.2)
 *   - `CreatePlaylistForm` — pinned at the bottom (Req 9.1)
 *
 * The CSS flex column layout (see Sidebar.css `.sidebar`) makes the list
 * expand to fill available space while the form stays at the bottom.
 *
 * Requirements: 9.1, 12.2, 13.1
 */
export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Playlists">
      <h2 className="sidebar__heading">Your Playlists</h2>
      <PlaylistList />
      <CreatePlaylistForm />
    </aside>
  );
}
