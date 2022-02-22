import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { Plugin } from "prosemirror-state";
import { menuBar } from "prosemirror-menu";

import { buildMenuItems } from "./menu";
import { buildKeymap } from "./keymap";
import { buildInputRules } from "./inputrules";

export function setup(options: any) {
  let plugins = [
    buildInputRules(options.schema),
    keymap(buildKeymap(options.schema, options.mapKeys)),
    keymap(baseKeymap),
  ];
  if (options.menuBar !== false)
    plugins.push(
      //@ts-ignore
      menuBar({
        content: buildMenuItems(options.schema).fullMenu,
      })
    );
  if (options.history !== false) plugins.push(history());

  return plugins.concat(
    new Plugin({
      props: {
        attributes: { class: "ProseMirror-example-setup-style" },
      },
    })
  );
}
