import ResizeObserver from 'resize-observer-polyfill';
import { vi } from 'vitest';

vi.stubGlobal('ResizeObserver', ResizeObserver);
