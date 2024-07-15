(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('quill')) :
	typeof define === 'function' && define.amd ? define(['exports', 'quill'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TableUp = {}, global.Quill));
})(this, (function (exports, Quill) { 'use strict';

	const find = Quill.find;

	exports.find = find;

}));
