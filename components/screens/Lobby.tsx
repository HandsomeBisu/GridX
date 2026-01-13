import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, User, RefreshCw, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { auth } from '../../firebaseConfig';
import { GameService } from '../../services/gameService';
import { GameRoom, Player } from '../../types';

interface LobbyProps {
  onBack: () => void;
  onEnterGame: (roomId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onBack, onEnterGame }) => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  // Subscribe to Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Room List
  useEffect(() => {
    const unsubscribe = GameService.subscribeToRoomList((fetchedRooms) => {
      setRooms(fetchedRooms);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async () => {
    if (!currentUser || currentUser.isAnonymous) return;
    if (!newRoomName.trim()) return;

    try {
        const roomId = await GameService.createRoom(
            { uid: currentUser.uid, displayName: currentUser.displayName },
            newRoomName
        );
        onEnterGame(roomId);
    } catch (e) {
        console.error("Error creating room:", e);
        alert("방 생성 중 오류가 발생했습니다.");
    }
  };

  const handleJoinRoom = async () => {
      if (!selectedRoom || !currentUser) return;
      try {
          await GameService.joinRoom(selectedRoom, {
              uid: currentUser.uid,
              displayName: currentUser.displayName
          });
          onEnterGame(selectedRoom);
      } catch (e: any) {
          console.error("Error joining room:", e);
          alert(e.message);
      }
  };

  const isAnonymous = currentUser?.isAnonymous;

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gold-800/30 pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} size="sm" icon={<ArrowLeft size={16} />}>
            뒤로가기
          </Button>
          <h2 className="text-3xl font-serif text-gold-400 tracking-wider italic">GAME LOBBY</h2>
        </div>
        
        {currentUser && (
            <div className="flex items-center gap-4 bg-luxury-panel px-6 py-2 rounded-sm border border-gold-800/50 shadow-lg">
            <User size={18} className="text-gold-500" />
            <span className="text-base text-white font-bold">{currentUser.displayName || 'Guest'}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${isAnonymous ? 'bg-gray-700 text-gray-300' : 'bg-blue-900 text-blue-300'}`}>
                {isAnonymous ? 'GUEST' : 'HOST'}
            </span>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-8 h-full overflow-hidden">
        
        {/* Room List (Left Panel) */}
        <div className="flex-1 bg-luxury-panel/80 border border-gold-900/60 rounded-sm flex flex-col p-1 backdrop-blur-md relative">
          
          <div className="flex justify-between items-center p-4 border-b border-gold-900/50 bg-black/40">
            <h3 className="text-gold-300 font-bold uppercase text-sm tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> 
              실시간 대기실 목록 ({rooms.length})
            </h3>
            {/* Create Room Button - Only for Non-Anonymous (Hosts) */}
            {!isAnonymous && !isCreating && (
                <Button variant="outline" size="sm" icon={<Plus size={14}/>} onClick={() => setIsCreating(true)}>방 만들기</Button>
            )}
            {isAnonymous && (
                <span className="text-xs text-gray-500">게스트는 참가만 가능합니다.</span>
            )}
          </div>

          {/* Create Room Form Overlay */}
          {isCreating && (
             <div className="p-4 bg-gold-900/20 border-b border-gold-500/30 animate-fade-in-up">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="방 제목을 입력하세요" 
                        className="flex-1 bg-black/50 border border-gold-600 px-3 py-2 text-white text-sm focus:outline-none"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                    />
                    <Button variant="secondary" size="sm" onClick={() => setIsCreating(false)}>취소</Button>
                    <Button variant="primary" size="sm" onClick={handleCreateRoom}>생성</Button>
                </div>
             </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {rooms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                    <RefreshCw size={24} className="opacity-20"/>
                    <p>생성된 방이 없습니다.</p>
                </div>
            ) : (
                rooms.map((room) => (
                <div 
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`p-5 rounded-sm border transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden
                    ${selectedRoom === room.id 
                        ? 'bg-gold-900/30 border-gold-500 shadow-[0_0_20px_rgba(245,132,26,0.15)]' 
                        : 'bg-black/60 border-white/5 hover:border-gold-700 hover:bg-gold-900/10'
                    }`}
                >
                    {/* Active Indicator Bar */}
                    {selectedRoom === room.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-500" />}

                    <div className="pl-2">
                    <div className={`font-bold text-lg mb-1 ${selectedRoom === room.id ? 'text-white' : 'text-gray-400 group-hover:text-gold-100'}`}>
                        {room.name}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">HOST: {Object.values(room.players).find((p: Player) => p.isHost)?.name}</div>
                    </div>
                    <div className="text-right">
                    <div className={`text-xs uppercase font-bold tracking-wider mb-2 px-2 py-1 rounded inline-block ${room.status === 'PLAYING' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                        {room.status === 'WAITING' ? '대기중' : '게임중'}
                    </div>
                    <div className="text-sm font-mono text-gray-500">
                        <span className="text-gold-400 text-lg">{room.currentPlayers}</span> / {room.maxPlayers}
                    </div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Room Details / Quick Start (Right Panel) */}
        <div className="w-full md:w-[380px] bg-gradient-to-b from-luxury-panel to-black border border-gold-800/60 rounded-sm p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <h3 className="text-xl font-serif text-gold-100 mb-6 border-l-4 border-gold-500 pl-4 uppercase italic">
              {selectedRoom ? '선택된 방 정보' : '준비'}
            </h3>
            
            {selectedRoom ? (
               <div className="space-y-6">
                 <div className="bg-black/60 p-5 rounded-sm border border-gold-900/80">
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Room Title</p>
                    <p className="text-gold-400 text-xl font-bold leading-tight">{rooms.find(r => r.id === selectedRoom)?.name}</p>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                     <span className="text-gray-500">현재 인원</span>
                     <span className="text-gray-300">
                        {rooms.find(r => r.id === selectedRoom)?.currentPlayers} / 4
                     </span>
                   </div>
                   <div className="flex justify-between text-sm border-b border-gray-800 pb-2">
                     <span className="text-gray-500">상태</span>
                     <span className="text-gray-300">
                        {rooms.find(r => r.id === selectedRoom)?.status}
                     </span>
                   </div>
                 </div>

                 <div className="text-center py-4">
                     {/* Show players in the room */}
                     <div className="flex gap-2 justify-center flex-wrap">
                        {rooms.find(r => r.id === selectedRoom)?.players && Object.values(rooms.find(r => r.id === selectedRoom)!.players).map((p: Player) => (
                            <div key={p.id} className="text-xs px-2 py-1 bg-gray-800 rounded border border-gray-600 text-gray-300">
                                {p.name}
                            </div>
                        ))}
                     </div>
                 </div>
               </div>
            ) : (
              <div className="text-gray-400 text-sm leading-relaxed p-4 bg-gold-900/10 rounded border border-gold-900/30">
                <p className="mb-4">목록에서 방을 선택하여 정보를 확인하거나 입장을 진행하세요.</p>
                <p>Host는 방을 생성하여 친구를 초대할 수 있습니다.</p>
              </div>
            )}
          </div>

          <div className="space-y-3 mt-8">
            <Button 
              onClick={handleJoinRoom} 
              className="w-full py-5 text-lg" 
              disabled={!selectedRoom}
              variant="primary"
              icon={<LogIn size={20}/>}
            >
              게임 입장
            </Button>
            {!selectedRoom && (
              <p className="text-center text-xs text-red-500/80 mt-2">입장할 방을 먼저 선택해주세요.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};