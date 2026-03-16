import ExcelJS from 'exceljs';

const VALID_CATEGORIES = [
  'Additivi', 'Alcolici', 'Bevande', 'Birra', 'Caffè', 'Carni', 'Farine',
  'Latticini', 'Non Food', 'Packaging', 'Spezie', 'Verdura', 'Altro',
] as const;

const VALID_PACKAGE_TYPES = [
  'Sacco', 'Busta', 'Brick', 'Cartone', 'Scatola', 'Bottiglia',
  'Barattolo', 'Lattina', 'Sfuso', 'Fusto',
] as const;

export async function exportIngredientsToExcel(ingredients: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ingredienti');

  // Definire colonne complete con validazioni
  worksheet.columns = [
    { header: 'Nome *', key: 'name', width: 30 },
    { header: 'Categoria *', key: 'category', width: 18 },
    { header: 'Tipo Unità * (kg/unità)', key: 'unitType', width: 18 },
    { header: 'Quantità Conf. *', key: 'packageQuantity', width: 18 },
    { header: 'Prezzo Conf. (€) *', key: 'packagePrice', width: 18 },
    { header: 'Prezzo/kg o /pz (€)', key: 'pricePerKgOrUnit', width: 18 },
    { header: 'Fornitore', key: 'supplier', width: 25 },
    { header: 'Tipo Confezione', key: 'packageType', width: 18 },
    { header: 'Reparto (Cucina/Sala)', key: 'department', width: 20 },
    { header: 'Marca', key: 'brand', width: 20 },
    { header: 'Q.tà Min. Ordine', key: 'minOrderQuantity', width: 18 },
    { header: 'Allergeni (virgola)', key: 'allergens', width: 35 },
    { header: 'È Alimento (SI/NO)', key: 'isFood', width: 18 },
    { header: 'Ordinabile (SI/NO)', key: 'isOrderable', width: 18 },
    { header: 'Note', key: 'notes', width: 35 },
  ];

  // Formattare header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 22;

  // Aggiungere validazioni dati Excel
  // Categoria: dropdown
  for (let row = 2; row <= 1000; row++) {
    worksheet.getCell(`B${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${VALID_CATEGORIES.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Categoria non valida',
      error: `Scegli tra: ${VALID_CATEGORIES.join(', ')}`,
    };
    worksheet.getCell(`C${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"kg,unità"'],
      showErrorMessage: true,
      errorTitle: 'Tipo unità non valido',
      error: 'Inserisci "kg" oppure "unità"',
    };
    worksheet.getCell(`H${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${VALID_PACKAGE_TYPES.join(',')}"`],
    };
    worksheet.getCell(`I${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Cucina,Sala"'],
    };
    worksheet.getCell(`M${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"SI,NO"'],
    };
    worksheet.getCell(`N${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"SI,NO"'],
    };
  }

  // Aggiungere dati
  ingredients.forEach((ing) => {
    worksheet.addRow({
      name: ing.name || '',
      category: ing.category || 'Altro',
      unitType: ing.unitType === 'k' ? 'kg' : 'unità',
      packageQuantity: parseFloat(ing.packageQuantity) || 0,
      packagePrice: parseFloat(ing.packagePrice) || 0,
      pricePerKgOrUnit: parseFloat(ing.pricePerKgOrUnit) || 0,
      supplier: ing.supplier || ing.supplierName || '',
      packageType: ing.packageType || '',
      department: ing.department || 'Cucina',
      brand: ing.brand || '',
      minOrderQuantity: ing.minOrderQuantity ? parseFloat(ing.minOrderQuantity) : '',
      allergens: Array.isArray(ing.allergens) ? ing.allergens.join(', ') : (ing.allergens || ''),
      isFood: ing.isFood !== false ? 'SI' : 'NO',
      isOrderable: ing.isOrderable !== false ? 'SI' : 'NO',
      notes: ing.notes || '',
    });
  });

  // Formattare colonne numeriche
  worksheet.getColumn('packagePrice').numFmt = '€#,##0.00';
  worksheet.getColumn('pricePerKgOrUnit').numFmt = '€#,##0.00';
  worksheet.getColumn('packageQuantity').numFmt = '#,##0.000';
  worksheet.getColumn('minOrderQuantity').numFmt = '#,##0.000';

  // Foglio istruzioni
  const instrSheet = workbook.addWorksheet('Istruzioni');
  instrSheet.getColumn('A').width = 80;
  const instructions = [
    ['ISTRUZIONI PER L\'IMPORTAZIONE INGREDIENTI'],
    [''],
    ['Colonne obbligatorie (marcate con *):'],
    ['  A - Nome: nome univoco dell\'ingrediente'],
    ['  B - Categoria: scegli dalla lista dropdown'],
    ['  C - Tipo Unità: "kg" per peso, "unità" per pezzi'],
    ['  D - Quantità Conf.: quantità per confezione (es. 5 per un sacco da 5 kg)'],
    ['  E - Prezzo Conf.: prezzo totale della confezione in €'],
    [''],
    ['Colonne calcolate automaticamente:'],
    ['  F - Prezzo/kg o /pz: calcolato automaticamente come E/D (puoi lasciare vuoto)'],
    [''],
    ['Colonne opzionali:'],
    ['  G - Fornitore: nome del fornitore (verrà matchato con i fornitori esistenti)'],
    ['  H - Tipo Confezione: scegli dalla lista dropdown'],
    ['  I - Reparto: Cucina (default) oppure Sala'],
    ['  J - Marca: nome del produttore/marca'],
    ['  K - Q.tà Min. Ordine: quantità minima per ordine'],
    ['  L - Allergeni: lista separata da virgola (es. "Glutine, Latte, Uova")'],
    ['  M - È Alimento: SI (default) oppure NO (per packaging/non-food)'],
    ['  N - Ordinabile: SI (default) oppure NO'],
    ['  O - Note: note libere'],
    [''],
    ['ALLERGENI RICONOSCIUTI (EU 14):'],
    ['  Glutine, Crostacei, Uova, Pesce, Arachidi, Soia, Latte,'],
    ['  Frutta a guscio, Sedano, Senape, Semi di sesamo,'],
    ['  Anidride solforosa e solfiti, Lupini, Molluschi'],
    [''],
    ['NOTA: Se il fornitore non esiste nel sistema, verrà creato automaticamente'],
    ['o potrai abbinarlo manualmente durante la revisione dell\'importazione.'],
  ];
  instructions.forEach(([text]) => {
    const row = instrSheet.addRow([text]);
    if (text?.startsWith('ISTRUZIONI') || text?.startsWith('ALLERGENI')) {
      row.getCell(1).font = { bold: true, size: 12 };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function importIngredientsFromExcel(fileBuffer: ArrayBuffer): Promise<any[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);

  const worksheet = workbook.getWorksheet('Ingredienti');
  if (!worksheet) {
    throw new Error('Foglio "Ingredienti" non trovato nel file Excel. Assicurati di usare il template corretto.');
  }

  const ingredients: any[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Salta intestazione

    const name = row.getCell(1).value?.toString().trim();
    if (!name) return; // Salta righe vuote

    const categoryRaw = row.getCell(2).value?.toString().trim() || 'Altro';
    const category = VALID_CATEGORIES.includes(categoryRaw as any) ? categoryRaw : 'Altro';

    const unitTypeRaw = row.getCell(3).value?.toString().trim().toLowerCase();
    const unit = unitTypeRaw === 'kg' ? 'kg' : 'unità';

    const packageQuantity = parseFloat(row.getCell(4).value?.toString() || '1') || 1;
    const packagePrice = parseFloat(row.getCell(5).value?.toString() || '0') || 0;

    // Prezzo/kg: usa il valore della colonna F se presente, altrimenti calcola
    const priceColRaw = parseFloat(row.getCell(6).value?.toString() || '0');
    const pricePerKgOrUnit = priceColRaw > 0 ? priceColRaw : (packageQuantity > 0 ? packagePrice / packageQuantity : 0);

    const supplier = row.getCell(7).value?.toString().trim() || '';

    const packageTypeRaw = row.getCell(8).value?.toString().trim() || '';
    const packageType = VALID_PACKAGE_TYPES.includes(packageTypeRaw as any) ? packageTypeRaw : null;

    const departmentRaw = row.getCell(9).value?.toString().trim() || 'Cucina';
    const department = departmentRaw === 'Sala' ? 'Sala' : 'Cucina';

    const brand = row.getCell(10).value?.toString().trim() || '';
    const minOrderQuantityRaw = parseFloat(row.getCell(11).value?.toString() || '0');
    const minOrderQuantity = minOrderQuantityRaw > 0 ? minOrderQuantityRaw : null;

    const allergensRaw = row.getCell(12).value?.toString().trim() || '';
    const allergens = allergensRaw ? allergensRaw.split(',').map((a) => a.trim()).filter(Boolean) : [];

    const isFoodRaw = row.getCell(13).value?.toString().trim().toUpperCase();
    const isFood = isFoodRaw !== 'NO';

    const isOrderableRaw = row.getCell(14).value?.toString().trim().toUpperCase();
    const isOrderable = isOrderableRaw !== 'NO';

    const notes = row.getCell(15).value?.toString().trim() || '';

    ingredients.push({
      name,
      category,
      unit,          // 'kg' | 'unità' — convertito internamente in 'k' | 'u'
      packageQuantity,
      packagePrice,
      pricePerKgOrUnit,
      supplier,
      packageType,
      department,
      brand,
      minOrderQuantity,
      allergens,
      isFood,
      isOrderable,
      notes,
    });
  });

  return ingredients;
}
