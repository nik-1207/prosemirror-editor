import {
  canSplit,
  findWrapping,
  liftTarget,
  ReplaceAroundStep,
} from "prosemirror-transform";
import { Fragment, NodeRange, Slice } from "prosemirror-model";

const olDOM = ["ol", 0],
  ulDOM = ["ul", 0],
  liDOM = ["li", 0];
export const orderedList = {
  attrs: { order: { default: 1 } },
  parseDOM: [
    {
      tag: "ol",
      getAttrs(dom: any) {
        return {
          order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1,
        };
      },
    },
  ],
  toDOM(node: any) {
    return node.attrs.order == 1
      ? olDOM
      : ["ol", { start: node.attrs.order }, 0];
  },
};
export const bulletList = {
  parseDOM: [{ tag: "ul" }],
  toDOM() {
    return ulDOM;
  },
};
export const listItem = {
  parseDOM: [{ tag: "li" }],
  toDOM() {
    return liDOM;
  },
  defining: true,
};

function add(obj: any, props: any) {
  let copy: any = {};
  for (let prop in obj) copy[prop] = obj[prop];
  for (let prop in props) copy[prop] = props[prop];
  return copy;
}

export function addListNodes(
  nodes: any,
  itemContent: string,
  listGroup: string
) {
  return nodes.append({
    ordered_list: add(orderedList, { content: "list_item+", group: listGroup }),
    bullet_list: add(bulletList, { content: "list_item+", group: listGroup }),
    list_item: add(listItem, { content: itemContent }),
  });
}

export function wrapInList(listType: any, attrs: any) {
  return function (state: any, dispatch: any) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange($to),
      doJoin = false,
      outerRange = range;
    if (!range) return false;
    // This is at the top of an existing list item
    if (
      range.depth >= 2 &&
      $from.node(range.depth - 1).type.compatibleContent(listType) &&
      range.startIndex == 0
    ) {
      // Don't do anything if this is the top of the list
      if ($from.index(range.depth - 1) == 0) return false;
      let $insert = state.doc.resolve(range.start - 2);
      outerRange = new NodeRange($insert, $insert, range.depth);
      if (range.endIndex < range.parent.childCount)
        range = new NodeRange(
          $from,
          state.doc.resolve($to.end(range.depth)),
          range.depth
        );
      doJoin = true;
    }
    let wrap = findWrapping(outerRange, listType, attrs, range);
    if (!wrap) return false;
    if (dispatch)
      dispatch(
        doWrapInList(state.tr, range, wrap, doJoin, listType).scrollIntoView()
      );
    return true;
  };
}

function doWrapInList(
  tr: any,
  range: any,
  wrappers: any,
  joinBefore: any,
  listType: any
) {
  let content = Fragment.empty;
  for (let i = wrappers.length - 1; i >= 0; i--)
    content = Fragment.from(
      wrappers[i].type.create(wrappers[i].attrs, content)
    );

  tr.step(
    new ReplaceAroundStep(
      range.start - (joinBefore ? 2 : 0),
      range.end,
      range.start,
      range.end,
      new Slice(content, 0, 0),
      wrappers.length,
      true
    )
  );

  let found = 0;
  for (let i = 0; i < wrappers.length; i++)
    if (wrappers[i].type == listType) found = i + 1;
  let splitDepth = wrappers.length - found;

  let splitPos = range.start + wrappers.length - (joinBefore ? 2 : 0),
    parent = range.parent;
  for (
    let i = range.startIndex, e = range.endIndex, first = true;
    i < e;
    i++, first = false
  ) {
    if (!first && canSplit(tr.doc, splitPos, splitDepth)) {
      tr.split(splitPos, splitDepth);
      splitPos += 2 * splitDepth;
    }
    splitPos += parent.child(i).nodeSize;
  }
  return tr;
}

export function splitListItem(itemType: any) {
  return function (state: any, dispatch: any) {
    let { $from, $to, node } = state.selection;
    if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to))
      return false;
    let grandParent = $from.node(-1);
    if (grandParent.type != itemType) return false;
    if (
      $from.parent.content.size == 0 &&
      $from.node(-1).childCount == $from.indexAfter(-1)
    ) {
      if (
        $from.depth == 2 ||
        $from.node(-3).type != itemType ||
        $from.index(-2) != $from.node(-2).childCount - 1
      )
        return false;
      if (dispatch) {
        let wrap = Fragment.empty;
        let depthBefore = $from.index(-1) ? 1 : $from.index(-2) ? 2 : 3;

        for (let d = $from.depth - depthBefore; d >= $from.depth - 3; d--)
          wrap = Fragment.from($from.node(d).copy(wrap));
        let depthAfter =
          $from.indexAfter(-1) < $from.node(-2).childCount
            ? 1
            : $from.indexAfter(-2) < $from.node(-3).childCount
            ? 2
            : 3;
        wrap = wrap.append(Fragment.from(itemType.createAndFill()));
        let start = $from.before($from.depth - (depthBefore - 1));
        let tr = state.tr.replace(
          start,
          $from.after(-depthAfter),
          new Slice(wrap, 4 - depthBefore, 0)
        );
        let sel = -1;
        tr.doc.nodesBetween(
          start,
          tr.doc.content.size,
          (node: any, pos: any) => {
            if (sel > -1) return false;
            if (node.isTextblock && node.content.size == 0) sel = pos + 1;
          }
        );
        if (sel > -1)
          tr.setSelection(
            state.selection.constructor.near(tr.doc.resolve(sel))
          );
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
    let nextType =
      $to.pos == $from.end() ? grandParent.contentMatchAt(0).defaultType : null;
    let tr = state.tr.delete($from.pos, $to.pos);
    let types = nextType && [null, { type: nextType }];
    if (!canSplit(tr.doc, $from.pos, 2, types)) return false;
    if (dispatch) dispatch(tr.split($from.pos, 2, types).scrollIntoView());
    return true;
  };
}

export function liftListItem(itemType: any) {
  return function (state: any, dispatch: any) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange(
      $to,
      (node: any) => node.childCount && node.firstChild.type == itemType
    );
    if (!range) return false;
    if (!dispatch) return true;
    if ($from.node(range.depth - 1).type == itemType)
      return liftToOuterList(state, dispatch, itemType, range);
    else return liftOutOfList(state, dispatch, range);
  };
}

function liftToOuterList(state: any, dispatch: any, itemType: any, range: any) {
  let tr = state.tr,
    end = range.end,
    endOfList = range.$to.end(range.depth);
  if (end < endOfList) {
    tr.step(
      new ReplaceAroundStep(
        end - 1,
        endOfList,
        end,
        endOfList,
        new Slice(
          Fragment.from(itemType.create(null, range.parent.copy())),
          1,
          0
        ),
        1,
        true
      )
    );
    range = new NodeRange(
      tr.doc.resolve(range.$from.pos),
      tr.doc.resolve(endOfList),
      range.depth
    );
  }
  dispatch(tr.lift(range, liftTarget(range)).scrollIntoView());
  return true;
}

function liftOutOfList(state: any, dispatch: any, range: any) {
  let tr = state.tr,
    list = range.parent;
  for (
    let pos = range.end, i = range.endIndex - 1, e = range.startIndex;
    i > e;
    i--
  ) {
    pos -= list.child(i).nodeSize;
    tr.delete(pos - 1, pos + 1);
  }
  let $start = tr.doc.resolve(range.start),
    item = $start.nodeAfter;
  if (tr.mapping.map(range.end) != range.start + $start.nodeAfter.nodeSize)
    return false;
  let atStart = range.startIndex == 0,
    atEnd = range.endIndex == list.childCount;
  let parent = $start.node(-1),
    indexBefore = $start.index(-1);
  if (
    !parent.canReplace(
      indexBefore + (atStart ? 0 : 1),
      indexBefore + 1,
      item.content.append(atEnd ? Fragment.empty : Fragment.from(list))
    )
  )
    return false;
  let start = $start.pos,
    end = start + item.nodeSize;
  tr.step(
    new ReplaceAroundStep(
      start - (atStart ? 1 : 0),
      end + (atEnd ? 1 : 0),
      start + 1,
      end - 1,
      new Slice(
        (atStart
          ? Fragment.empty
          : Fragment.from(list.copy(Fragment.empty))
        ).append(
          atEnd ? Fragment.empty : Fragment.from(list.copy(Fragment.empty))
        ),
        atStart ? 0 : 1,
        atEnd ? 0 : 1
      ),
      atStart ? 0 : 1
    )
  );
  dispatch(tr.scrollIntoView());
  return true;
}

export function sinkListItem(itemType: any) {
  return function (state: any, dispatch: any) {
    let { $from, $to } = state.selection;
    let range = $from.blockRange(
      $to,
      (node: any) => node.childCount && node.firstChild.type == itemType
    );
    if (!range) return false;
    let startIndex = range.startIndex;
    if (startIndex == 0) return false;
    let parent = range.parent,
      nodeBefore = parent.child(startIndex - 1);
    if (nodeBefore.type != itemType) return false;

    if (dispatch) {
      let nestedBefore =
        nodeBefore.lastChild && nodeBefore.lastChild.type == parent.type;
      let inner = Fragment.from(nestedBefore ? itemType.create() : null);
      let slice = new Slice(
        Fragment.from(
          itemType.create(null, Fragment.from(parent.type.create(null, inner)))
        ),
        nestedBefore ? 3 : 1,
        0
      );
      let before = range.start,
        after = range.end;
      dispatch(
        state.tr
          .step(
            new ReplaceAroundStep(
              before - (nestedBefore ? 3 : 1),
              after,
              before,
              after,
              slice,
              1,
              true
            )
          )
          .scrollIntoView()
      );
    }
    return true;
  };
}
