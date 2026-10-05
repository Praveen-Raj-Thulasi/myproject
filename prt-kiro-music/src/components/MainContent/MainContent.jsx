import { useState, useContext } from 'react';
import { PlayerContext } from '../../context/PlayerContext';
import { filterTracks } from '../../utils/filterTracks';
import { SearchBar } from './SearchBar';
import { TrackList } from './TrackList';

/**
 * MainContent — search + track list.
 *
 * C1 fix: no longer dispatches LOAD_TRACK directly. Passes the queue to
 * audioEngine.loadTrack(track, queue) so there is exactly one LOAD_TRACK
 * dispatch per track selection, preserving the full catalog queue for
 * skip-next / skip-previous navigation.
 *
 * Requirements: 1.1, 2.1, 2.4, 3.1
 */
export function MainContent({ catalog }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { audioEngine } = useContext(PlayerContext);

  const filteredTracks = filterTracks(catalog, searchQuery);
  const isSearchActive = searchQuery.trim() !== '';
  const emptyMessage = isSearchActive ? 'No results found' : 'No tracks available';

  const handleTrackSelect = (track) => {
    const currentIndex = catalog.findIndex((t) => t.id === track.id);
    const queue = {
      tracks: catalog,
      currentIndex: currentIndex !== -1 ? currentIndex : 0,
      sourceId: null,
    };
    audioEngine.loadTrack(track, queue);
  };

  return (
    <main className="main-content">
      <SearchBar searchQuery={searchQuery} onSearch={setSearchQuery} />
      <TrackList
        tracks={filteredTracks}
        onTrackSelect={handleTrackSelect}
        emptyMessage={emptyMessage}
      />
    </main>
  );
}

export default MainContent;
