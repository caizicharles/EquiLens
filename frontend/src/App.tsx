import { useAppStore } from './store';
import TerrainMap from './components/TerrainMap';

function App() {
  const phase = useAppStore((s) => s.phase);

  return (
    <>
      {phase === 'map' && <TerrainMap />}
    </>
  );
}

export default App;
