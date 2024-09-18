import Quill from 'quill';
import type TypeHeader from 'quill/formats/header';
import { mixinClass } from '../../utils';
import { BlockOverride } from './block';

const Header = Quill.import('formats/header') as typeof TypeHeader;

export class HeaderOverride extends mixinClass(Header, [BlockOverride]) {}
