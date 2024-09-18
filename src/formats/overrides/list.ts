import Quill from 'quill';
import type TypeListItem from 'quill/formats/list';
import { mixinClass } from '../../utils';
import { BlockOverride } from './block';

const ListItem = Quill.import('formats/list') as typeof TypeListItem;

export class ListItemOverride extends mixinClass(ListItem, [BlockOverride]) {}