import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  supplier?: string;
}

export interface OrderPDFData {
  userName: string;
  items: OrderItem[];
  date: Date;
  notes?: string;
}

/**
 * Genera PDF ordine senza prezzi (solo nome, quantità, unità)
 * Restituisce ArrayBuffer del PDF
 */
export function generateUserOrderPDF(data: OrderPDFData): ArrayBuffer {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text("Ordine Ingredienti", 14, 20);

  doc.setFontSize(11);
  doc.text(`Ordinato da: ${data.userName}`, 14, 32);
  doc.text(`Data: ${data.date.toLocaleDateString("it-IT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`, 14, 39);

  if (data.notes) {
    doc.setFontSize(10);
    doc.text(`Note: ${data.notes}`, 14, 46);
  }

  // Tabella articoli (SENZA PREZZI)
  const tableData = data.items.map((item) => [
    item.name,
    item.quantity.toString(),
    item.unit === "k" ? "kg" : item.unit === "u" ? "pz" : item.unit,
    item.supplier || "-",
  ]);

  autoTable(doc, {
    startY: data.notes ? 52 : 45,
    head: [["Articolo", "Quantità", "Unità", "Fornitore"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 80 }, // Articolo
      1: { cellWidth: 30, halign: "right" }, // Quantità
      2: { cellWidth: 25, halign: "center" }, // Unità
      3: { cellWidth: 50 }, // Fornitore
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(
      `Pagina ${i} di ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  // Restituisce ArrayBuffer
  return doc.output("arraybuffer");
}

/**
 * Genera nome file PDF per l'ordine
 */
export function generateOrderPDFFilename(userName: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const userSlug = userName.toLowerCase().replace(/\s+/g, "_");
  return `ordine_${userSlug}_${dateStr}.pdf`;
}
