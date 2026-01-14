import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Check, Home, Hotel, Building, Star, Plane, HandCoins, AlertOctagon, Key, DollarSign, RefreshCw, XCircle, Rocket, Gift, MoveRight } from 'lucide-react';
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
    return `₩ ${(Math.abs(amount) / 10000).toLocaleString()}만`;
  };

  // --- RENDERERS ---

  // ... (Keep existing simpler renderers for events)
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

  // NEW: Card Style Buy Land Content
  const renderBuyLandContent = () => {
    if (!cellData) return null;
    const isSpecialLocation = cellData.type === 'SPECIAL' || cellData.type === 'VEHICLE';
    const basePrice = cellData.price || 0;
    const fixedToll = cellData.toll || 0;
    
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
            {/* DEED CARD UI */}
            <div className="bg-[#f0f0f0] rounded-lg overflow-hidden text-black shadow-lg mx-auto w-full max-w-xs transform transition-transform hover:scale-[1.02]">
                {/* Card Header (Color Strip) */}
                <div className="h-12 flex items-center justify-center relative" style={{ backgroundColor: cellData.color || '#333' }}>
                     <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-white/80 uppercase tracking-widest font-sans font-bold">Land Title Deed</div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tight text-shadow-sm mt-1">{cellData.name}</h3>
                </div>
                
                {/* Card Body */}
                <div className="p-4 space-y-3">
                     {isSpecialLocation ? (
                         <div className="text-center space-y-2 py-4">
                             <p className="text-xs text-gray-500 uppercase tracking-wide">Fixed Rental Price</p>
                             <p className="text-2xl font-black text-gray-800">₩ {formatMoney(fixedToll).replace('₩ ','')}</p>
                         </div>
                     ) : (
                         <div className="space-y-1 text-xs font-mono text-gray-600">
                             <div className="flex justify-between border-b border-gray-300 pb-1">
                                 <span>기본 통행료</span>
                                 <span className="font-bold">₩ {formatMoney(basePrice * RATIOS.LAND_TOLL).replace('₩ ','')}</span>
                             </div>
                             <div className="flex justify-between items-center py-0.5">
                                 <span className="flex items-center gap-1"><Home size={10}/> 별장 통행료</span>
                                 <span className="font-bold">₩ {formatMoney(basePrice * (RATIOS.LAND_TOLL + RATIOS.VILLA_TOLL)).replace('₩ ','')}</span>
                             </div>
                             <div className="flex justify-between items-center py-0.5">
                                 <span className="flex items-center gap-1"><Building size={10}/> 빌딩 통행료</span>
                                 <span className="font-bold">₩ {formatMoney(basePrice * (RATIOS.LAND_TOLL + RATIOS.BUILD_TOLL)).replace('₩ ','')}</span>
                             </div>
                             <div className="flex justify-between items-center py-0.5">
                                 <span className="flex items-center gap-1"><Hotel size={10}/> 호텔 통행료</span>
                                 <span className="font-bold">₩ {formatMoney(basePrice * (RATIOS.LAND_TOLL + RATIOS.HOTEL_TOLL)).replace('₩ ','')}</span>
                             </div>
                         </div>
                     )}
                     
                     <div className="pt-2 border-t-2 border-dashed border-gray-300">
                         <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                            <span>Mortgage Value</span>
                            <span>{formatMoney(basePrice * 0.5)}</span>
                         </div>
                     </div>
                </div>
            </div>

            {/* Construction Selection (Overlaid below card) */}
            {!isSpecialLocation && (
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { key: 'hasVilla', label: '별장', icon: <Home size={14}/>, cost: RATIOS.VILLA_COST },
                        { key: 'hasBuilding', label: '빌딩', icon: <Building size={14}/>, cost: RATIOS.BUILD_COST },
                        { key: 'hasHotel', label: '호텔', icon: <Hotel size={14}/>, cost: RATIOS.HOTEL_COST },
                    ].map((item) => (
                         <button 
                            key={item.key}
                            onClick={() => !currentBuildings[item.key as keyof BuildingState] && toggleBuilding(item.key as keyof BuildingState)}
                            disabled={currentBuildings[item.key as keyof BuildingState]}
                            className={`flex flex-col items-center justify-center p-2 rounded border-2 transition-all
                            ${currentBuildings[item.key as keyof BuildingState] ? 'bg-gray-800 border-gray-700 text-gray-500 opacity-50 cursor-default' : 
                              selection[item.key as keyof BuildingState] ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-black/40 border-gray-700 text-gray-400 hover:bg-gray-800'}`}
                         >
                             {item.icon}
                             <span className="text-[10px] mt-1">{item.label}</span>
                             <span className="text-[10px] font-mono">{formatMoney(basePrice * item.cost).replace('₩ ','')}</span>
                             {(selection[item.key as keyof BuildingState] || currentBuildings[item.key as keyof BuildingState]) && <div className="absolute top-1 right-1"><Check size={8} className="text-green-500"/></div>}
                         </button>
                    ))}
                </div>
            )}
            
            {/* Summary & Action */}
            <div className="bg-black/60 p-3 rounded border border-gold-900/50 flex justify-between items-center">
                 <div className="flex flex-col">
                     <span className="text-xs text-gray-400">TOTAL COST</span>
                     <span className={`text-lg font-black font-mono ${canAfford ? 'text-gold-400' : 'text-red-500'}`}>{formatMoney(totalCost)}</span>
                 </div>
                 <div className="flex gap-2">
                     <Button variant="secondary" size="sm" onClick={onCancel}>PASS</Button>
                     <Button variant="primary" size="sm" disabled={!canAfford || (isSpecialLocation && isOwned)} onClick={() => onConfirm(selection, totalCost)}>
                         {isOwned ? '건설' : '매입'}
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
        
        {/* Header - Conditional Rendering for Cards */}
        {type !== 'BUY_LAND' && (
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
                    (type === 'SELL_LAND' ? 'ASSET LIQUIDATION' : 'EVENT')}
                </p>
            </div>
            </div>
        )}

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