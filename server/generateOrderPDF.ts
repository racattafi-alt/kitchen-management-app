import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface OrderItem {
  itemName: string;
  quantityToOrder: number;
  unitType: string;
  pricePerUnit: number;
  totalCost: number;
}

interface SupplierOrder {
  supplierName: string;
  items: OrderItem[];
  totalCost: number;
}

export async function generateOrderPDF(supplierOrders: SupplierOrder[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Ordine Fornitori', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Data: ${new Date().toLocaleDateString('it-IT')}`, { align: 'center' });
    doc.moveDown(2);

    // Per ogni fornitore
    for (const supplierOrder of supplierOrders) {
      // Nome fornitore
      doc.fontSize(14).font('Helvetica-Bold').text(supplierOrder.supplierName, { underline: true });
      doc.moveDown(0.5);

      // Tabella header
      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 300;
      const col3X = 380;
      const col4X = 450;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Prodotto', col1X, tableTop);
      doc.text('Quantità', col2X, tableTop);
      doc.text('Prezzo/u', col3X, tableTop);
      doc.text('Totale', col4X, tableTop);
      
      doc.moveTo(col1X, doc.y + 5).lineTo(545, doc.y + 5).stroke();
      doc.moveDown(0.5);

      // Items
      doc.font('Helvetica').fontSize(9);
      for (const item of supplierOrder.items) {
        const itemY = doc.y;
        
        // Controlla se c'è spazio, altrimenti nuova pagina
        if (itemY > 700) {
          doc.addPage();
          doc.y = 50;
        }

        const unit = item.unitType === 'k' ? 'kg' : 'pz';
        doc.text(item.itemName, col1X, doc.y, { width: 240 });
        const nameHeight = doc.heightOfString(item.itemName, { width: 240 });
        
        doc.text(`${item.quantityToOrder.toFixed(2)} ${unit}`, col2X, itemY);
        doc.text(`€${item.pricePerUnit.toFixed(2)}`, col3X, itemY);
        doc.text(`€${item.totalCost.toFixed(2)}`, col4X, itemY);
        
        doc.y = itemY + nameHeight + 5;
      }

      // Totale fornitore
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Totale ${supplierOrder.supplierName}: €${supplierOrder.totalCost.toFixed(2)}`, col3X, doc.y);
      doc.moveDown(2);

      // Linea separatrice
      if (supplierOrders.indexOf(supplierOrder) < supplierOrders.length - 1) {
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);
      }
    }

    // Totale generale
    const grandTotal = supplierOrders.reduce((sum, order) => sum + order.totalCost, 0);
    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`TOTALE GENERALE: €${grandTotal.toFixed(2)}`, { align: 'right' });

    doc.end();
  });
}
