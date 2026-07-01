import ExcelJS from 'exceljs';

const VALID_CATEGORIES = [
  'Additivi', 'Alcolici', 'Bevande', 'Birra', 'Caffè', 'Carni', 'Farine',
  'Latticini', 'Non Food', 'Packaging', 'Spezie', 'Verdura', 'Altro',
] as const;

const VALID_PACKAGE_TYPES = [
  'Sacco', 'Busta', 'Brick', 'Cartone', 'Scatola', 'Bottiglia',
  'Barattolo', 'Lattina', 'Sfuso', 'Fusto',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function styleHeader(row: ExcelJS.Row, color: string = 'FF1565C0') {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
    };
  });
}

function addDropdown(ws: ExcelJS.Worksheet, col: string, maxRow: number, values: string[], title: string) {
  for (let r = 2; r <= maxRow; r++) {
    ws.getCell(`${col}${r}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${values.join(',')}"`],
      showErrorMessage: true,
      errorTitle: `${title} non valido`,
      error: `Scegli tra: ${values.join(', ')}`,
    };
  }
}

function addYesNo(ws: ExcelJS.Worksheet, col: string, maxRow: number) {
  addDropdown(ws, col, maxRow, ['SI', 'NO'], 'Valore');
}

function exampleRow(ws: ExcelJS.Worksheet, values: (string | number | null)[]) {
  const row = ws.addRow(values);
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
    cell.font = { italic: true, color: { argb: 'FF757575' } };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MASTER IMPORT TEMPLATE  (tutti i fogli)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMasterImportTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Kitchen Management App';
  wb.created = new Date();

  // ── 0. ISTRUZIONI ──────────────────────────────────────────────────────────
  const instr = wb.addWorksheet('📋 ISTRUZIONI');
  instr.getColumn('A').width = 90;
  instr.getColumn('B').width = 50;

  const instrData: [string, string?][] = [
    ['TEMPLATE MASTER — IMPORTAZIONE DATI — Kitchen Management App', ''],
    ['', ''],
    ['COME USARE QUESTO FILE', ''],
    ['1. Ogni foglio corrisponde a una tabella del database.', ''],
    ['2. La RIGA 2 (gialla) è un esempio — puoi cancellarla prima di importare.', ''],
    ['3. I campi marcati con * sono OBBLIGATORI.', ''],
    ['4. Le colonne con menu a tendina accettano solo i valori elencati.', ''],
    ['5. Per i campi booleani usa "SI" o "NO".', ''],
    ['6. Lascia vuoti i campi facoltativi se non disponibili.', ''],
    ['', ''],
    ['ORDINE CONSIGLIATO DI IMPORTAZIONE', ''],
    ['1. Fornitori', 'Il nome deve essere univoco'],
    ['2. Operazioni', 'Costi lavoro/energia usati nelle ricette'],
    ['3. Ingredienti', 'Richiedono il nome del fornitore (verrà abbinato)'],
    ['4. Semilavorati', 'Ricette di livello 1 (es. salse, impasti)'],
    ['5. Componenti_Semilavorati', 'Ingredienti/semilavorati che compongono ogni semilavorato'],
    ['6. Ricette_Finali', 'Ricette di livello 2 (piatti pronti per il menu)'],
    ['7. Componenti_Ricette', 'Ingredienti/semilavorati che compongono ogni ricetta finale'],
    ['8. Frigoriferi', 'Celle frigo/freezer per il monitoraggio HACCP'],
    ['', ''],
    ['ALLERGENI EU-14 RICONOSCIUTI', ''],
    ['Glutine', 'Crostacei'],
    ['Uova', 'Pesce'],
    ['Arachidi', 'Soia'],
    ['Latte', 'Frutta a guscio'],
    ['Sedano', 'Senape'],
    ['Semi di sesamo', 'Anidride solforosa e solfiti'],
    ['Lupini', 'Molluschi'],
  ];

  instrData.forEach(([a, b], i) => {
    const r = instr.addRow([a, b ?? '']);
    if (i === 0) {
      r.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF1565C0' } };
    } else if (['COME USARE QUESTO FILE', 'ORDINE CONSIGLIATO DI IMPORTAZIONE', 'ALLERGENI EU-14 RICONOSCIUTI'].includes(a)) {
      r.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF2E7D32' } };
    }
  });

  // ── 1. FORNITORI ───────────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Fornitori');
  ws1.columns = [
    { header: 'Nome *', key: 'name', width: 30 },
    { header: 'Contatto', key: 'contact', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Telefono', key: 'phone', width: 18 },
    { header: 'Indirizzo', key: 'address', width: 40 },
    { header: 'Note', key: 'notes', width: 40 },
  ];
  styleHeader(ws1.getRow(1), 'FF6A1B9A');
  exampleRow(ws1, ['Mario Rossi Srl', 'Mario Rossi', 'mario@esempio.it', '+39 02 12345678', 'Via Roma 1, Milano', 'Fornitore carni']);

  // ── 2. OPERAZIONI ──────────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet('Operazioni');
  ws2.columns = [
    { header: 'Nome *', key: 'name', width: 30 },
    { header: 'Tipo Costo * (LAVORO/ENERGIA)', key: 'costType', width: 26 },
    { header: 'Tariffa Oraria (€/h) *', key: 'hourlyRate', width: 22 },
    { header: 'kW Max (solo ENERGIA)', key: 'maxKw', width: 22 },
    { header: 'kW Medio Consumo', key: 'avgConsumptionKw', width: 22 },
    { header: 'Moltiplicatore Efficienza', key: 'efficiencyMultiplier', width: 26 },
  ];
  styleHeader(ws2.getRow(1), 'FF00695C');
  addDropdown(ws2, 'B', 500, ['LAVORO', 'ENERGIA'], 'Tipo costo');
  ws2.getColumn('hourlyRate').numFmt = '€#,##0.00';
  exampleRow(ws2, ['Operatore cucina', 'LAVORO', 12.50, null, null, null]);
  exampleRow(ws2, ['Forno combinato', 'ENERGIA', 0.25, 6.5, 4.2, 1.0]);

  // ── 3. INGREDIENTI ─────────────────────────────────────────────────────────
  const ws3 = wb.addWorksheet('Ingredienti');
  ws3.columns = [
    { header: 'Nome *', key: 'name', width: 30 },
    { header: 'Categoria *', key: 'category', width: 18 },
    { header: 'Tipo Unità * (kg/unità)', key: 'unitType', width: 20 },
    { header: 'Quantità Confezione *', key: 'packageQuantity', width: 22 },
    { header: 'Prezzo Confezione (€) *', key: 'packagePrice', width: 22 },
    { header: 'Prezzo/kg o /pz (€)', key: 'pricePerKgOrUnit', width: 20 },
    { header: 'Fornitore', key: 'supplier', width: 25 },
    { header: 'Tipo Confezione', key: 'packageType', width: 18 },
    { header: 'Reparto', key: 'department', width: 14 },
    { header: 'Marca', key: 'brand', width: 20 },
    { header: 'Q.tà Min. Ordine', key: 'minOrderQuantity', width: 18 },
    { header: 'Allergeni (separati da virgola)', key: 'allergens', width: 38 },
    { header: 'È Alimento', key: 'isFood', width: 14 },
    { header: 'Ordinabile', key: 'isOrderable', width: 14 },
    { header: 'Vendibile', key: 'isSellable', width: 14 },
    { header: 'Sottocategoria', key: 'subcategory', width: 20 },
    { header: 'Note', key: 'notes', width: 38 },
  ];
  styleHeader(ws3.getRow(1), 'FF2E7D32');
  addDropdown(ws3, 'B', 2000, [...VALID_CATEGORIES], 'Categoria');
  addDropdown(ws3, 'C', 2000, ['kg', 'unità'], 'Tipo unità');
  addDropdown(ws3, 'H', 2000, [...VALID_PACKAGE_TYPES], 'Tipo confezione');
  addDropdown(ws3, 'I', 2000, ['Cucina', 'Sala'], 'Reparto');
  addYesNo(ws3, 'M', 2000);
  addYesNo(ws3, 'N', 2000);
  addYesNo(ws3, 'O', 2000);
  ws3.getColumn('packagePrice').numFmt = '€#,##0.00';
  ws3.getColumn('pricePerKgOrUnit').numFmt = '€#,##0.00';
  ws3.getColumn('packageQuantity').numFmt = '#,##0.000';
  ws3.getColumn('minOrderQuantity').numFmt = '#,##0.000';
  exampleRow(ws3, [
    'Farina 00 Molino Rosso', 'Farine', 'kg', 25, 18.50, 0.74,
    'Molino Rosso', 'Sacco', 'Cucina', 'Molino Rosso', 25,
    'Glutine', 'SI', 'SI', 'SI', 'farine tipo 00', 'Per impasti base',
  ]);

  // ── 4. SEMILAVORATI ────────────────────────────────────────────────────────
  const ws4 = wb.addWorksheet('Semilavorati');
  ws4.columns = [
    { header: 'Codice * (univoco per negozio)', key: 'code', width: 26 },
    { header: 'Nome *', key: 'name', width: 30 },
    { header: 'Categoria *', key: 'category', width: 18 },
    { header: 'Resa % * (0-100)', key: 'yieldPercentage', width: 18 },
    { header: 'Prezzo Finale /kg (€) *', key: 'finalPricePerKg', width: 22 },
    { header: 'Vita Commerciale (giorni) *', key: 'shelfLifeDays', width: 26 },
    { header: 'Metodo Conservazione *', key: 'storageMethod', width: 35 },
    { header: 'Quantità Tot. Prodotta (kg)', key: 'totalQuantityProduced', width: 28 },
    { header: 'Passaggi Produzione (testo)', key: 'productionSteps', width: 50 },
  ];
  styleHeader(ws4.getRow(1), 'FFB71C1C');
  addDropdown(ws4, 'C', 1000, ['SPEZIE', 'SALSE', 'VERDURA', 'CARNE', 'ALTRO'], 'Categoria');
  ws4.getColumn('finalPricePerKg').numFmt = '€#,##0.00';
  exampleRow(ws4, [
    'SLV-001', 'Salsa Barbecue Base', 'SALSE', 85, 4.20, 5,
    'Frigorifero +4°C', 10, 'Cuocere 30 min mescolando',
  ]);

  // ── 5. COMPONENTI SEMILAVORATI ─────────────────────────────────────────────
  const ws5 = wb.addWorksheet('Componenti_Semilavorati');
  ws5.columns = [
    { header: 'Codice Semilavorato *', key: 'semiFinishedCode', width: 28 },
    { header: 'Tipo Componente *', key: 'componentType', width: 22 },
    { header: 'Nome Componente *', key: 'componentName', width: 30 },
    { header: 'Quantità *', key: 'quantity', width: 14 },
    { header: 'Unità (kg/u)', key: 'unit', width: 14 },
    { header: 'Ordine Visualizzazione', key: 'sortOrder', width: 22 },
  ];
  styleHeader(ws5.getRow(1), 'FFB71C1C');
  addDropdown(ws5, 'B', 5000, ['INGREDIENTE', 'SEMILAVORATO', 'OPERAZIONE'], 'Tipo componente');
  addDropdown(ws5, 'E', 5000, ['kg', 'u'], 'Unità');
  ws5.getColumn('quantity').numFmt = '#,##0.000';
  const noteSemi = ws5.addRow(['← Inserisci qui il codice del semilavorato (foglio Semilavorati col. A)']);
  noteSemi.getCell(1).font = { italic: true, color: { argb: 'FF1565C0' } };
  exampleRow(ws5, ['SLV-001', 'INGREDIENTE', 'Pomodori pelati', 2.000, 'kg', 1]);
  exampleRow(ws5, ['SLV-001', 'INGREDIENTE', 'Cipolla', 0.300, 'kg', 2]);
  exampleRow(ws5, ['SLV-001', 'OPERAZIONE', 'Operatore cucina', 0.500, 'u', 3]);

  // ── 6. RICETTE FINALI ──────────────────────────────────────────────────────
  const ws6 = wb.addWorksheet('Ricette_Finali');
  ws6.columns = [
    { header: 'Codice * (univoco per negozio)', key: 'code', width: 28 },
    { header: 'Nome *', key: 'name', width: 30 },
    { header: 'Categoria *', key: 'category', width: 20 },
    { header: 'Resa % * (0-100)', key: 'yieldPercentage', width: 18 },
    { header: 'Costo Totale (€) *', key: 'totalCost', width: 18 },
    { header: 'Metodo Conservazione *', key: 'conservationMethod', width: 35 },
    { header: 'Tempo Max Conservazione *', key: 'maxConservationTime', width: 28 },
    { header: 'Tipo Unità (kg/u)', key: 'unitType', width: 18 },
    { header: 'Peso Unitario (kg)', key: 'unitWeight', width: 18 },
    { header: 'Quantità Prodotta', key: 'producedQuantity', width: 20 },
    { header: 'Tipo Misura', key: 'measurementType', width: 20 },
    { header: 'Peso Pezzo (kg)', key: 'pieceWeight', width: 18 },
    { header: 'Spreco Servizio %', key: 'serviceWastePercentage', width: 20 },
    { header: 'Prezzo Vendita (€)', key: 'sellingPrice', width: 20 },
    { header: 'È Semilavorato', key: 'isSemiFinished', width: 18 },
    { header: 'Vendibile', key: 'isSellable', width: 14 },
    { header: 'Attivo', key: 'isActive', width: 12 },
  ];
  styleHeader(ws6.getRow(1), 'FFE65100');
  addDropdown(ws6, 'C', 1000, ['Pane', 'Carne', 'Salse', 'Verdure', 'Formaggi', 'Altro'], 'Categoria');
  addDropdown(ws6, 'H', 1000, ['kg', 'u'], 'Tipo unità');
  addDropdown(ws6, 'K', 1000, ['weight_only', 'unit_only', 'both'], 'Tipo misura');
  addYesNo(ws6, 'O', 1000);
  addYesNo(ws6, 'P', 1000);
  addYesNo(ws6, 'Q', 1000);
  ws6.getColumn('totalCost').numFmt = '€#,##0.00';
  ws6.getColumn('sellingPrice').numFmt = '€#,##0.00';
  exampleRow(ws6, [
    'RIC-001', 'Burger Classico', 'Carne', 90, 3.80,
    'Frigorifero +4°C', '24 ore', 'u', 0.250, 50,
    'both', 0.250, 2, 8.50, 'NO', 'SI', 'SI',
  ]);

  // ── 7. COMPONENTI RICETTE FINALI ───────────────────────────────────────────
  const ws7 = wb.addWorksheet('Componenti_Ricette');
  ws7.columns = [
    { header: 'Codice Ricetta *', key: 'recipeCode', width: 26 },
    { header: 'Tipo Componente *', key: 'componentType', width: 22 },
    { header: 'Nome Componente *', key: 'componentName', width: 30 },
    { header: 'Quantità *', key: 'quantity', width: 14 },
    { header: 'Unità (kg/u)', key: 'unit', width: 14 },
    { header: 'Ordine Visualizzazione', key: 'sortOrder', width: 22 },
  ];
  styleHeader(ws7.getRow(1), 'FFE65100');
  addDropdown(ws7, 'B', 5000, ['INGREDIENTE', 'SEMILAVORATO', 'OPERAZIONE'], 'Tipo componente');
  addDropdown(ws7, 'E', 5000, ['kg', 'u'], 'Unità');
  ws7.getColumn('quantity').numFmt = '#,##0.000';
  const noteRic = ws7.addRow(['← Inserisci qui il codice della ricetta (foglio Ricette_Finali col. A)']);
  noteRic.getCell(1).font = { italic: true, color: { argb: 'FF1565C0' } };
  exampleRow(ws7, ['RIC-001', 'INGREDIENTE', 'Hamburger bovino 150g', 0.150, 'kg', 1]);
  exampleRow(ws7, ['RIC-001', 'SEMILAVORATO', 'Salsa Barbecue Base', 0.040, 'kg', 2]);
  exampleRow(ws7, ['RIC-001', 'INGREDIENTE', 'Panino brioche', 1, 'u', 3]);
  exampleRow(ws7, ['RIC-001', 'OPERAZIONE', 'Operatore cucina', 0.083, 'u', 4]);

  // ── 8. FRIGORIFERI ─────────────────────────────────────────────────────────
  const ws8 = wb.addWorksheet('Frigoriferi');
  ws8.columns = [
    { header: 'Nome *', key: 'name', width: 30 },
    { header: 'Tipo * (fridge/freezer)', key: 'type', width: 22 },
    { header: 'Ubicazione * (kitchen/sala)', key: 'location', width: 24 },
    { header: 'Categoria', key: 'category', width: 20 },
    { header: 'Temp. Min (°C) *', key: 'minTemp', width: 18 },
    { header: 'Temp. Max (°C) *', key: 'maxTemp', width: 18 },
    { header: 'Attivo', key: 'isActive', width: 12 },
    { header: 'Note', key: 'notes', width: 38 },
  ];
  styleHeader(ws8.getRow(1), 'FF1565C0');
  addDropdown(ws8, 'B', 200, ['fridge', 'freezer'], 'Tipo');
  addDropdown(ws8, 'C', 200, ['kitchen', 'sala'], 'Ubicazione');
  addYesNo(ws8, 'G', 200);
  exampleRow(ws8, ['Cella Carni', 'fridge', 'kitchen', 'Carni', 0, 4, 'SI', 'Cella principale cucina']);
  exampleRow(ws8, ['Freezer Produzione', 'freezer', 'kitchen', 'Surgelati', -25, -18, 'SI', '']);

  // ── 9. PRODUZIONI SETTIMANALI ──────────────────────────────────────────────
  const ws9 = wb.addWorksheet('Produzioni_Settimanali');
  ws9.columns = [
    { header: 'Data Inizio Settimana * (AAAA-MM-GG)', key: 'weekStartDate', width: 36 },
    { header: 'Tipo Produzione * (final/semifinished)', key: 'productionType', width: 34 },
    { header: 'Codice Ricetta Finale', key: 'recipeFinalCode', width: 28 },
    { header: 'Codice Semilavorato', key: 'semiFinishedCode', width: 26 },
    { header: 'Quantità *', key: 'quantity', width: 14 },
  ];
  styleHeader(ws9.getRow(1), 'FF37474F');
  addDropdown(ws9, 'B', 2000, ['final', 'semifinished'], 'Tipo produzione');
  ws9.getColumn('quantity').numFmt = '#,##0.000';
  const noteProd = ws9.addRow([
    '← Formato data: 2024-01-08 | Compilare SOLO il codice corretto in base al Tipo Produzione',
  ]);
  noteProd.getCell(1).font = { italic: true, color: { argb: 'FF1565C0' } };
  exampleRow(ws9, ['2024-01-08', 'final', 'RIC-001', null, 50]);
  exampleRow(ws9, ['2024-01-08', 'semifinished', null, 'SLV-001', 10]);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

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
