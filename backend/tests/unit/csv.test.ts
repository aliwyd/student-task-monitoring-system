import { describe, it, expect } from "vitest";
import { toCsv } from "../../src/domain/csv";

describe("toCsv", () => {
  it("writes a header and CRLF-terminated rows", () => {
    expect(toCsv(["a", "b"], [[1, "x"], [2, "y"]])).toBe("a,b\r\n1,x\r\n2,y\r\n");
  });
  it("outputs only the header when there are no rows", () => expect(toCsv(["a", "b"], [])).toBe("a,b\r\n"));
  it("quotes cells containing commas, quotes or newlines and doubles quotes", () => {
    expect(toCsv(["t"], [["a,b"], ['say "hi"'], ["line1\nline2"]])).toBe('t\r\n"a,b"\r\n"say ""hi"""\r\n"line1\nline2"\r\n');
  });
  it("formats dates as ISO strings and null/undefined as empty", () => {
    expect(toCsv(["d", "n", "u"], [[new Date("2026-12-10T12:00:00.000Z"), null, undefined]])).toBe("d,n,u\r\n2026-12-10T12:00:00.000Z,,\r\n");
  });
  it("neutralises spreadsheet formulas in text cells", () => {
    const out = toCsv(["t"], [["=1+1"], ["+cmd"], ["-cmd"], ["@SUM(A1)"], ["\tTAB"]]);
    expect(out).toBe("t\r\n'=1+1\r\n'+cmd\r\n'-cmd\r\n'@SUM(A1)\r\n'\tTAB\r\n");
  });
  it("does not alter numbers, including negatives", () => expect(toCsv(["n"], [[-5], [0], [3.5]])).toBe("n\r\n-5\r\n0\r\n3.5\r\n"));
  it("still quotes a neutralised cell that needs quoting", () => expect(toCsv(["t"], [["=a,b"]])).toBe("t\r\n\"'=a,b\"\r\n"));
});
