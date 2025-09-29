import { formatDate } from "@/hooks/format";

describe("formatDate", () => {
  it("should format the date in Japanese format (YYYY年MM月DD日)", () => {
    const inputDate = new Date("2024-12-20");
    const expectedOutput = "2024年12月20日";

    expect(formatDate(inputDate)).toBe(expectedOutput);
  });

  it("should handle single-digit months and days correctly", () => {
    const inputDate = new Date("2024-01-05");
    const expectedOutput = "2024年1月5日";

    expect(formatDate(inputDate)).toBe(expectedOutput);
  });

  it("should return a string in Japanese format even for a date object with time", () => {
    const inputDate = new Date("2024-12-20T15:30:00");
    const expectedOutput = "2024年12月20日";

    expect(formatDate(inputDate)).toBe(expectedOutput);
  });

  it("should throw an error if the input is not a valid date", () => {
    expect(() => formatDate(new Date("invalid date"))).toThrowError(
      "Invalid Date",
    );
  });
});
