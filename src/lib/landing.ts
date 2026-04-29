// Editable landing page content store.
// Persisted in localStorage so admins can edit without a backend.
// When VITE_PHP_API_BASE is set, this can be wired to GET/PUT /api/landing.

import { useEffect, useState } from "react";

export type Lang = "ar" | "fr";

export interface LandingFeature {
  icon: string; // lucide name: zap, message-circle, truck, bell, smartphone, shield-check, sparkles, rocket
  title: string;
  desc: string;
}

export interface LandingTestimonial {
  name: string;
  city: string;
  quote: string;
  revenue: string;
  initials: string;
}

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingNavLink {
  label: string;
  href: string;
}

export interface LandingSocial {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  youtube?: string;
}

export interface LandingContent {
  brand: string;
  tagline: string;
  badge: string;
  heroTitle: string;
  heroHighlight: string; // a sub-phrase to render in accent
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  ctaNote: string;
  trustCounter: string;
  guarantee: string;
  watchDemo: string;
  heroStats: { value: string; label: string }[];

  navLinks: LandingNavLink[];

  featuresTitle: string;
  featuresSubtitle: string;
  features: LandingFeature[];

  howTitle: string;
  howSubtitle: string;
  steps: { title: string; desc: string }[];

  testimonialsTitle: string;
  testimonialsSubtitle: string;
  testimonials: LandingTestimonial[];

  pricingTitle: string;
  pricingSubtitle: string;
  pricingPrice: string;
  pricingCurrency: string;
  pricingPeriod: string;
  pricingFeatures: string[];
  pricingCta: string;

  faqTitle: string;
  faqs: LandingFaq[];

  ctaSectionTitle: string;
  ctaSectionSub: string;

  footerTagline: string;
  footerColumns: { title: string; links: LandingNavLink[] }[];
  footerCopyright: string;
  social: LandingSocial;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

const KEY_PREFIX = "etwin_landing_v1_";

const defaultsAr: LandingContent = {
  brand: "ETWIN Commerce",
  tagline: "أطلق متجرك. بِع اليوم.",
  badge: "🇲🇦 منصة مغربية للبيع أونلاين",
  heroTitle: "صاوب متجر كيبيع",
  heroHighlight: "فـ60 ثانية",
  heroSubtitle: "ETWIN كتعطيك متجر جاهز، WhatsApp مربوط، الدفع عند التسليم، إشعارات Telegram. كل شي باش تبدا تبيع اليوم.",
  ctaPrimary: "ابدا تجربة مجانية 14 يوم",
  ctaSecondary: "شوف الديمو",
  ctaNote: "بلا بطاقة بنكية · توقف فاش بغيتي",
  trustCounter: "+1200 تاجر مغربي كيستعمل ETWIN",
  guarantee: "ضمانة 30 يوم: إلا ما بعتيش، كنرجعو ليك فلوسك",
  watchDemo: "شوف الديمو (30 ثانية)",
  heroStats: [
    { value: "1200+", label: "تاجر نشيط" },
    { value: "60s", label: "إطلاق المتجر" },
    { value: "99 د.م.", label: "/ شهر فقط" },
    { value: "14 يوم", label: "تجربة مجانية" },
  ],
  navLinks: [
    { label: "المميزات", href: "#features" },
    { label: "كيفاش كيخدم", href: "#how" },
    { label: "تجار", href: "#testimonials" },
    { label: "الثمن", href: "#pricing" },
    { label: "أسئلة", href: "#faq" },
  ],

  featuresTitle: "كل شي محتاج تبيع، فبلاصة وحدة",
  featuresSubtitle: "بلا تعقيد. بلا ربط APIs. بلا مطورين.",
  features: [
    { icon: "zap", title: "متجر فـ60 ثانية", desc: "اسم المنتج، تصويرة، الثمن. صافي. المتجر ديالك على etwin.store/..." },
    { icon: "message-circle", title: "WhatsApp مدمج", desc: "زر أخضر دائم فالمتجر. كل طلب كيوصلك مباشرة فـWhatsApp." },
    { icon: "truck", title: "الدفع عند التسليم", desc: "مفعّل من الأول. الزبون كيطلب بلا حساب، بلا بطاقة." },
    { icon: "bell", title: "إشعارات Telegram", desc: "كل طلب جديد كيوصلك فـTelegram مع زر «أكد» و «ألغي»." },
    { icon: "smartphone", title: "Pixel Facebook & TikTok", desc: "ربط Pixel ديالك بنقرة. كتبدا تتبّع الإعلانات نهار 1." },
    { icon: "shield-check", title: "صفحة منتج كتبيع", desc: "تصاوير، تخفيض، «بقا 4 قطع»، تقييمات، إشعارات حية." },
  ],

  howTitle: "3 خطوات. أنت تاجر.",
  howSubtitle: "حرفياً أقل من 60 ثانية.",
  steps: [
    { title: "1. سجل", desc: "بريد + كلمة سر. صافي." },
    { title: "2. زيد منتج", desc: "اسم، تصويرة، ثمن. كافي." },
    { title: "3. شير الرابط", desc: "WhatsApp، Instagram، TikTok. الفلوس كيدخلو." },
  ],

  testimonialsTitle: "تجار كيبيعو فعلاً",
  testimonialsSubtitle: "مغاربة كيخدمو وكيربحو يومياً مع ETWIN.",
  testimonials: [
    { name: "Hamza", city: "Casablanca", quote: "بدلت Shopify بـETWIN، فلوس قل، مبيعات أكثر. الـTelegram bot هاد شي زوين.", revenue: "32,400 د.م./شهر", initials: "HC" },
    { name: "Salma", city: "Tanger", quote: "صاوبت المتجر فـ4 دقائق. أول طلب جا فـ24 ساعة. شكراً ETWIN.", revenue: "8,900 د.م./شهر", initials: "ST" },
    { name: "Anas", city: "Marrakech", quote: "WhatsApp + COD = combo قاتل. زبناءي كيوثقو وكيشريو بلا تردد.", revenue: "21,750 د.م./شهر", initials: "AM" },
  ],

  pricingTitle: "ثمن واحد. كلشي مفتوح.",
  pricingSubtitle: "بلا حدود فالمنتجات. بلا حدود فالطلبات.",
  pricingPrice: "99",
  pricingCurrency: "د.م.",
  pricingPeriod: "/شهر",
  pricingFeatures: [
    "منتجات وطلبات بلا حدود",
    "إشعارات Telegram + WhatsApp",
    "Pixel Facebook & TikTok",
    "حذف العلامة ديال ETWIN",
    "دعم بالدارجة 7/7",
    "ضمانة الإسترجاع 30 يوم",
  ],
  pricingCta: "بدا دابا — 14 يوم مجاناً",

  faqTitle: "أسئلة شائعة",
  faqs: [
    { q: "واش محتاج بطاقة بنكية؟", a: "لا. التجربة 14 يوم مجاناً بلا بطاقة." },
    { q: "واش كيخدم بالعربية والفرنسية؟", a: "إيه. المتجر ديالك واللوحة باللغتين، RTL مفعّل تلقائياً." },
    { q: "كيفاش كنخلص؟", a: "Bank transfer أو CMI. كنوريوك التفاصيل بعد التسجيل." },
    { q: "واش نقدر نلغي فاش بغيت؟", a: "إيه، بنقرة وحدة من اللوحة. ما كاين حتى التزام." },
  ],

  ctaSectionTitle: "وجد متجرك دابا.",
  ctaSectionSub: "أقل من 60 ثانية. أول بيعة قبل العشية.",

  footerTagline: "منصة مغربية لإطلاق متاجر كتبيع. WhatsApp + COD + Telegram.",
  footerColumns: [
    { title: "المنتج", links: [
      { label: "المميزات", href: "#features" },
      { label: "الثمن", href: "#pricing" },
      { label: "ديمو", href: "#how" },
    ]},
    { title: "الشركة", links: [
      { label: "علينا", href: "#" },
      { label: "تواصل", href: "#" },
      { label: "المدونة", href: "#" },
    ]},
    { title: "قانوني", links: [
      { label: "الشروط", href: "#" },
      { label: "الخصوصية", href: "#" },
    ]},
  ],
  footerCopyright: "© 2026 ETWIN Commerce. صنع فالمغرب 🇲🇦",
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    whatsapp: "https://wa.me/212600000000",
    youtube: "",
  },
  contactEmail: "hello@etwin.app",
  contactPhone: "+212 6 00 00 00 00",
  contactAddress: "Casablanca, المغرب",
};

const defaultsFr: LandingContent = {
  brand: "ETWIN Commerce",
  tagline: "Lance ta boutique. Vends aujourd'hui.",
  badge: "🇲🇦 Plateforme marocaine pour vendre en ligne",
  heroTitle: "Crée une boutique qui vend",
  heroHighlight: "en 60 secondes",
  heroSubtitle: "ETWIN te donne une boutique prête, WhatsApp connecté, paiement à la livraison, notifications Telegram. Tout pour vendre dès aujourd'hui.",
  ctaPrimary: "Essai gratuit 14 jours",
  ctaSecondary: "Voir la démo",
  ctaNote: "Sans carte bancaire · annule quand tu veux",
  trustCounter: "+1200 vendeurs marocains utilisent ETWIN",
  guarantee: "Garantie 30 jours : si tu ne vends pas, on rembourse",
  watchDemo: "Voir la démo (30 sec)",
  heroStats: [
    { value: "1200+", label: "Vendeurs actifs" },
    { value: "60s", label: "Pour lancer" },
    { value: "99 MAD", label: "/ mois seulement" },
    { value: "14 j", label: "Essai gratuit" },
  ],
  navLinks: [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Comment ça marche", href: "#how" },
    { label: "Vendeurs", href: "#testimonials" },
    { label: "Tarifs", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ],

  featuresTitle: "Tout pour vendre, en un seul endroit",
  featuresSubtitle: "Pas de complexité. Pas d'API. Pas de développeurs.",
  features: [
    { icon: "zap", title: "Boutique en 60 sec", desc: "Nom du produit, photo, prix. C'est tout. Ta boutique est sur etwin.store/..." },
    { icon: "message-circle", title: "WhatsApp intégré", desc: "Bouton vert toujours visible. Chaque commande arrive directement sur WhatsApp." },
    { icon: "truck", title: "Paiement à la livraison", desc: "Activé par défaut. Le client commande sans compte, sans carte." },
    { icon: "bell", title: "Notifications Telegram", desc: "Chaque commande arrive sur Telegram avec boutons Confirmer / Annuler." },
    { icon: "smartphone", title: "Pixel Facebook & TikTok", desc: "Connecte ton Pixel en un clic. Track tes pubs dès le jour 1." },
    { icon: "shield-check", title: "Page produit qui convertit", desc: "Photos, remise, scarcity, avis, notifs live. Tout activé." },
  ],

  howTitle: "3 étapes. Tu es vendeur.",
  howSubtitle: "Littéralement moins de 60 secondes.",
  steps: [
    { title: "1. Inscris-toi", desc: "Email + mot de passe. C'est tout." },
    { title: "2. Ajoute un produit", desc: "Nom, photo, prix. Suffisant." },
    { title: "3. Partage le lien", desc: "WhatsApp, Instagram, TikTok. L'argent rentre." },
  ],

  testimonialsTitle: "Des vendeurs qui vendent vraiment",
  testimonialsSubtitle: "Des Marocains qui gagnent chaque jour avec ETWIN.",
  testimonials: [
    { name: "Hamza", city: "Casablanca", quote: "J'ai quitté Shopify pour ETWIN, moins cher, plus de ventes. Le bot Telegram est génial.", revenue: "32 400 MAD/mois", initials: "HC" },
    { name: "Salma", city: "Tanger", quote: "Boutique créée en 4 minutes. Première commande en 24h. Merci ETWIN.", revenue: "8 900 MAD/mois", initials: "ST" },
    { name: "Anas", city: "Marrakech", quote: "WhatsApp + COD = combo gagnant. Mes clients commandent sans hésiter.", revenue: "21 750 MAD/mois", initials: "AM" },
  ],

  pricingTitle: "Un seul prix. Tout débloqué.",
  pricingSubtitle: "Produits et commandes illimités. Pas de marque ETWIN.",
  pricingPrice: "99",
  pricingCurrency: "MAD",
  pricingPeriod: "/mois",
  pricingFeatures: [
    "Produits et commandes illimités",
    "Notifications Telegram + WhatsApp",
    "Pixel Facebook & TikTok",
    "Suppression du branding ETWIN",
    "Support en darija 7/7",
    "Garantie remboursé 30 jours",
  ],
  pricingCta: "Commencer — 14 jours gratuits",

  faqTitle: "Questions fréquentes",
  faqs: [
    { q: "Faut-il une carte bancaire ?", a: "Non. L'essai 14 jours est gratuit, sans carte." },
    { q: "C'est en arabe et français ?", a: "Oui. Boutique et tableau dans les deux langues, RTL automatique." },
    { q: "Comment je paie ?", a: "Virement bancaire ou CMI. On t'envoie les détails après inscription." },
    { q: "Puis-je annuler ?", a: "Oui, en un clic depuis ton tableau. Aucun engagement." },
  ],

  ctaSectionTitle: "Lance ta boutique maintenant.",
  ctaSectionSub: "Moins de 60 secondes. Première vente avant ce soir.",

  footerTagline: "Plateforme marocaine pour boutiques qui vendent. WhatsApp + COD + Telegram.",
  footerColumns: [
    { title: "Produit", links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Démo", href: "#how" },
    ]},
    { title: "Société", links: [
      { label: "À propos", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#" },
    ]},
    { title: "Légal", links: [
      { label: "CGU", href: "#" },
      { label: "Confidentialité", href: "#" },
    ]},
  ],
  footerCopyright: "© 2026 ETWIN Commerce. Fabriqué au Maroc 🇲🇦",
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    whatsapp: "https://wa.me/212600000000",
    youtube: "",
  },
  contactEmail: "hello@etwin.app",
  contactPhone: "+212 6 00 00 00 00",
  contactAddress: "Casablanca, Maroc",
};

export const defaults: Record<Lang, LandingContent> = { ar: defaultsAr, fr: defaultsFr };

export function loadLanding(lang: Lang): LandingContent {
  if (typeof localStorage === "undefined") return defaults[lang];
  try {
    const raw = localStorage.getItem(KEY_PREFIX + lang);
    if (!raw) return defaults[lang];
    return { ...defaults[lang], ...JSON.parse(raw) } as LandingContent;
  } catch {
    return defaults[lang];
  }
}

export function saveLanding(lang: Lang, content: LandingContent) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY_PREFIX + lang, JSON.stringify(content));
  window.dispatchEvent(new CustomEvent("etwin:landing-updated", { detail: { lang } }));
}

export function resetLanding(lang: Lang) {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY_PREFIX + lang);
  window.dispatchEvent(new CustomEvent("etwin:landing-updated", { detail: { lang } }));
}

export function useLandingContent(lang: Lang): LandingContent {
  const [content, setContent] = useState<LandingContent>(() => loadLanding(lang));
  useEffect(() => {
    setContent(loadLanding(lang));
    const handler = () => setContent(loadLanding(lang));
    window.addEventListener("etwin:landing-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("etwin:landing-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, [lang]);
  return content;
}
