import { DOMParser, Node as prosemirrorNode, Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema as baseSchema } from "./config/prosemirror-schema-basic";
import { addListNodes } from "./config/prosemirror-schema-list";

import { setup } from "./config";

const useEditor = (checklist?: string) => {
  const editor = document.createElement("div");
  const content = document.createElement("div");
  content.id = "content";
  editor.id = "editor";

  const schema = new Schema({
    nodes: addListNodes(baseSchema.spec.nodes, "note block*", "block"),
    marks: baseSchema.spec.marks,
  });

  const state = EditorState.create({
    doc: DOMParser.fromSchema(schema).parse(content as Node),
    plugins: setup({ schema }),
  });

  let view = new EditorView(editor as Node, {
    state,
    dispatchTransaction: (transaction) => {
      let newState = view.state.apply(transaction);
      view.updateState(newState);
    },
  });
  if (checklist) {
    const jsonData = JSON.parse(checklist);
    const node = prosemirrorNode.fromJSON(schema, jsonData);
    view.dispatch(view.state.tr.replaceSelectionWith(node));
  }
  return {
    editor,
    view,
    state,
    schema,
  };
};
export { useEditor };
