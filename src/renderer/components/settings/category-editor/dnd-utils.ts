import type { CategoryHeaderType } from '../../../../shared/types';

export interface ActiveDrag {
  type: 'header' | 'category';
  id: string;
}

// ID encoding — prefixed strings to distinguish drag/drop item types
export function headerDragId(id: string) { return `header::${id}`; }
export function catDragId(id: string) { return `cat::${id}`; }
export function typeDropId(type: string) { return `type::${type}`; }
export function headerDropId(id: string) { return `headerDrop::${id}`; }

// ID decoding — returns the entity ID or null if prefix doesn't match
export function parseHeaderDragId(id: string) { return id.startsWith('header::') ? id.slice(8) : null; }
export function parseCatDragId(id: string) { return id.startsWith('cat::') ? id.slice(5) : null; }
export function parseTypeDropId(id: string) { return id.startsWith('type::') ? (id.slice(6) as CategoryHeaderType) : null; }
export function parseHeaderDropId(id: string) { return id.startsWith('headerDrop::') ? id.slice(12) : null; }
