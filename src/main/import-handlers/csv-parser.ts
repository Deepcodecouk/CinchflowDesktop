export interface CsvRow {
  fields: string[];
  get(index: number): string;
}

export function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const rows: CsvRow[] = [];

  for (const line of lines) {
    const fields = parseCsvLine(line);
    rows.push({
      fields,
      get(index: number) {
        return fields[index]?.trim() ?? '';
      },
    });
  }

  // Auto-detect and skip header row
  if (rows.length > 0) {
    const firstRow = rows[0].fields.map((f) => f.toLowerCase());
    const headerKeywords = ['date', 'description', 'amount', 'credit', 'debit', 'balance', 'transaction'];
    const isHeader = firstRow.some((f) => headerKeywords.some((k) => f.includes(k)));
    if (isHeader) {
      rows.shift();
    }
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  fields.push(current);
  return fields;
}
