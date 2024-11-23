# quill-table-up

Enhancement of quill table module

[demo](https://zzxming.github.io/quill-table-up/)

[quill@1.3.7 table module](https://github.com/zzxming/quill-table)

- [x] complete UI operation process
- [x] insert/delete row/column/table; merge/split cells
- [x] support insert header/list/video/image/code-block
- [x] control cells width/height/background color
- [x] 100 percent table width or fixed pixel width
- [x] line break in cells
- [x] not effect on other formats
- [x] redo and undo

## Usage

```sh
npm install quill-table-up
```

```js
import Quill from 'quill';
import TableUp from 'quill-table-up';
import 'quill-table-up/index.css';
// If using the default customSelect option. You need to import this css
import 'quill-table-up/table-creator.css';

Quill.register({ [`modules/${TableUp.moduleName}`]: TableUp }, true);
// or
// Quill.register({ 'modules/tableUp': TableUp }, true);

const quill = new Quill('#editor', {
  // ...
  modules: {
    //  ...
    toolbar: [
      // ...
      [ // use picker to enable the customSelect option
        { [TableUp.toolName]: [] }
        // or
        // { 'table-up': [] }
      ],
    ],
    [TableUp.moduleName]: {},
    // or
    // tableUp: {},
  },
});
```

## Options

### TableUp Options

| attribute       | description                                                                                                                             | type                                    | default             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------- |
| full            | if set `true`. width max will be 100%                                                                                                   | `boolean`                               | `false`             |
| customBtn       | display a custom button to custom row and column number add a table                                                                     | `boolean`                               | `false`             |
| resizerSetOuter | if set `true`. table cell resize will be border around table                                                                            | `boolean`                               | `false`             |
| texts           | the text used to create the table                                                                                                       | `TableTextOptions`                      | `defaultTexts`      |
| customSelect    | display a custom select to custom row and column number add a table. the DOM returned by the function will replace the default selector | `(tableModule: TableUp) => HTMLElement` | -                   |
| selection       | moduel TableSelection options                                                                                                           | `TableSelectionOptions`                 | -                   |
| icon            | picker svg icon string. it will set with `innerHTML`                                                                                    | `string`                                | `origin table icon` |
| scrollbar       | enable table virtual scrollbar                                                                                                          | `boolean`                               | `true`              |

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
};
```

</details>

### TableSelection Options

| attribute      | description                                                                                                                            | type               | default           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------- |
| selectColor    | selector border color                                                                                                                  | `string`           | `#0589f3`         |
| tableMenu      | module TableMenu options                                                                                                               | `TableMenuOptions` | -                 |
| tableMenuClass | when select a cell will trigger this class to create menu. module provide two menu module `TableMenuContextmenu` and `TableMenuSelect` | `Constructor`      | `TableMenuSelect` |

### TableMenu Options

| attribute       | description                        | type                     | default                 |
| --------------- | ---------------------------------- | ------------------------ | ----------------------- |
| tipText         | display tip text when hover icon   | `boolean`                | `true`                  |
| tipTexts        | the text to replace tools tip text | `Record<string, string>` | `{}`                    |
| localstorageKey | used color save localstorage key   | `string`                 | `__table-bg-used-color` |
| tools           | menu items                         | `Tool[]`                 | `defaultTools`          |
| defaultColorMap | color map                          | `string[][]`             | in source code          |
| texts           | the text that menu needs           | `TableMenuTexts`         | `defaultTexts`          |

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
interface TableMenuTexts {
  custom: string;
  clear: string;
}
const defaultTexts = {
  custom: 'Custom',
  clear: 'Clear',
};
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
