// AUTO-GENERATED from REC_semilavorati Excel sheet - DO NOT EDIT MANUALLY
import type { SeedImportRow, SeedMetadata } from "./rec-finale-seed";

// NOTA: i nomi dei semilavorati referenziati da REC_FINALE sono allineati ESATTAMENTE
// alla stringa usata nel foglio REC_FINALE (es. "Spezie pulled", "Salsa bbqribs"),
// così il match esatto scatta quando si importano le ricette composte (Step B).
export const REC_SEMILAVORATI_METADATA: Record<string, SeedMetadata> = {
  SL_SBACON: { name: "Spezie bacon", category: "SPEZIE", shelfLifeDays: 180, storageMethod: "Temperatura ambiente" },
  SL_SPULLED: { name: "Spezie pulled", category: "SPEZIE", shelfLifeDays: 180, storageMethod: "Temperatura ambiente" },
  SL_SRIBS: { name: "Spezie ribs", category: "SPEZIE", shelfLifeDays: 180, storageMethod: "Temperatura ambiente" },
  SL_STENDERS: { name: "Spezie tenders", category: "SPEZIE", shelfLifeDays: 180, storageMethod: "Temperatura ambiente" },
  SL_KETCHUP: { name: "Ketchup", category: "SALSE", shelfLifeDays: 14, storageMethod: "Refrigerato" },
  SL_BBQ: { name: "Salsa BBQ", category: "SALSE", shelfLifeDays: 14, storageMethod: "Refrigerato" },
  SL_BBQRIBS: { name: "Salsa bbqribs", category: "SALSE", shelfLifeDays: 14, storageMethod: "Refrigerato" },
  SL_MEMPHIS: { name: "Salsa Memphis", category: "SALSE", shelfLifeDays: 14, storageMethod: "Refrigerato" },
  SL_SENAPE: { name: "Senape", category: "SALSE", shelfLifeDays: 14, storageMethod: "Refrigerato" },
  SL_SSOVRACOSCE: { name: "Spezie sovracosce", category: "SPEZIE", shelfLifeDays: 180, storageMethod: "Temperatura ambiente" },
};

export const REC_SEMILAVORATI_ROWS: SeedImportRow[] = [
  // SL_SBACON — Spezia Bacon
  { sl_id: "SL_SBACON", ingrediente_nome: "Sale grosso", qty: 700, um: 1000, eur_riga: 0.2146666667 },
  { sl_id: "SL_SBACON", ingrediente_nome: "Semi di fieno greco", qty: 60, um: 1000, eur_riga: 0.939 },
  { sl_id: "SL_SBACON", ingrediente_nome: "Paprica affumicata", qty: 80, um: 1000, eur_riga: 2.152 },
  { sl_id: "SL_SBACON", ingrediente_nome: "Galangal", qty: 80, um: 1000, eur_riga: 2.512 },
  { sl_id: "SL_SBACON", ingrediente_nome: "Cannella", qty: 20, um: 1000, eur_riga: 1.2064 },
  { sl_id: "SL_SBACON", ingrediente_nome: "Aglio in polvere", qty: 60, um: 1000, eur_riga: 0.39 },
  { sl_id: "SL_SBACON", ingrediente_nome: "Busta sv 30x40", qty: 1, um: 1, eur_riga: 0.1273 },

  // SL_SPULLED — Spezia Pulled Pork
  { sl_id: "SL_SPULLED", ingrediente_nome: "Pepe", qty: 120, um: 1000, eur_riga: 2.0784 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "Sale", qty: 560, um: 1000, eur_riga: 0.1656666667 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "Coriandolo in polvere", qty: 60, um: 1000, eur_riga: 1.062 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "Cumino", qty: 50, um: 1000, eur_riga: 0.995 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "Paprica affumicata", qty: 60, um: 1000, eur_riga: 1.614 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "Semi di fieno greco", qty: 50, um: 1000, eur_riga: 0.7825 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "Galangal", qty: 15.267175572519085, um: 1000, eur_riga: 0.479389313 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "thè affumicato", qty: 75, um: 1000, eur_riga: 6.27 },
  { sl_id: "SL_SPULLED", ingrediente_nome: "Busta sv 30x40", qty: 1, um: 1, eur_riga: 0.1273 },

  // SL_SRIBS — Spezia Ribs
  { sl_id: "SL_SRIBS", ingrediente_nome: "Sale", qty: 150, um: 1000, eur_riga: 0.044375 },
  { sl_id: "SL_SRIBS", ingrediente_nome: "Aglio in polvere", qty: 80, um: 1000, eur_riga: 0.52 },
  { sl_id: "SL_SRIBS", ingrediente_nome: "Paprica affumicata", qty: 130, um: 1000, eur_riga: 3.497 },
  { sl_id: "SL_SRIBS", ingrediente_nome: "Busta sv 30x40", qty: 1, um: 1, eur_riga: 0.1273 },

  // SL_STENDERS — Spezia Tenders
  { sl_id: "SL_STENDERS", ingrediente_nome: "Sale", qty: 100, um: 1000, eur_riga: 0.0295833333 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Sumac", qty: 30, um: 1000, eur_riga: 0.84 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Aglio in polvere", qty: 10, um: 1000, eur_riga: 0.065 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Cumino", qty: 10, um: 1000, eur_riga: 0.199 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Senape in polvere", qty: 30, um: 1000, eur_riga: 0.501 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Paprica affumicata", qty: 30, um: 1000, eur_riga: 0.807 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Xantana", qty: 5, um: 1000, eur_riga: 0.13895 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Pepe bianco", qty: 10, um: 1000, eur_riga: 0.2 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Farina per fritti", qty: 20, um: 1000, eur_riga: 0.0252 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Amido pregelatinizzato", qty: 25, um: 1000, eur_riga: 0.1625 },
  { sl_id: "SL_STENDERS", ingrediente_nome: "Busta sv 30x40", qty: 1, um: 1, eur_riga: 0.1273 },

  // SL_KETCHUP — Ketchup
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Olio di semi", qty: 100, um: 1000, eur_riga: 0.158 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Cipolla caramellata", qty: 130, um: 1000, eur_riga: 0.5018 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Aglio arrosto", qty: 20, um: 1000, eur_riga: 0.129 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "doppio concentrato", qty: 440, um: 1000, eur_riga: 1.37368 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Zucchero invertito", qty: 200, um: 1000, eur_riga: 0.4 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Aceto di mele", qty: 150, um: 1000, eur_riga: 0.3535 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Sale", qty: 26.4, um: 1000, eur_riga: 0.00781 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Senape", qty: 52.8, um: 1000, eur_riga: 0.1587017143 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Paprica dolce", qty: 12, um: 1000, eur_riga: 0.3228 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Acqua", qty: 54, um: 1000, eur_riga: 0 },
  { sl_id: "SL_KETCHUP", ingrediente_nome: "Xantana", qty: 2, um: 1000, eur_riga: 0.05558 },

  // SL_BBQ — Salsa BBQ
  { sl_id: "SL_BBQ", ingrediente_nome: "Fondo bruno vegano", qty: 20, um: 1000, eur_riga: 0.4106 },
  { sl_id: "SL_BBQ", ingrediente_nome: "Zucchero invertito", qty: 40, um: 1000, eur_riga: 0.08 },
  { sl_id: "SL_BBQ", ingrediente_nome: "Ketchup", qty: 1000, um: 1000, eur_riga: 2.915154746 },
  { sl_id: "SL_BBQ", ingrediente_nome: "Fumo liquido", qty: 0.5, um: 1000, eur_riga: 0.0163 },
  { sl_id: "SL_BBQ", ingrediente_nome: "funghi Shitake", qty: 5, um: 1000, eur_riga: 0 },
  { sl_id: "SL_BBQ", ingrediente_nome: "Rabarbaro", qty: 0.5, um: 1000, eur_riga: 0.0355 },
  { sl_id: "SL_BBQ", ingrediente_nome: "radice di Angelica", qty: 1, um: 1000, eur_riga: 0.07436 },
  { sl_id: "SL_BBQ", ingrediente_nome: "funghi acularia", qty: 9, um: 1000, eur_riga: 0.162 },

  // SL_BBQRIBS — Salsa BBQ Ribs
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "ketchup", qty: 900, um: 1000, eur_riga: 2.623639271 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "Fondo bruno vegano", qty: 200, um: 1000, eur_riga: 4.106 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "Pepe di sichuan", qty: 5, um: 1000, eur_riga: 0.2885 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "Zucchero invertito", qty: 150, um: 1000, eur_riga: 0.3 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "Acqua", qty: 200, um: 1000, eur_riga: 0 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "lime", qty: 80, um: 1000, eur_riga: 0.2712 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "Sumac", qty: 15, um: 1000, eur_riga: 0.42 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "Senape", qty: 20, um: 1000, eur_riga: 0.0601142857 },
  { sl_id: "SL_BBQRIBS", ingrediente_nome: "Sale", qty: 20, um: 1000, eur_riga: 0.0059166667 },

  // SL_MEMPHIS — Salsa Memphis
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "Senape", qty: 20, um: 1000, eur_riga: 0.0601142857 },
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "Acqua cetriolo", qty: 100, um: 1000, eur_riga: 0 },
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "Acqua cavolo", qty: 100, um: 1000, eur_riga: 0 },
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "Zucchero invertito", qty: 50, um: 1000, eur_riga: 0.1 },
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "Fondo bruno vegano", qty: 30, um: 1000, eur_riga: 0.6159 },
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "Ketchup", qty: 200, um: 1000, eur_riga: 0.5830309492 },
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "xantana", qty: 0.25, um: 1000, eur_riga: 0.0069475 },
  { sl_id: "SL_MEMPHIS", ingrediente_nome: "Amido pregelatinizzato", qty: 0.25, um: 1000, eur_riga: 0.001625 },

  // SL_SENAPE — Senape
  { sl_id: "SL_SENAPE", ingrediente_nome: "Senape in polvere", qty: 25, um: 1000, eur_riga: 0.4175 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Semi di senape nera", qty: 20, um: 1000, eur_riga: 0.349 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Semi di senape gialla", qty: 30, um: 1000, eur_riga: 0.552 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Zucchero invertito", qty: 30, um: 1000, eur_riga: 0.06 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Vino bianco", qty: 100, um: 1000, eur_riga: 0.6666666667 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Aceto di mele", qty: 50, um: 1000, eur_riga: 0.1178333333 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Xantana", qty: 0.7, um: 1000, eur_riga: 0.019453 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Amido pregelatinizzato", qty: 4, um: 1000, eur_riga: 0.026 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Curcuma", qty: 2, um: 1000, eur_riga: 0.0396 },
  { sl_id: "SL_SENAPE", ingrediente_nome: "Sale", qty: 5, um: 1000, eur_riga: 0.0014791667 },

  // SL_SSOVRACOSCE — Spezia Sovracosce
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Paprica dolce", qty: 20, um: 1000, eur_riga: 0.538 },
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Pepe", qty: 25, um: 1000, eur_riga: 0.433 },
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Pepe bianco", qty: 10, um: 1000, eur_riga: 0.2 },
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Sale", qty: 100, um: 1000, eur_riga: 0.0295833333 },
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Amido pregelatinizzato", qty: 30, um: 1000, eur_riga: 0.195 },
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Xantana", qty: 5, um: 1000, eur_riga: 0.13895 },
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Farina per fritti", qty: 40, um: 1000, eur_riga: 0.0504 },
  { sl_id: "SL_SSOVRACOSCE", ingrediente_nome: "Busta sv 30x40", qty: 1, um: 1, eur_riga: 0.1273 },

];
