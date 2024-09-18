import Quill from 'quill';
import type TypeCodeBlock from 'quill/formats/code';
import { mixinClass } from '../../utils';
import { BlockOverride } from './block';

const CodeBlock = Quill.import('formats/code-block') as typeof TypeCodeBlock;

export class CodeBlockOverride extends mixinClass(CodeBlock, [BlockOverride]) {}
