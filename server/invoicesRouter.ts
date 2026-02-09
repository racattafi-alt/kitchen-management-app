import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import * as invoicesDb from "./invoicesDb";
import * as db from "./db";

export const invoicesRouter = router({
  // Upload fattura e salva in S3
  uploadInvoice: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64
      supplierName: z.string().optional(),
      invoiceNumber: z.string().optional(),
      invoiceDate: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(input.fileData, 'base64');
      const fileKey = `invoices/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, 'application/pdf');
      
      // Create invoice record
      const invoiceId = await invoicesDb.createInvoice({
        fileUrl: url,
        uploadedBy: ctx.user.id,
        supplierName: input.supplierName,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : undefined,
      });
      
      return { invoiceId, fileUrl: url };
    }),

  // Processa fattura: OCR + AI extraction + matching
  processInvoice: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const invoice = await invoicesDb.getInvoiceById(input.invoiceId);
      if (!invoice) throw new Error('Fattura non trovata');
      
      // TODO: OCR extraction (per ora simulato)
      const extractedText = `Fattura simulata\nProdotto 1: 10 kg @ €5.00\nProdotto 2: 5 u @ €2.00`;
      
      // AI extraction con structured output
      const aiResponse = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Sei un assistente che estrae dati strutturati da fatture.
Estrai: nome fornitore, numero fattura, data, importo totale, e lista prodotti (nome, quantità, unità, prezzo unitario, prezzo totale).
Sii flessibile con nomi e brand. Normalizza le unità (kg, u, l, pz).`
          },
          {
            role: 'user',
            content: `Estrai i dati da questa fattura:\n\n${extractedText}`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'invoice_data',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                supplierName: { type: 'string' },
                invoiceNumber: { type: 'string' },
                invoiceDate: { type: 'string' },
                totalAmount: { type: 'number' },
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productName: { type: 'string' },
                      quantity: { type: 'number' },
                      unit: { type: 'string' },
                      unitPrice: { type: 'number' },
                      totalPrice: { type: 'number' },
                    },
                    required: ['productName', 'quantity', 'unit', 'totalPrice'],
                    additionalProperties: false,
                  }
                }
              },
              required: ['items'],
              additionalProperties: false,
            }
          }
        }
      });
      
      const content = aiResponse.choices[0].message.content;
      const extractedData = JSON.parse(typeof content === 'string' ? content : '{}');
      
      // Update invoice with extracted data
      await invoicesDb.updateInvoiceExtraction(input.invoiceId, {
        extractedText,
        extractedData,
        supplierName: extractedData.supplierName,
        invoiceNumber: extractedData.invoiceNumber,
        invoiceDate: extractedData.invoiceDate ? new Date(extractedData.invoiceDate) : undefined,
        totalAmount: extractedData.totalAmount,
      });
      
      // Match products with ingredients
      const items = extractedData.items || [];
      const matchedItems = [];
      
      for (const item of items) {
        // 1. Check product mappings (memoria storica)
        let match = await invoicesDb.findProductMapping(item.productName, invoice.supplierId);
        
        let matchMethod = 'auto';
        let matchConfidence = 0;
        
        if (match) {
          matchMethod = 'learned';
          matchConfidence = 95;
        } else {
          // 2. Fuzzy match ingredients
          const fuzzyMatches = await invoicesDb.fuzzyMatchIngredients(item.productName, 1);
          if (fuzzyMatches.length > 0) {
            match = fuzzyMatches[0];
            matchConfidence = 70;
          }
        }
        
        // Get current price for comparison
        let oldPrice = null;
        let newPrice = null;
        let priceChange = null;
        let isAnomalous = false;
        
        if (match) {
          const ingredient = await db.getIngredientById(match.ingredientId || match.id);
          if (ingredient) {
            oldPrice = parseFloat(ingredient.pricePerKgOrUnit);
            newPrice = item.unitPrice || (item.totalPrice / item.quantity);
            priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
            isAnomalous = Math.abs(priceChange) > 20;
          }
        }
        
        // Create invoice item
        const itemId = await invoicesDb.createInvoiceItem({
          invoiceId: input.invoiceId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          ingredientId: match ? (match.ingredientId || match.id) : undefined,
          matchConfidence,
          matchMethod,
          oldPrice: oldPrice || undefined,
          newPrice: newPrice || undefined,
          priceChange: priceChange || undefined,
          isAnomalous,
        });
        
        matchedItems.push({
          itemId,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          totalPrice: item.totalPrice,
          ingredientId: match ? (match.ingredientId || match.id) : null,
          ingredientName: match ? (match.ingredientName || match.name) : null,
          matchConfidence,
          matchMethod,
          oldPrice: oldPrice || undefined,
          newPrice: newPrice || undefined,
          priceChange: priceChange || undefined,
          isAnomalous,
        });
      }
      
      return {
        invoiceId: input.invoiceId,
        extractedData,
        matchedItems,
      };
    }),

  // Get invoice details with items
  getInvoice: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
    }))
    .query(async ({ input }) => {
      const invoice = await invoicesDb.getInvoiceById(input.invoiceId);
      if (!invoice) throw new Error('Fattura non trovata');
      
      const items = await invoicesDb.getInvoiceItems(input.invoiceId);
      
      return {
        invoice,
        items,
      };
    }),

  // Get all invoices
  getAllInvoices: protectedProcedure
    .query(async () => {
      return await invoicesDb.getAllInvoices(50);
    }),

  // Update invoice item match (manual correction)
  updateItemMatch: protectedProcedure
    .input(z.object({
      itemId: z.string(),
      ingredientId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get ingredient for price calculation
      const ingredient = await db.getIngredientById(input.ingredientId);
      if (!ingredient) throw new Error('Ingrediente non trovato');
      
      // Get item to calculate new price
      const items = await invoicesDb.getInvoiceItems(''); // TODO: get by itemId
      const item = items.find((i: any) => i.id === input.itemId);
      if (!item) throw new Error('Item non trovato');
      
      const oldPrice = parseFloat(ingredient.pricePerKgOrUnit);
      const newPrice = item.unitPrice || (item.totalPrice / item.quantity);
      const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
      const isAnomalous = Math.abs(priceChange) > 20;
      
      await invoicesDb.updateInvoiceItem(input.itemId, {
        ingredientId: input.ingredientId,
        matchMethod: 'manual',
        oldPrice: oldPrice || undefined,
        newPrice: newPrice || undefined,
        priceChange,
        isAnomalous,
      });
      
      return { success: true };
    }),

  // Confirm invoice and update prices
  confirmInvoice: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const items = await invoicesDb.getInvoiceItems(input.invoiceId);
      
      // Update each confirmed item
      for (const item of items) {
        if (!item.ingredientId) continue;
        
        // Mark as confirmed
        await invoicesDb.updateInvoiceItem(item.id, {
          isConfirmed: true,
          confirmedBy: ctx.user.id,
        });
        
        // Save product mapping for learning
        const invoice = await invoicesDb.getInvoiceById(input.invoiceId);
        await invoicesDb.createOrUpdateProductMapping({
          supplierId: invoice.supplierId,
          supplierName: invoice.supplierName || 'Non specificato',
          productNameInInvoice: item.productName,
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName,
          createdBy: ctx.user.id,
        });
        
        // Update ingredient price
        const ingredient = await db.getIngredientById(item.ingredientId);
        if (ingredient && item.newPrice) {
          const oldPackagePrice = parseFloat(ingredient.packagePrice);
          const oldPricePerUnit = parseFloat(ingredient.pricePerKgOrUnit);
          
          await db.updateIngredient(item.ingredientId, {
            packagePrice: item.totalPrice.toString(),
            pricePerKgOrUnit: item.newPrice.toString(),
          });
          
          // Save price history
          await invoicesDb.createPriceHistory({
            ingredientId: item.ingredientId,
            ingredientName: item.ingredientName,
            oldPackagePrice,
            newPackagePrice: item.totalPrice,
            oldPricePerUnit,
            newPricePerUnit: item.newPrice,
            priceChange: item.priceChange || 0,
            invoiceId: input.invoiceId,
            invoiceItemId: item.id,
            supplierId: invoice.supplierId,
            isAnomalous: item.isAnomalous || false,
            changedBy: ctx.user.id,
          });
        }
      }
      
      // Mark invoice as confirmed
      await invoicesDb.updateInvoiceStatus(input.invoiceId, 'confirmed');
      
      return { success: true };
    }),

  // Get price change report
  getPriceReport: protectedProcedure
    .input(z.object({
      invoiceId: z.string(),
    }))
    .query(async ({ input }) => {
      const items = await invoicesDb.getInvoiceItems(input.invoiceId);
      const anomalies = items.filter((i: any) => i.isAnomalous);
      const impactedRecipes = await invoicesDb.getImpactOnFinalRecipes(input.invoiceId);
      
      return {
        totalItems: items.length,
        matchedItems: items.filter((i: any) => i.ingredientId).length,
        anomalousChanges: anomalies.length,
        anomalies,
        impactedRecipes,
      };
    }),

  // Get price history
  getPriceHistory: protectedProcedure
    .input(z.object({
      ingredientId: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await invoicesDb.getPriceHistory(input.ingredientId, input.limit || 100);
    }),

  // Get anomalous price changes
  getAnomalousChanges: protectedProcedure
    .input(z.object({
      days: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await invoicesDb.getAnomalousPriceChanges(input.days || 30);
    }),
});
