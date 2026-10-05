import { PlayerProvider } from './context/PlayerProvider';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MainContent } from './components/MainContent/MainContent';
import { NowPlayingBar } from './components/NowPlayingBar/NowPlayingBar';
import { LyricsPanel } from './components/NowPlayingBar/LyricsPanel';
import { CATALOG } from './data/catalog';
import './styles/global.css';

/**
 * App — root component that assembles the full EchoBox Music layout.
 *
 * Structure:
 *   PlayerProvider (global player state + audio engine)
 *     app-layout (flex row)
 *       Sidebar      — fixed-width left panel with playlists
 *       MainContent  — search + track list, receives full catalog
 *       LyricsPanel  — fixed-width right panel with synced lyrics
 *     NowPlayingBar  — fixed bottom bar (position: fixed in CSS)
 *
 * Requirements: 1.1, 7.1, 9.1
 */
function App() {
  return (
    <PlayerProvider>
      <div className="app-layout">
        <Sidebar />
        <MainContent catalog={CATALOG} />
        <LyricsPanel />
      </div>
      <NowPlayingBar />
    </PlayerProvider>
  );
}

export default App;
