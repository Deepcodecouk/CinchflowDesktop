export interface OfxTransaction {
  date: number;
  amount: number;
  description: string;
  fitId: string | null;
}

export function parseOfx(content: string): OfxTransaction[] {
  const transactions: OfxTransaction[] = [];

  // Match STMTTRN blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];

    const dateStr = extractTag(block, 'DTPOSTED');
    const amountStr = extractTag(block, 'TRNAMT');
    const name = extractTag(block, 'NAME');
    const memo = extractTag(block, 'MEMO');
    const fitId = extractTag(block, 'FITID');

    if (!dateStr || !amountStr) continue;

    const date = parseOfxDate(dateStr);
    const amount = parseFloat(amountStr);
    if (isNaN(date) || isNaN(amount)) continue;

    // Combine NAME and MEMO if both present and different
    let description = name || memo || '';
    if (name && memo && name !== memo) {
      description = `${name} - ${memo}`;
    }

    transactions.push({ date, amount, description: description.trim(), fitId });
  }

  return transactions;
}

function extractTag(block: string, tag: string): string | null {
  // OFX can use <TAG>value or <TAG>value</TAG>
  const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
  const match = regex.exec(block);
  return match ? match[1].trim() : null;
}

function parseOfxDate(dateStr: string): number {
  // Format: YYYYMMDD or YYYYMMDDHHmmss
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  return new Date(Date.UTC(year, month, day)).getTime() / 1000;
}
