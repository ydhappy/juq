import { describe, expect, it } from "vitest";

import { angleDifference, clampNumber, pointToAngle, scaleFromPinch, snapAngle, wrapAngle } from "../lib/protractor-math";

describe("각도기 수학", () => {
  it("임의의 각도를 0도 이상 360도 미만 범위로 정규화한다", () => {
    expect(wrapAngle(-1)).toBe(359);
    expect(wrapAngle(360)).toBe(0);
    expect(wrapAngle(721)).toBe(1);
  });

  it("기준선을 지나가는 시계 방향 차이를 0~360도로 계산한다", () => {
    expect(angleDifference(0, 44)).toBe(44);
    expect(angleDifference(315, 45)).toBe(90);
    expect(angleDifference(45, 315)).toBe(270);
  });

  it("스냅 단위 조절과 위치 제한을 일관되게 적용한다", () => {
    expect(snapAngle(358, 1, 5)).toBe(3);
    expect(snapAngle(2, -1, 5)).toBe(357);
    expect(clampNumber(5, 10, 40)).toBe(10);
    expect(clampNumber(55, 10, 40)).toBe(40);
  });

  it("화면 터치 위치를 화면 좌표 기준 0~360도 각도로 변환한다", () => {
    expect(pointToAngle(20, 10, 10, 10)).toBe(0);
    expect(pointToAngle(10, 20, 10, 10)).toBe(90);
    expect(pointToAngle(0, 10, 10, 10)).toBe(180);
    expect(pointToAngle(10, 0, 10, 10)).toBe(270);
  });

  it("두 손가락 간격 비율에 따라 각도기 크기를 안전 범위에서 갱신한다", () => {
    expect(scaleFromPinch(0.9, 100, 150)).toBeCloseTo(1.18);
    expect(scaleFromPinch(0.9, 100, 50)).toBeCloseTo(0.55);
    expect(scaleFromPinch(0.8, 100, 110)).toBeCloseTo(0.88);
  });
});
