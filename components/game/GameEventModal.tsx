import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Check, Home, Hotel, Building, Star, Plane, Anchor } from 'lucide-react';
import { Button } from '../ui/Button';
import { BoardCell, BuildingState } from '../../types';

export type ModalType = 'BUY_LAND' | 'PAY_TOLL' | 'GOLD_KEY' | 'INFO';

interface GameEventModalProps {
  isOpen: boolean;
  type: ModalType;
  cellData: BoardCell | null;
  currentBuildings: BuildingState; // Passed from parent to know what's already built
  onConfirm: (selectedBuildings: BuildingState, totalCost: number) => void;
  onCancel: () => void;
  playerBalance: number;
}

// Updated Balance Constants
const RATIOS = {
  LAND_TOLL: 0.1,    // 10%
  VILLA_COST: 0.5,   
  VILLA_TOLL: 0.8,   // 80%
  BUILD_COST: 1.0,   
  BUILD_TOLL: 1.2,   // 120%
  HOTEL_COST: 1.5,   
  HOTEL_TOLL: 2.8,   // 280%
};

export const GameEventModal: React.FC<GameEventModalProps> = ({ 
  isOpen, 
  type, 
  cellData, 
  currentBuildings,
  onConfirm, 
  onCancel,
  playerBalance 
}) => {
  // Local state for checkboxes
  const [selection, setSelection] = useState<BuildingState>({
    hasVilla: false,
    hasBuilding: false,
    hasHotel: false,
  });

  // Reset selection when modal opens/changes
  useEffect(() => {
    if (isOpen) {
      setSelection({
        hasVilla: currentBuildings.hasVilla,
        hasBuilding: currentBuildings.hasBuilding,
        hasHotel: currentBuildings.hasHotel,
      });
    }
  }, [isOpen, currentBuildings]);

  if (!isOpen || !cellData) return null;

  // Determine if this is a Special/Vehicle cell (No Buildings)
  const isSpecialLocation = cellData.type === 'SPECIAL' || cellData.type === 'VEHICLE';

  const basePrice = cellData.price || 0;
  // Use defined fixed toll for special cells, otherwise calculate for land
  const fixedToll = cellData.toll || 0;

  // Costs
  const calculateCost = () => {
    // If Special, we only buy the base
    if (isSpecialLocation) return 0; // Construction cost is 0, only land price matters

    let cost = 0;
    // Buildings
    if (selection.hasVilla && !currentBuildings.hasVilla) cost += basePrice * RATIOS.VILLA_COST;
    if (selection.hasBuilding && !currentBuildings.hasBuilding) cost += basePrice * RATIOS.BUILD_COST;
    if (selection.hasHotel && !currentBuildings.hasHotel) cost += basePrice * RATIOS.HOTEL_COST;
    
    return cost;
  };

  const constructionCost = calculateCost();
  
  const isOwned = cellData.owner !== null && cellData.owner !== undefined;
  // For special locations, you can only buy it once. If owned, you can't "upgrade".
  const landPriceToPay = isOwned ? 0 : basePrice;
  const totalCost = landPriceToPay + constructionCost;
  
  const canAfford = playerBalance >= totalCost;

  const calculateProjectedToll = () => {
    if (isSpecialLocation) {
        return fixedToll;
    }

    let toll = basePrice * RATIOS.LAND_TOLL;
    if (selection.hasVilla) toll += basePrice * RATIOS.VILLA_TOLL;
    if (selection.hasBuilding) toll += basePrice * RATIOS.BUILD_TOLL;
    if (selection.hasHotel) toll += basePrice * RATIOS.HOTEL_TOLL;
    return toll;
  };

  const toggleBuilding = (b: keyof BuildingState) => {
    setSelection(prev => ({ ...prev, [b]: !prev[b] }));
  };

  // Helper to format currency
  const formatMoney = (amount?: number) => {
    if (!amount) return '0';
    if (amount >= 100000000) return `₩ ${(amount / 100000000).toFixed(1)}억`;
    return `₩ ${(amount / 10000).toLocaleString()}만`;
  };

  // Icon helper
  const renderIcon = () => {
      if (cellData.type === 'VEHICLE') return <Plane size={48} className="text-blue-400 opacity-80" />;
      if (cellData.type === 'SPECIAL') return <Star size={48} className="text-purple-400 opacity-80" />;
      return <MapPin size={48} className="text-gold-500/50" />;
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-lg bg-luxury-panel border border-gold-600 rounded-lg shadow-[0_0_60px_rgba(245,132,26,0.3)] overflow-hidden flex flex-col">
        
        {/* Header Image / Pattern */}
        <div className="h-28 relative overflow-hidden bg-black shrink-0">
          {cellData.image || cellData.countryCode ? (
            <>
               <img 
                src={cellData.image || `https://flagcdn.com/w640/${cellData.countryCode}.png`} 
                alt={cellData.name}
                className="w-full h-full object-cover opacity-50 mask-linear-fade-bottom"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-luxury-panel via-transparent to-transparent" />
            </>
          ) : (
             <div className="absolute inset-0 bg-gold-900/20 flex items-center justify-center">
                {renderIcon()}
             </div>
          )}
          
          <div className="absolute bottom-3 left-5">
            <h2 className="text-3xl font-serif font-black text-white drop-shadow-lg italic tracking-tighter">{cellData.name}</h2>
            <p className="text-gold-400 text-xs font-mono tracking-widest uppercase">{cellData.engName} PROPERTY</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          
          {type === 'BUY_LAND' && (
            <>
              {isSpecialLocation ? (
                 /* Special Location UI */
                 <div className="space-y-4">
                    <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-center">
                        <h3 className="text-purple-300 font-bold mb-1">랜드마크 전용 지역</h3>
                        <p className="text-xs text-gray-400">이곳은 건물을 지을 수 없으며, 고정된 통행료가 적용됩니다.</p>
                    </div>

                    <div className="flex justify-between items-center bg-black/40 p-4 rounded border border-white/5">
                        <span className="text-gray-400 text-sm">소유권 매입가</span>
                        <span className="text-xl font-bold text-gold-300">{formatMoney(basePrice)}</span>
                    </div>

                    <div className="flex justify-between items-center bg-black/40 p-4 rounded border border-white/5">
                         <span className="text-gray-400 text-sm">고정 통행료</span>
                         <span className="text-lg font-bold text-green-400">{formatMoney(fixedToll)}</span>
                    </div>

                    {!canAfford && (
                       <p className="text-red-500 text-xs text-center animate-pulse mt-2">자금이 부족합니다.</p>
                    )}
                 </div>
              ) : (
                /* Standard Land UI */
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">
                        <span>Construction Plan</span>
                        <span>Cost / Toll Effect</span>
                    </div>

                    {/* 1. Land Base */}
                    <div className={`p-3 rounded border flex items-center justify-between transition-all ${isOwned ? 'bg-gray-900/50 border-gray-800 opacity-60' : 'bg-gold-900/20 border-gold-500/50'}`}>
                        <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isOwned ? 'bg-gray-700' : 'bg-gold-500'}`}>
                            <Check size={12} className="text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-200">기본 부지 매입</span>
                            <span className="text-[10px] text-gray-500">기본 소유권 확보</span>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-sm font-mono text-gold-300">{formatMoney(basePrice)}</div>
                        <div className="text-[10px] text-green-500">+ {formatMoney(basePrice * RATIOS.LAND_TOLL)}</div>
                        </div>
                    </div>

                    {/* 2. Villa */}
                    <div 
                        onClick={() => !currentBuildings.hasVilla && toggleBuilding('hasVilla')}
                        className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-all select-none
                        ${currentBuildings.hasVilla ? 'bg-gray-900/50 border-gray-800 opacity-60 cursor-default' : 
                        selection.hasVilla ? 'bg-blue-900/30 border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.2)]' : 'bg-black/40 border-gray-700 hover:bg-gray-800'}`}
                    >
                        <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                            ${selection.hasVilla || currentBuildings.hasVilla ? 'bg-blue-500 border-blue-500' : 'border-gray-500'}`}>
                            {(selection.hasVilla || currentBuildings.hasVilla) && <Check size={12} className="text-black" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-200 flex items-center gap-2"><Home size={14}/> 별장 건설</span>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-sm font-mono text-gray-300">{formatMoney(basePrice * RATIOS.VILLA_COST)}</div>
                        <div className="text-[10px] text-green-500">+ {formatMoney(basePrice * RATIOS.VILLA_TOLL)}</div>
                        </div>
                    </div>

                    {/* 3. Building */}
                    <div 
                        onClick={() => !currentBuildings.hasBuilding && toggleBuilding('hasBuilding')}
                        className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-all select-none
                        ${currentBuildings.hasBuilding ? 'bg-gray-900/50 border-gray-800 opacity-60 cursor-default' : 
                        selection.hasBuilding ? 'bg-purple-900/30 border-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.2)]' : 'bg-black/40 border-gray-700 hover:bg-gray-800'}`}
                    >
                        <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                            ${selection.hasBuilding || currentBuildings.hasBuilding ? 'bg-purple-500 border-purple-500' : 'border-gray-500'}`}>
                            {(selection.hasBuilding || currentBuildings.hasBuilding) && <Check size={12} className="text-black" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-200 flex items-center gap-2"><Building size={14}/> 빌딩 건설</span>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-sm font-mono text-gray-300">{formatMoney(basePrice * RATIOS.BUILD_COST)}</div>
                        <div className="text-[10px] text-green-500">+ {formatMoney(basePrice * RATIOS.BUILD_TOLL)}</div>
                        </div>
                    </div>

                    {/* 4. Hotel */}
                    <div 
                        onClick={() => !currentBuildings.hasHotel && toggleBuilding('hasHotel')}
                        className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-all select-none
                        ${currentBuildings.hasHotel ? 'bg-gray-900/50 border-gray-800 opacity-60 cursor-default' : 
                        selection.hasHotel ? 'bg-red-900/30 border-red-500 shadow-[0_0_10px_rgba(248,113,113,0.2)]' : 'bg-black/40 border-gray-700 hover:bg-gray-800'}`}
                    >
                        <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                            ${selection.hasHotel || currentBuildings.hasHotel ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                            {(selection.hasHotel || currentBuildings.hasHotel) && <Check size={12} className="text-black" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-200 flex items-center gap-2"><Hotel size={14}/> 호텔 건설</span>
                        </div>
                        </div>
                        <div className="text-right">
                        <div className="text-sm font-mono text-gray-300">{formatMoney(basePrice * RATIOS.HOTEL_COST)}</div>
                        <div className="text-[10px] text-green-500">+ {formatMoney(basePrice * RATIOS.HOTEL_TOLL)}</div>
                        </div>
                    </div>
                </div>
              )}

              {/* Summary (Only for normal Lands) */}
              {!isSpecialLocation && (
                  <div className="pt-3 border-t border-gold-900/30">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">예상 통행료 수익</span>
                        <span className="text-sm font-mono text-green-400 font-bold">{formatMoney(calculateProjectedToll())}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">총 건설 비용</span>
                        <span className="text-lg font-mono text-gold-300 font-black tracking-tight">{formatMoney(totalCost)}</span>
                    </div>
                    
                    {!canAfford && (
                    <p className="text-red-500 text-xs text-right animate-pulse bg-red-900/20 px-2 rounded">자금이 부족합니다.</p>
                    )}
                </div>
              )}
            </>
          )}

          {type === 'INFO' && (
             <div className="py-8 text-center text-gray-300">
                <p className="text-xl font-serif mb-2 text-white">{cellData.name}</p>
                <p className="text-sm text-gray-500 px-8">특별한 이벤트가 없는 평화로운 지역입니다. 잠시 쉬어갑니다.</p>
             </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-black/80 border-t border-gold-900/50 flex gap-3">
          {type === 'BUY_LAND' && (
            <>
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={onCancel}
              >
                건너뛰기
              </Button>
              <Button 
                variant="primary" 
                className="flex-[2]" 
                disabled={!canAfford || (isSpecialLocation && isOwned)}
                onClick={() => onConfirm(selection, totalCost)}
                icon={<Building2 size={16} />}
              >
                {isSpecialLocation 
                    ? (isOwned ? '매입 완료' : '인수하기') 
                    : ((isOwned && totalCost > 0) ? '증축하기' : (totalCost > 0 ? '건설 및 매입' : '확인'))
                }
              </Button>
            </>
          )}
          
          {type === 'INFO' && (
             <Button variant="secondary" className="w-full" onClick={onCancel} icon={<Check size={16}/>}>
                확인
             </Button>
          )}
        </div>
      </div>
    </div>
  );
};