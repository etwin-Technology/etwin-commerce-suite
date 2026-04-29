import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — ETWIN Commerce" },
      { name: "description", content: "Connectez-vous à votre tableau de bord ETWIN Commerce." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@etwin.app");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user: loggedUser } = await login(email, password);
      // Super admins without a store go directly to admin panel
      if (loggedUser?.role === "super_admin" || loggedUser?.role === "admin") {
        void navigate({ to: "/admin" });
      } else {
        void navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-32 -end-32 size-96 rounded-full bg-ochre/20 blur-3xl" />
        <Link to="/" className="font-serif text-2xl font-bold relative">ETWIN</Link>
        <div className="relative">
          <p className="font-serif text-3xl leading-snug max-w-md">
            « ETWIN Commerce nous a permis de lancer notre boutique en français et en arabe en moins d'une semaine. »
          </p>
          <p className="mt-6 text-sm text-primary-foreground/70">— Karim B., fondateur, Maison Atlas</p>
        </div>
      </div>

      <div className="flex flex-col p-6 sm:p-12">
        <div className="flex justify-between items-center">
          <Link to="/" className="lg:hidden font-serif text-xl font-bold text-primary">ETWIN</Link>
          <div className="ms-auto"><LanguageSwitcher subtle /></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h1 className="font-serif text-3xl font-bold">{t("auth.loginTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <Field
                label={t("auth.email")}
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
              <Field
                label={t("auth.password")}
                type="password"
                value={password}
                onChange={setPassword}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {loading ? t("common.loading") : t("auth.submitLogin")}
              </button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                {t("auth.signupLink")}
              </Link>
            </p>

            <div className="mt-8 p-4 rounded-xl bg-surface-alt border border-border text-xs space-y-2">
              <p className="font-semibold text-foreground mb-2">Comptes démo — mot de passe : <code className="text-primary">demo1234</code></p>
              {[
                { email: "demo@etwin.app",       label: "Marchand",    desc: "Atlas Watches · Essai" },
                { email: "admin@etwin.app",       label: "Admin",       desc: "Sahara Boutique · Pro" },
                { email: "superadmin@etwin.app",  label: "Super Admin", desc: "Accès complet" },
              ].map(a => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => setEmail(a.email)}
                  className="w-full text-start px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <span className="font-medium text-foreground">{a.label}</span>
                  <span className="text-muted-foreground ms-2 text-[11px]">{a.email}</span>
                  <span className="block text-[10px] text-muted-foreground/60">{a.desc}</span>
                </button>
              ))}
            </div>
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
