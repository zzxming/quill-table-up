import type { RelactiveRect } from './types';

export function isRectanglesIntersect<T extends Omit<RelactiveRect, 'width' | 'height'>>(a: T, b: T, tolerance = 0, edgeJudge: boolean = true) {
  const { x: minAx, y: minAy, x1: maxAx, y1: maxAy } = a;
  const { x: minBx, y: minBy, x1: maxBx, y1: maxBy } = b;

  let notOverlapX;
  let notOverlapY;
  if (edgeJudge) {
    notOverlapX = maxAx < minBx + tolerance || minAx - tolerance > maxBx;
    notOverlapY = maxAy < minBy + tolerance || minAy - tolerance > maxBy;
  }
  else {
    notOverlapX = maxAx <= minBx + tolerance || minAx - tolerance >= maxBx;
    notOverlapY = maxAy <= minBy + tolerance || minAy - tolerance >= maxBy;
  }
  return !(notOverlapX || notOverlapY);
}

export function getRelativeRect(targetRect: Omit<RelactiveRect, 'x1' | 'y1'>, container: HTMLElement): RelactiveRect {
  const containerRect = container.getBoundingClientRect();
  return {
    x: targetRect.x - containerRect.x - container.scrollLeft,
    y: targetRect.y - containerRect.y - container.scrollTop,
    x1: targetRect.x - containerRect.x - container.scrollLeft + targetRect.width,
    y1: targetRect.y - containerRect.y - container.scrollTop + targetRect.height,
    width: targetRect.width,
    height: targetRect.height,
  };
}
