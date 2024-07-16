(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('quill')) :
    typeof define === 'function' && define.amd ? define(['exports', 'quill'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TableUp = {}, global.Quill));
})(this, (function (exports, Quill) { 'use strict';

    const createInputItem = (label, options) => {
        options.type || (options.type = 'text');
        options.value || (options.value = '');
        const inputItem = document.createElement('div');
        inputItem.classList.add('input__item');
        if (label) {
            const inputLabel = document.createElement('span');
            inputLabel.classList.add('input__label');
            inputLabel.textContent = label;
            inputItem.appendChild(inputLabel);
        }
        const inputInput = document.createElement('div');
        inputInput.classList.add('input__input');
        const input = document.createElement('input');
        for (const key in options) {
            input.setAttribute(key, options[key]);
        }
        if (options.max || options.min) {
            input.addEventListener('blur', () => {
                if (options.max && options.max <= Number(input.value)) {
                    input.value = String(options.max);
                }
                if (options.min && options.min >= Number(input.value)) {
                    input.value = String(options.min);
                }
            });
        }
        inputInput.appendChild(input);
        inputItem.appendChild(inputInput);
        input.addEventListener('focus', () => {
            inputInput.classList.add('focus');
        });
        input.addEventListener('blur', () => {
            inputInput.classList.remove('focus');
        });
        const errorTip = (msg) => {
            let errorTip;
            if (inputInput.classList.contains('error')) {
                errorTip = inputInput.querySelector('.input__error-tip');
            }
            else {
                errorTip = document.createElement('span');
                errorTip.classList.add('input__error-tip');
                inputInput.appendChild(errorTip);
            }
            errorTip.textContent = msg;
            inputInput.classList.add('error');
            const removeError = () => {
                inputInput.classList.remove('error');
                errorTip.remove();
            };
            return { removeError };
        };
        return { item: inputItem, input, errorTip };
    };
    let zindex = 8000;
    const createDialog = ({ child, target = document.body, beforeClose = () => { } } = {}) => {
        const appendTo = target;
        const dialog = document.createElement('div');
        dialog.classList.add('dialog');
        dialog.style.zIndex = String(zindex);
        const overlay = document.createElement('div');
        overlay.classList.add('dialog__overlay');
        dialog.appendChild(overlay);
        if (child) {
            const content = document.createElement('div');
            content.classList.add('dialog__content');
            content.appendChild(child);
            overlay.appendChild(content);
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        const originOverflow = getComputedStyle(appendTo).overflow;
        appendTo.style.overflow = 'hidden';
        appendTo.appendChild(dialog);
        const close = () => {
            beforeClose();
            dialog.remove();
            appendTo.style.overflow = originOverflow;
        };
        dialog.addEventListener('click', close);
        zindex += 1;
        return { dialog, close };
    };
    const showTableCreator = async (options = {}) => {
        const box = document.createElement('div');
        box.classList.add('table-creator');
        const inputContent = document.createElement('div');
        inputContent.classList.add('table-creator__input');
        const { item: rowItem, input: rowInput, errorTip: rowErrorTip, } = createInputItem(options.rowText || '行数', { type: 'number', value: String(options.row || ''), max: 99 });
        const { item: colItem, input: colInput, errorTip: colErrorTip, } = createInputItem(options.rowText || '列数', { type: 'number', value: String(options.col || ''), max: 99 });
        inputContent.appendChild(rowItem);
        inputContent.appendChild(colItem);
        box.appendChild(inputContent);
        const control = document.createElement('div');
        control.classList.add('table-creator__control');
        const confirmBtn = document.createElement('button');
        confirmBtn.classList.add('table-creator__btn', 'confirm');
        confirmBtn.textContent = options.confirmText || 'Confirm';
        const cancelBtn = document.createElement('button');
        cancelBtn.classList.add('table-creator__btn', 'cancel');
        cancelBtn.textContent = options.cancelText || 'Cancel';
        control.appendChild(confirmBtn);
        control.appendChild(cancelBtn);
        box.appendChild(control);
        return new Promise((resolve, reject) => {
            const { close } = createDialog({ child: box, beforeClose: reject });
            confirmBtn.addEventListener('click', async () => {
                const row = Number(rowInput.value);
                const col = Number(colInput.value);
                if (Number.isNaN(row) || row <= 0) {
                    return rowErrorTip('Invalid number');
                }
                if (Number.isNaN(col) || col <= 0) {
                    return colErrorTip('Invalid number');
                }
                resolve({ row, col });
                close();
            });
            cancelBtn.addEventListener('click', () => {
                close();
            });
        });
    };
    const createSelectBox = (options = {}) => {
        const selectDom = document.createElement('div');
        selectDom.classList.add('select-box');
        const selectBlock = document.createElement('div');
        selectBlock.classList.add('select-box__block');
        for (let r = 0; r < (options.row || 8); r++) {
            for (let c = 0; c < (options.col || 8); c++) {
                const selectItem = document.createElement('div');
                selectItem.classList.add('select-box__item');
                selectItem.dataset.row = String(r + 1);
                selectItem.dataset.col = String(c + 1);
                selectBlock.appendChild(selectItem);
            }
        }
        const updateSelectBlockItems = () => {
            const { row, col } = selectDom.dataset;
            for (const item of Array.from(selectBlock.querySelectorAll('.active'))) {
                item.classList.remove('active');
            }
            if (!row || !col)
                return;
            const childs = Array.from(selectBlock.children);
            for (let i = 0; i < childs.length; i++) {
                const { row: childRow, col: childCol } = childs[i].dataset;
                if (childRow > row && childCol > col) {
                    return;
                }
                if (childRow <= row && childCol <= col) {
                    childs[i].classList.add('active');
                }
                else {
                    childs[i].classList.remove('active');
                }
            }
        };
        selectBlock.addEventListener('mousemove', (e) => {
            if (!e.target)
                return;
            const { row, col } = e.target.dataset;
            if (!row || !col)
                return;
            selectDom.dataset.row = row;
            selectDom.dataset.col = col;
            updateSelectBlockItems();
        });
        selectBlock.addEventListener('mouseleave', () => {
            selectDom.removeAttribute('data-row');
            selectDom.removeAttribute('data-col');
            updateSelectBlockItems();
        });
        selectBlock.addEventListener('click', () => {
            const { row, col } = selectDom.dataset;
            if (!row || !col)
                return;
            options.onSelect && options.onSelect(Number(row), Number(col));
        });
        selectDom.appendChild(selectBlock);
        if (options.isCustom) {
            const selectCustom = document.createElement('div');
            selectCustom.classList.add('select-box__custom');
            selectCustom.textContent = options.customText || '自定义行列数';
            selectCustom.addEventListener('click', async () => {
                const res = await showTableCreator({
                    confirmText: options.confirmText,
                    cancelText: options.cancelText,
                    rowText: options.rowText,
                    colText: options.colText,
                });
                if (res) {
                    options.onSelect && options.onSelect(res.row, res.col);
                }
            });
            selectDom.appendChild(selectCustom);
        }
        return selectDom;
    };
    const createToolTip = (target, options = {}) => {
        const { msg = '', delay = 0 } = options;
        const wrapper = document.createElement('div');
        wrapper.classList.add('tool-tip');
        wrapper.appendChild(target);
        if (msg) {
            const tip = document.createElement('div');
            tip.classList.add('tool-tip__text');
            tip.classList.add('hidden');
            tip.textContent = msg;
            wrapper.appendChild(tip);
            let timer = null;
            wrapper.addEventListener('mouseenter', () => {
                if (timer)
                    clearTimeout(timer);
                timer = setTimeout(() => {
                    tip.classList.remove('hidden');
                }, delay);
            });
            wrapper.addEventListener('mouseleave', () => {
                if (timer)
                    clearTimeout(timer);
                timer = setTimeout(() => {
                    tip.classList.add('hidden');
                    timer = null;
                }, delay);
            });
        }
        return wrapper;
    };

    const isFunction = (val) => typeof val === 'function';

    var InsertLeft = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm14.44 2v2h4v2h-4v2l-3-3z\"/></svg>";

    var InsertRight = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm15.44 8v-2h-4v-2h4v-2l3 3z\"/></svg>";

    var InsertTop = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm17.94 4.5h-2v4h-2v-4h-2l3-3z\"/></svg>";

    var InsertBottom = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4zm11.94 5.5h2v-4h2v4h2l-3 3z\"/></svg>";

    var RemoveRow = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M9.41 13L12 15.59L14.59 13L16 14.41L13.41 17L16 19.59L14.59 21L12 18.41L9.41 21L8 19.59L10.59 17L8 14.41zM22 9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2zM4 9h4V6H4zm6 0h4V6h-4zm6 0h4V6h-4z\"/></svg>";

    var RemoveColumn = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M4 2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m0 8v4h7v-4zm0 6v4h7v-4zM4 4v4h7V4zm13.59 8L15 9.41L16.41 8L19 10.59L21.59 8L23 9.41L20.41 12L23 14.59L21.59 16L19 13.41L16.41 16L15 14.59z\"/></svg>";

    var RemoveTable = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"m15.46 15.88l1.42-1.42L19 16.59l2.12-2.13l1.42 1.42L20.41 18l2.13 2.12l-1.42 1.42L19 19.41l-2.12 2.13l-1.42-1.42L17.59 18zM4 3h14a2 2 0 0 1 2 2v7.08a6 6 0 0 0-4.32.92H12v4h1.08c-.11.68-.11 1.35 0 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m0 4v4h6V7zm8 0v4h6V7zm-8 6v4h6v-4z\"/></svg>";

    const TableFormat = Quill.import('formats/table');
    const defaultTools = [
        {
            name: 'InsertTop',
            icon: InsertTop,
            tip: '向上插入一行',
            handle: (tableModule) => {
                tableModule.insertRow(0);
            },
        },
        {
            name: 'InsertRight',
            icon: InsertRight,
            tip: '向右插入一列',
            handle: (tableModule) => {
                tableModule.insertColumn(1);
            },
        },
        {
            name: 'InsertBottom',
            icon: InsertBottom,
            tip: '向下插入一行',
            handle: (tableModule) => {
                tableModule.insertRow(1);
            },
        },
        {
            name: 'InsertLeft',
            icon: InsertLeft,
            tip: '向左插入一列',
            handle: (tableModule) => {
                tableModule.insertColumn(0);
            },
        },
        {
            name: 'break',
        },
        {
            name: 'DeleteRow',
            icon: RemoveRow,
            tip: '删除当前行',
            handle: (tableModule) => {
                tableModule.deleteRow();
            },
        },
        {
            name: 'DeleteColumn',
            icon: RemoveColumn,
            tip: '删除当前列',
            handle: (tableModule) => {
                tableModule.deleteColumn();
            },
        },
        {
            name: 'DeleteTable',
            icon: RemoveTable,
            tip: '删除当前表格',
            handle: (tableModule) => {
                tableModule.deleteTable();
            },
        },
    ];
    class TableSelection {
        tableModule;
        quill;
        options;
        tableBlot = null;
        selectTd = null;
        cellSelect;
        boundary = null;
        selectTool;
        constructor(tableModule, quill, options = {}) {
            this.tableModule = tableModule;
            this.quill = quill;
            this.options = this.resolveOptions(options);
            this.cellSelect = this.quill.addContainer('ql-table-selection');
            this.selectTool = this.buildTools();
            this.quill.root.addEventListener('mousedown', this.destory);
            this.quill.root.addEventListener('scroll', this.destory);
            this.quill.on(Quill.events.EDITOR_CHANGE, (name, range, _oldRange, _source) => {
                if (name === Quill.events.SELECTION_CHANGE && range) {
                    const [blot] = this.quill.scroll.descendant(TableFormat, range.index);
                    if (!blot)
                        return;
                    this.selectTd = blot;
                    this.updateSelectBox();
                }
                else {
                    this.destory();
                }
            });
        }
        resolveOptions = (options) => {
            return Object.assign({
                selectColor: '#0589f3',
                tools: defaultTools,
            }, options);
        };
        buildTools = () => {
            const toolBox = this.quill.addContainer('ql-table-selection-tool');
            for (const tool of this.options.tools) {
                const { name, icon, handle, tip = '' } = tool;
                let item = document.createElement('span');
                item.classList.add('ql-table-selection-item');
                if (name === 'break') {
                    item.classList.add('break');
                }
                else {
                    item.classList.add('icon');
                    item.innerHTML = icon;
                    if (isFunction(handle)) {
                        item.addEventListener('click', () => {
                            this.quill.focus();
                            handle(this.tableModule);
                        });
                    }
                    if (tip) {
                        item = createToolTip(item, { msg: tip, delay: 150 });
                    }
                }
                toolBox.appendChild(item);
            }
            return toolBox;
        };
        remove = () => {
            Object.assign(this.cellSelect.style, {
                display: 'none',
            });
            Object.assign(this.selectTool.style, {
                display: 'none',
            });
            this.selectTd = null;
        };
        destory = () => {
            this.remove();
            this.tableBlot = null;
        };
        updateSelectBox = () => {
            if (!this.selectTd)
                return;
            this.boundary = this.getRelativeRect(this.selectTd.domNode.getBoundingClientRect(), this.quill.container.getBoundingClientRect());
            Object.assign(this.cellSelect.style, {
                'border-color': this.options.selectColor,
                'display': 'block',
                'left': `${this.boundary.x - 1}px`,
                'top': `${this.boundary.y - 1}px`,
                'width': `${this.boundary.width + 1}px`,
                'height': `${this.boundary.height + 1}px`,
            });
            Object.assign(this.selectTool.style, {
                display: 'flex',
                left: `${this.boundary.x + (this.boundary.width / 2) - 1}px`,
                top: `${this.boundary.y - 1}px`,
                transform: `translate(-50%, 100%)`,
            });
        };
        getRelativeRect = (targetRect, containerRect) => ({
            x: targetRect.x - containerRect.x,
            y: targetRect.y - containerRect.y,
            width: targetRect.width,
            height: targetRect.height,
        });
    }

    const icons = Quill.import('ui/icons');
    const TableModule = Quill.import('modules/table');
    const toolName = 'table';
    class TableUp extends TableModule {
        constructor(quill, options) {
            super(quill, options);
            this.options = this.resolveOptions(options || {});
            const toolbar = this.quill.getModule('toolbar');
            const [, select] = (toolbar.controls || []).find(([name]) => name === toolName) || [];
            if (select && select.tagName.toLocaleLowerCase() === 'select') {
                this.picker = this.quill.theme.pickers.find((picker) => picker.select === select);
                if (!this.picker)
                    return;
                this.picker.label.innerHTML = icons.table;
                this.buildCustomSelect(this.options.customSelect);
                this.picker.label.addEventListener('mousedown', this.handleInViewport);
            }
            this.selection = new TableSelection(this, this.quill, this.options.selection);
        }
        handleInViewport = () => {
            const selectRect = this.selector.getBoundingClientRect();
            if (selectRect.right >= window.innerWidth) {
                const labelRect = this.picker.label.getBoundingClientRect();
                this.picker.options.style.transform = `translateX(calc(-100% + ${labelRect.width}px))`;
            }
            else {
                this.picker.options.style.transform = undefined;
            }
        };
        resolveOptions = (options) => {
            return Object.assign({
                isCustom: true,
                texts: this.resolveTexts(options.texts || {}),
            }, options);
        };
        resolveTexts = (options) => {
            return Object.assign({
                customBtn: '自定义行列数',
                confirmText: '确认',
                cancelText: '取消',
                rowText: '行数',
                colText: '列数',
            }, options);
        };
        buildCustomSelect = async (customSelect) => {
            const dom = document.createElement('div');
            dom.classList.add('ql-custom-select');
            this.selector = customSelect && isFunction(customSelect) ? await customSelect(this) : this.createSelect();
            dom.appendChild(this.selector);
            this.picker.options.appendChild(dom);
        };
        createSelect = () => {
            return createSelectBox({
                onSelect: (row, col) => {
                    this.insertTable(row, col);
                    this.picker.close();
                },
                isCustom: this.options.isCustom,
                customText: this.options.texts.customBtn,
            });
        };
        insertTable = (rows, columns) => {
            this.quill.focus();
            super.insertTable(rows, columns);
        };
    }

    exports.default = TableUp;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
