import type TypeCodeBlock from 'quill/formats/code';
import Quill from 'quill';
import { mixinClass } from '../../utils';
import { BlockOverride } from './block';

const CodeBlock = Quill.import('formats/code-block') as typeof TypeCodeBlock;

export class CodeBlockOverride extends mixinClass(CodeBlock, [BlockOverride]) {}
