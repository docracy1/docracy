export type FieldType = "signature" | "text" | "date";

export interface DocField {
  id: string;
  signerOrder: number;
  page: number;
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
  type: FieldType;
  label?: string;
}

export interface SignerInput {
  order: number;
  name: string;
  email: string;
}

export interface StatusSigner {
  order: number;
  name: string;
  status: "pending" | "signed";
  signedAt: string | null;
}

export interface StatusPayload {
  docId: string;
  status: "pending" | "completed";
  signers: StatusSigner[];
}
