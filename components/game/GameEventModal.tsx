import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Check, Home, Hotel, Building, Star, Plane, HandCoins, AlertOctagon, Key, DollarSign, RefreshCw, XCircle, Rocket, Gift, MoveRight, ArrowRight, Coins, Calculator } from 'lucide-react';
import { Button } from '../ui/Button';
import { BoardCell, BuildingState, GoldenKey } from '../../types';
import { playSound } from '../../utils/sound';

export type ModalType = 'BUY_LAND' | 'PAY_TOLL' | 'GOLD_KEY' | 'INFO' | 'SELL_LAND' | 'WELFARE_PAY' | 'WELFARE_RECEIVE' | 'SPACE_TRAVEL';

interface GameEventModalProps {
  isOpen: boolean;
  type: ModalType;
  cellData: BoardCell | null;
  currentBuildings: BuildingState; 
  onConfirm: (selectedBuildings: BuildingState, totalCost: number) => void;
  onCancel: () => void;
  onSell?: (cellIds: number[]) => void; 
  playerBalance: number;
  tollAmount?: number;
  ownedLands?: BoardCell[]; 
  goldenKeyData?: { key: GoldenKey, result: { newPos?: number, balanceChange?: number, message: string } } | null;
}

const RATIOS = {
  LAND_TOLL: 0.1,    
  VILLA_COST: 0.5,   
  VILLA_TOLL: 0.8,   
  BUILD_COST: 1.0,   
  BUILD_TOLL: 1.2,   
  HOTEL_COST: 1.5,   
  HOTEL_TOLL: 2.8,   
};

export const GameEventModal: React.FC<GameEventModalProps> = ({ 
  isOpen, 
  type, 
  cellData, 
  currentBuildings,
  onConfirm, 
  onCancel,
  onSell,
  playerBalance,
  tollAmount = 0,
  ownedLands = [],
  goldenKeyData
}) => {
  const [selection, setSelection] = useState<BuildingState>({
    hasVilla: false,
    hasBuilding: false,
    hasHotel: false,
  });
  
  // Sell Land State
  const [selectedSellIds, setSelectedSellIds] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (type === 'PAY_TOLL' || type === 'SELL_LAND' || type === 'WELFARE_PAY') {
          playSound('ERROR'); 
      } else if (type === 'BUY_LAND' || type === 'WELFARE_RECEIVE') {
          playSound('TURN_START');
      } else if (type === 'GOLD_KEY' || type === 'SPACE_TRAVEL') {
          playSound('TURN_START'); 
      } else {
          playSound('CLICK');
      }

      setSelection({
        hasVilla: currentBuildings.hasVilla,
        hasBuilding: currentBuildings.hasBuilding,
        hasHotel: currentBuildings.hasHotel,
      });
      setSelectedSellIds([]);
    }
  }, [isOpen, type, currentBuildings]);

  if (!isOpen) return null;

  const formatMoney = (amount?: number) => {
    if (!amount) return '0';
    if (amount >= 100000000) return `₩ ${(amount / 100000000).toFixed(1)}억`;
    return `₩ ${(Math.abs(amount) / 10000).toLocaleString()}만`;
  };

  // --- RENDERERS ---

  const renderWelfarePayContent = () => (
      <div className="text-center py-6 space-y-4">
          <div className="w-24 h-24 mx-auto bg-red-900/20 rounded-full flex items-center justify-center border border-red-500/50">
              <HandCoins size={48} className="text-red-400" />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-red-500 mb-2">사회복지기금 납부</h2>
              <p className="text-gray-300">사회복지기금 접수처에 도착했습니다.<br/>기금으로 <span className="text-gold-400 font-bold">15만원</span>을 기부합니다.</p>
          </div>
          <Button variant="primary" className="w-full bg-red-600 border-red-500 hover:bg-red-500 text-white" onClick={() => onConfirm(selection, 0)}>납부하기</Button>
      </div>
  );

  const renderWelfareReceiveContent = () => (
      <div className="text-center py-6 space-y-4">
          <div className="w-24 h-24 mx-auto bg-green-900/20 rounded-full flex items-center justify-center border border-green-500/50 animate-pulse">
              <Gift size={48} className="text-green-400" />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-green-500 mb-2">사회복지기금 수령</h2>
              <p className="text-gray-300">축하합니다! 그동안 적립된 기금을 모두 수령합니다.</p>
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded">
                  <span className="block text-xs text-green-300 mb-1">수령 금액</span>
                  <span className="text-3xl font-mono font-bold text-white">{formatMoney(tollAmount)}</span>
              </div>
          </div>
          <Button variant="primary" className="w-full" onClick={() => onConfirm(selection, 0)}>수령하기</Button>
      </div>
  );

  const renderSpaceTravelContent = () => (
      <div className="text-center py-6 space-y-4">
          <div className="w-24 h-24 mx-auto bg-purple-900/20 rounded-full flex items-center justify-center border border-purple-500/50">
              <Rocket size={48} className="text-purple-400" />
          </div>
          <div>
              <h2 className="text-2xl font-bold text-purple-400 mb-2">우주여행</h2>
              <p className="text-gray-300">우주정거장에 도착했습니다.<br/>다음 턴에 원하는 곳으로 이동할 수 있습니다.</p>
          </div>
          <Button variant="secondary" className="w-full" onClick={onCancel}>확인</Button>
      </div>
  );

  const renderSellLandContent = () => {
      // Calculate selected total value (Now 100% refund)
      const totalSellValue = ownedLands
        .filter(l => selectedSellIds.includes(l.id))
        .reduce((sum, land) => sum + (land.price || 0), 0); // Simplified approximation or need exact build cost?
        // Note: The UI here uses simple price for display. The actual logic in GameService accounts for buildings.
        // For accurate UI, we should ideally pass the "sellValue" pre-calculated.
        // However, based on the Service logic: price * (1 + ratio) etc.
        // Let's assume for UI we display base price but add text saying "Includes buildings".
        
      const shortage = tollAmount - playerBalance;
      const remainingAfterSell = (playerBalance + totalSellValue) - tollAmount;
      const isEnough = remainingAfterSell >= 0;

      const toggleSelection = (id: number) => {
          setSelectedSellIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
          playSound('CLICK');
      };

      return (
          <div className="flex flex-col h-full max-h-[60vh]">
              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded text-center mb-4 shrink-0">
                  <h3 className="text-red-400 font-bold mb-1 flex items-center justify-center gap-2"><AlertOctagon size={16}/> 자금 부족!</h3>
                  <p className="text-xs text-gray-400">통행료 지불을 위해 보유 자산을 매각해야 합니다.</p>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4 pr-1">
                  {ownedLands.length === 0 ? (
                      <div className="text-center text-gray-500 py-10">매각할 수 있는 부동산이 없습니다. (파산 위기)</div>
                  ) : (
                      ownedLands.map(land => {
                          const isSelected = selectedSellIds.includes(land.id);
                          return (
                          <div key={land.id} 
                               className={`flex justify-between items-center p-3 rounded border cursor-pointer transition-all
                               ${isSelected ? 'bg-red-900/30 border-red-500' : 'bg-black/40 border-gray-700 hover:border-gray-500'}`}
                               onClick={() => toggleSelection(land.id)}>
                              <div className="flex items-center gap-3">
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                                      {isSelected && <Check size={12} className="text-white"/>}
                                  </div>
                                  <div>
                                      <div className="text-sm font-bold text-gray-200">{land.name}</div>
                                      <div className="text-[10px] text-gray-500">건설 비용 포함 전액 환급</div>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="font-mono font-bold text-green-400">
                                      + {formatMoney(land.price)}
                                  </div>
                              </div>
                          </div>
                      )})
                  )}
              </div>

              {/* Calculation Footer */}
              <div className="bg-black/80 border-t border-gray-800 pt-4 space-y-3 shrink-0">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-500">현재 잔액</div>
                      <div className="text-right font-mono text-gray-300">{formatMoney(playerBalance)}</div>
                      
                      <div className="text-gray-500">필요 통행료</div>
                      <div className="text-right font-mono text-red-400">- {formatMoney(tollAmount)}</div>
                      
                      <div className="text-green-500 font-bold">매각 선택 총액</div>
                      <div className="text-right font-mono text-green-400">+ {formatMoney(totalSellValue)}</div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-2 flex justify-between items-center">
                      <span className="font-bold text-gray-200">최종 잔액 (예상)</span>
                      <span className={`font-mono font-black text-lg ${isEnough ? 'text-blue-400' : 'text-red-500'}`}>
                          {isEnough ? formatMoney(remainingAfterSell) : `부족 ${formatMoney(Math.abs(remainingAfterSell))}`}
                      </span>
                  </div>

                  <Button 
                    variant="primary" 
                    className={`w-full ${isEnough ? 'bg-green-600 border-green-500' : 'bg-gray-700 border-gray-600 opacity-50'}`} 
                    disabled={!isEnough}
                    onClick={() => onSell && onSell(selectedSellIds)}
                  >
                      {isEnough ? `${selectedSellIds.length}개 매각 및 지불` : '금액이 부족합니다'}
                  </Button>
              </div>
          </div>
      );
  };

  const renderGoldenKeyContent = () => {
      const data = goldenKeyData?.key;
      const result = goldenKeyData?.result;
      const amount = result?.balanceChange;
      const isMove = data?.type === 'MOVE';
      const isMoney = data?.type === 'MONEY';

      return (
          <div className="text-center py-6 space-y-6">
               <div className="w-24 h-24 mx-auto bg-gold-500/20 rounded-full flex items-center justify-center animate-pulse">
                   <Key size={48} className="text-gold-400" />
               </div>
               <div>
                   <h2 className="text-2xl font-bold text-gold-300 mb-2">{data?.title || "황금열쇠"}</h2>
                   <p className="text-gray-300 px-4 leading-relaxed">{data?.description}</p>
               </div>
               
               {amount !== undefined && amount !== 0 && (
                   <div className={`text-xl font-mono font-bold p-3 rounded border ${amount > 0 ? 'text-green-400 bg-green-900/20 border-green-500/50' : 'text-red-400 bg-red-900/20 border-red-500/50'}`}>
                       <DollarSign className="inline mb-1" size={20}/> {amount > 0 ? '지급' : '지불'}: {formatMoney(amount)}
                   </div>
               )}

               <Button variant="primary" className="w-full" onClick={() => isMove ? onConfirm(selection, 0) : onCancel()}>
                   {isMove ? <span className="flex items-center gap-2">이동하기 <MoveRight size={16}/></span> : '확인'}
               </Button>
          </div>
      );
  };

  const renderBuyLandContent = () => {
    if (!cellData) return null;
    const isSpecialLocation = cellData.type === 'SPECIAL' || cellData.type === 'VEHICLE';
    const basePrice = cellData.price || 0;
    
    let cost = 0;
    if (selection.hasVilla && !currentBuildings.hasVilla) cost += basePrice * RATIOS.VILLA_COST;
    if (selection.hasBuilding && !currentBuildings.hasBuilding) cost += basePrice * RATIOS.BUILD_COST;
    if (selection.hasHotel && !currentBuildings.hasHotel) cost += basePrice * RATIOS.HOTEL_COST;
    
    // Projected Toll Calculation
    let projectedToll = 0;
    if (isSpecialLocation) {
        projectedToll = cellData.toll || 0;
    } else {
        projectedToll = basePrice * RATIOS.LAND_TOLL;
        // Check "existing" buildings (if already built) OR "selected" buildings
        const hasVilla = currentBuildings.hasVilla || selection.hasVilla;
        const hasBuilding = currentBuildings.hasBuilding || selection.hasBuilding;
        const hasHotel = currentBuildings.hasHotel || selection.hasHotel;

        if (hasVilla) projectedToll += basePrice * RATIOS.VILLA_TOLL;
        if (hasBuilding) projectedToll += basePrice * RATIOS.BUILD_TOLL;
        if (hasHotel) projectedToll += basePrice * RATIOS.HOTEL_TOLL;
    }
    
    const isOwned = cellData.owner !== null && cellData.owner !== undefined;
    const landPriceToPay = isOwned ? 0 : basePrice;
    const totalCost = landPriceToPay + cost;
    const canAfford = playerBalance >= totalCost;

    const toggleBuilding = (b: keyof BuildingState) => {
        setSelection(prev => ({ ...prev, [b]: !prev[b] }));
        playSound('CLICK');
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-400 text-center text-sm">
                {isOwned ? "추가 건설을 진행합니다." : "이 지역을 매입하고 건물을 건설하세요."}
            </p>

            {/* Base Land Info (Only if not owned yet) */}
            {!isOwned && (
                <div className="flex justify-between items-center bg-white/5 p-3 rounded border border-gold-500/30">
                    <span className="font-bold text-gray-200">🚩 토지 매입</span>
                    <span className="font-mono text-gold-400">₩ {formatMoney(basePrice).replace('₩ ', '')}</span>
                </div>
            )}

            {/* Buildings Selection */}
            {!isSpecialLocation && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { key: 'hasVilla', label: '별장', icon: <Home size={16}/>, cost: basePrice * RATIOS.VILLA_COST },
                        { key: 'hasBuilding', label: '빌딩', icon: <Building size={16}/>, cost: basePrice * RATIOS.BUILD_COST },
                        { key: 'hasHotel', label: '호텔', icon: <Hotel size={16}/>, cost: basePrice * RATIOS.HOTEL_COST },
                    ].map((item) => {
                         const isBuilt = currentBuildings[item.key as keyof BuildingState];
                         const isSelected = selection[item.key as keyof BuildingState];
                         
                         return (
                             <button 
                                key={item.key}
                                onClick={() => !isBuilt && toggleBuilding(item.key as keyof BuildingState)}
                                disabled={isBuilt}
                                className={`flex flex-col items-center justify-center p-3 rounded border transition-all relative overflow-hidden
                                ${isBuilt 
                                    ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed opacity-50' 
                                    : isSelected
                                        ? 'bg-gold-600 border-gold-400 text-white shadow-[0_0_15px_rgba(245,132,26,0.4)]'
                                        : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gold-500/50 hover:bg-gold-900/10'
                                }`}
                             >
                                 {item.icon}
                                 <span className="text-xs font-bold mt-2 mb-1">{item.label}</span>
                                 <span className="text-[10px] font-mono opacity-80">{formatMoney(item.cost).replace('₩ ', '')}</span>
                                 {isBuilt && <div className="absolute top-1 right-1 text-green-500"><Check size={12}/></div>}
                                 {isSelected && !isBuilt && <div className="absolute top-1 right-1 text-white"><Check size={12}/></div>}
                             </button>
                         );
                    })}
                </div>
            )}

            {/* NEW: Estimated Toll Info */}
            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-400">
                    <Calculator size={16}/>
                    <span className="text-xs font-bold uppercase">예상 통행료</span>
                </div>
                <div className="font-mono font-bold text-white">₩ {formatMoney(projectedToll).replace('₩ ', '')}</div>
            </div>

            {/* Total Cost & Action */}
             <div className="bg-black/60 p-4 rounded border border-gold-900/50 flex flex-col gap-4">
                 <div className="flex justify-between items-end border-b border-gray-800 pb-3">
                     <span className="text-sm text-gray-400">총 소요 비용</span>
                     <span className={`text-2xl font-black font-mono ${canAfford ? 'text-gold-400' : 'text-red-500'}`}>
                         {formatMoney(totalCost)}
                     </span>
                 </div>
                 <div className="flex gap-3">
                     <Button variant="secondary" className="flex-1" onClick={onCancel}>건너뛰기</Button>
                     <Button variant="primary" className="flex-[2]" disabled={!canAfford || (totalCost === 0 && isOwned)} onClick={() => onConfirm(selection, totalCost)}>
                         {isOwned ? '건설하기' : '매입하기'}
                     </Button>
                 </div>
            </div>
        </div>
    );
  };

  const renderPayTollContent = () => {
    return (
        <div className="text-center space-y-6 py-4">
            <div className="flex flex-col items-center gap-2">
                <AlertOctagon size={48} className="text-red-500 animate-bounce" />
                <h3 className="text-2xl font-bold text-red-500">통행료 지불</h3>
                <p className="text-gray-400 text-sm">다른 플레이어의 도시에 도착했습니다.</p>
            </div>
            
            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-lg">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">지불해야 할 통행료</p>
                <p className="text-3xl font-black text-white">{formatMoney(tollAmount)}</p>
            </div>
            
            {playerBalance < tollAmount && (
                <div className="bg-red-500/10 p-2 rounded">
                    <p className="text-red-500 text-sm font-bold animate-pulse">
                        ⚠️ 자금이 부족합니다. 자산을 매각하세요.
                    </p>
                </div>
            )}

            <Button 
                variant="primary" 
                className={`w-full ${playerBalance < tollAmount ? 'bg-gray-600 border-gray-500' : 'bg-red-600 border-red-500 hover:bg-red-500'} text-white`}
                onClick={() => {
                    if (playerBalance < tollAmount) {
                       // Logic handled via parent switch to SELL_LAND
                       // But visual button disabled, user must wait or parent handles state
                       // Actually, if balance < toll, GameScreen usually sets mode to SELL_LAND directly.
                       // But if we are here, maybe balance dropped or initial check passed?
                    } else {
                        onConfirm(selection, 0);
                    }
                }}
                disabled={playerBalance < tollAmount} // Disable Pay button if broke
                icon={<HandCoins size={16}/>}
            >
                통행료 지불하기
            </Button>
        </div>
    );
  };

  const renderInfoContent = () => (
     <div className="py-8 text-center text-gray-300">
        <p className="text-xl font-serif mb-2 text-white">{cellData?.name}</p>
        <p className="text-sm text-gray-500 px-8">특별한 이벤트가 없는 평화로운 지역입니다.</p>
        <div className="mt-6">
            <Button variant="secondary" className="w-full" onClick={onCancel} icon={<Check size={16}/>}>
                확인
            </Button>
        </div>
     </div>
  );

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-lg bg-luxury-panel border border-gold-600 rounded-lg shadow-[0_0_60px_rgba(245,132,26,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header - Always show for context, including BUY_LAND now */}
        <div className="h-24 relative overflow-hidden bg-black shrink-0">
            {(cellData?.image || cellData?.countryCode) ? (
                <>
                <img 
                    src={cellData?.image || `https://flagcdn.com/w640/${cellData?.countryCode}.png`} 
                    alt={cellData?.name}
                    className="w-full h-full object-cover opacity-50 mask-linear-fade-bottom"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-luxury-panel via-transparent to-transparent" />
                </>
            ) : (
                <div className="absolute inset-0 bg-gold-900/20 flex items-center justify-center">
                    {type === 'GOLD_KEY' ? <Key className="text-gold-500 opacity-20" size={64}/> : 
                    type === 'SPACE_TRAVEL' ? <Rocket className="text-purple-500 opacity-20" size={64}/> :
                    type === 'WELFARE_PAY' || type === 'WELFARE_RECEIVE' ? <Gift className="text-green-500 opacity-20" size={64} /> :
                    <MapPin className="text-gold-500/50" size={48} />}
                </div>
            )}
            
            <div className="absolute bottom-3 left-5">
                <h2 className="text-3xl font-serif font-black text-white drop-shadow-lg italic tracking-tighter">
                    {type === 'GOLD_KEY' ? 'GOLDEN KEY' : 
                    type === 'SPACE_TRAVEL' ? 'SPACE TRAVEL' :
                    type === 'WELFARE_PAY' ? 'WELFARE FUND' :
                    type === 'WELFARE_RECEIVE' ? 'FUND BONUS' :
                    cellData?.name}
                </h2>
                <p className="text-gold-400 text-xs font-mono tracking-widest uppercase">
                    {type === 'GOLD_KEY' ? 'EVENT CARD' : 
                    type === 'SPACE_TRAVEL' ? 'TELEPORT GATE' :
                    type === 'WELFARE_PAY' ? 'DONATION' :
                    type === 'WELFARE_RECEIVE' ? 'JACKPOT' :
                    (type === 'SELL_LAND' ? 'ASSET LIQUIDATION' : 
                    type === 'BUY_LAND' ? 'PURCHASE & UPGRADE' : 'EVENT')}
                </p>
            </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto">
           {type === 'SELL_LAND' && renderSellLandContent()}
           {type === 'GOLD_KEY' && renderGoldenKeyContent()}
           {type === 'BUY_LAND' && renderBuyLandContent()}
           {type === 'PAY_TOLL' && renderPayTollContent()}
           {type === 'WELFARE_PAY' && renderWelfarePayContent()}
           {type === 'WELFARE_RECEIVE' && renderWelfareReceiveContent()}
           {type === 'SPACE_TRAVEL' && renderSpaceTravelContent()}
           {type === 'INFO' && renderInfoContent()}
        </div>
      </div>
    </div>
  );
};