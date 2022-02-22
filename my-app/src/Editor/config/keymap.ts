import {
  setBlockType,
  toggleMark,
  joinUp,
  joinDown,
  lift,
  selectParentNode,
} from "prosemirror-commands";

import {
  wrapInList,
  splitListItem,
  liftListItem,
  sinkListItem,
} from "./prosemirror-schema-list";
import { undo, redo } from "prosemirror-history";
import { undoInputRule } from "prosemirror-inputrules";

const mac =
  typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false;

export function buildKeymap(schema: any, mapKeys: any) {
  let keys: any = {},
    type;
  function bind(key: any, cmd: any) {
    if (mapKeys) {
      let mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }

  bind("Mod-z", undo);
  bind("Shift-Mod-z", redo);
  bind("Backspace", undoInputRule);
  if (!mac) bind("Mod-y", redo);

  bind("Alt-ArrowUp", joinUp);
  bind("Alt-ArrowDown", joinDown);
  bind("Mod-BracketLeft", lift);
  bind("Escape", selectParentNode);

  if ((type = schema.marks.strong)) {
    bind("Mod-b", toggleMark(type));
    bind("Mod-B", toggleMark(type));
  }
  if ((type = schema.marks.em)) {
    bind("Mod-i", toggleMark(type));
    bind("Mod-I", toggleMark(type));
  }
  if ((type = schema.nodes.bullet_list)) {
    bind("Shift-Ctrl-8", wrapInList(type));
  }
  if ((type = schema.nodes.ordered_list)) {
    bind("Shift-Ctrl-9", wrapInList(type));
  }
  if ((type = schema.nodes.list_item)) {
    bind("Enter", splitListItem(type));
    bind("Mod+Tab", liftListItem(type));
    bind("Tab", sinkListItem(type));
  }
  if ((type = schema.nodes.paragraph)) bind("Shift-Ctrl-0", setBlockType(type));
  return keys;
}
