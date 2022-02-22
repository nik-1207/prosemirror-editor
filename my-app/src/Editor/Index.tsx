import React from "react";

import { DOMParser } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

import { EditorContext } from "./EditorContext";

import "./style.css";

interface ProsemirrorProps {
  uniqueId: string | number;
}

const Editor: React.FC<ProsemirrorProps> = ({ uniqueId }) => {
  const { editor, view, schema } = React.useContext(EditorContext);
  React.useEffect(() => {
    const wrapper = document.getElementById(`wrapper${uniqueId}`)!;
    wrapper.appendChild(editor);
    return () => {
      view.updateState(
        EditorState.create({
          doc: DOMParser.fromSchema(schema).parse(
            document.createElement("div")
          ),
          plugins: view.state.plugins,
        })
      );
    };
  }, [uniqueId]); // eslint-disable-line

  return <div id={`wrapper${uniqueId}`} />;
};

export default Editor;
