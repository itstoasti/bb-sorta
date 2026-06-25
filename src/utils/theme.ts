export interface Flavor {
  id: string;
  name: string;
  color: string;       // Hex color
  gradient: string[];  // Gradient colors [light/top, dark/bottom]
  textColor: string;   // Text color for label
}

export const FLAVORS: Record<string, Flavor> = {
  taro: {
    id: 'taro',
    name: 'Taro',
    color: '#B39DDB',
    gradient: ['#D1C4E9', '#7E57C2'],
    textColor: '#FFFFFF',
  },
  matcha: {
    id: 'matcha',
    name: 'Matcha',
    color: '#A5D6A7',
    gradient: ['#C8E6C9', '#4CAF50'],
    textColor: '#FFFFFF',
  },
  brownSugar: {
    id: 'brownSugar',
    name: 'Brown Sugar',
    color: '#8D6E63',
    gradient: ['#A1887F', '#5D4037'],
    textColor: '#FFFFFF',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    color: '#FF8A80',
    gradient: ['#FFCDD2', '#E53935'],
    textColor: '#FFFFFF',
  },
  mango: {
    id: 'mango',
    name: 'Mango',
    color: '#FFE082',
    gradient: ['#FFF9C4', '#FFB300'],
    textColor: '#3E2723',
  },
  blueCuracao: {
    id: 'blueCuracao',
    name: 'Blue Curacao',
    color: '#80DEEA',
    gradient: ['#B2EBF2', '#00ACC1'],
    textColor: '#FFFFFF',
  },
};

export const THEME = {
  colors: {
    background: '#0B0C10',
    backgroundCard: '#1F2833',
    textPrimary: '#C5C6C7',
    textSecondary: '#66FCF1',
    accent: '#45A29E',
    border: '#1F2833',
    glassBackground: 'rgba(255, 255, 255, 0.08)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    glassSelected: 'rgba(102, 252, 241, 0.3)',
    glassTargetable: 'rgba(102, 252, 241, 0.15)',
  },
  dimensions: {
    cupWidth: 70,
    cupHeight: 180,
    cupBorderRadius: 16,
    bobaSize: 18,
    maxCupCapacity: 4,
    maxStrawCapacity: 2,
  },
};

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
}

export const STRAW_SKINS: ShopItem[] = [
  { id: 'classic', name: 'Classic', price: 0, description: 'Standard translucent boba straw.' },
  { id: 'candy', name: 'Candy Spiral', price: 100, description: 'Pink & white spiral candy cane pattern.' },
  { id: 'gold', name: 'Golden Chrome', price: 200, description: 'Solid polished gold tube.' },
  { id: 'neon', name: 'Neon Laser', price: 350, description: 'Glowing digital cyan border.' },
];

export const CUP_STYLES: ShopItem[] = [
  { id: 'classic', name: 'Standard', price: 0, description: 'Cylindrical takeaway glass with dome lid.' },
  { id: 'cat', name: 'Cute Cat', price: 150, description: 'Molded plastic cat ears on top.' },
  { id: 'bear', name: 'Cozy Bear', price: 150, description: 'Rounded teddy bear ears on top.' },
  { id: 'jar', name: 'Mason Jar', price: 300, description: 'Classic rustic mason jar shape.' },
];

export const DECOR_ITEMS: ShopItem[] = [
  { id: 'poster', name: 'Cute Poster', price: 100, description: 'A cute sleeping boba cup poster.' },
  { id: 'plant', name: 'Hanging Plant', price: 120, description: 'Cozy potted ivy hanging from the ceiling.' },
  { id: 'neon_sign', name: 'Boba Neon Sign', price: 250, description: 'Glowing neon lights reading "BOBA".' },
];
