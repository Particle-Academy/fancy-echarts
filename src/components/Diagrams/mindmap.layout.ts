export interface MindmapNode {
  id: string;
  label: string;
  color?: string;
  children?: MindmapNode[];
}

export interface MindmapPosition {
  id: string;
  label: string;
  color?: string;
  x: number;
  y: number;
}

export interface MindmapEdge {
  from: string;
  to: string;
}

export interface MindmapLayoutResult {
  nodes: MindmapPosition[];
  edges: MindmapEdge[];
  /** Bounding box of placed nodes for viewport/centering decisions. */
  width: number;
  height: number;
}

const DEFAULT_RADII = [0, 220, 380, 520, 640, 740];

function leafCount(node: MindmapNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + leafCount(child), 0);
}

function radiusForDepth(depth: number, radii: number[]): number {
  if (depth < radii.length) return radii[depth];
  // After preset rings, keep stepping outward at a fixed cadence.
  return radii[radii.length - 1] + (depth - radii.length + 1) * 110;
}

/**
 * Polar layout: root at center, each subsequent level on a concentric ring.
 * Each child subtree gets an angular slice proportional to its leaf count
 * so dense branches don't get crammed into the same wedge as sparse ones.
 */
export function layoutMindmap(
  root: MindmapNode,
  radii: number[] = DEFAULT_RADII,
): MindmapLayoutResult {
  const positions: MindmapPosition[] = [];
  const edges: MindmapEdge[] = [];

  // Use a virtual center origin; convert to non-negative pixels at the end.
  const placed = new Map<string, { x: number; y: number }>();

  function place(
    node: MindmapNode,
    depth: number,
    angleStart: number,
    angleEnd: number,
  ): void {
    const r = radiusForDepth(depth, radii);
    const angleMid = (angleStart + angleEnd) / 2;
    const x = depth === 0 ? 0 : r * Math.cos(angleMid);
    const y = depth === 0 ? 0 : r * Math.sin(angleMid);
    placed.set(node.id, { x, y });
    positions.push({ id: node.id, label: node.label, color: node.color, x, y });

    if (!node.children || node.children.length === 0) return;
    const total = leafCount(node);
    let cursor = angleStart;
    for (const child of node.children) {
      const span = (leafCount(child) / total) * (angleEnd - angleStart);
      place(child, depth + 1, cursor, cursor + span);
      edges.push({ from: node.id, to: child.id });
      cursor += span;
    }
  }

  place(root, 0, 0, Math.PI * 2);

  // Shift to non-negative + add padding for entity boxes.
  const PADDING = 100;
  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const shifted = positions.map((p) => ({
    ...p,
    x: p.x - minX + PADDING,
    y: p.y - minY + PADDING,
  }));

  return {
    nodes: shifted,
    edges,
    width: maxX - minX + PADDING * 2,
    height: maxY - minY + PADDING * 2,
  };
}
