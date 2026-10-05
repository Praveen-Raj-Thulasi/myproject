/**
 * SearchBar — controlled search input for filtering the track list.
 *
 * - Receives `searchQuery` (current value) and `onSearch` (callback) as props;
 *   state lives in the parent MainContent component.
 * - Updates the filtered results on every keystroke without form submission (Req 2.4).
 * - Requirements: 2.1, 2.2, 2.4
 *
 * @param {{ searchQuery: string, onSearch: (query: string) => void }} props
 */
export function SearchBar({ searchQuery, onSearch }) {
  const handleChange = (e) => {
    onSearch(e.target.value);
  };

  return (
    <div className="search-bar">
      <label htmlFor="search-input" className="search-bar__label">
        <span className="search-bar__icon" aria-hidden="true">🔍</span>
      </label>
      <input
        id="search-input"
        type="text"
        className="search-bar__input"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search tracks..."
        aria-label="Search tracks"
        autoComplete="off"
        spellCheck={false}
      />
      {searchQuery.length > 0 && (
        <button
          type="button"
          className="search-bar__clear"
          aria-label="Clear search"
          onClick={() => onSearch('')}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;
