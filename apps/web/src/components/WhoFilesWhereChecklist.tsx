import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchWhoFilesVault, saveWhoFilesVault, type Account } from "../lib/api";
import { localizePath, useI18n } from "../lib/i18n";
import { LATAM_COUNTRY_CORRIDORS } from "../lib/latamCountryCorridors";
import {
  WHO_FILES_COUNTRY_KEY,
  WHO_FILES_GROUPS,
  WHO_FILES_ROWS,
  WHO_FILES_STORAGE_KEY,
  type WhoFilesRow,
} from "../lib/whoFilesWhere";

export type WhoFilesAction = (to: string, label: string, source: string) => ReactNode;

type VaultHint = "pending" | "local" | "account" | "paid";

function readDone(): string[] {
  try {
    const raw = localStorage.getItem(WHO_FILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function readCountry(): string {
  try {
    return localStorage.getItem(WHO_FILES_COUNTRY_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeLocal(done: string[], countrySlug: string) {
  try {
    localStorage.setItem(WHO_FILES_STORAGE_KEY, JSON.stringify(done));
    if (countrySlug) localStorage.setItem(WHO_FILES_COUNTRY_KEY, countrySlug);
    else localStorage.removeItem(WHO_FILES_COUNTRY_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

export default function WhoFilesWhereChecklist({
  account,
  renderAction,
  sourcePrefix,
}: {
  /** undefined = still loading /me; null = signed out; object = signed in (KV vault). */
  account?: Account | null;
  renderAction?: WhoFilesAction;
  sourcePrefix: string;
}) {
  const { t, locale } = useI18n();
  const [done, setDone] = useState<string[]>([]);
  const [countrySlug, setCountrySlug] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [vaultHint, setVaultHint] = useState<VaultHint>("pending");

  useEffect(() => {
    let cancelled = false;
    const localDone = readDone();
    const localCountry = readCountry();
    setDone(localDone);
    setCountrySlug(localCountry);
    setHydrated(true);

    if (account === undefined) {
      setVaultHint("pending");
      return;
    }
    if (!account) {
      setVaultHint("local");
      return;
    }

    fetchWhoFilesVault()
      .then((vault) => {
        if (cancelled) return;
        const vaultHas = Boolean(vault.updatedAt) && (vault.done.length > 0 || Boolean(vault.countrySlug));
        if (vaultHas) {
          setDone(vault.done);
          setCountrySlug(vault.countrySlug);
          writeLocal(vault.done, vault.countrySlug);
        } else if (localDone.length || localCountry) {
          void saveWhoFilesVault({ done: localDone, countrySlug: localCountry });
        }
        setVaultHint(account.isPaid ? "paid" : "account");
      })
      .catch(() => {
        if (!cancelled) setVaultHint("local");
      });

    return () => {
      cancelled = true;
    };
  }, [account]);

  const persist = (nextDone: string[], nextCountry: string) => {
    setDone(nextDone);
    setCountrySlug(nextCountry);
    writeLocal(nextDone, nextCountry);
    if (account) {
      void saveWhoFilesVault({ done: nextDone, countrySlug: nextCountry });
    }
  };

  const onToggle = (id: string) => {
    persist(done.includes(id) ? done.filter((x) => x !== id) : [...done, id], countrySlug);
  };

  const onCountry = (slug: string) => {
    persist(done, slug);
  };

  const country = LATAM_COUNTRY_CORRIDORS.find((c) => c.slug === countrySlug);
  const doneCount = WHO_FILES_ROWS.filter((row) => done.includes(row.id)).length;

  const groups = useMemo(
    () =>
      WHO_FILES_GROUPS.map((group) => ({
        group,
        rows: WHO_FILES_ROWS.filter((row) => row.group === group),
      })),
    []
  );

  const hintKey =
    vaultHint === "paid" ? "whoFiles.vaultPaid" : vaultHint === "account" ? "whoFiles.vaultAccount" : "whoFiles.vaultLocal";

  return (
    <div className="who-files">
      <p className="who-files-progress" aria-live="polite">
        {t("whoFiles.progress", { done: String(doneCount), total: String(WHO_FILES_ROWS.length) })}
      </p>
      {vaultHint !== "pending" ? <p className="who-files-vault-hint">{t(hintKey)}</p> : null}
      <nav className="who-files-jump" aria-label={t("whoFiles.jumpLabel")}>
        {WHO_FILES_GROUPS.map((group) => (
          <a key={group} href={`#who-files-${group}`}>
            {t(`whoFiles.group.${group}`)}
          </a>
        ))}
      </nav>

      {groups.map(({ group, rows }) => (
        <section key={group} id={`who-files-${group}`} className="who-files-group">
          <h3 className="who-files-group-title">{t(`whoFiles.group.${group}`)}</h3>
          <ol className="packet-steps">
            {rows.map((row, i) => (
              <ChecklistRow
                key={row.id}
                row={row}
                index={i}
                checked={hydrated && done.includes(row.id)}
                onToggle={() => onToggle(row.id)}
                renderAction={renderAction}
                sourcePrefix={sourcePrefix}
              />
            ))}
          </ol>
          {group === "origin" ? (
            <div className="card who-files-country">
              <label htmlFor="who-files-country">
                <strong>{t("whoFiles.apostillePick")}</strong>
              </label>
              <p>{t("whoFiles.apostillePickHint")}</p>
              <select
                id="who-files-country"
                value={countrySlug}
                onChange={(e) => onCountry(e.target.value)}
              >
                <option value="">{t("whoFiles.apostillePickEmpty")}</option>
                {LATAM_COUNTRY_CORRIDORS.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {locale === "es" ? `${c.countryEs} — ${c.apostilleLabelEs}` : `${c.countryEn} — ${c.apostilleLabelEn}`}
                  </option>
                ))}
              </select>
              {country ? (
                <p className="who-files-country-out">
                  <a href={country.officialHref} target="_blank" rel="noopener noreferrer">
                    {locale === "es" ? country.apostilleLabelEs : country.apostilleLabelEn}
                  </a>
                  {" — "}
                  {locale === "es" ? country.officialNoteEs : country.officialNoteEn}
                  {" · "}
                  <Link to={localizePath(country.enPath, locale)}>
                    {locale === "es" ? `${country.countryEs} → EE. UU.` : `${country.countryEn} → US`}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function ChecklistRow({
  row,
  index,
  checked,
  onToggle,
  renderAction,
  sourcePrefix,
}: {
  row: WhoFilesRow;
  index: number;
  checked: boolean;
  onToggle: () => void;
  renderAction?: WhoFilesAction;
  sourcePrefix: string;
}) {
  const { t, locale } = useI18n();
  const checkId = `who-files-check-${row.id}`;

  return (
    <li className={`card packet-step who-files-row${checked ? " is-done" : ""}`}>
      <div className="who-files-row-head">
        <input id={checkId} type="checkbox" checked={checked} onChange={onToggle} />
        <div>
          <p className="packet-step-num">{t("packet.stepN", { n: index + 1 })}</p>
          <h4>
            <label htmlFor={checkId}>{t(row.titleKey)}</label>
          </h4>
        </div>
      </div>
      <p className="who-files-body">{t(row.bodyKey)}</p>
      <p className="who-files-wedont">
        <span>{t("whoFiles.weDontLabel")}</span> {t(row.weDontKey)}
      </p>
      <div className="who-files-actions">
        {row.docracyTo && row.docracyCtaKey
          ? renderAction
            ? renderAction(row.docracyTo, t(row.docracyCtaKey), `${sourcePrefix}:${row.id}`)
            : (
              <Link to={localizePath(row.docracyTo, locale)} className="btn-secondary">
                {t(row.docracyCtaKey)}
              </Link>
            )
          : null}
        {row.officialHref && row.officialKey ? (
          <a href={row.officialHref} target="_blank" rel="noopener noreferrer">
            {t(row.officialKey)}
          </a>
        ) : null}
      </div>
    </li>
  );
}
