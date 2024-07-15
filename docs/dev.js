(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('quill')) :
    typeof define === 'function' && define.amd ? define(['exports', 'quill'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TableUp = {}, global.Quill));
})(this, (function (exports, Quill) { 'use strict';

    const TableModule = Quill.import('module/table');
    class TableUp extends TableModule {
        constructor(quill, options) {
            super(quill, options);
            const toolbar = this.quill.getModule('toolbar');
            console.log(toolbar);
        }
    }

    exports.default = TableUp;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
