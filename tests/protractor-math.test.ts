import { describe, expect, it } from "vitest";

import { angleDifference, clampNumber, snapAngle, wrapAngle } from "../lib/protractor-math";

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
});
