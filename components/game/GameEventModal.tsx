import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Check, Home, Hotel, Building, Star, Plane, HandCoins, AlertOctagon, Key, DollarSign, RefreshCw, XCircle, Rocket, Gift } from 'lucide-react';
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
  onSell?: (cellId: number) => void; 
  playerBalance: number;
  tollAmount?: number;
  ownedLands?: BoardCell[]; 
  goldenKeyData?: GoldenKey | null;
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
    }
  }, [isOpen, type, currentBuildings]);

  if (!isOpen) return null;

  const formatMoney = (amount?: number) => {
    if (!amount) return '0';
    if (amount >= 100000000) return `₩ ${(amount / 100000000).toFixed(1)}억`;
    return `₩ ${(amount / 10000).toLocaleString()}만`;
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
      return (
          <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded text-center">
                  <h3 className="text-red-400 font-bold mb-1">자금 부족!</h3>
                  <p className="text-xs text-gray-400">통행료 {formatMoney(tollAmount)}을 지불하기 위해 부동산을 매각해야 합니다.</p>
              </div>
              
              <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                  {ownedLands.length === 0 ? (
                      <div className="text-center text-gray-500 py-4">매각할 수 있는 부동산이 없습니다. (파산)</div>
                  ) : (
                      ownedLands.map(land => (
                          <div key={land.id} className="flex justify-between items-center bg-black/40 p-3 rounded border border-gray-700 hover:border-gold-500 cursor-pointer group"
                               onClick={() => {
                                   if(window.confirm(`${land.name}을(를) 매각하시겠습니까? 반값만 돌려받습니다.`)) {
                                       onSell && onSell(land.id);
                                   }
                               }}>
                              <div className="flex items-center gap-2">
                                  <div className="w-2 h-8 rounded" style={{backgroundColor: land.color || '#555'}}/>
                                  <span className="text-sm font-bold">{land.name}</span>
                              </div>
                              <div className="text-right">
                                  <div className="text-xs text-gold-500">예상 매각가</div>
                                  <div className="font-mono font-bold text-white">
                                      {/* Simplified: 50% of base price. Real logic in service needs to match */}
                                      {formatMoney((land.price || 0) * 0.5)} 
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
              <Button variant="secondary" className="w-full" onClick={onCancel}>돌아가기 (잔액 확인)</Button>
          </div>
      );
  };

  const renderGoldenKeyContent = () => {
      return (
          <div className="text-center py-6 space-y-6">
               <div className="w-24 h-24 mx-auto bg-gold-500/20 rounded-full flex items-center justify-center animate-pulse">
                   <Key size={48} className="text-gold-400" />
               </div>
               <div>
                   <h2 className="text-2xl font-bold text-gold-300 mb-2">{goldenKeyData?.title || "황금열쇠"}</h2>
                   <p className="text-gray-300 px-4 leading-relaxed">{goldenKeyData?.description}</p>
               </div>
               {goldenKeyData?.type === 'MONEY' && (
                   <div className="text-xl font-mono text-green-400 font-bold">
                       {/* Value is handled in service, just generic icon here */}
                       <DollarSign className="inline mb-1" size={20}/> 정산 완료
                   </div>
               )}
               <Button variant="primary" className="w-full" onClick={onCancel}>확인</Button>
          </div>
      );
  };

  const renderBuyLandContent = () => {
    if (!cellData) return null;
    const isSpecialLocation = cellData.type === 'SPECIAL' || cellData.type === 'VEHICLE';
    const basePrice = cellData.price || 0;
    const fixedToll = cellData.toll || 0;
    
    // Logic dup from main for rendering
    let cost = 0;
    if (selection.hasVilla && !currentBuildings.hasVilla) cost += basePrice * RATIOS.VILLA_COST;
    if (selection.hasBuilding && !currentBuildings.hasBuilding) cost += basePrice * RATIOS.BUILD_COST;
    if (selection.hasHotel && !currentBuildings.hasHotel) cost += basePrice * RATIOS.HOTEL_COST;
    const isOwned = cellData.owner !== null && cellData.owner !== undefined;
    const landPriceToPay = isOwned ? 0 : basePrice;
    const totalCost = landPriceToPay + cost;
    const canAfford = playerBalance >= totalCost;

    const toggleBuilding = (b: keyof BuildingState) => {
        setSelection(prev => ({ ...prev, [b]: !prev[b] }));
        playSound('CLICK');
    };

    return (
        <div className="space-y-4">
            {isSpecialLocation ? (
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
                 </div>
              ) : (
                <div className="space-y-3">
                     <div className="flex justify-between items-center text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">
                        <span>Construction Plan</span>
                        <span>Cost / Toll Effect</span>
                    </div>

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
                        </div>
                    </div>

                     {/* Buildings Toggles */}
                     {[
                        { key: 'hasVilla', label: '별장', icon: <Home size={14}/>, cost: RATIOS.VILLA_COST, toll: RATIOS.VILLA_TOLL, color: 'blue' },
                        { key: 'hasBuilding', label: '빌딩', icon: <Building size={14}/>, cost: RATIOS.BUILD_COST, toll: RATIOS.BUILD_TOLL, color: 'purple' },
                        { key: 'hasHotel', label: '호텔', icon: <Hotel size={14}/>, cost: RATIOS.HOTEL_COST, toll: RATIOS.HOTEL_TOLL, color: 'red' },
                     ].map((item) => (
                        <div 
                            key={item.key}
                            onClick={() => !currentBuildings[item.key as keyof BuildingState] && toggleBuilding(item.key as keyof BuildingState)}
                            className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-all select-none
                            ${currentBuildings[item.key as keyof BuildingState] ? 'bg-gray-900/50 border-gray-800 opacity-60 cursor-default' : 
                            selection[item.key as keyof BuildingState] ? `bg-${item.color}-900/30 border-${item.color}-400 shadow-[0_0_10px_rgba(255,255,255,0.1)]` : 'bg-black/40 border-gray-700 hover:bg-gray-800'}`}
                        >
                             <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors 
                                    ${selection[item.key as keyof BuildingState] || currentBuildings[item.key as keyof BuildingState] ? `bg-${item.color}-500 border-${item.color}-500` : 'border-gray-500'}`}>
                                    {(selection[item.key as keyof BuildingState] || currentBuildings[item.key as keyof BuildingState]) && <Check size={12} className="text-black" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-200 flex items-center gap-2">{item.icon} {item.label} 건설</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <div className="text-sm font-mono text-gray-300">{formatMoney(basePrice * item.cost)}</div>
                             </div>
                        </div>
                     ))}
                </div>
              )}
            
            {/* Footer Summary */}
            {!isSpecialLocation && (
                  <div className="pt-3 border-t border-gold-900/30">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-400">총 건설 비용</span>
                        <span className="text-lg font-mono text-gold-300 font-black tracking-tight">{formatMoney(totalCost)}</span>
                    </div>
                    {!canAfford && (
                       <p className="text-red-500 text-xs text-right animate-pulse bg-red-900/20 px-2 rounded">자금이 부족합니다.</p>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-4">
                <Button variant="secondary" className="flex-1" onClick={onCancel}>건너뛰기</Button>
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
                       // Logic handled via modal type switch
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
        
        {/* Header */}
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
                 (type === 'SELL_LAND' ? 'ASSET LIQUIDATION' : `${cellData?.engName || 'Location'} PROPERTY`)}
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