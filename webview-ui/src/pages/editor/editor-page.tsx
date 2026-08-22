 import CanvasComponent from "../../components/canvascomponents/canvascomponent";
import type { DatabaseSchema } from "@dbchart/schema";
import type { ArrangedDesign } from "@lib/utils/design-arrangement";

interface EditorPageProps {
  schema?: DatabaseSchema;
  design?: ArrangedDesign;
}

const EditorPage = ({ schema, design }: EditorPageProps) => {
  return <CanvasComponent schema={schema} design={design} />;
};

export default EditorPage;