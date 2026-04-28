export const MAD = (n: number, lang: "fr" | "ar" = "fr") =>
  new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
    maximumFractionDigits: 0,
  }).format(n) + " MAD";

export const fmtCurrency = (n: number, currency: string = "MAD", lang: "fr" | "ar" = "fr") => {
  if (currency === "MAD") return MAD(n, lang);
  return new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-MA", { style: "currency", currency }).format(n);
};
