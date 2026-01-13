import React, { useState, useEffect, useCallback } from 'react';
import { AppScreen } from './types';
import { Layout } from './components/layout/Layout';
import { MainMenu } from './components/screens/MainMenu';
import { Lobby } from './components/screens/Lobby';
import { GameScreen } from './components/screens/GameScreen';
import { auth } from './firebaseConfig';
import { User } from 'firebase/auth';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.MAIN_MENU);
  const [user, setUser] = useState<User | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
        setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const navigateTo = (screen: AppScreen) => {
    setCurrentScreen(screen);
  };

  // Memoize to prevent GameScreen useEffect from re-triggering on every render
  const handleEnterGame = useCallback((roomId: string) => {
      setCurrentRoomId(roomId);
      navigateTo(AppScreen.GAME);
  }, []);

  // Memoize to prevent GameScreen useEffect from re-triggering on every render
  const handleQuitGame = useCallback(() => {
      setCurrentRoomId(null);
      navigateTo(AppScreen.MAIN_MENU);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.MAIN_MENU:
        return (
          <MainMenu 
            onStart={() => navigateTo(AppScreen.GAME)} 
            onJoin={() => navigateTo(AppScreen.LOBBY)} 
          />
        );
      case AppScreen.LOBBY:
        return (
          <Lobby 
            onBack={() => navigateTo(AppScreen.MAIN_MENU)} 
            onEnterGame={handleEnterGame}
          />
        );
      case AppScreen.GAME:
        return (
          <GameScreen 
            roomId={currentRoomId}
            onQuit={handleQuitGame} 
          />
        );
      default:
        return <div>Error: Unknown Screen</div>;
    }
  };

  return (
    <Layout>
      {renderScreen()}
    </Layout>
  );
}

export default App;