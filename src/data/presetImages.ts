import { PuzzleImage } from '../types';
import puppyImg from '../assets/images/puzzle_puppy_1791556547499.jpg';
import fireTruckImg from '../assets/images/puzzle_firetruck_1791556560862.jpg';
import babyDinoImg from '../assets/images/puzzle_baby_dino_1791556572717.jpg';
import fruitsImg from '../assets/images/puzzle_fruits_1791556584145.jpg';

export const PRESET_IMAGES: PuzzleImage[] = [
  {
    id: 'puppy-meadow',
    title: 'Chú Cún Con Vui Vẻ',
    titleEn: 'Happy Puppy in the Meadow',
    category: 'animals',
    src: puppyImg,
  },
  {
    id: 'fire-truck',
    title: 'Xe Cứu Hỏa Tí Hon',
    titleEn: 'Friendly Fire Truck',
    category: 'vehicles',
    src: fireTruckImg,
  },
  {
    id: 'baby-dino',
    title: 'Khủng Long Nhí Nở Trứng',
    titleEn: 'Baby Dino Hatching',
    category: 'dino',
    src: babyDinoImg,
  },
  {
    id: 'smiling-fruits',
    title: 'Bữa Tiệc Trái Cây',
    titleEn: 'Smiling Fruit Friends',
    category: 'fruits',
    src: fruitsImg,
  },
  {
    id: 'yellow-school-bus',
    title: 'Xe Buýt Đến Trường',
    titleEn: 'Yellow School Bus',
    category: 'vehicles',
    // Crisp inline SVG data URI as fallback & instant variety
    src: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#93c5fd"/>
            <stop offset="100%" stop-color="#e0f2fe"/>
          </linearGradient>
          <linearGradient id="busBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="100%" stop-color="#eab308"/>
          </linearGradient>
        </defs>
        <rect width="800" height="420" fill="url(#sky)"/>
        <circle cx="680" cy="110" r="55" fill="#fef08a"/>
        <path d="M 680 35 L 680 15 M 755 110 L 775 110 M 680 185 L 680 205 M 605 110 L 585 110" stroke="#fde047" stroke-width="8" stroke-linecap="round"/>
        <rect y="420" width="800" height="180" fill="#86efac"/>
        <rect y="470" width="800" height="130" fill="#64748b"/>
        <line x1="0" y1="535" x2="800" y2="535" stroke="#f8fafc" stroke-width="12" stroke-dasharray="40 30"/>
        
        <!-- School Bus -->
        <g transform="translate(100, 180)">
          <!-- Body -->
          <rect x="50" y="80" width="500" height="200" rx="36" fill="url(#busBody)" stroke="#ca8a04" stroke-width="8"/>
          <path d="M 50 160 Q 50 80 120 80 L 510 80 Q 550 80 550 160 Z" fill="#facc15"/>
          <rect x="50" y="210" width="500" height="18" fill="#1e293b"/>
          <rect x="50" y="240" width="500" height="12" fill="#1e293b"/>
          <!-- Windows -->
          <rect x="90" y="105" width="85" height="75" rx="14" fill="#38bdf8" stroke="#0284c7" stroke-width="6"/>
          <rect x="195" y="105" width="85" height="75" rx="14" fill="#38bdf8" stroke="#0284c7" stroke-width="6"/>
          <rect x="300" y="105" width="85" height="75" rx="14" fill="#38bdf8" stroke="#0284c7" stroke-width="6"/>
          <rect x="405" y="105" width="105" height="75" rx="14" fill="#38bdf8" stroke="#0284c7" stroke-width="6"/>
          <!-- Little Animals / Kids in window -->
          <circle cx="132" cy="148" r="24" fill="#fbcfe8"/>
          <circle cx="124" cy="142" r="4" fill="#0f172a"/>
          <circle cx="140" cy="142" r="4" fill="#0f172a"/>
          <path d="M 128 155 Q 132 160 136 155" stroke="#db2777" stroke-width="3" fill="none"/>
          
          <circle cx="237" cy="148" r="24" fill="#fed7aa"/>
          <circle cx="229" cy="142" r="4" fill="#0f172a"/>
          <circle cx="245" cy="142" r="4" fill="#0f172a"/>
          <path d="M 233 155 Q 237 160 241 155" stroke="#ea580c" stroke-width="3" fill="none"/>

          <circle cx="342" cy="148" r="24" fill="#bbf7d0"/>
          <circle cx="334" cy="142" r="4" fill="#0f172a"/>
          <circle cx="350" cy="142" r="4" fill="#0f172a"/>
          
          <!-- Headlights -->
          <circle cx="535" cy="230" r="16" fill="#fef08a" stroke="#ca8a04" stroke-width="4"/>
          <!-- Wheels -->
          <g transform="translate(130, 260)">
            <circle cx="30" cy="30" r="46" fill="#1e293b"/>
            <circle cx="30" cy="30" r="24" fill="#94a3b8"/>
            <circle cx="30" cy="30" r="10" fill="#f1f5f9"/>
          </g>
          <g transform="translate(410, 260)">
            <circle cx="30" cy="30" r="46" fill="#1e293b"/>
            <circle cx="30" cy="30" r="24" fill="#94a3b8"/>
            <circle cx="30" cy="30" r="10" fill="#f1f5f9"/>
          </g>
        </g>
      </svg>
    `)}`,
  },
  {
    id: 'cute-panda',
    title: 'Gấu Trúc Dễ Thương',
    titleEn: 'Cute Baby Panda',
    category: 'animals',
    src: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <rect width="800" height="600" fill="#dcfce7"/>
        <g stroke="#15803d" stroke-width="22" stroke-linecap="round">
          <line x1="80" y1="600" x2="80" y2="40"/>
          <line x1="140" y1="600" x2="140" y2="90"/>
          <line x1="720" y1="600" x2="720" y2="60"/>
          <line x1="660" y1="600" x2="660" y2="120"/>
        </g>
        <!-- Panda -->
        <g transform="translate(400, 360)">
          <!-- Body -->
          <ellipse cx="0" cy="60" rx="160" ry="140" fill="#ffffff" stroke="#0f172a" stroke-width="12"/>
          <!-- Legs -->
          <ellipse cx="-120" cy="140" rx="55" ry="45" fill="#1e293b"/>
          <ellipse cx="120" cy="140" rx="55" ry="45" fill="#1e293b"/>
          <ellipse cx="-120" cy="140" rx="28" ry="20" fill="#f472b6"/>
          <ellipse cx="120" cy="140" rx="28" ry="20" fill="#f472b6"/>
          <!-- Arms -->
          <ellipse cx="-130" cy="40" rx="45" ry="60" fill="#1e293b" transform="rotate(20 -130 40)"/>
          <ellipse cx="130" cy="40" rx="45" ry="60" fill="#1e293b" transform="rotate(-20 130 40)"/>
          <!-- Bamboo in hand -->
          <line x1="90" y1="120" x2="150" y2="-60" stroke="#22c55e" stroke-width="16" stroke-linecap="round"/>
          <path d="M 140 -20 Q 180 -40 190 -20 Q 150 0 140 -20 Z" fill="#4ade80"/>
          <!-- Ears -->
          <circle cx="-100" cy="-140" r="48" fill="#1e293b"/>
          <circle cx="100" cy="-140" r="48" fill="#1e293b"/>
          <circle cx="-100" cy="-140" r="24" fill="#f472b6"/>
          <circle cx="100" cy="-140" r="24" fill="#f472b6"/>
          <!-- Head -->
          <circle cx="0" cy="-70" r="130" fill="#ffffff" stroke="#0f172a" stroke-width="12"/>
          <!-- Eye patches -->
          <ellipse cx="-45" cy="-75" rx="32" ry="42" fill="#1e293b" transform="rotate(-18 -45 -75)"/>
          <ellipse cx="45" cy="-75" rx="32" ry="42" fill="#1e293b" transform="rotate(18 45 -75)"/>
          <circle cx="-42" cy="-75" r="14" fill="#ffffff"/>
          <circle cx="42" cy="-75" r="14" fill="#ffffff"/>
          <circle cx="-40" cy="-75" r="8" fill="#0f172a"/>
          <circle cx="40" cy="-75" r="8" fill="#0f172a"/>
          <circle cx="-38" cy="-78" r="3" fill="#ffffff"/>
          <circle cx="38" cy="-78" r="3" fill="#ffffff"/>
          <!-- Cheeks -->
          <circle cx="-75" cy="-40" r="18" fill="#fbcfe8"/>
          <circle cx="75" cy="-40" r="18" fill="#fbcfe8"/>
          <!-- Nose & Mouth -->
          <ellipse cx="0" cy="-48" rx="16" ry="11" fill="#0f172a"/>
          <path d="M -15 -35 Q 0 -22 15 -35" stroke="#0f172a" stroke-width="6" stroke-linecap="round" fill="none"/>
        </g>
      </svg>
    `)}`,
  },
];
