import React, { useState } from 'react';
import { Users, ShoppingBag, Trophy, ArrowRight, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { auth } from '../../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, updateProfile } from 'firebase/auth';

interface MainMenuProps {
  onStart: () => void;
  onJoin: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onJoin }) => {
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Login (Host)
  const handleHostLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onJoin(); // Go to Lobby
    } catch (err: any) {
      console.error(err);
      setError("Google 로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Anonymous Login (Guest)
  const handleGuestLogin = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInAnonymously(auth);
      // Update profile with nickname
      await updateProfile(result.user, { displayName: nickname });
      onJoin(); // Go to Lobby
    } catch (err: any) {
      console.error(err);
      setError("게스트 로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 relative z-20 overflow-hidden">
      
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Logo Section */}
      <div className="mb-12 relative animate-float z-10 text-center">
         <div className="absolute inset-0 bg-gold-500/20 blur-[50px] rounded-full scale-125 animate-pulse-slow" />
         <img 
          src="https://i.postimg.cc/PxKkN3Yx/gridx-logo.png" 
          alt="GridX Logo" 
          className="w-full max-w-[500px] h-auto object-contain relative drop-shadow-[0_0_30px_rgba(245,132,26,0.5)]"
        />
        <p className="mt-4 text-gold-100/90 font-sans font-bold tracking-[0.3em] text-xs md:text-sm uppercase inline-block px-4 py-1 bg-black/60 border border-gold-800/50 backdrop-blur-sm rounded">
            하이퍼 그리드 전략 보드게임
        </p>
      </div>

      {/* Auth / Menu Section */}
      <div className="w-full max-w-sm z-50">
        
        {/* Error Message */}
        {error && (
            <div className="mb-4 p-2 bg-red-900/50 border border-red-500 text-red-200 text-xs text-center rounded">
                {error}
            </div>
        )}

        {!showGuestInput ? (
            <div className="flex flex-col gap-4 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]">
                <Button 
                    onClick={handleHostLogin} 
                    variant="primary" 
                    size="lg" 
                    className="w-full h-14 text-base border-gold-400/50"
                    icon={isLoading ? <span className="animate-spin">⏳</span> : <Trophy size={20} />}
                    disabled={isLoading}
                >
                    방 만들기 (구글 로그인)
                </Button>

                <Button 
                    onClick={() => setShowGuestInput(true)} 
                    variant="secondary" 
                    size="lg" 
                    className="w-full h-14 text-base"
                    icon={<Users size={20} />}
                    disabled={isLoading}
                >
                    게임 참가 (게스트)
                </Button>
                
                <div className="flex gap-3 pt-2">
                     <Button variant="ghost" className="flex-1 border border-white/5 bg-black/30" icon={<ShoppingBag size={16} />}>상점</Button>
                     <Button variant="ghost" className="flex-1 border border-white/5 bg-black/30" icon={<Trophy size={16} />}>랭킹</Button>
                </div>
            </div>
        ) : (
            <div className="bg-luxury-panel p-6 border border-gold-600 rounded shadow-2xl animate-fade-in-up">
                <h3 className="text-gold-400 font-bold mb-4 flex items-center gap-2">
                    <User size={18}/> 닉네임 설정
                </h3>
                <input 
                    type="text" 
                    placeholder="사용할 닉네임을 입력하세요"
                    className="w-full bg-black/50 border border-gold-800 text-white px-4 py-3 rounded mb-4 focus:border-gold-500 focus:outline-none text-sm"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                    maxLength={10}
                />
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowGuestInput(false)} className="flex-1">취소</Button>
                    <Button variant="primary" onClick={handleGuestLogin} disabled={isLoading} className="flex-[2]" icon={<ArrowRight size={16}/>}>
                        {isLoading ? '접속 중...' : '입장하기'}
                    </Button>
                </div>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-gold-700/30 text-[10px] font-mono tracking-widest">
        SYSTEM ONLINE • FIREBASE CONNECTED
      </div>
    </div>
  );
};