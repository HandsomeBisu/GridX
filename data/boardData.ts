import { BoardCell } from '../types';

// Color Palette based on the image properties (Kept for logic, not rendering)
const COLORS = {
  PINK: '#FF69B4',
  GREEN: '#4ADE80',
  ORANGE: '#FB923C',
  BLUE: '#60A5FA',
  SPECIAL: '#A855F7',
};

export const BOARD_DATA: BoardCell[] = [
  // BOTTOM ROW (Right to Left: 0 -> 10)
  { 
    id: 0, 
    name: '출발', 
    engName: 'START', 
    type: 'START', 
    price: 0,
    image: 'https://images.unsplash.com/photo-1495819903255-00fdfa38a8de?q=80&w=400' // Abstract Start Line/Green Light
  },
  { id: 1, name: '타이베이', engName: 'Taipei', type: 'LAND', price: 50000, color: COLORS.PINK, countryCode: 'tw' },
  { 
    id: 2, 
    name: '황금열쇠', 
    engName: 'KEY', 
    type: 'GOLD_KEY',
    image: 'https://media.istockphoto.com/id/91509634/photo/ornate-gold-key-on-white.jpg?s=612x612&w=0&k=20&c=Vn259XKeSsm8DNNE0OyBYzYfmlYuOBrDlf8rmvWOUhw=' // Treasure/Gold
  },
  { id: 3, name: '베이징', engName: 'Beijing', type: 'LAND', price: 80000, color: COLORS.PINK, countryCode: 'cn' },
  { id: 4, name: '마닐라', engName: 'Manila', type: 'LAND', price: 80000, color: COLORS.PINK, countryCode: 'ph' },
  { 
    id: 5, 
    name: '제주도', 
    engName: 'Jeju Island', 
    type: 'SPECIAL', 
    price: 200000, 
    toll: 300000, // Fixed Toll
    color: COLORS.SPECIAL, 
    countryCode: 'kr' 
  },
  { id: 6, name: '싱가포르', engName: 'Singapore', type: 'LAND', price: 100000, color: COLORS.PINK, countryCode: 'sg' },
  { 
    id: 7, 
    name: '황금열쇠', 
    engName: 'KEY', 
    type: 'GOLD_KEY',
    image: 'https://media.istockphoto.com/id/91509634/photo/ornate-gold-key-on-white.jpg?s=612x612&w=0&k=20&c=Vn259XKeSsm8DNNE0OyBYzYfmlYuOBrDlf8rmvWOUhw='
  },
  { id: 8, name: '카이로', engName: 'Cairo', type: 'LAND', price: 100000, color: COLORS.PINK, countryCode: 'eg' },
  { id: 9, name: '이스탄불', engName: 'Istanbul', type: 'LAND', price: 120000, color: COLORS.PINK, countryCode: 'tr' },
  { 
    id: 10, 
    name: '우주여행', 
    engName: 'Space Travel', 
    type: 'SPACE',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400' // Earth from Space
  },

  // LEFT ROW (Bottom to Top: 11 -> 20)
  { id: 11, name: '아테네', engName: 'Athens', type: 'LAND', price: 140000, color: COLORS.GREEN, countryCode: 'gr' },
  { 
    id: 12, 
    name: '황금열쇠', 
    engName: 'KEY', 
    type: 'GOLD_KEY',
    image: 'https://media.istockphoto.com/id/91509634/photo/ornate-gold-key-on-white.jpg?s=612x612&w=0&k=20&c=Vn259XKeSsm8DNNE0OyBYzYfmlYuOBrDlf8rmvWOUhw='
  },
  { id: 13, name: '코펜하겐', engName: 'Copenhagen', type: 'LAND', price: 160000, color: COLORS.GREEN, countryCode: 'dk' },
  { id: 14, name: '스톡홀름', engName: 'Stockholm', type: 'LAND', price: 160000, color: COLORS.GREEN, countryCode: 'se' },
  { 
    id: 15, 
    name: '콩코드여객기', 
    engName: 'Concorde', 
    type: 'VEHICLE', 
    price: 200000,
    toll: 150000, // Fixed Toll
    image: 'https://images.unsplash.com/photo-1542296332-2e44a996aa0b?q=80&w=300' // Airplane
  },
  { id: 16, name: '취리히', engName: 'Zurich', type: 'LAND', price: 180000, color: COLORS.GREEN, countryCode: 'ch' },
  { 
    id: 17, 
    name: '황금열쇠', 
    engName: 'KEY', 
    type: 'GOLD_KEY',
    image: 'https://media.istockphoto.com/id/91509634/photo/ornate-gold-key-on-white.jpg?s=612x612&w=0&k=20&c=Vn259XKeSsm8DNNE0OyBYzYfmlYuOBrDlf8rmvWOUhw='
  },
  { id: 18, name: '베를린', engName: 'Berlin', type: 'LAND', price: 180000, color: COLORS.GREEN, countryCode: 'de' },
  { id: 19, name: '몬트리올', engName: 'Montreal', type: 'LAND', price: 200000, color: COLORS.GREEN, countryCode: 'ca' },
  { 
    id: 20, 
    name: '무인도', 
    engName: 'Desert Island', 
    type: 'ISLAND',
    image: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?q=80&w=400' // Tropical Island
  },

  // TOP ROW (Left to Right: 21 -> 30)
  { id: 21, name: '부에노스\n아이레스', engName: 'Buenos Aires', type: 'LAND', price: 220000, color: COLORS.ORANGE, countryCode: 'ar' },
  { 
    id: 22, 
    name: '황금열쇠', 
    engName: 'KEY', 
    type: 'GOLD_KEY',
    image: 'https://media.istockphoto.com/id/91509634/photo/ornate-gold-key-on-white.jpg?s=612x612&w=0&k=20&c=Vn259XKeSsm8DNNE0OyBYzYfmlYuOBrDlf8rmvWOUhw='
  },
  { id: 23, name: '상파울루', engName: 'Sao Paulo', type: 'LAND', price: 240000, color: COLORS.ORANGE, countryCode: 'br' },
  { id: 24, name: '시드니', engName: 'Sydney', type: 'LAND', price: 240000, color: COLORS.ORANGE, countryCode: 'au' },
  { 
    id: 25, 
    name: '부산', 
    engName: 'Busan', 
    type: 'SPECIAL', 
    price: 500000, 
    toll: 600000, // Fixed Toll
    color: COLORS.SPECIAL, 
    countryCode: 'kr' 
  },
  { id: 26, name: '하와이', engName: 'Hawaii', type: 'LAND', price: 260000, color: COLORS.ORANGE, countryCode: 'us' },
  { id: 27, name: '리스본', engName: 'Lisbon', type: 'LAND', price: 260000, color: COLORS.ORANGE, countryCode: 'pt' },
  { 
    id: 28, 
    name: '퀸엘리자베스호', 
    engName: 'Queen Elizabeth', 
    type: 'VEHICLE', 
    price: 300000,
    toll: 300000, // Fixed Toll
    image: 'https://images.unsplash.com/photo-1599640845513-26211d7eb600?q=80&w=300' // Cruise Ship
  },
  { id: 29, name: '마드리드', engName: 'Madrid', type: 'LAND', price: 280000, color: COLORS.ORANGE, countryCode: 'es' },
  { 
    id: 30, 
    name: '사회복지기금\n(접수처)', 
    engName: 'Welfare Fund', 
    type: 'FUND',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=400' // Money/Vault
  },

  // RIGHT ROW (Top to Bottom: 31 -> 39)
  { id: 31, name: '도쿄', engName: 'Tokyo', type: 'LAND', price: 300000, color: COLORS.BLUE, countryCode: 'jp' },
  { 
    id: 32, 
    name: '콜롬비아호', 
    engName: 'Columbia', 
    type: 'VEHICLE', 
    price: 450000,
    toll: 200000, // Fixed Toll (Arrival)
    image: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=300' // Rocket
  },
  { id: 33, name: '파리', engName: 'Paris', type: 'LAND', price: 320000, color: COLORS.BLUE, countryCode: 'fr' },
  { id: 34, name: '로마', engName: 'Rome', type: 'LAND', price: 320000, color: COLORS.BLUE, countryCode: 'it' },
  { 
    id: 35, 
    name: '황금열쇠', 
    engName: 'KEY', 
    type: 'GOLD_KEY',
    image: 'https://media.istockphoto.com/id/91509634/photo/ornate-gold-key-on-white.jpg?s=612x612&w=0&k=20&c=Vn259XKeSsm8DNNE0OyBYzYfmlYuOBrDlf8rmvWOUhw='
  },
  { id: 36, name: '런던', engName: 'London', type: 'LAND', price: 350000, color: COLORS.BLUE, countryCode: 'gb' },
  { id: 37, name: '뉴욕', engName: 'New York', type: 'LAND', price: 350000, color: COLORS.BLUE, countryCode: 'us' },
  { 
    id: 38, 
    name: '사회복지기금\n(수령처)', 
    engName: 'Fund Receive', 
    type: 'SPECIAL', 
    price: 0,
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=300' // Money/Currency
  },
  { 
    id: 39, 
    name: '서울', 
    engName: 'Seoul', 
    type: 'SPECIAL', // Changed to SPECIAL to prevent building
    price: 1000000, 
    toll: 2000000, // Fixed Toll
    color: COLORS.BLUE, 
    countryCode: 'kr' 
  },
];