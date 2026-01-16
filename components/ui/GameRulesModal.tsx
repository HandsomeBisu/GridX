import React, { useState } from 'react';
import { X, BookOpen, Building2, Plane, Coins, AlertTriangle, Trophy, Zap, RefreshCw, ShieldCheck, HeartHandshake, FileText } from 'lucide-react';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'BASIC' | 'BUILD' | 'SPECIAL' | 'SYSTEM' | 'POLICY'>('BASIC');

  if (!isOpen) return null;

  const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all border-b-2 
        ${activeTab === id 
          ? 'border-gold-500 text-gold-400 bg-gold-900/20' 
          : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-4xl h-[85vh] bg-luxury-panel border border-gold-600 rounded-lg shadow-[0_0_60px_rgba(245,132,26,0.2)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gold-800/50 bg-black/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-500/20 rounded-full border border-gold-500/50">
              <BookOpen className="text-gold-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">GAME MANUAL</h2>
              <p className="text-[10px] text-gold-600 font-mono tracking-[0.2em] uppercase">Hyper Grid Strategy Guide</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-red-900/30 rounded-full group transition-colors"
          >
            <X className="text-gray-500 group-hover:text-red-400" size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gold-900/50 bg-black/20 shrink-0">
          <TabButton id="BASIC" label="기본 규칙" icon={<Trophy size={16}/>} />
          <TabButton id="BUILD" label="건설 & 통행료" icon={<Building2 size={16}/>} />
          <TabButton id="SPECIAL" label="특수 지역" icon={<Plane size={16}/>} />
          <TabButton id="SYSTEM" label="시스템" icon={<Zap size={16}/>} />
          <TabButton id="POLICY" label="정책 및 약관" icon={<ShieldCheck size={16}/>} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-gradient-to-br from-[#111] to-[#080808]">
          
          {activeTab === 'BASIC' && (
            <div className="space-y-8 animate-fade-in-up">
              <Section title="승리 조건" color="text-gold-400">
                <p className="text-gray-300 leading-relaxed">
                  게임의 목표는 <span className="text-white font-bold">최후의 1인</span>이 되는 것입니다.<br/>
                  자신의 턴에 주사위를 굴려 이동하고, 도착한 도시를 매입하여 다른 플레이어로부터 통행료를 받으세요.<br/>
                  상대방을 파산시키면 승리합니다.
                </p>
              </Section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card icon={<Coins className="text-green-400"/>} title="초기 자금">
                    모든 플레이어는 <span className="text-green-400 font-bold font-mono">₩ 2,500,000</span> (250만원)을 가지고 시작합니다.
                 </Card>
                 <Card icon={<RefreshCw className="text-blue-400"/>} title="월급 시스템">
                    출발지(START)를 지나거나 도착할 때마다 <span className="text-blue-400 font-bold font-mono">₩ 200,000</span>의 월급을 받습니다.
                 </Card>
              </div>

              <Section title="게임 진행" color="text-white">
                <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
                  <li>자신의 턴이 되면 주사위 2개를 굴립니다.</li>
                  <li>나온 수의 합만큼 시계 방향으로 이동합니다.</li>
                  <li>도착한 칸의 소유자가 없으면 <strong>토지를 매입</strong> 할 수 있습니다.</li>
                  <li>이미 소유한 칸에 도착하면 <strong>건물을 1개</strong> 건설할 수 있습니다.</li>
                  <li>다른 사람의 칸에 도착하면 <strong>통행료</strong>를 지불해야 합니다.</li>
                </ol>
              </Section>
            </div>
          )}

          {activeTab === 'BUILD' && (
            <div className="space-y-8 animate-fade-in-up">
              <Section title="자유 건설 시스템" color="text-blue-400">
                <p className="text-gray-300 mb-4">
                  첫 방문 시에는 토지 매입만 가능합니다.<br/>
                  이후 자신의 땅을 방문할 때마다, <strong>아직 짓지 않은 건물 중 하나</strong>를 선택해 건설할 수 있습니다.<br/>
                  (예: 별장 없이 바로 호텔 건설 가능)
                  <br/><br/>
                  <span className="text-blue-400 font-bold">※ 방문 당 최대 1개의 건물만 건설 가능합니다.</span>
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <BuildingCard type="별장" multiplier="x 0.8" color="bg-blue-500" />
                    <BuildingCard type="빌딩" multiplier="x 1.2" color="bg-purple-500" />
                    <BuildingCard type="호텔" multiplier="x 2.8" color="bg-red-500" />
                </div>
              </Section>

              <Section title="통행료 규칙" color="text-red-400">
                <div className="bg-red-900/10 border border-red-500/20 p-4 rounded text-sm text-gray-300 space-y-2">
                    <p>• <strong>기본 통행료:</strong> 땅값의 20%</p>
                    <p>• <strong>건물 통행료:</strong> 건설된 모든 건물의 가치가 합산됩니다.</p>
                    <p className="text-red-400 font-bold mt-2">※ 건물을 많이 지을수록 통행료가 크게 증가하여 상대를 빠르게 파산시킬 수 있습니다.</p>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'SPECIAL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
               <SpecialCard title="우주여행" icon={<Plane/>} color="text-purple-400">
                  우주정거장(10번 칸)에 도착하면 다음 턴에 <strong>원하는 위치로 즉시 이동</strong>할 수 있습니다. 전략적 요충지입니다.
               </SpecialCard>
               <SpecialCard title="감옥" icon={<AlertTriangle/>} color="text-red-400">
                  감옥(20번 칸)에 갇히면 3턴 동안 이동할 수 없으며, <strong>다른 플레이어의 월급을 대신 지불</strong>해야 합니다.
                  <br/><span className="text-xs text-gray-500 mt-2 block">• 주사위 더블이 나오면 즉시 탈출</span>
                  <span className="text-xs text-gray-500 block">• 20만원을 지불하고 즉시 탈출 가능</span>
                  <span className="text-xs text-red-500 block mt-1">• 현금 부족 시 20만원 이상 자산 강제 매각</span>
               </SpecialCard>
               <SpecialCard title="사회복지기금" icon={<Coins/>} color="text-green-400">
                  <span className="text-green-400">수령처(38번)</span>에 도착하면 그동안 쌓인 기금을 모두 가져갑니다!
                  <br/><span className="text-xs text-gray-500 mt-2 block">• 접수처(30번) 도착 시 15만원 기부</span>
               </SpecialCard>
               <SpecialCard title="황금열쇠" icon={<BookOpen/>} color="text-gold-400">
                  예측할 수 없는 운명 카드입니다. 돈을 받거나, 잃거나, 강제 이동을 당할 수 있습니다.
               </SpecialCard>
            </div>
          )}

          {activeTab === 'SYSTEM' && (
            <div className="space-y-6 animate-fade-in-up">
              <Section title="턴 제한 시간" color="text-white">
                <div className="flex items-center gap-4 bg-gray-900 p-4 rounded border border-gray-700">
                    <div className="text-3xl font-mono font-bold text-red-500 animate-pulse">30s</div>
                    <p className="text-gray-400 text-sm">
                        원활한 게임 진행을 위해 각 턴은 <strong>30초</strong>로 제한됩니다.<br/>
                        시간 내에 주사위를 굴리지 않으면 자동으로 턴이 넘어갑니다.
                    </p>
                </div>
              </Section>
              
              <Section title="네트워크 & 저장" color="text-blue-400">
                <p className="text-gray-400 text-sm">
                    본 게임은 Firebase 기반의 실시간 네트워크 게임입니다.<br/>
                    게임 도중 나가더라도 방이 유지되는 한 <strong>재접속</strong>이 가능합니다.<br/>
                    (단, 파산 처리된 후에는 관전만 가능합니다.)
                </p>
              </Section>
            </div>
          )}
          
          {activeTab === 'POLICY' && (
            <div className="space-y-8 animate-fade-in-up">
                
                {/* 행동강령 */}
                <Section title="행동 강령 (Code of Conduct)" color="text-gold-400">
                    <div className="bg-gold-900/10 border border-gold-600/30 p-5 rounded-sm space-y-4">
                        <div className="flex gap-3 items-start">
                            <HeartHandshake className="text-gold-500 shrink-0 mt-1" size={20}/>
                            <div>
                                <h4 className="text-white font-bold mb-1">상호 존중</h4>
                                <p className="text-sm text-gray-400">
                                    함께 플레이하는 유저들을 존중해주세요. 채팅이나 닉네임을 통한 욕설, 비하 발언, 혐오 표현은 엄격히 금지됩니다.
                                </p>
                            </div>
                        </div>
                         <div className="flex gap-3 items-start">
                            <ShieldCheck className="text-gold-500 shrink-0 mt-1" size={20}/>
                            <div>
                                <h4 className="text-white font-bold mb-1">공정한 플레이</h4>
                                <p className="text-sm text-gray-400">
                                    버그 악용, 불법 프로그램 사용, 고의적인 게임 방해 행위는 제재의 대상이 될 수 있습니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 개인정보처리방침 */}
                <Section title="개인정보처리방침 (Privacy Policy)" color="text-blue-400">
                    <div className="bg-blue-900/10 border border-blue-600/30 p-5 rounded-sm">
                        <div className="flex gap-3 items-start mb-4">
                            <FileText className="text-blue-500 shrink-0 mt-1" size={20}/>
                            <div>
                                <h4 className="text-white font-bold mb-1">수집하는 개인정보 항목</h4>
                                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                    <li>구글 로그인 시: 이메일, 닉네임, 프로필 사진 (Firebase 인증 시스템 이용)</li>
                                    <li>게스트 로그인 시: 임시 식별자(UID), 사용자가 입력한 닉네임</li>
                                    <li>게임 데이터: 게임 진행 상황, 자산 정보, 승패 기록</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div className="space-y-4 text-sm text-gray-400 leading-relaxed border-t border-blue-500/20 pt-4">
                            <p>
                                <strong className="text-blue-300 block mb-1">1. 개인정보의 수집 및 이용 목적</strong>
                                수집된 정보는 오직 게임 서비스 제공, 사용자 식별, 실시간 게임 동기화를 위해서만 사용됩니다.
                            </p>
                            <p>
                                <strong className="text-blue-300 block mb-1">2. 개인정보의 보유 및 이용 기간</strong>
                                회원은 언제든지 탈퇴를 요청할 수 있으며, 탈퇴 시 수집된 개인정보는 즉시 파기됩니다. 단, 게임 방 데이터는 게임이 종료되거나 모든 사용자가 퇴장하면 자동으로 삭제됩니다.
                            </p>
                            <p>
                                <strong className="text-blue-300 block mb-1">3. 제3자 제공</strong>
                                본 서비스는 사용자의 동의 없이 개인정보를 외부에 제공하거나 위탁하지 않습니다.
                            </p>
                        </div>
                    </div>
                </Section>

                <div className="text-center pt-8 border-t border-white/5">
                    <p className="text-[10px] text-gray-600">
                        문의사항: support@dpsteam.xyz
                    </p>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Sub-components for styling
const Section = ({ title, color, children }: any) => (
    <div>
        <h3 className={`text-lg font-bold ${color} mb-3 border-l-4 border-current pl-3`}>{title}</h3>
        {children}
    </div>
);

const Card = ({ icon, title, children }: any) => (
    <div className="bg-black/40 border border-gray-800 p-4 rounded flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div>
            <h4 className="font-bold text-gray-200 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{children}</p>
        </div>
    </div>
);

const BuildingCard = ({ type, multiplier, color }: any) => (
    <div className="bg-[#151515] p-3 rounded border border-gray-800 flex flex-col items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}/>
        <span className="text-gray-300 font-bold text-sm">{type}</span>
        <span className="text-xs text-gold-500 font-mono">{multiplier}</span>
    </div>
);

const SpecialCard = ({ title, icon, color, children }: any) => (
    <div className={`p-5 rounded border bg-opacity-10 bg-white border-white/5`}>
        <div className={`flex items-center gap-2 mb-3 ${color}`}>
            {icon}
            <span className="font-bold text-lg">{title}</span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">{children}</p>
    </div>
);