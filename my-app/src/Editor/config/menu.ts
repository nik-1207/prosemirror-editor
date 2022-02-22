import {
  icons,
  joinUpItem,
  liftItem,
  MenuItem,
  redoItem,
  selectParentNodeItem,
  undoItem,
} from "prosemirror-menu";
import { EditorState, Transaction } from "prosemirror-state";
import { toggleMark } from "prosemirror-commands";
import { wrapInList } from "./prosemirror-schema-list";

function cmdItem(
  cmd: {
    (
      state: EditorState<any>,
      dispatch?: ((tr: Transaction<any>) => void) | undefined
    ): boolean;
    (arg0: any): any;
  },
  options: {
    [x: string]: any;
    active?: (state: any) => any;
    enable: any;
    title?: any;
    select?: any;
  }
) {
  let passedOptions: any = {
    label: options.title,
    run: cmd,
  };
  for (let prop in options) passedOptions[prop] = options[prop];
  if ((!options.enable || options.enable === true) && !options.select)
    passedOptions[options.enable ? "enable" : "select"] = (state: any) =>
      cmd(state);

  return new MenuItem(passedOptions);
}

function markActive(state: any, type: { isInSet: (arg0: any) => any }) {
  let { from, $from, to, empty } = state.selection;
  if (empty) return type.isInSet(state.storedMarks || $from.marks());
  else return state.doc.rangeHasMark(from, to, type);
}

function markItem(
  markType: any,
  options: { [x: string]: any; title?: string; icon?: any }
) {
  let passedOptions: any = {
    active(state: any) {
      return markActive(state, markType);
    },
    enable: true,
  };
  for (let prop in options) passedOptions[prop] = options[prop];
  return cmdItem(toggleMark(markType), passedOptions);
}

function wrapListItem(nodeType: any, options: any) {
  //@ts-ignore
  return cmdItem(wrapInList(nodeType as any, options.attrs as any), options);
}

export function buildMenuItems(schema: any) {
  let r: any = {},
    type;
  if ((type = schema.marks.strong))
    r.toggleStrong = markItem(type, {
      title: "Toggle strong style",
      icon: icons.strong,
    });
  if ((type = schema.marks.em))
    r.toggleEm = markItem(type, { title: "Toggle emphasis", icon: icons.em });
  if ((type = schema.nodes.bullet_list))
    r.wrapBulletList = wrapListItem(type, {
      title: "Wrap in bullet list",
      icon: icons.bulletList,
    });
  if ((type = schema.nodes.ordered_list))
    r.wrapOrderedList = wrapListItem(type, {
      title: "Wrap in ordered list",
      icon: icons.orderedList,
    });
  let cut = (arr: any[]) => arr.filter((x: any) => x);
  r.inlineMenu = [cut([r.toggleStrong, r.toggleEm])];
  r.blockMenu = [
    cut([
      r.wrapBulletList,
      r.wrapOrderedList,
      joinUpItem,
      liftItem,
      selectParentNodeItem,
    ]),
  ];
  r.fullMenu = r.inlineMenu.concat([[undoItem, redoItem]], r.blockMenu);

  return r;
}
