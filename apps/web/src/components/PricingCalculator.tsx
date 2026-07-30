import { useState } from "react";
import { useT } from "../lib/i18n";
import { COMPETITORS, DOCRACY_PRICE, formatUsd } from "../lib/competitors";

export default function PricingCalculator() {
  const t = useT();
  const [teamSize, setTeamSize] = useState(5);

  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 4 }}>{t("calc.title")}</h2>
      <p style={{ marginTop: 0, marginBottom: 24, maxWidth: 640 }}>{t("calc.sub")}</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <label htmlFor="team-size-slider" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--mute)" }}>
          {t("calc.teamSize")}
        </label>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "4px 0 12px" }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)" }}>{teamSize}</span>
          <span style={{ fontSize: 14, color: "var(--mute)" }}>{teamSize === 1 ? t("common.person") : t("common.people")}</span>
        </div>
        <input
          id="team-size-slider"
          type="range"
          min={1}
          max={20}
          value={teamSize}
          onChange={(e) => setTeamSize(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--mute)", marginTop: 4 }}>
          <span>1</span>
          <span>20</span>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20, borderColor: "var(--primary)", borderWidth: 2 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--primary)" }}>Docracy</div>
          <div style={{ fontSize: 13, color: "var(--mute)" }}>{t("calc.unlimitedMembers")}</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>
          {formatUsd(DOCRACY_PRICE)}
          <span style={{ fontSize: 14, fontWeight: 400, color: "var(--mute)" }}>{t("calc.perMonth")}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {COMPETITORS.map((c) => {
          const seats = Math.max(teamSize, c.minSeats);
          const total = seats * c.pricePerSeat;
          const delta = total - DOCRACY_PRICE;
          return (
            <div key={c.name} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  {c.name}{" "}
                  <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600 }}>
                    {t("calc.pricingLink")}
                  </a>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 13, color: "var(--danger)", fontWeight: 700, marginRight: 8 }}>
                    +{formatUsd(delta)}
                    {t("calc.perMonth")}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>{formatUsd(total)}</span>
                  <span style={{ fontSize: 13, color: "var(--mute)" }}>{t("calc.perMonth")}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 6 }}>
                {t("calc.perUser", { price: formatUsd(c.pricePerSeat), seats, billing: c.billing })}
                {seats > teamSize ? t("calc.minSeats", { min: c.minSeats }) : ""}
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 16 }}>{t("calc.footer")}</p>
    </div>
  );
}
