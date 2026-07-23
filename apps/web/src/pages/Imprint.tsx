import { usePageMeta } from "../lib/usePageMeta";

export default function Imprint() {
  usePageMeta("Imprint — Docracy", "Legal entity behind Docracy.");

  return (
    <div className="container">
      <h1>Imprint</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>Information according to §5 ECG (Austrian E-Commerce Act).</p>

      <h3>Operator</h3>
      <p style={{ marginBottom: 4 }}>RELACON GmbH</p>
      <p style={{ marginTop: 0 }}>
        Elisabethstraße 15/5b
        <br />
        1010 Vienna, Austria
      </p>

      <h3>Contact</h3>
      <p>
        <a href="mailto:founder@docracy.io">founder@docracy.io</a>
      </p>
    </div>
  );
}
