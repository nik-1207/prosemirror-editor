import { render } from "@testing-library/react";

import Editor from "../Index";
import { EditorContext } from "../EditorContext";
import { useEditor } from "../useEditor";

describe("Editor", () => {
  it("should match snapshot", () => {
    const EditorWrapper: React.FC = () => {
      const { editor, view, schema } = useEditor();
      return (
        <EditorContext.Provider value={{ editor, view, schema }}>
          <Editor uniqueId="test-checklist-uid" />
        </EditorContext.Provider>
      );
    };

    const { container } = render(<EditorWrapper />);

    expect(container).toMatchSnapshot();
  });
});
