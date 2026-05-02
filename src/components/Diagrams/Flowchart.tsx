import { useMemo } from "react";
import { Diagram } from "../Diagram/Diagram";
import type {
  DiagramSchema,
  RelationType,
  RoutingMode,
} from "../Diagram/Diagram.types";

export interface FlowchartNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
  color?: string;
}

export interface FlowchartEdge {
  from: string;
  to: string;
  /** Defaults to "association" (line with arrow on `to` end). */
  type?: RelationType;
  label?: string;
}

export interface FlowchartProps {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  /** Defaults to "manhattan". */
  routing?: RoutingMode;
  downloadable?: boolean;
  minimap?: boolean;
  className?: string;
}

const NODE_W = 160;
const NODE_H = 80;
const COL_GAP = 220;
const ROW_GAP = 140;

/** Auto-layout: lay missing-position nodes on a wrap-around grid. */
function autoLayout(nodes: FlowchartNode[]): FlowchartNode[] {
  let col = 0;
  let row = 0;
  const cols = Math.max(2, Math.ceil(Math.sqrt(nodes.length)));
  return nodes.map((n) => {
    if (n.x !== undefined && n.y !== undefined) return n;
    const placed = { ...n, x: col * COL_GAP + 40, y: row * ROW_GAP + 40 };
    col += 1;
    if (col >= cols) {
      col = 0;
      row += 1;
    }
    return placed;
  });
}

/**
 * Boxes-and-arrows flowchart. Thin schema adapter over {@link Diagram} —
 * each node becomes a label-only entity, each edge becomes a relation.
 */
export function Flowchart({
  nodes,
  edges,
  routing = "manhattan",
  downloadable = false,
  minimap = false,
  className,
}: FlowchartProps) {
  const schema: DiagramSchema = useMemo(() => {
    const placed = autoLayout(nodes);
    return {
      entities: placed.map((n) => ({
        id: n.id,
        name: n.label,
        x: n.x,
        y: n.y,
      })),
      relations: edges.map((e) => ({
        from: e.from,
        to: e.to,
        type: e.type ?? "association",
        routing,
        label: e.label,
      })),
    };
  }, [nodes, edges, routing]);

  return (
    <Diagram
      type="flowchart"
      schema={schema}
      downloadable={downloadable}
      minimap={minimap}
      className={className}
    />
  );
}

Flowchart.displayName = "Flowchart";

export { NODE_W as FLOWCHART_NODE_WIDTH, NODE_H as FLOWCHART_NODE_HEIGHT };
