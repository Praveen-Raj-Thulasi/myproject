import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerContext } from '../context/PlayerContext';
import { MainContent } from '../components/MainContent/MainContent';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps `ui` in a PlayerContext.Provider with a fully-wired mock context value. */
function renderWithContext(ui, overrides = {}) {
  const contextValue = {
    state: {
      currentTrack: null,
      status: 'idle',
      currentTime: 0,
      duration: 0,
      volume: 1,
      queue: { tracks: [], currentIndex: -1, sourceId: null },
      error: null,
      ...(overrides.state ?? {}),
    },
    dispatch: vi.fn(),
    audioEngine: {
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
      setVolume: vi.fn(),
      loadTrack: vi.fn(),
      skipNext: vi.fn(),
      skipPrevious: vi.fn(),
      ...(overrides.audioEngine ?? {}),
    },
    playlists: [],
    playlistActions: {
      create: vi.fn(),
      remove: vi.fn(),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      ...(overrides.playlistActions ?? {}),
    },
  };

  return render(
    <PlayerContext.Provider value={contextValue}>
      {ui}
    </PlayerContext.Provider>
  );
}

/** A small catalog of three tracks used across multiple tests. */
const sampleCatalog = [
  { id: '1', title: 'Alpha', artist: 'Artist A', album: 'Album 1', duration: 180, src: '/audio/track01.mp3' },
  { id: '2', title: 'Beta',  artist: 'Artist B', album: 'Album 2', duration: 200, src: '/audio/track02.wav' },
  { id: '3', title: 'Gamma', artist: 'Artist C', album: 'Album 3', duration: 220, src: '/audio/track03.mp3' },
];

// ---------------------------------------------------------------------------
// Req 1.1 — Track catalog renders all tracks
// ---------------------------------------------------------------------------
describe('MainContent — catalog display (Req 1.1)', () => {
  it('renders all track titles when the catalog has tracks', () => {
    renderWithContext(<MainContent catalog={sampleCatalog} />);

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Req 1.3 — Empty catalog shows "No tracks available"
// ---------------------------------------------------------------------------
describe('MainContent — empty catalog (Req 1.3)', () => {
  it('shows "No tracks available" when the catalog is empty', () => {
    renderWithContext(<MainContent catalog={[]} />);

    expect(screen.getByText('No tracks available')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Req 2.4 — Search filters track list reactively on every keystroke
// ---------------------------------------------------------------------------
describe('MainContent — reactive search filter (Req 2.4)', () => {
  it('shows only matching tracks as the user types in the search box', () => {
    renderWithContext(<MainContent catalog={sampleCatalog} />);

    const searchInput = screen.getByRole('textbox', { name: /search tracks/i });
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Req 2.3 — No results found message when search matches nothing
// ---------------------------------------------------------------------------
describe('MainContent — no search results (Req 2.3)', () => {
  it('shows "No results found" when the search query matches no tracks', () => {
    renderWithContext(<MainContent catalog={sampleCatalog} />);

    const searchInput = screen.getByRole('textbox', { name: /search tracks/i });
    fireEvent.change(searchInput, { target: { value: 'zzzzz' } });

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });
});
