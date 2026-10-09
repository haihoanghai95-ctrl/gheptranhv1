export type PieceCount = 2 | 3 | 4 | 6 | 8 | 9 | 12 | 16;

export type CutStyle = 'classic' | 'wavy' | 'tiles';

export type Category = 'all' | 'animals' | 'vehicles' | 'dino' | 'fruits' | 'custom';

export interface PuzzleImage {
  id: string;
  title: string;
  titleEn: string;
  category: Category;
  src: string;
  isCustom?: boolean;
}

export interface EdgeDefinition {
  // 1: tab pointing outward (positive), -1: tab pointing inward (negative), 0: flat border
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PieceData {
  id: string;
  index: number;
  row: number;
  col: number;
  edges: EdgeDefinition;
  // target coordinates on board (relative to board size)
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  // current placement
  isPlaced: boolean;
  currentX: number;
  currentY: number;
  rotation: number; // 0, 90, 180, 270 (for toddler mode default 0)
}

export interface PuzzleSettings {
  pieceCount: PieceCount;
  cutStyle: CutStyle;
  allowRotation: boolean;
  ghostOpacity: number; // 0, 0.25, 0.5, 0.75
  smartAssist: boolean; // highlights target slot on selection
  soundEnabled: boolean;
  speechEnabled?: boolean;
  splitOrientation?: 'horizontal' | 'vertical'; // for 2 and 3 pieces
}
