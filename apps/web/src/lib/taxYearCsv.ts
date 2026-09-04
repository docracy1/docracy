export function taxYearToCsv(
  year: number,
  documents: Array<{
    completedAt: string;
    title: string;
    counterparties: Array<{ name: string; email: string }>;
    amount: string;
    currency: string;
    paymentUrl: string;
    expiresAt: string;
    signedPageUrl: string;
  }>
): string {
  const header = [
    "year",
    "completedAt",
    "title",
    "counterpartyNames",
    "counterpartyEmails",
    "amount",
    "currency",
    "paymentUrl",
    "expiresAt",
    "signedPageUrl",
  ];
  const lines = [header.join(",")];
  for (const d of documents) {
    lines.push(
      [
        String(year),
        csvCell(d.completedAt),
        csvCell(d.title),
        csvCell(d.counterparties.map((c) => c.name).join("; ")),
        csvCell(d.counterparties.map((c) => c.email).filter(Boolean).join("; ")),
        csvCell(d.amount),
        csvCell(d.currency),
        csvCell(d.paymentUrl),
        csvCell(d.expiresAt),
        csvCell(d.signedPageUrl),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
