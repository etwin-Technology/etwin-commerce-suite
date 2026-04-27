import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { applyLangToDocument, type Lang, SUPPORTED_LANGS } from "@/i18n";

const LABELS: Record<Lang, string> = { fr: "FR", ar: "ع" };

export function LanguageSwitcher({ subtle = false }: { subtle?: boolean }) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage || "fr") as Lang;

  useEffect(() => {
    applyLangToDocument(current);
  }, [current]);

  const change = (l: Lang) => {
    void i18n.changeLanguage(l);
    applyLangToDocument(l);
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-border p-1 ${
        subtle ? "bg-transparent" : "bg-card"
      }`}
    >
      {SUPPORTED_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            current === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={current === l}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
