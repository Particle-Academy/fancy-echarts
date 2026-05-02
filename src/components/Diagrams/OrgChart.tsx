import { useMemo } from "react";
import { Diagram } from "../Diagram/Diagram";
import type { DiagramSchema } from "../Diagram/Diagram.types";
import { layoutOrgChart, type OrgChartNode } from "./orgchart.layout";

export type { OrgChartNode };

export interface OrgChartProps {
  root: OrgChartNode;
  downloadable?: boolean;
  minimap?: boolean;
  className?: string;
}

/**
 * Top-down hierarchy diagram. Each parent sits centered over the span of its
 * descendants; manhattan-routed connectors with an open triangle on the
 * child end give it a UML-inheritance feel.
 */
export function OrgChart({
  root,
  downloadable = false,
  minimap = false,
  className,
}: OrgChartProps) {
  const schema: DiagramSchema = useMemo(() => {
    const layout = layoutOrgChart(root);
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
        routing: "manhattan" as const,
        fromMarker: "none",
        toMarker: "triangle-open",
      })),
    };
  }, [root]);

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

OrgChart.displayName = "OrgChart";
