import { GoldenKey } from '../types';

export const GOLDEN_KEYS: GoldenKey[] = [
  // MONEY GAIN
  { id: 1, title: '복권 당첨', description: '축하합니다! 복권에 당첨되었습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 500000, message: '복권 당첨금 50만원 수령' }) },
  { id: 2, title: '은행 이자', description: '은행 예금 이자가 발생했습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 100000, message: '이자 10만원 수령' }) },
  { id: 3, title: '장학금', description: '우수한 성적으로 장학금을 받습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 200000, message: '장학금 20만원 수령' }) },
  { id: 4, title: '유산 상속', description: '먼 친척으로부터 유산을 상속받았습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 300000, message: '유산 30만원 수령' }) },
  { id: 5, title: '주식 대박', description: '투자한 주식이 상한가를 기록했습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 1000000, message: '주식 수익 100만원 수령' }) },
  { id: 6, title: '세금 환급', description: '연말 정산으로 세금을 환급받습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 150000, message: '세금 환급 15만원' }) },
  { id: 7, title: '유튜브 수익', description: '업로드한 영상이 알고리즘을 탔습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 250000, message: '광고 수익 25만원' }) },
  { id: 8, title: '중고 거래', description: '창고에 있던 물건을 비싸게 팔았습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: 50000, message: '중고 수익 5만원' }) },
  
  // MONEY LOSS
  { id: 9, title: '병원비', description: '갑작스러운 감기로 병원에 다녀왔습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: -50000, message: '병원비 5만원 지출' }) },
  { id: 10, title: '과속 딱지', description: '규정 속도를 위반했습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: -100000, message: '범칙금 10만원 지출' }) },
  { id: 11, title: '세금 납부', description: '종합부동산세를 납부할 시기입니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: -300000, message: '세금 30만원 납부' }) },
  { id: 12, title: '기부', description: '불우이웃 돕기 성금을 냅니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: -150000, message: '기부금 15만원 지출' }) },
  { id: 13, title: '주식 폭락', description: '투자한 회사가 상장 폐지되었습니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: -500000, message: '투자 손실 50만원' }) },
  { id: 14, title: '경조사비', description: '친구의 결혼식 축의금을 냅니다.', type: 'MONEY', effect: (_, b) => ({ balanceChange: -100000, message: '축의금 10만원 지출' }) },

  // MOVEMENT
  { id: 15, title: '제주도 여행', description: '제주도로 휴가를 떠납니다.', type: 'MOVE', effect: () => ({ newPos: 5, message: '제주도로 이동' }) },
  { id: 16, title: '부산 출장', description: '부산으로 급히 출장을 갑니다.', type: 'MOVE', effect: () => ({ newPos: 25, message: '부산으로 이동' }) },
  { id: 17, title: '서울 구경', description: '대한민국의 수도 서울로 이동합니다.', type: 'MOVE', effect: () => ({ newPos: 39, message: '서울로 이동' }) },
  { id: 18, title: '출발지로', description: '시작 지점으로 돌아갑니다. (월급 수령)', type: 'MOVE', effect: () => ({ newPos: 0, message: '출발지로 이동' }) },
  { id: 19, title: '뒤로 3칸', description: '길을 잃어 뒤로 돌아갑니다.', type: 'MOVE', effect: (pos) => ({ newPos: (pos - 3 + 40) % 40, message: '뒤로 3칸 이동' }) },
  { id: 20, title: '앞으로 3칸', description: '지름길을 발견했습니다.', type: 'MOVE', effect: (pos) => ({ newPos: (pos + 3) % 40, message: '앞으로 3칸 이동' }) },
  { id: 21, title: '우주여행', description: '우주 정거장으로 이동합니다.', type: 'MOVE', effect: () => ({ newPos: 10, message: '우주여행으로 이동' }) },
  { id: 22, title: '무인도 표류', description: '폭풍을 만나 무인도로 떠내려갑니다.', type: 'MOVE', effect: () => ({ newPos: 20, message: '무인도로 이동' }) },
  { id: 23, title: '사회복지기금', description: '사회복지기금 접수처로 이동합니다.', type: 'MOVE', effect: () => ({ newPos: 30, message: '사회복지기금으로 이동' }) },
  { id: 24, title: '초고속 이동', description: '콩코드 여객기로 이동합니다.', type: 'MOVE', effect: () => ({ newPos: 15, message: '콩코드 여객기로 이동' }) },
  { id: 25, title: '유람선 여행', description: '퀸엘리자베스호로 이동합니다.', type: 'MOVE', effect: () => ({ newPos: 28, message: '퀸엘리자베스호로 이동' }) },
  { id: 26, title: '로켓 발사', description: '콜롬비아호 발사대로 이동합니다.', type: 'MOVE', effect: () => ({ newPos: 32, message: '콜롬비아호로 이동' }) },
  
  // COMBINATION / SPECIAL
  { id: 27, title: '세계 일주', description: '출발지를 지나 다음 턴을 준비합니다.', type: 'MOVE', effect: () => ({ newPos: 0, balanceChange: 300000, message: '출발지로 이동 및 월급 수령' }) },
  { id: 28, title: '해외 연수', description: '뉴욕으로 어학연수를 떠납니다.', type: 'MOVE', effect: () => ({ newPos: 37, message: '뉴욕으로 이동' }) },
  { id: 29, title: '유럽 배낭여행', description: '파리로 배낭여행을 떠납니다.', type: 'MOVE', effect: () => ({ newPos: 33, message: '파리로 이동' }) },
  { id: 30, title: '건망증', description: '지갑을 두고 왔습니다. 뒤로 1칸 이동합니다.', type: 'MOVE', effect: (pos) => ({ newPos: (pos - 1 + 40) % 40, message: '뒤로 1칸 이동' }) },
];