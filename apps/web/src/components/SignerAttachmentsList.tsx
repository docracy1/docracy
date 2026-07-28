export interface SignerAttachmentGroup {
  order: number;
  name: string;
  attachments: Array<{ id: string; name: string; sizeBytes: number; uploadedAt?: string }>;
}

export function SignerAttachmentsList({
  groups,
  buildDownloadUrl,
}: {
  groups: SignerAttachmentGroup[];
  buildDownloadUrl: (signerOrder: number, attachmentId: string) => string;
}) {
  if (groups.length === 0) return null;
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
      <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 8 }}>Signer uploads</h3>
      {groups.map((group) => (
        <div key={group.order} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{group.name}</div>
          {group.attachments.map((a) => (
            <a
              key={a.id}
              href={buildDownloadUrl(group.order, a.id)}
              download
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              {a.name} ({Math.max(1, Math.round(a.sizeBytes / 1024))} KB)
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}
