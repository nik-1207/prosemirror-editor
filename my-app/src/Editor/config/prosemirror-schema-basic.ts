import { Schema } from "prosemirror-model";
import { orderedList, listItem } from "./prosemirror-schema-list";

export const nodes: any = {
  doc: {
    content: "ordered_list+",
  },
  text: {
    group: "inline",
  },
  note: {
    content: "text*",
    group: "block",
    parseDom: [{ tag: "div" }],
    toDOM() {
      return ["div", { class: "note" }, 0];
    },
  },
  ordered_list: orderedList,
  list_item: listItem,
};

const emDOM = ["em", 0],
  strongDOM = ["strong", 0];

export const marks: any = {
  em: {
    parseDOM: [{ tag: "i" }, { tag: "em" }, { style: "font-style=italic" }],
    toDOM() {
      return emDOM;
    },
  },
  strong: {
    parseDOM: [
      { tag: "strong" },
      {
        tag: "b",
        getAttrs: (node: any) => node.style.fontWeight != "normal" && null,
      },
      {
        style: "font-weight",
        getAttrs: (value: any) =>
          /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
      },
    ],
    toDOM() {
      return strongDOM;
    },
  },
};

export const schema = new Schema({ nodes, marks });
