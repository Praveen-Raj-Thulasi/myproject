import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerContext } from '../context/PlayerContext';
import { PlaylistList } from '../components/Sidebar/PlaylistList';

/** Wraps the component in a PlayerContext.Provider with the given value. */
function renderWithContext(ui, contextValue) {
  return render(
    <PlayerContext.Provider value={contextValue}>
      {ui}
    </PlayerContext.Provider>
  );
}

/** Builds a minimal context value with the supplied playlists array. */
function makeContext(playlists) {
  return {
    state: {
      currentTrack: null,
      status: 'idle',
      currentTime: 0,
      duration: 0,
      volume: 1,
      queue: { tracks: [], currentIndex: -1, sourceId: null },
      error: null,
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
    },
    playlists,
    playlistActions: {
      create: vi.fn(),
      remove: vi.fn(() => null),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    },
  };
}

const SAMPLE_PLAYLIST = { id: 'pl-1', name: 'My Mix', tracks: [] };

// ---------------------------------------------------------------------------
// Req 13.1 — Clicking delete shows confirmation dialog
// ---------------------------------------------------------------------------
describe('PlaylistList — delete confirmation', () => {
  it('shows a confirmation dialog when the delete button is clicked (Req 13.1)', () => {
    const ctx = makeContext([SAMPLE_PLAYLIST]);
    renderWithContext(<PlaylistList />, ctx);

    // Confirmation should NOT be visible before clicking delete
    expect(screen.queryByRole('button', { name: /confirm delete/i })).toBeNull();

    // Click the delete button on the playlist row
    fireEvent.click(screen.getByRole('button', { name: 'Delete My Mix' }));

    // Both confirm and cancel buttons must now be visible
    expect(screen.getByRole('button', { name: /confirm delete my mix/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel deletion/i })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Req 13.2 — Confirming delete calls playlistActions.remove with the id
  // -------------------------------------------------------------------------
  it('calls playlistActions.remove with the playlist id when confirmed (Req 13.2)', () => {
    const ctx = makeContext([SAMPLE_PLAYLIST]);
    renderWithContext(<PlaylistList />, ctx);

    // Open the confirmation
    fireEvent.click(screen.getByRole('button', { name: 'Delete My Mix' }));

    // Click the "Delete" confirm button
    fireEvent.click(screen.getByRole('button', { name: /confirm delete my mix/i }));

    expect(ctx.playlistActions.remove).toHaveBeenCalledOnce();
    expect(ctx.playlistActions.remove).toHaveBeenCalledWith('pl-1');
  });

  // -------------------------------------------------------------------------
  // Req 13.3 — Cancelling delete keeps the playlist and hides confirmation
  // -------------------------------------------------------------------------
  it('does NOT call playlistActions.remove and hides confirmation when cancelled (Req 13.3)', () => {
    const ctx = makeContext([SAMPLE_PLAYLIST]);
    renderWithContext(<PlaylistList />, ctx);

    // Open the confirmation
    fireEvent.click(screen.getByRole('button', { name: 'Delete My Mix' }));

    // Click the "Cancel" button
    fireEvent.click(screen.getByRole('button', { name: /cancel deletion/i }));

    // remove must NOT have been called
    expect(ctx.playlistActions.remove).not.toHaveBeenCalled();

    // Confirmation UI should be gone
    expect(screen.queryByRole('button', { name: /confirm delete my mix/i })).toBeNull();

    // The playlist row itself should still be present
    expect(screen.getByRole('button', { name: 'Delete My Mix' })).toBeInTheDocument();
  });
});
