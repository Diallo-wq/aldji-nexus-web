import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Sale } from '../types';
import { APP_CONFIG } from './constants';
import { formatAmount } from './format';
import { CGU_HTML } from './legal';

export function buildSaleInvoiceHTML(params: {
  sale: Sale;
  business: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    tagline?: string;
    country?: string;
    termsUrl?: string;
  };
  currency?: string;
  invoiceNumberOverride?: string;
  dueDate?: Date;
}): string {
  const { sale, business, currency = 'GNF', invoiceNumberOverride, dueDate } = params;
  const taxRate = sale.subtotal > 0 ? (sale.tax / sale.subtotal) : 0;
  const invoiceNumber = invoiceNumberOverride || makeInvoiceNumber(sale);
  const invoiceNumberSlashed = makeInvoiceNumberSlashed(invoiceNumber);

  const fmt = (n: number) => formatAmount(n, { decimals: 0, currency });

  const rows = sale.items.map((it) => {
    const lineTax = it.totalPrice * taxRate;
    return `
      <tr>
        <td class="desc">${escapeHtml(it.productName)}</td>
        <td class="center">${it.quantity}</td>
        <td class="right">${fmt(it.unitPrice)}</td>
        <td class="right">${fmt(lineTax)}</td>
        <td class="right">${fmt(it.totalPrice)}</td>
      </tr>
    `;
  }).join('');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        :root{
          --primary:#1e3a8a; /* dark blue */
          --silver:#c0c0c0;  /* silver */
          --text:#0f172a;    /* slate-900 */
          --muted:#64748b;   /* slate-500 */
          --border:#e5e7eb;  /* gray-200 */
          --soft:#f5f7fb;    /* very light blue */
        }
        body { font-family: Arial, Helvetica, sans-serif; color: var(--text); }
        .container { padding: 24px 36px 48px; }
        .top { display:flex; justify-content: space-between; align-items: center; }
        .logo { width: 64px; height: 64px; background: var(--silver); border-radius: 6px; }
        .company-right { text-align: right; font-size: 12px; line-height: 1.4; color: var(--muted); }
        .slogan { margin-top: 8px; font-size: 12px; color: var(--muted); }
        .banner { margin-top: 12px; border-radius: 12px; padding: 16px 20px; display:flex; justify-content: flex-end; align-items: center; background: linear-gradient(90deg, var(--soft), #edf2ff); border:1px solid var(--border); }
        .banner-title { font-size: 22px; font-weight: 800; color: var(--primary); }
        .party { margin-top: 16px; font-size: 13px; }
        .dates { margin-top: 12px; display:flex; gap: 48px; font-size: 12px; }
        .dates .label { color: var(--muted); }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid var(--border); padding: 10px 12px; font-size: 13px; }
        thead th { background: #eef2ff; color: var(--primary); font-weight: 700; }
        .desc { width: 45%; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bottom { display:flex; justify-content: space-between; margin-top: 10px; align-items: flex-start; }
        .note { font-size: 12px; color: var(--muted); }
        .terms { margin-top: 10px; font-size: 12px; color: var(--muted); }
        .totals { width: 300px; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .totals td { border: 1px solid var(--border); font-size: 13px; }
        .totals .label { background:#f8fafc; color: var(--muted); }
        .totals .grand { font-weight: 900; color: var(--primary); background: #eef2ff; }
        .footer { position: fixed; left:36px; right:36px; bottom: 18px; font-size: 11px; color: var(--muted); display:flex; justify-content: space-between; border-top:1px solid var(--border); padding-top:6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="top">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="logo"></div>
            <div>
              <div style="font-weight:700;">${escapeHtml(business.name || 'OMEX')}</div>
              <div class="slogan">${escapeHtml(business.tagline || 'La qualité à votre portée.')}</div>
            </div>
          </div>
          <div class="company-right">
            <div>${escapeHtml(business.name || 'OMEX')}</div>
            <div>${escapeHtml(business.country || 'Guinée')}</div>
          </div>
        </div>

        <div class="banner">
          <div class="banner-title">Facture ${escapeHtml(invoiceNumberSlashed)}</div>
        </div>

        <div class="party">${escapeHtml(sale.customerName || 'Client')}</div>
        <div class="dates">
          <div>
            <div class="label">Date de facturation</div>
            <div>${formatDate(sale.createdAt)}</div>
          </div>
          <div>
            <div class="label">Date d'échéance</div>
            <div>${formatDate(dueDate ?? sale.createdAt)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Taxes</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="bottom">
          <div>
            <div class="note">Communication de paiement : <strong>${escapeHtml(invoiceNumberSlashed)}</strong></div>
            <div class="terms">
              <div style="font-weight:700; color:#1e293b; margin-bottom:4px;">Conditions générales d'utilisation</div>
              ${CGU_HTML}
            </div>
          </div>
          <table class="totals">
            <tbody>
              <tr>
                <td class="label">Montant hors taxes</td>
                <td class="right">${fmt(sale.subtotal)}</td>
              </tr>
              <tr>
                <td class="label grand">Total</td>
                <td class="right grand">${fmt(sale.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="footer">
        <div>${escapeHtml(business.email || 'contact@omex.com')}</div>
        <div>Page 1 / 1</div>
      </div>
    </body>
  </html>`;
}

export async function generateAndShareSalePDF(
  sale: Sale,
  business?: { name?: string; address?: string; phone?: string; email?: string },
  currency?: string
) {
  const html = buildSaleInvoiceHTML({ sale, business: business || {}, currency });

  if (Platform.OS === 'web') {
    // Sur le web, expo-print ne génère pas un PDF de l'HTML donné.
    // On ouvre une nouvelle fenêtre avec le HTML puis on lance l'impression.
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      // Attendre le rendu puis imprimer
      win.onload = () => {
        win.focus();
        win.print();
      };
    }
    return undefined;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Partager la facture' });
  }
  return uri;
}

// Variante qui renvoie toujours l'URI sur natif, et se comporte comme generateAndShareSalePDF sur web
export async function generateSalePDFNative(
  sale: Sale,
  business?: { name?: string; address?: string; phone?: string; email?: string },
  currency?: string
): Promise<string | undefined> {
  const html = buildSaleInvoiceHTML({ sale, business: business || {}, currency });
  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.onload = () => {
        win.focus();
        win.print();
      };
    }
    return undefined;
  }
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

function formatDate(date: Date) {
  try {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

function makeInvoiceNumber(sale: Sale): string {
  const d = new Date(sale.createdAt);
  const y = d.getFullYear();
  // simple fallback: utiliser les 3 premiers chars de l'id pour différencier
  const suffix = String(sale.id).slice(0, 3).toUpperCase();
  return `INV-${y}-${suffix}`;
}

function makeInvoiceNumberSlashed(inv: string) {
  // Transforme INV-2025-ABC -> INV/2025/ABC (ou garde tel quel s'il est déjà au bon format)
  if (inv.includes('/')) return inv;
  return inv.replace(/-/g, '/');
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
