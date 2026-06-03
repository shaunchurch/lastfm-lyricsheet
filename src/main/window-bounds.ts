export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export function getAnchoredWindowBounds(
  bounds: WindowRect,
  size: WindowSize,
  workArea: WindowRect,
): WindowRect {
  const rightEdge = workArea.x + workArea.width;
  const leftInset = bounds.x - workArea.x;
  const rightInset = rightEdge - (bounds.x + bounds.width);
  const anchorToRight = rightInset < leftInset;
  const nextX = anchorToRight ? rightEdge - rightInset - size.width : bounds.x;

  return {
    x: clamp(nextX, workArea.x, rightEdge - size.width),
    y: clamp(bounds.y, workArea.y, workArea.y + workArea.height - size.height),
    width: size.width,
    height: size.height,
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
