import { useContext, useState } from 'react';
import { PlayerContext } from '../../context/PlayerContext';

/**
 * CreatePlaylistForm — controlled form for creating a new playlist.
 *
 * Calls `playlistActions.create(name)` on submit:
 *   - Returns null on success (Req 9.1)
 *   - Returns an error string on validation failure (Req 9.2, 9.3)
 *
 * Inline errors are displayed below the input field and cleared as soon
 * as the user starts typing again.
 */
export function CreatePlaylistForm() {
  const { playlistActions } = useContext(PlayerContext);
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const err = playlistActions.create(name);
    if (err) {
      setError(err);
      return;
    }
    // Success — reset form state
    setName('');
    setError(null);
  }

  return (
    <form className="create-playlist-form" onSubmit={handleSubmit}>
      <p className="create-playlist-form__label">Create a playlist</p>
      <div className="create-playlist-form__field">
        <input
          type="text"
          className="create-playlist-form__input"
          value={name}
          onChange={e => { setName(e.target.value); setError(null); }}
          placeholder="New playlist name…"
          aria-label="New playlist name"
          aria-describedby={error ? 'create-playlist-error' : undefined}
        />
        <button
          type="submit"
          className="create-playlist-form__submit"
          aria-label="Create playlist"
        >
          +
        </button>
      </div>
      {error && (
        <p
          className="create-playlist-form__error"
          id="create-playlist-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </form>
  );
}
