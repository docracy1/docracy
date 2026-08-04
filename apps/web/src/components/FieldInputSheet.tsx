import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";
import type { DocField } from "../lib/types";

export interface FieldInputSheetProps {
  field: DocField;
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

/** Bottom sheet for text / date / dropdown on mobile — avoids tiny PDF-overlay inputs. */
export default function FieldInputSheet({ field, initialValue, onSave, onCancel }: FieldInputSheetProps) {
  const t = useT();
  const type = field.type ?? "text";
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [field.id, initialValue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const title =
    type === "date"
      ? t("sign.dateField")
      : type === "dropdown"
        ? t("sign.dropdownField")
        : t("sign.textField");

  const canSave = type === "dropdown" ? Boolean(value) : Boolean(value.trim());

  return (
    <div className="field-sheet-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="field-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="field-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="field-sheet-handle" aria-hidden />
        <h2 id="field-sheet-title" className="field-sheet-title">
          {title}
        </h2>

        {type === "date" ? (
          <input
            className="form-input field-sheet-input"
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={t("sign.dateField")}
            autoFocus
          />
        ) : type === "dropdown" ? (
          <select
            className="form-input field-sheet-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={t("sign.dropdownField")}
            autoFocus
          >
            <option value="">{t("sign.choose")}</option>
            {(field.options ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="form-input field-sheet-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("sign.typeHere")}
            aria-label={t("sign.textField")}
            autoFocus
          />
        )}

        <div className="field-sheet-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!canSave}
            onClick={() => onSave(type === "text" ? value.trim() : value)}
          >
            {t("sign.fieldDone")}
          </button>
        </div>
      </div>
    </div>
  );
}
