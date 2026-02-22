import { useEffect } from 'react';
import { useAppStore } from './store';
import TerrainMap from './components/TerrainMap';

function App() {
  const phase = useAppStore((s) => s.phase);

  // Toggle class on #root to hide/show the gradient wash
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    if (phase === 'map') {
      root.classList.add('phase-map');
    } else {
      root.classList.remove('phase-map');
    }
  }, [phase]);

  return (
    <>
      {phase === 'map' && <TerrainMap />}
    </>
  );
}

export default App;
