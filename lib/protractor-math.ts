export function wrapAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

export function angleDifference(baseAngle: number, measureAngle: number) {
  return wrapAngle(measureAngle - baseAngle);
}

export function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function snapAngle(currentAngle: number, direction: number, step: number) {
  return wrapAngle(currentAngle + direction * step);
}

export function pointToAngle(x: number, y: number, centerX: number, centerY: number) {
  const radians = Math.atan2(y - centerY, x - centerX);
  return wrapAngle((radians * 180) / Math.PI);
}

export function scaleFromPinch(originScale: number, startDistance: number, currentDistance: number) {
  if (startDistance <= 0 || currentDistance <= 0) return clampNumber(originScale, 0.55, 1.18);
  return clampNumber(originScale * (currentDistance / startDistance), 0.55, 1.18);
}
