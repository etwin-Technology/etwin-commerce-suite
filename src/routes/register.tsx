import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Créer une boutique — ETWIN Commerce" },
      { name: "description", content: "Créez votre boutique ETWIN Commerce en quelques secondes." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", storeName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form);
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -bottom-32 -start-32 size-96 rounded-full bg-ochre/20 blur-3xl" />
        <Link to="/" className="font-serif text-2xl font-bold relative">ETWIN</Link>
        <div className="relative">
          <p className="font-serif text-3xl leading-snug max-w-md">
            Construisez quelque chose qui dure. Une boutique, votre marque, votre cadence.
          </p>
          <p className="mt-6 text-sm text-primary-foreground/70">7 jours d'essai gratuit · sans carte bancaire</p>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-12">
        <div className="flex justify-between items-center">
          <Link to="/" className="lg:hidden font-serif text-xl font-bold text-primary">ETWIN</Link>
          <div className="ms-auto"><LanguageSwitcher subtle /></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h1 className="font-serif text-3xl font-bold">{t("auth.signupTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.signupSubtitle")}</p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field label={t("auth.fullName")} type="text" value={form.fullName} onChange={update("fullName")} required />
              <Field label={t("auth.storeName")} type="text" value={form.storeName} onChange={update("storeName")} required />
              <Field label={t("auth.email")} type="email" value={form.email} onChange={update("email")} required />
              <Field label={t("auth.password")} type="password" value={form.password} onChange={update("password")} required />

              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? t("common.loading") : t("auth.submitSignup")}
              </button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              {t("auth.haveAccount")}{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t("auth.loginLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
      />
    </label>
  );
}
