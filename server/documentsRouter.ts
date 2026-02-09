import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./documentsDb";
import { storagePut } from "./storage";

export const documentsRouter = router({
  // Ottenere tutte le categorie
  getCategories: protectedProcedure.query(async () => {
    return await db.getAllCategories();
  }),

  // Ottenere documenti per categoria
  getByCategory: protectedProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ input }) => {
      return await db.getDocumentsByCategory(input.categoryId);
    }),

  // Ottenere tutti i documenti
  getAll: protectedProcedure.query(async () => {
    return await db.getAllDocuments();
  }),

  // Ottenere documenti in scadenza
  getExpiring: protectedProcedure
    .input(z.object({ daysAhead: z.number().optional() }))
    .query(async ({ input }) => {
      return await db.getExpiringDocuments(input.daysAhead);
    }),

  // Upload documento
  upload: protectedProcedure
    .input(
      z.object({
        categoryId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        fileBase64: z.string(),
        fileName: z.string(),
        fileType: z.enum(["pdf", "jpg", "jpeg", "png"]),
        documentDate: z.date().optional(),
        expiryDate: z.date().optional(),
        referenceNumber: z.string().optional(),
        tags: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decodifica base64 e upload a S3
      const fileBuffer = Buffer.from(input.fileBase64, "base64");
      const fileSizeKb = Math.round(fileBuffer.length / 1024);
      
      // Genera chiave S3 univoca
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `documents/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.fileName}`;
      
      // Determina content type
      const contentTypeMap: Record<string, string> = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
      };
      const contentType = contentTypeMap[input.fileType];
      
      // Upload a S3
      const { url: fileUrl } = await storagePut(fileKey, fileBuffer, contentType);
      
      // Salva nel database
      return await db.createDocument({
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        fileType: input.fileType,
        fileUrl,
        fileKey,
        fileSizeKb,
        uploadedByUserId: ctx.user.id,
        uploadedByUserName: ctx.user.name || "Unknown",
        documentDate: input.documentDate,
        expiryDate: input.expiryDate,
        referenceNumber: input.referenceNumber,
        tags: input.tags,
        notes: input.notes,
      });
    }),

  // Eliminare documento
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // TODO: eliminare anche da S3 usando fileKey
      await db.deleteDocument(input.id);
      return { success: true };
    }),
});
