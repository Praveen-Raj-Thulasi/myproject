/**
 * Snapshot smoke test for the responsive dark theme layout.
 *
 * Verifies that the full <App /> component tree renders without throwing
 * and captures the dark-theme structural HTML for regression detection.
 *
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

// Stub the HTML5 Audio API — jsdom does not implement HTMLAudioElement and
// PlayerProvider's useAudioEngine hook creates `new Audio()` inside a useRef.
beforeAll(() => {
  vi.stubGlobal('Audio', class {
    constructor() {}
    load() {}
    play() { return Promise.resolve(); }
    pause() {}
    addEventListener() {}
    removeEventListener() {}
    get volume() { return 1; }
    set volume(_v) {}
    get currentTime() { return 0; }
    set currentTime(_t) {}
    get duration() { return 0; }
    get src() { return ''; }
    set src(_s) {}
  });

  // Stub localStorage so PlayerProvider's init reads return null gracefully.
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('App — responsive dark theme snapshot (Req 15.1–15.5)', () => {
  it('renders the full layout without throwing and matches snapshot', () => {
    const { container } = render(<App />);

    // Smoke check: the root app-layout div must exist in the tree
    expect(container.querySelector('.app-layout')).not.toBeNull();

    // Snapshot: captures the dark-theme structural HTML.
    // First run creates the snapshot; subsequent runs detect regressions.
    expect(container).toMatchSnapshot();
  });
});
