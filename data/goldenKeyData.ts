import { GoldenKey } from '../types';

export const GOLDEN_KEYS: GoldenKey[] = [
  // --- MONEY GAIN (GOOD) ---
  { 
    id: 1, 
    title: '복권 당첨', 
    description: '축하합니다! 로또 2등에 당첨되었습니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 500000, message: '당첨금 50만원 수령' }) 
  },
  { 
    id: 2, 
    title: '비트코인 떡상', 
    description: '오랫동안 묻어둔 코인이 폭등했습니다!', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 1000000, message: '수익금 100만원 환전' }) 
  },
  { 
    id: 3, 
    title: '유튜브 실버버튼', 
    description: '구독자 10만명을 달성하여 수익이 발생합니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 300000, message: '광고 수익 30만원 수령' }) 
  },
  { 
    id: 4, 
    title: '연말정산 환급', 
    description: '세금 환급금이 입금되었습니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 200000, message: '환급금 20만원 수령' }) 
  },
  { 
    id: 5, 
    title: '은행 이자', 
    description: '예금 만기로 이자를 수령합니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 100000, message: '이자 10만원 수령' }) 
  },
  { 
    id: 6, 
    title: '장학금 수여', 
    description: '우수한 성적으로 장학금을 받습니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 150000, message: '장학금 15만원 수령' }) 
  },
  { 
    id: 7, 
    title: '중고 거래 대박', 
    description: '창고에 있던 물건이 비싼 값에 팔렸습니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 80000, message: '판매금 8만원 수령' }) 
  },
  { 
    id: 8, 
    title: '노벨 평화상', 
    description: '세계 평화에 기여한 공로를 인정받았습니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: 300000, message: '상금 30만원 수령' }) 
  },

  // --- MONEY LOSS (BAD) ---
  { 
    id: 9, 
    title: '건강보험료 폭탄', 
    description: '건강보험료가 인상되어 추가 납부합니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: -200000, message: '보험료 20만원 납부' }) 
  },
  { 
    id: 10, 
    title: '과속 딱지', 
    description: '속도 위반으로 과태료를 냅니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: -50000, message: '벌금 5만원 납부' }) 
  },
  { 
    id: 11, 
    title: '주식 상장 폐지', 
    description: '투자한 회사가 망했습니다. ㅠㅠ', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: -500000, message: '투자 손실 50만원' }) 
  },
  { 
    id: 12, 
    title: '보이스피싱 피해', 
    description: '사기를 당해 계좌에서 돈이 빠져나갔습니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: -300000, message: '피해액 30만원' }) 
  },
  { 
    id: 13, 
    title: '종합부동산세', 
    description: '보유한 부동산에 대한 세금을 납부하세요.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: -150000, message: '세금 15만원 납부' }) 
  },
  { 
    id: 14, 
    title: '병원비 지출', 
    description: '감기에 걸려 병원에 다녀왔습니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: -30000, message: '병원비 3만원 지출' }) 
  },

  // --- MOVEMENT (FORWARD) ---
  { 
    id: 15, 
    title: '제주도 푸른밤', 
    description: '제주도로 휴가를 떠납니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 5, message: '제주도로 이동' }) 
  },
  { 
    id: 16, 
    title: '부산행 KTX', 
    description: '부산으로 빠르게 이동합니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 25, message: '부산으로 이동' }) 
  },
  { 
    id: 17, 
    title: '서울 구경', 
    description: '대한민국의 수도 서울로 초대됩니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 39, message: '서울로 이동' }) 
  },
  { 
    id: 18, 
    title: '고속도로 질주', 
    description: '앞으로 3칸 전진합니다.', 
    type: 'MOVE', 
    effect: (curr) => ({ newPos: (curr + 3) % 40, message: '3칸 전진' }) 
  },
  { 
    id: 19, 
    title: '세계일주 시작', 
    description: '출발지로 이동하여 월급을 받으세요.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 0, message: '출발지로 이동' }) 
  },
  { 
    id: 20, 
    title: '우주여행 당첨', 
    description: '우주 정거장으로 이동합니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 10, message: '우주여행으로 이동' }) 
  },
  
  // --- MOVEMENT (BACKWARD) ---
  { 
    id: 21, 
    title: '여권 분실', 
    description: '여권을 찾아 뒤로 3칸 돌아갑니다.', 
    type: 'MOVE', 
    effect: (curr) => ({ newPos: (curr - 3 + 40) % 40, message: '뒤로 3칸 이동' }) 
  },
  { 
    id: 22, 
    title: '태풍 조우', 
    description: '악천후를 피해 뒤로 2칸 이동합니다.', 
    type: 'MOVE', 
    effect: (curr) => ({ newPos: (curr - 2 + 40) % 40, message: '뒤로 2칸 이동' }) 
  },
  { 
    id: 23, 
    title: '배탈이 났다', 
    description: '화장실을 찾아 뒤로 1칸 이동합니다.', 
    type: 'MOVE', 
    effect: (curr) => ({ newPos: (curr - 1 + 40) % 40, message: '뒤로 1칸 이동' }) 
  },

  // --- SPECIAL / MIXED ---
  { 
    id: 24, 
    title: '용의자', 
    description: '감옥에 수감됩니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 20, message: '감옥으로 강제 이동' }) 
  },
  { 
    id: 25, 
    title: '사회복지기금 기부', 
    description: '좋은 일에 동참하세요. 접수처로 이동합니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 30, message: '사회복지기금 접수처로 이동' }) 
  },
  { 
    id: 26, 
    title: '초고속 여객기', 
    description: '콩코드 여객기로 이동하여 여행을 떠납니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 15, message: '콩코드 여객기로 이동' }) 
  },
  { 
    id: 27, 
    title: '호화 유람선', 
    description: '퀸 엘리자베스호에 탑승합니다.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 28, message: '퀸 엘리자베스호로 이동' }) 
  },
  { 
    id: 28, 
    title: '마이너스 통장', 
    description: '자금이 부족해 대출 이자가 빠져나갑니다.', 
    type: 'MONEY', 
    effect: (_, b) => ({ balanceChange: Math.floor(-b * 0.1), message: '보유 자산의 10% 차감' }) 
  },
  { 
    id: 29, 
    title: '기적의 투자', 
    description: '자산 가치가 상승했습니다.', 
    type: 'MONEY', 
    effect: () => ({ balanceChange: 50000, message: '보너스 5만원' }) 
  },
  { 
    id: 30, 
    title: '관광 여행', 
    description: '서울로 가십시오.', 
    type: 'MOVE', 
    effect: () => ({ newPos: 39, message: '서울로 이동' }) 
  },
];