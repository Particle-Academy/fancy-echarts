export interface OrgChartNode {
  id: string;
  label: string;
  color?: string;
  children?: OrgChartNode[];
}

export interface OrgChartPosition {
  id: string;
  label: string;
  color?: string;
  x: number;
  y: number;
}

export interface OrgChartEdge {
  from: string;
  to: string;
}

export interface OrgChartLayoutResult {
  nodes: OrgChartPosition[];
  edges: OrgChartEdge[];
  width: number;
  height: number;
}

const COL_WIDTH = 200;
const ROW_HEIGHT = 140;
const PADDING = 60;

interface Sized {
  node: OrgChartNode;
  depth: number;
  /** First slot index occupied by this subtree (inclusive). */
  startSlot: number;
  /** Number of leaf slots this subtree occupies. */
  span: number;
  /** Pre-computed center slot in the X axis. */
  centerSlot: number;
  children: Sized[];
}

let slotCursor = 0;

function size(node: OrgChartNode, depth: number): Sized {
  if (!node.children || node.children.length === 0) {
    const startSlot = slotCursor++;
    return { node, depth, startSlot, span: 1, centerSlot: startSlot, children: [] };
  }
  const startSlot = slotCursor;
  const sized = node.children.map((c) => size(c, depth + 1));
  const span = sized.reduce((sum, s) => sum + s.span, 0);
  // Center over middle of children's combined span.
  const centerSlot = (sized[0].centerSlot + sized[sized.length - 1].centerSlot) / 2;
  return { node, depth, startSlot, span, centerSlot, children: sized };
}

function flatten(s: Sized, out: OrgChartPosition[], edges: OrgChartEdge[]) {
  out.push({
    id: s.node.id,
    label: s.node.label,
    color: s.node.color,
    x: s.centerSlot * COL_WIDTH + PADDING,
    y: s.depth * ROW_HEIGHT + PADDING,
  });
  for (const child of s.children) {
    edges.push({ from: s.node.id, to: child.node.id });
    flatten(child, out, edges);
  }
}

/**
 * Tidy-tree layout (simplified Reingold-Tilford):
 * leaves occupy unit slots in a row; every internal node is centered over
 * the span of its descendants. Manhattan-routed edges look natural top-down.
 */
export function layoutOrgChart(root: OrgChartNode): OrgChartLayoutResult {
  slotCursor = 0;
  const sized = size(root, 0);
  const nodes: OrgChartPosition[] = [];
  const edges: OrgChartEdge[] = [];
  flatten(sized, nodes, edges);

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  return {
    nodes,
    edges,
    width: Math.max(...xs) + PADDING + COL_WIDTH,
    height: Math.max(...ys) + PADDING + ROW_HEIGHT,
  };
}
