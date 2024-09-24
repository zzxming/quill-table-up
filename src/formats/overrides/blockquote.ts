import type TypeBlockquote from 'quill/formats/blockquote';
import Quill from 'quill';
import { mixinClass } from '../../utils';
import { BlockOverride } from './block';

const Blockquote = Quill.import('formats/blockquote') as typeof TypeBlockquote;

export class BlockquoteOverride extends mixinClass(Blockquote, [BlockOverride]) {}
