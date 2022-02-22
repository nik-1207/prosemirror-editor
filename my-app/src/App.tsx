import React from "react";

import Editor from "./Editor/Index";
import { EditorContext } from "./Editor/EditorContext";
import { useEditor } from "./Editor/useEditor";

const App: React.FC = () => {
  const { editor, view, schema, state } = useEditor();
  return (
    <EditorContext.Provider value={{ editor, view, schema, state }}>
      <Editor uniqueId={Math.random()} />
    </EditorContext.Provider>
  );
};

export default App;
