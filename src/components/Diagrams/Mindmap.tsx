import { useMemo } from "react";
import { Diagram } from "../Diagram/Diagram";
import type { DiagramSchema } from "../Diagram/Diagram.types";
import { layoutMindmap, type MindmapNode } from "./mindmap.layout";

export type { MindmapNode };

export interface MindmapProps {
  root: MindmapNode;
  /** Override the default ring radii (level 0 is always center). */
  radii?: number[];
  downloadable?: boolean;
  minimap?: boolean;
  className?: string;
}

/**
 * Radial mindmap. Root at center; children fan outward on concentric rings
 * using bezier-routed connectors. Angular wedges are sized by subtree leaf
 * count so dense branches get more room than sparse ones.
 */
export function Mindmap({
  root,
  radii,
  downloadable = false,
  minimap = false,
  className,
}: MindmapProps) {
  const schema: DiagramSchema = useMemo(() => {
    const layout = layoutMindmap(root, radii);
    return {
      entities: layout.nodes.map((n) => ({
        id: n.id,
        name: n.label,
        x: n.x,
        y: n.y,
      })),
      relations: layout.edges.map((e) => ({
        from: e.from,
        to: e.to,
        type: "association" as const,
        routing: "bezier" as const,
        toMarker: "none",
        fromMarker: "none",
      })),
    };
  }, [root, radii]);

  return (
    <Diagram
      type="general"
      schema={schema}
      downloadable={downloadable}
      minimap={minimap}
      className={className}
    />
  );
}

Mindmap.displayName = "Mindmap";
