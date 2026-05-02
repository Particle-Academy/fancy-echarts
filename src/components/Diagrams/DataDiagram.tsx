import type { DiagramProps } from "../Diagram/Diagram.types";
import { Diagram } from "../Diagram/Diagram";

/**
 * ERD/UML preset of {@link Diagram}. Pre-applies the most common defaults for
 * data-modeling diagrams: type="erd", downloadable, ERD + UML export formats,
 * minimap on. Pass any DiagramProps to override.
 */
export function DataDiagram(props: DiagramProps) {
  return (
    <Diagram
      type="erd"
      downloadable
      exportFormats={["erd", "uml"]}
      minimap
      {...props}
    />
  );
}

DataDiagram.Entity = Diagram.Entity;
DataDiagram.Field = Diagram.Field;
DataDiagram.Relation = Diagram.Relation;
DataDiagram.Toolbar = Diagram.Toolbar;
DataDiagram.displayName = "DataDiagram";
