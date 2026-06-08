import SoundboardTrayButton from './components/SoundboardTrayButton';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-md">
        <h1 className="text-4xl font-bold text-white">Soundboard Standalone Mock</h1>
        <p className="text-slate-400">Click the button below to open the tray. Try resizing your browser to see the mobile layout!</p>
        <div className="flex justify-center pt-4">
          <SoundboardTrayButton streamerSlug="mock-streamer" />
        </div>
      </div>
    </div>
  );
}

export default App;
