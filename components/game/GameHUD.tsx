import React, { useState, useRef } from 'react';
import { Wallet, ChevronDown, Coins, LogOut, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Player, GameRoom, BoardCell, LandOwnership } from '../../types';
import { BOARD_DATA } from '../../data/boardData';
import { playSound } from '../../utils/sound';

interface GameHUDProps {
  currentUser: any;
  roomData: GameRoom;
  onDeclareBankruptcy: () => void;
  onLeaveGame: () => void;
  onOpenRules: () => void; // New Prop
}

export const GameHUD: React.FC<GameHUDProps> = ({ currentUser, roomData, onDeclareBankruptcy, onLeaveGame, onOpenRules }) => {
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const myPlayer = currentUser ? roomData.players[currentUser.uid] : null;
  const ownershipMap = roomData.ownership || {};

  const myOwnedCells = Object.entries(ownershipMap)
    .filter(([_, data]) => (data as LandOwnership).ownerId === currentUser?.uid)
    .map(([id, _]) => BOARD_DATA.find(c => c.id === Number(id)))
    .filter(Boolean) as BoardCell[];

  const realEstateValue = myOwnedCells.reduce((acc, cell) => {
      const data = ownershipMap[cell.id];
      let val = cell.price || 0;
      if (data && data.buildings.hasVilla) val += (cell.price || 0) * 0.5;
      if (data && data.buildings.hasBuilding) val += (cell.price || 0) * 1.0;
      if (data && data.buildings.hasHotel) val += (cell.price || 0) * 1.5;
      return acc + val;
  }, 0);

  const totalAssets = (myPlayer?.balance || 0) + realEstateValue;

  const formatPrice = (price?: number) => {
    if (!price) return '0';
    if (price >= 100000000) return `${(price / 100000000).toFixed(1)}억`;
    if (price >= 10000) return `${price / 10000}만`;
    return price.toLocaleString();
  };

  return (
    <div className="h-14 md:h-16 bg-luxury-panel border-b border-gold-800/60 flex items-center justify-between px-3 md:px-4 z-20 shadow-lg shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-4 relative">
            {/* Asset Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => { setShowAssetDropdown(!showAssetDropdown); playSound('CLICK'); }}
                    className={`flex items-center gap-2 md:gap-3 bg-black/50 px-2 md:px-3 py-1.5 rounded-sm border transition-all duration-200 group min-w-max ${showAssetDropdown ? 'border-gold-500 bg-gold-900/20' : 'border-gold-900 hover:border-gold-600'}`}
                >
                    <div className="bg-gold-500/20 p-1.5 rounded-full"><Wallet className="text-gold-400 w-3 h-3 md:w-4 md:h-4" /></div>
                    <div className="text-left">
                        <div className="text-[8px] md:text-[9px] text-gold-600 uppercase tracking-widest font-bold flex items-center gap-1">총 자산 <ChevronDown size={10} /></div>
                        <div className="text-xs md:text-base font-sans font-bold text-white tracking-tight">₩ {formatPrice(totalAssets)}</div>
                    </div>
                </button>
                 {showAssetDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-luxury-panel/95 backdrop-blur-md border border-gold-600/50 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[100] animate-fade-in-up flex flex-col overflow-hidden">
                       <div className="p-3 border-b border-gold-800/30 bg-black/40 flex justify-between items-center">
                           <span className="text-xs font-bold text-gold-400 uppercase tracking-wider">보유 부동산</span>
                           <span className="text-[10px] text-gray-500 font-mono">{myOwnedCells.length} / 25</span>
                       </div>
                       <div className="max-h-64 overflow-y-auto custom-scrollbar bg-black/20">
                           {myOwnedCells.map((cell) => (
                               <div key={cell.id} className="p-3 flex items-center justify-between hover:bg-gold-900/10 border-b border-white/5">
                                   <div className="flex items-center gap-2">
                                       <div className="w-1 h-6" style={{backgroundColor: cell.color || '#555'}}/>
                                       <span className="text-sm text-gray-200">{cell.name}</span>
                                   </div>
                                   <div className="text-xs text-gold-500">₩ {formatPrice(cell.price)}</div>
                               </div>
                           ))}
                       </div>
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-gold-900/50 hidden md:block shrink-0"></div>

            {/* Cash */}
            <div className="flex items-center gap-2 md:gap-3 bg-black/30 px-2 md:px-3 py-1.5 rounded-sm border border-white/5 min-w-max">
                <div className="bg-green-500/10 p-1.5 rounded-full hidden md:block"><Coins className="text-green-400 w-3 h-3 md:w-4 md:h-4" /></div>
                <div className="text-left">
                    <div className="text-[8px] md:text-[9px] text-green-600 uppercase tracking-widest font-bold">현금 자금</div>
                    <div className="text-xs md:text-sm font-sans font-bold text-gray-200 tracking-tight">₩ {formatPrice(myPlayer?.balance)}</div>
                </div>
            </div>

            {/* Welfare Fund Status */}
            <div className="hidden lg:flex items-center gap-2 md:gap-3 bg-red-900/20 px-2 md:px-3 py-1.5 rounded-sm border border-red-500/20 min-w-max">
                <div className="text-left">
                    <div className="text-[8px] md:text-[9px] text-red-400 uppercase tracking-widest font-bold">사회복지기금</div>
                    <div className="text-xs md:text-sm font-sans font-bold text-white tracking-tight">₩ {formatPrice(roomData.welfareFund || 0)}</div>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 ml-2">
           <Button variant="ghost" size="sm" onClick={onOpenRules} className="border border-white/5 bg-black/30" icon={<BookOpen size={14} />}>가이드</Button>
           <Button variant="outline" size="sm" onClick={onDeclareBankruptcy} className="border-red-900 text-red-500 hover:bg-red-900/20 hidden md:flex">파산</Button>
           <Button variant="secondary" size="sm" onClick={onLeaveGame} icon={<LogOut size={14} />}>나가기</Button>
        </div>
      </div>
  );
};