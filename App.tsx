import React, { useState, useEffect, useCallback } from 'react';
import { AppScreen } from './types';
import { Layout } from './components/layout/Layout';
import { MainMenu } from './components/screens/MainMenu';
import { Lobby } from './components/screens/Lobby';
import { GameScreen } from './components/screens/GameScreen';
import { MobileRestriction } from './components/screens/MobileRestriction';
import { ResolutionRestriction } from './components/screens/ResolutionRestriction';
import { auth } from './firebaseConfig';
import { User } from 'firebase/auth';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.MAIN_MENU);
  const [user, setUser] = useState<User | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTooSmall, setIsTooSmall] = useState<boolean>(false);

  // Device & Screen Detection Logic
  useEffect(() => {
    const checkEnvironment = () => {
      const userAgent = navigator.userAgent;
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 1. Check for Mobile Devices
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileScreen = width < 768; // Tablet/Phone width
      
      const mobileDetected = isMobileUA || isMobileScreen;
      setIsMobile(mobileDetected);

      // 2. Check for Desktop Resolution (Only if not mobile)
      if (!mobileDetected) {
          // Require at least 1200x720 for "Maximized" feel on standard laptops
          const minWidth = 1200;
          const minHeight = 720;
          
          if (width < minWidth || height < minHeight) {
              setIsTooSmall(true);
          } else {
              setIsTooSmall(false);
          }
      } else {
          setIsTooSmall(false);
      }
    };

    checkEnvironment();
    window.addEventListener('resize', checkEnvironment);
    
    // Auth Listener
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
        setUser(u);
    });

    return () => {
        window.removeEventListener('resize', checkEnvironment);
        unsubscribeAuth();
    };
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

  // Render Logic Priority: Mobile -> Small Screen -> Game
  if (isMobile) {
      return <MobileRestriction />;
  }

  if (isTooSmall) {
      return <ResolutionRestriction />;
  }

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