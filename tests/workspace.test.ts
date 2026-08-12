import { describe, expect, it } from "vitest";

import { createWorkspaceTitle } from "../lib/workspace";

describe("작업 기록", () => {
  it("저장 시점을 읽기 쉬운 작업 제목으로 구성한다", () => {
    expect(createWorkspaceTitle(new Date(2026, 7, 12, 5, 4))).toBe("8/12 측정 05:04");
  });
});
