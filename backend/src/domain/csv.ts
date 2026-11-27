export type CsvCell = string | number | boolean | Date | null | undefined;

const FORMULA_START = /^[=+\-@\t\r]/; // spreadsheets may execute cells starting with these (CSV injection)
const NEEDS_QUOTES = /[",\r\n]/;

function formatCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** RFC 4180-style CSV with CRLF line endings and spreadsheet-formula neutralisation. */
export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((row) => row.map(formatCell).join(",")).join("\r\n") + "\r\n";
}
