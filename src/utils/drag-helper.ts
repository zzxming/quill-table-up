import type { Position } from './types';

export interface DragPosition {
  startPosition: Position;
  position: Position;
  movePosition: Position;
}
export interface DragElementOptions {
  axis: 'x' | 'y' | 'both';
  onStart: (position: DragPosition, e: PointerEvent) => void | boolean;
  onMove: (position: DragPosition, e: PointerEvent) => void;
  onEnd: (position: DragPosition, e: PointerEvent) => void;
  buttons: number[];
  container: HTMLElement;
  draggingElement: HTMLElement | Window | Document;
  exact: boolean;
}

export function dragElement(target: HTMLElement, options: Partial<DragElementOptions> = {}) {
  const {
    axis = 'both',
    onMove = () => {},
    onStart = () => {},
    onEnd = () => {},
    buttons = [0],
    container,
    draggingElement = document,
    exact = true,
  } = options;

  let position = { x: 0, y: 0 };
  let startPosition: Position | undefined;
  let startPoint = { x: 0, y: 0 };

  function updatePositionByEvent(e: PointerEvent) {
    if (!startPosition) return;
    const targetRect = target.getBoundingClientRect();
    let { x, y } = position;
    if (axis === 'x' || axis === 'both') {
      x = e.clientX - startPosition.x;
      if (container) {
        x = Math.min(Math.max(0, x), container.scrollWidth - targetRect!.width);
      }
    }
    if (axis === 'y' || axis === 'both') {
      y = e.clientY - startPosition.y;
      if (container) {
        y = Math.min(Math.max(0, y), container.scrollHeight - targetRect!.height);
      }
    }
    position = {
      x,
      y,
    };
  }
  function handlePointerDown(e: PointerEvent) {
    if (!buttons.includes(e.button)) return;
    if (exact && e.target !== target) return;

    (draggingElement as HTMLElement).addEventListener('pointerup', handlePointerUp);
    (draggingElement as HTMLElement).addEventListener('pointermove', handlePointerMove);

    const containerRect = container?.getBoundingClientRect?.();
    const targetRect = target.getBoundingClientRect();
    const pos = {
      x: e.clientX - (container ? targetRect.left - containerRect!.left + container.scrollLeft : targetRect.left),
      y: e.clientY - (container ? targetRect.top - containerRect!.top + container.scrollTop : targetRect.top),
    };
    startPoint = { x: e.clientX, y: e.clientY };
    if (onStart({
      position,
      startPosition: pos,
      movePosition: { x: e.clientX - startPoint.x, y: e.clientY - startPoint.y },
    }, e) === false) {
      return;
    }

    startPosition = pos;
    position = pos;
  }
  function handlePointerMove(e: PointerEvent) {
    if (!startPosition) return;
    updatePositionByEvent(e);
    onMove({
      position,
      startPosition,
      movePosition: { x: e.clientX - startPoint.x, y: e.clientY - startPoint.y },
    }, e);
  }
  function handlePointerUp(e: PointerEvent) {
    (draggingElement as HTMLElement).removeEventListener('pointermove', handlePointerMove);
    (draggingElement as HTMLElement).removeEventListener('pointerup', handlePointerUp);
    updatePositionByEvent(e);
    onEnd({
      position,
      startPosition: startPosition!,
      movePosition: { x: e.clientX - startPoint.x, y: e.clientY - startPoint.y },
    }, e);
    startPosition = undefined;
    startPoint = { x: 0, y: 0 };
    position = { x: 0, y: 0 };
  }

  (draggingElement as HTMLElement).addEventListener('pointerdown', handlePointerDown);

  const stop = () => {
    (draggingElement as HTMLElement).removeEventListener('pointerdown', handlePointerDown);
  };
  return {
    stop,
  };
}
