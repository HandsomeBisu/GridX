import React from 'react';
import { Users, Zap, History, Coins, Building2, Lock } from 'lucide-react';
import { GameRoom, Player } from '../../types';

interface GameSidebarProps {
  roomData: GameRoom;
  currentUser: any;
}

export const GameSidebar: React.FC<GameSidebarProps> = ({ roomData, currentUser }) => {
  const formatPrice = (price?: number) => {
    if (!price) return '0';
    if (price >= 100000000) return `${(price / 100000000).toFixed(1)}억`;
    if (price >= 10000) return `${price / 10000}만`;
    return price.toLocaleString();
  };

  return (
    <div className="w-80 bg-luxury-dark border-l border-gold-900 flex flex-col hidden xl:flex shadow-[-10px_0_20px_rgba(0,0,0,0.5)] z-30">
          <div className="p-4 border-b border-gold-800/30 bg-black/40 flex items-center justify-between">
            <h3 className="text-gold-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2"><Users size={14} /> PLAYERS</h3>
            <div className="text-[10px] text-gray-500 font-mono">ROOM: {roomData.name}</div>
          </div>
          
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-black/20 custom-scrollbar">
             {roomData.playerOrder.map(uid => {
               const player = roomData.players[uid] as Player;
               const lastAction = roomData.lastAction;
               // Check if this player was involved in the last action
               const isSubject = lastAction?.subjectId === uid;
               const isTarget = lastAction?.targetId === uid;
               const hasRecentEvent = (isSubject || isTarget) && (Date.now() - (lastAction?.timestamp || 0) < 10000); 

               return (
               <div key={player.id} className={`p-4 rounded-sm border relative transition-all 
                    ${player.isBankrupt ? 'bg-red-900/10 border-red-900/30 grayscale opacity-50' : 'bg-[#151515] border-gray-800'}
                    ${player.id === currentUser?.uid ? 'border-gold-500/50' : ''}
               `}>
                  
                  {/* Event Notification */}
                  {hasRecentEvent && lastAction && (
                      <div className="mb-2 p-2 bg-gradient-to-r from-gray-900 to-black border-l-2 border-gold-500 text-[10px] text-gray-200 shadow-inner animate-fade-in-up">
                          <div className="flex items-center gap-1 text-gold-400 font-bold mb-0.5 uppercase tracking-wider">
                              {isSubject ? "Action" : "Received"} <History size={10}/>
                          </div>
                          <p className="line-clamp-2 leading-tight">{lastAction.message}</p>
                          {lastAction.amount && (
                              <p className={`font-mono font-bold mt-1 ${isSubject ? 'text-red-400' : 'text-green-400'}`}>
                                  {isSubject ? '-' : '+'} ₩ {formatPrice(lastAction.amount)}
                              </p>
                          )}
                      </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600 flex items-center justify-center">
                        <span className="text-xs font-bold" style={{color: player.color}}>{player.name.substring(0,1)}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-200 flex items-center gap-2">
                            {player.name}
                            {player.id === currentUser?.uid && <span className="text-[10px] text-gold-500 bg-gold-900/30 px-1 rounded">YOU</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                             {player.isBankrupt ? <span className="text-red-500 font-bold">BANKRUPT</span> : 'Player'}
                        </div>
                      </div>
                    </div>
                    {player.isTurn && <Zap size={14} className="text-yellow-400 animate-pulse" />}
                    {player.islandTurns > 0 && <Lock size={14} className="text-red-500" />}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1"><Coins size={10}/> BALANCE</div>
                      <div className="font-mono text-gray-300">₩ {formatPrice(player.balance).replace('억', '')}</div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                      <div className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1"><Building2 size={10}/> ASSETS</div>
                      <div className="font-mono text-gray-300">{player.assets} Cities</div>
                    </div>
                  </div>
               </div>
             )})}
          </div>
        </div>
  );
};