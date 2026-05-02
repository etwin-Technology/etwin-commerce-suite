// Excel import/export helpers using SheetJS (xlsx).
import * as XLSX from "xlsx";
import type { Order, Product, Customer } from "./api/types";

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

function makeSheet<T extends Record<string, unknown>>(rows: T[], sheetName: string): XLSX.WorkBook {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

const datePart = () => new Date().toISOString().slice(0, 10);

// ── Exports ──────────────────────────────────────────────────────────────────
export function exportOrders(orders: Order[], storeName = "store") {
  const rows = orders.map(o => ({
    "N°":        o.id,
    "Date":      new Date(o.createdAt).toLocaleString("fr-FR"),
    "Client":    o.customerName,
    "Téléphone": o.customerPhone || "",
    "Adresse":   o.customerAddress || "",
    "Ville":     o.city || "",
    "Total":     o.total,
    "Statut":    o.status,
    "Articles":  o.items.map(it => `${it.name} x${it.qty}`).join(" | "),
    "Notes":     o.notes || "",
  }));
  downloadWorkbook(makeSheet(rows, "Commandes"), `commandes-${storeName}-${datePart()}.xlsx`);
}

export function exportCustomers(customers: Customer[], storeName = "store") {
  const rows = customers.map(c => ({
    "Nom":         c.name,
    "Téléphone":   c.phone,
    "Adresse":     c.address,
    "Commandes":   c.ordersCount,
    "Total dépensé": c.totalSpent,
  }));
  downloadWorkbook(makeSheet(rows, "Clients"), `clients-${storeName}-${datePart()}.xlsx`);
}

export function exportProducts(products: Product[], storeName = "store") {
  const rows = products.map(p => ({
    "Nom":         p.name,
    "Description": p.description,
    "Prix":        p.price,
    "Prix barré":  p.originalPrice ?? "",
    "Stock":       p.stock,
    "Statut":      p.status,
    "Image":       p.image,
  }));
  downloadWorkbook(makeSheet(rows, "Produits"), `produits-${storeName}-${datePart()}.xlsx`);
}

// ── Product import template ─────────────────────────────────────────────────
export function downloadProductTemplate() {
  const sample = [{
    "Nom":         "Exemple - Montre Atlas",
    "Description": "Montre élégante 100% cuir.",
    "Prix":        299,
    "Prix barré":  450,
    "Stock":       10,
    "Statut":      "active",
    "Image":       "https://example.com/image.jpg",
  }];
  downloadWorkbook(makeSheet(sample, "Produits"), "modele-produits.xlsx");
}

export interface ParsedProduct {
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  status: "active" | "draft" | "archived";
  image: string;
}

export async function parseProductsFile(file: File): Promise<{ ok: ParsedProduct[]; errors: { row: number; msg: string }[] }> {
  const buf = await file.arrayBuffer();
  const wb  = XLSX.read(buf, { type: "array" });
  const ws  = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  const ok: ParsedProduct[] = [];
  const errors: { row: number; msg: string }[] = [];

  rows.forEach((r, i) => {
    const name = String(r["Nom"] ?? r["name"] ?? "").trim();
    const price = Number(r["Prix"] ?? r["price"] ?? 0);
    const stock = Number(r["Stock"] ?? r["stock"] ?? 0);
    const status = String(r["Statut"] ?? r["status"] ?? "active").trim();
    const image = String(r["Image"] ?? r["image"] ?? "").trim();
    const description = String(r["Description"] ?? r["description"] ?? "").trim();
    const originalRaw = r["Prix barré"] ?? r["originalPrice"];
    const originalPrice = originalRaw === "" || originalRaw == null ? null : Number(originalRaw);

    if (!name)        return errors.push({ row: i + 2, msg: "Nom manquant" });
    if (!price || isNaN(price)) return errors.push({ row: i + 2, msg: "Prix invalide" });
    if (!["active","draft","archived"].includes(status))
      return errors.push({ row: i + 2, msg: `Statut invalide: ${status}` });

    ok.push({
      name, description, price, stock: Math.max(0, Math.floor(stock)),
      status: status as ParsedProduct["status"],
      image: image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
      originalPrice: originalPrice && !isNaN(originalPrice) ? originalPrice : null,
    });
  });

  return { ok, errors };
}
