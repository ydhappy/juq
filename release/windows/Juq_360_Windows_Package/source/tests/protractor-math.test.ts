import { describe, expect, it } from "vitest";

import { angleDifference, clampNumber, pointToAngle, scaleFromPinch, snapAngle, snapMeasuredAngle, workspacePointToAngle, wrapAngle } from "../lib/protractor-math";

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

  it("화면 터치 위치를 북쪽 0도 기준의 시계 방향 각도로 변환한다", () => {
    expect(pointToAngle(10, 0, 10, 10)).toBe(0);
    expect(pointToAngle(20, 10, 10, 10)).toBe(90);
    expect(pointToAngle(10, 20, 10, 10)).toBe(180);
    expect(pointToAngle(0, 10, 10, 10)).toBe(270);
  });

  it("두 손가락 간격 비율에 따라 각도기 크기를 안전 범위에서 갱신한다", () => {
    expect(scaleFromPinch(0.9, 100, 150)).toBeCloseTo(1.18);
    expect(scaleFromPinch(0.9, 100, 50)).toBeCloseTo(0.55);
    expect(scaleFromPinch(0.8, 100, 110)).toBeCloseTo(0.88);
  });

  it("작업면 전체의 터치를 북쪽 0도 기준으로 계산한다", () => {
    expect(workspacePointToAngle(210, 80, 210, 180)).toBe(0);
    expect(workspacePointToAngle(310, 180, 210, 180)).toBe(90);
    expect(workspacePointToAngle(210, 280, 210, 180)).toBe(180);
    expect(workspacePointToAngle(110, 180, 210, 180)).toBe(270);
  });

  it("측정값을 선택한 눈금 단위로 반올림하고 360도 경계를 넘기지 않는다", () => {
    expect(snapMeasuredAngle(3.6, 1)).toBe(4);
    expect(snapMeasuredAngle(12.4, 5)).toBe(10);
    expect(snapMeasuredAngle(12.6, 5)).toBe(15);
    expect(snapMeasuredAngle(358, 5)).toBe(0);
  });
});
