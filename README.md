# quill-table-up

Enhancement of quill table module

[demo](https://zzxming.github.io/quill-table-up/)

[quill@1.3.7 table module](https://github.com/zzxming/quill-table)

- [x] complete UI operation process
- [x] insert/delete row/column/table; merge/split cells
- [x] support all origin quill formats
- [x] control cells width/height/border/background color
- [x] 100 percent table width or fixed pixel width
- [x] line break in cells
- [x] redo and undo
- [x] support whole table align left/center/right

## Usage

```sh
npm install quill-table-up
```

```js
import Quill from 'quill';
import TableUp, { TableAlign, TableResizeBox, TableVirtualScrollbar } from 'quill-table-up';
import 'quill/dist/quill.snow.css';
import 'quill-table-up/index.css';
// If using the default customSelect option. You need to import this css
import 'quill-table-up/table-creator.css';

Quill.register({ [`modules/${TableUp.moduleName}`]: TableUp }, true);
// or
// Quill.register({ 'modules/table-up': TableUp }, true);

const quill = new Quill('#editor', {
  // ...
  modules: {
    //  ...
    toolbar: [
      // ...
      [ // use picker to enable the customSelect option
        { [TableUp.toolName]: [] }
      ],
    ],
    [TableUp.moduleName]: {
      scrollbar: TableVirtualScrollbar,
      align: TableAlign,
      resize: TableResizeBox,
      selection: {
        tableMenuClass: 'contextmenu',
      }
    },
  },
});
```

## Options

### TableUp Options

| attribute        | description                                                                                                                             | type                                    | default             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------- |
| full             | if set `true`. width max will be 100%                                                                                                   | `boolean`                               | `false`             |
| customBtn        | display a custom button to custom row and column number add a table                                                                     | `boolean`                               | `false`             |
| texts            | the text used to create the table                                                                                                       | `TableTextOptions`                      | `defaultTexts`      |
| customSelect     | display a custom select to custom row and column number add a table. the DOM returned by the function will replace the default selector | `(tableModule: TableUp) => HTMLElement` | -                   |
| selection        | moduel TableSelection options                                                                                                           | `TableSelectionOptions`                 | -                   |
| icon             | picker svg icon string. it will set with `innerHTML`                                                                                    | `string`                                | `origin table icon` |
| resize           | table cell resize handler. module provides `TableResizeLine` and `TableResizeBox`                                                       | `Constructor`                           | -                   |
| scrollbar        | table virtual scrollbar handler. module provides `TableVirtualScrollbar`                                                                | `Constructor`                           | -                   |
| align            | table alignment handler. module provides `TableAlign`                                                                                   | `Constructor`                           | -                   |
| resizeOptions    | table cell resize handler options                                                                                                       | `any`                                   | -                   |
| alignOptions     | table alignment handler options                                                                                                         | `any`                                   | -                   |
| scrollbarOptions | table virtual scrollbar handler options                                                                                                 | `any`                                   | -                   |

> I'm not suggest to use `TableVirtualScrollbar` and `TableResizeLine` at same time, because it will make the virtual scrollbar display blink. Just like the first editor in [demo](https://zzxming.github.io/quill-table-up/)

<details>
  <summary> default value </summary>

```ts
const defaultTexts = {
  customBtnText: 'Custom',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  rowText: 'Row',
  colText: 'Column',
  notPositiveNumberError: 'Please enter a positive integer',
  custom: 'Custom',
  clear: 'Clear',
  transparent: 'Transparent',
  perWidthInsufficient: 'The percentage width is insufficient. To complete the operation, the table needs to be converted to a fixed width. Do you want to continue?',
};
```

</details>

### TableSelection Options

| attribute     | description                                                          | type                        | default   |
| ------------- | -------------------------------------------------------------------- | --------------------------- | --------- |
| selectColor   | selector border color                                                | `string`                    | `#0589f3` |
| tableMenu     | module TableMenu options                                             | `TableMenuOptions`          | -         |
| tableMenuType | Operation menu trigger type. Different types have different displays | `'select' \| 'contextmenu'` | -         |

### TableMenu Options

| attribute       | description                                                                                                                                                                           | type                     | default                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------- |
| tipText         | when `tableMenuClass` set `TableUp.TableMenuSelect`, display tip text when hover icon. when `tableMenuClass` set `TableUp.TableMenuContextmenu`(default), display tip text after icon | `boolean`                | `true`                  |
| tipTexts        | the text to replace tools tip text                                                                                                                                                    | `Record<string, string>` | `{}`                    |
| localstorageKey | used color save localstorage key                                                                                                                                                      | `string`                 | `__table-bg-used-color` |
| tools           | menu items                                                                                                                                                                            | `Tool[]`                 | `defaultTools`          |
| defaultColorMap | color map                                                                                                                                                                             | `string[][]`             | in source code          |

<details>
  <summary> types and default value </summary>

```ts
interface ToolOption {
  name: string;
  icon: string | ((tableModule: TableUp) => HTMLElement);
  tip?: string;
  key?: string; // the attribute name to set on td.
  isColorChoose?: boolean;
  handle: (tableModule: TableUp, selectedTds: TableCellInnerFormat[], e: Event | string) => void;
}
interface ToolOptionBreak {
  name: 'break';
}
type Tool = ToolOption | ToolOptionBreak;

const defaultTools = [
  {
    name: 'InsertTop',
    icon: InsertTop,
    tip: 'Insert a row above',
    handle: (tableModule) => {},
  },
  {
    name: 'InsertRight',
    icon: InsertRight,
    tip: 'Insert a column right',
    handle: (tableModule) => {},
  },
  {
    name: 'InsertBottom',
    icon: InsertBottom,
    tip: 'Insert a row below',
    handle: (tableModule) => {},
  },
  {
    name: 'InsertLeft',
    icon: InsertLeft,
    tip: 'Insert a column Left',
    handle: (tableModule) => {},
  },
  {
    name: 'break',
  },
  {
    name: 'MergeCell',
    icon: MergeCell,
    tip: 'Merge Cell',
    handle: (tableModule) => {},
  },
  {
    name: 'SplitCell',
    icon: SplitCell,
    tip: 'Split Cell',
    handle: (tableModule) => {},
  },
  {
    name: 'break',
  },
  {
    name: 'DeleteRow',
    icon: RemoveRow,
    tip: 'Delete Row',
    handle: (tableModule) => {},
  },
  {
    name: 'DeleteColumn',
    icon: RemoveColumn,
    tip: 'Delete Column',
    handle: (tableModule) => {},
  },
  {
    name: 'DeleteTable',
    icon: RemoveTable,
    tip: 'Delete table',
    handle: (tableModule) => {},
  },
  {
    name: 'break',
  },
  {
    name: 'BackgroundColor',
    icon: Color,
    isColorChoose: true,
    tip: 'Set background color',
    key: 'background-color',
    handle: (tableModule, selectedTds, color) => {},
  },
  {
    name: 'BorderColor',
    icon: Border,
    isColorChoose: true,
    tip: 'Set border color',
    key: 'border-color',
    handle: (tableModule, selectedTds, color) => {},
  },
];
```

</details>

## Overrides

if you need to rewrite extends from quill `Block` or `Scroll` blot. you need to import it from `quill-table-up`. or use `Quill.import()` after `TableUp` registed. beacuse module internal rewrite some functions, but those change only effect formats about table.

please read [source code](https://github.com/zzxming/quill-table-up/tree/master/src/formats/overrides) to know those change.

```ts
import {
  BlockOverride,
  BlockquoteOverride,
  CodeBlockOverride,
  HeaderOverride,
  ListItemOverride,
  ScrollOverride,
} from 'quill-table-up';

class ScrollBlot extends ScrollOverride {
  // ...
}
```

## Other

### Change internal constants variable

you can change internal constants variable by importing `updateTableConstants` from `quill-table-up` and call it before `TableUp` registed.

It helps to migrate from other table modules with the same data structure.

[change variable demo](https://github.com/zzxming/quill-table-up/blob/master/docs/update-constants.js)

If you change the `TableWrapperFormat` blot name, you also need to add new css style to make toolbar icon have correct style.

```css
/* change 'table-up' to your new blot name */
.ql-toolbar .ql-picker:not(.ql-color-picker):not(.ql-icon-picker).ql-table-up {
  width: 28px;
}
.ql-toolbar .ql-picker:not(.ql-color-picker):not(.ql-icon-picker).ql-table-up .ql-picker-label {
  padding: 2px 4px;
}
.ql-toolbar .ql-picker:not(.ql-color-picker):not(.ql-icon-picker).ql-table-up .ql-picker-label svg {
  position: static;
  margin-top: 0;
}
```
