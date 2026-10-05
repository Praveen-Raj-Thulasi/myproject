import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerContext } from '../context/PlayerContext';
import { TrackInfo } from '../components/NowPlayingBar/TrackInfo';
import { PlaybackControls } from '../components/NowPlayingBar/PlaybackControls';
import { SeekBar } from '../components/NowPlayingBar/SeekBar';

/**
 * Wraps a component in a PlayerContext.Provider with the supplied context value.
 */
function renderWithContext(ui, contextValue) {
  return render(
    <PlayerContext.Provider value={contextValue}>
      {ui}
    </PlayerContext.Provider>
  );
}

/** Builds a base context value, allowing selective overrides. */
function makeContext(overrides = {}) {
  const defaultState = {
    currentTrack: null,
    status: 'idle',
    currentTime: 0,
    duration: 0,
    volume: 1,
    queue: { tracks: [], currentIndex: -1, sourceId: null },
    error: null,
  };

  return {
    state: { ...defaultState, ...(overrides.state ?? {}) },
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
}

// ---------------------------------------------------------------------------
// Req 7.1 — TrackInfo shows title and artist when a track is loaded
// ---------------------------------------------------------------------------
describe('TrackInfo', () => {
  it('shows track title and artist when a track is loaded (Req 7.1)', () => {
    const ctx = makeContext({
      state: {
        currentTrack: {
          id: 't1',
          title: 'My Song',
          artist: 'The Band',
          album: 'Some Album',
          duration: 180,
          src: '/audio/track01.mp3',
        },
      },
    });

    renderWithContext(<TrackInfo />, ctx);

    expect(screen.getByText('My Song')).toBeInTheDocument();
    expect(screen.getByText('The Band')).toBeInTheDocument();
  });

  // Req 7.2 — TrackInfo shows placeholder text when no track is loaded
  it('shows placeholder text when no track is loaded (Req 7.2)', () => {
    const ctx = makeContext({ state: { currentTrack: null } });

    renderWithContext(<TrackInfo />, ctx);

    expect(screen.getByText('No track selected')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Req 3.5 — Loading state disables play button
// ---------------------------------------------------------------------------
describe('PlaybackControls', () => {
  it('disables the play button while status is "loading" (Req 3.5)', () => {
    const ctx = makeContext({
      state: {
        currentTrack: {
          id: 't1',
          title: 'My Song',
          artist: 'The Band',
          album: 'Some Album',
          duration: 180,
          src: '/audio/track01.mp3',
        },
        status: 'loading',
      },
    });

    renderWithContext(<PlaybackControls />, ctx);

    // When status is 'loading' (not 'playing'), the Play button is rendered
    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Req 4.6 — Seek bar range input is non-interactive when no track is loaded
// ---------------------------------------------------------------------------
describe('SeekBar', () => {
  it('disables the range input when no track is loaded (Req 4.6)', () => {
    const ctx = makeContext({ state: { currentTrack: null } });

    renderWithContext(<SeekBar />, ctx);

    const seekInput = screen.getByRole('slider', { name: /seek/i });
    expect(seekInput).toBeDisabled();
  });
});
