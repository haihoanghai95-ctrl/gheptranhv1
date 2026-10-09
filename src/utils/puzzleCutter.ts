import { CutStyle, EdgeDefinition, PieceCount } from '../types';

export interface GridDimensions {
  rows: number;
  cols: number;
}

export function getGridDimensions(count: PieceCount, orientation: 'horizontal' | 'vertical' = 'horizontal'): GridDimensions {
  switch (count) {
    case 2:
      return orientation === 'horizontal' ? { rows: 1, cols: 2 } : { rows: 2, cols: 1 };
    case 3:
      return orientation === 'horizontal' ? { rows: 1, cols: 3 } : { rows: 3, cols: 1 };
    case 4:
      return { rows: 2, cols: 2 };
    case 6:
      return { rows: 2, cols: 3 };
    case 8:
      return { rows: 2, cols: 4 };
    case 9:
      return { rows: 3, cols: 3 };
    case 12:
      return { rows: 3, cols: 4 };
    case 16:
      return { rows: 4, cols: 4 };
    default:
      return { rows: 2, cols: 2 };
  }
}

/**
 * Generate edge configurations for a grid so adjacent pieces interlock perfectly.
 */
export function generateGridEdges(rows: number, cols: number): EdgeDefinition[][] {
  // horizontal internal borders: (rows - 1) x cols
  // vertical internal borders: rows x (cols - 1)
  const hEdges: number[][] = [];
  for (let r = 0; r < rows - 1; r++) {
    hEdges[r] = [];
    for (let c = 0; c < cols; c++) {
      // 1 means points downward, -1 means points upward
      hEdges[r][c] = (r + c) % 2 === 0 ? 1 : -1;
    }
  }

  const vEdges: number[][] = [];
  for (let r = 0; r < rows; r++) {
    vEdges[r] = [];
    for (let c = 0; c < cols - 1; c++) {
      // 1 means points rightward, -1 means points leftward
      vEdges[r][c] = (r + c) % 2 === 0 ? 1 : -1;
    }
  }

  const result: EdgeDefinition[][] = [];
  for (let r = 0; r < rows; r++) {
    result[r] = [];
    for (let c = 0; c < cols; c++) {
      const top = r === 0 ? 0 : -hEdges[r - 1][c];
      const bottom = r === rows - 1 ? 0 : hEdges[r][c];
      const left = c === 0 ? 0 : -vEdges[r][c - 1];
      const right = c === cols - 1 ? 0 : vEdges[r][c];

      result[r][c] = { top, right, bottom, left };
    }
  }

  return result;
}

/**
 * Generates an SVG path string for a piece given its width, height, edge definition, and style.
 * Coordinates are relative to (0,0) of the piece's cell.
 * Tabs can extend outward beyond [0, w] and [0, h] by up to ~20% of cell dimension.
 */
export function generatePiecePath(
  w: number,
  h: number,
  edges: EdgeDefinition,
  style: CutStyle
): string {
  if (style === 'tiles') {
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }

  const tabDepthX = h * (style === 'wavy' ? 0.16 : 0.2);
  const tabDepthY = w * (style === 'wavy' ? 0.16 : 0.2);

  // Helper to draw edge from (x1, y1) to (x2, y2)
  // tabSign: 1 (outward to the right of travel direction), -1 (inward), 0 (straight)
  const drawEdge = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tabSign: number,
    depth: number
  ): string => {
    if (tabSign === 0) {
      return `L ${x2} ${y2}`;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Unit tangent vector along the edge
    const ux = dx / length;
    const uy = dy / length;

    // Normal vector perpendicular to the edge (points outward when tabSign > 0)
    // Left of travel direction is (-uy, ux), Right of travel direction is (uy, -ux)
    // Clockwise perimeter: top goes right, right goes down, bottom goes left, left goes up.
    // Outward tab is to the LEFT of clockwise traversal: (-uy, ux) * tabSign
    const nx = -uy * tabSign;
    const ny = ux * tabSign;

    if (style === 'wavy') {
      // Gentle wavy toddler curve
      const p1x = x1 + ux * (length * 0.35);
      const p1y = y1 + uy * (length * 0.35);
      const p2x = x1 + ux * (length * 0.65);
      const p2y = y1 + uy * (length * 0.65);

      const peakX = x1 + ux * (length * 0.5) + nx * depth;
      const peakY = y1 + uy * (length * 0.5) + ny * depth;

      return (
        `L ${p1x} ${p1y} ` +
        `Q ${peakX} ${peakY} ${p2x} ${p2y} ` +
        `L ${x2} ${y2}`
      );
    }

    // Classic interlocking puzzle tab with smooth rounded head and neck
    const s1 = 0.36; // straight before tab
    const s2 = 0.44; // neck start
    const s3 = 0.50; // head peak
    const s4 = 0.56; // neck end
    const s5 = 0.64; // return to line

    const p0x = x1 + ux * (length * s1);
    const p0y = y1 + uy * (length * s1);

    const cp1x = x1 + ux * (length * s2) + nx * (depth * 0.2);
    const cp1y = y1 + uy * (length * s2) + ny * (depth * 0.2);

    const headLeftX = x1 + ux * (length * (s3 - 0.12)) + nx * depth;
    const headLeftY = y1 + uy * (length * (s3 - 0.12)) + ny * depth;

    const headTopX = x1 + ux * (length * s3) + nx * (depth * 1.08);
    const headTopY = y1 + uy * (length * s3) + ny * (depth * 1.08);

    const headRightX = x1 + ux * (length * (s3 + 0.12)) + nx * depth;
    const headRightY = y1 + uy * (length * (s3 + 0.12)) + ny * depth;

    const cp2x = x1 + ux * (length * s4) + nx * (depth * 0.2);
    const cp2y = y1 + uy * (length * s4) + ny * (depth * 0.2);

    const p3x = x1 + ux * (length * s5);
    const p3y = y1 + uy * (length * s5);

    return (
      `L ${p0x} ${p0y} ` +
      `C ${cp1x} ${cp1y}, ${headLeftX} ${headLeftY}, ${headTopX} ${headTopY} ` +
      `C ${headRightX} ${headRightY}, ${cp2x} ${cp2y}, ${p3x} ${p3y} ` +
      `L ${x2} ${y2}`
    );
  };

  let path = `M 0 0 `;
  // Top edge: (0,0) -> (w,0)
  path += drawEdge(0, 0, w, 0, edges.top, tabDepthX) + ' ';
  // Right edge: (w,0) -> (w,h)
  path += drawEdge(w, 0, w, h, edges.right, tabDepthY) + ' ';
  // Bottom edge: (w,h) -> (0,h)
  path += drawEdge(w, h, 0, h, edges.bottom, tabDepthX) + ' ';
  // Left edge: (0,h) -> (0,0)
  path += drawEdge(0, h, 0, 0, edges.left, tabDepthY) + ' ';
  path += 'Z';

  return path;
}
