import CanvasComponent from "../../components/canvascomponents/canvascomponent";
import type { DatabaseSchema } from "@dbchart/schema";

interface EditorPageProps {
  schema?: DatabaseSchema;
}

const EditorPage = ({ schema }: EditorPageProps) => {
  return <CanvasComponent schema={schema} />;
};

export default EditorPage;