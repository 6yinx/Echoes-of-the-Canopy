import React from 'react';
import { GameScene } from './components/GameScene';
import { HUD } from './components/UI/HUD';

const App: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden select-none">
      <GameScene />
      <HUD />
    </div>
  );
};

export default App;