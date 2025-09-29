import { convertToMediaId, convertToCategoryId } from "@/hooks/article";

describe("convertToMediaId", () => {
  it("should return the correct MediaId for valid inputs", () => {
    expect(convertToMediaId("ai-textbook")).toBe("ai-textbook");
    expect(convertToMediaId("gyomu-system-textbook")).toBe(
      "gyomu-system-textbook",
    );
  });

  it("不正な入力の場合は空文字を返す", () => {
    expect(convertToMediaId("invalid-input")).toBe("");
    expect(convertToMediaId("")).toBe("");
  });
});

describe("convertToCategoryId", () => {
  it("should return the correct CategoryId for valid inputs", () => {
    expect(convertToCategoryId("column")).toBe("column");
    expect(convertToCategoryId("glossary")).toBe("glossary");
  });

  it("不正な入力の場合は空文字を返す", () => {
    expect(convertToCategoryId("invalid-input")).toBe("");
    expect(convertToCategoryId("")).toBe("");
  });
});
