import ExcelJS from 'exceljs';

export async function exportIngredientsToExcel(ingredients: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ingredienti');

  // Definire colonne
  worksheet.columns = [
    { header: 'Nome', key: 'name', width: 30 },
    { header: 'Categoria', key: 'category', width: 15 },
    { header: 'Fornitore', key: 'supplier', width: 25 },
    { header: 'Prezzo Confezione (€)', key: 'packagePrice', width: 20 },
    { header: 'Quantità Confezione', key: 'packageQuantity', width: 20 },
    { header: 'Unità', key: 'unitType', width: 10 },
    { header: 'Prezzo/kg o /pz (€)', key: 'pricePerKgOrUnit', width: 20 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Note', key: 'notes', width: 30 },
    { header: 'Food', key: 'isFood', width: 10 },
    { header: 'Allergeni', key: 'allergens', width: 30 },
  ];

  // Formattare header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4CAF50' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Aggiungere dati
  ingredients.forEach((ing) => {
    worksheet.addRow({
      name: ing.name,
      category: ing.category,
      supplier: ing.supplierName || '',
      packagePrice: parseFloat(ing.packagePrice) || 0,
      packageQuantity: parseFloat(ing.packageQuantity) || 0,
      unitType: ing.unitType === 'k' ? 'kg' : 'pz',
      pricePerKgOrUnit: parseFloat(ing.pricePerKgOrUnit) || 0,
      brand: ing.brand || '',
      notes: ing.notes || '',
      isFood: ing.isFood ? 'Sì' : 'No',
      allergens: Array.isArray(ing.allergens) ? ing.allergens.join(', ') : '',
    });
  });

  // Formattare colonne numeriche
  worksheet.getColumn('packagePrice').numFmt = '€#,##0.00';
  worksheet.getColumn('packageQuantity').numFmt = '#,##0.000';
  worksheet.getColumn('pricePerKgOrUnit').numFmt = '€#,##0.00';

  // Generare buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function importIngredientsFromExcel(fileBuffer: ArrayBuffer): Promise<any[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  
  const worksheet = workbook.getWorksheet('Ingredienti');
  if (!worksheet) {
    throw new Error('Foglio "Ingredienti" non trovato nel file Excel');
  }

  const ingredients: any[] = [];
  
  // Saltare header (riga 1)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    
    const name = row.getCell(1).value?.toString().trim();
    if (!name) return; // Skip empty rows
    
    const category = row.getCell(2).value?.toString().trim() || 'Altro';
    const supplier = row.getCell(3).value?.toString().trim() || '';
    const packagePrice = parseFloat(row.getCell(4).value?.toString() || '0');
    const packageQuantity = parseFloat(row.getCell(5).value?.toString() || '1');
    const unitTypeRaw = row.getCell(6).value?.toString().trim().toLowerCase();
    const unitType = unitTypeRaw === 'kg' ? 'k' : 'u';
    const brand = row.getCell(8).value?.toString().trim() || '';
    const notes = row.getCell(9).value?.toString().trim() || '';
    const isFoodRaw = row.getCell(10).value?.toString().trim().toLowerCase();
    const isFood = isFoodRaw === 'sì' || isFoodRaw === 'si' || isFoodRaw === 'yes' || isFoodRaw === 'true';
    const allergensRaw = row.getCell(11).value?.toString().trim() || '';
    const allergens = allergensRaw ? allergensRaw.split(',').map(a => a.trim()).filter(a => a) : [];

    ingredients.push({
      name,
      category,
      supplier,
      packagePrice,
      packageQuantity,
      unitType,
      brand,
      notes,
      isFood,
      allergens,
    });
  });

  return ingredients;
}
