# quill-table-up

Enhancement of quill table module

[demo](https://zzxming.github.io/quill-table-up/)

## Why

Quill2.0 supports table related APIs, but unfortunately it did not complete UI operations, so this module is available to solve this problem.

This module is only an ui extension of the basic table module, without adding any new APIs.

## Usage

```sh
npm install quill-table-up
```

```js
import Quill from 'quill';
import TableUp from 'quill-table-up';
import 'quill-table-up/index.css';
// import 'quill-table-up/table-creator.css'  // If using the default customSelect option. You need to import this css

Quill.register({ 'modules/tableUp': TableUp }, true);

const quill = new Quill('#editor', {
  // ...
  modules: {
    //  ...
    toolbar: [
      // ...
      [{ 'table-up-main': [] }], // use picker to enable the customSelect option
    ],
    tableUp: {},
  },
});
```

## Options

### TableUp Options

| attribute    | description                                                         | type                                    | default        |
| ------------ | ------------------------------------------------------------------- | --------------------------------------- | -------------- |
| full         | if set `true`. width max will be 100%                               | `boolean`                               | `true`         |
| customBtn    | display a custom button to custom row and column number add a table | `boolean`                               | `false`        |
| texts        | the text used to create the table                                   | `TableTextOptions`                      | `defaultTexts` |
| customSelect | display a custom select to custom row and column number add a table | `(tableModule: TableUp) => HTMLElement` | -              |
| selection    | moduel TableSelection options                                       | `TableSelection`                        | -              |
| resizer      | moduel TableResize options                                          | `TableResizeOptions`                    | -              |

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

| attribute   | description              | type               | default   |
| ----------- | ------------------------ | ------------------ | --------- |
| selectColor | selector border color    | `string`           | `#0589f3` |
| tableMenu   | module TableMenu options | `TableMenuOptions` | -         |

### TableMenu Options

| attribute       | description                        | type                     | default                 |
| --------------- | ---------------------------------- | ------------------------ | ----------------------- |
| tipText         | display tip text when hover icon   | `boolean`                | `true`                  |
| tipTexts        | the text to replace tools tip text | `Record<string, string>` | `{}`                    |
| localstorageKey | used color save localstorage key   | `string`                 | `__table-bg-used-color` |
| tools           | display tip text when hover icon   | `Tool[]`                 | `defaultTools`          |

<details>
  <summary> types and default value </summary>

```ts
interface ToolOption {
  name: string;
  icon: string | ((tableModule: TableUp) => HTMLElement);
  tip?: string;
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
    handle: (tableModule, selectedTds, color) => {},
  },
];
```

</details>

### TableResizer Options

| attribute | description             | type     | default |
| --------- | ----------------------- | -------- | ------- |
| size      | resizer width or height | `number` | `12`    |
