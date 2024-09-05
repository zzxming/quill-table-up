import { vi } from 'vitest';
import ResizeObserver from 'resize-observer-polyfill';

vi.stubGlobal('ResizeObserver', ResizeObserver);
