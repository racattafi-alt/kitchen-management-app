-- Riassegna gli ordini salvati con storeId 'default-store-001' (vecchio fallback)
-- al locale corretto: quello preferito dell'utente che ha fatto l'ordine,
-- oppure al primo locale attivo se l'utente non ha preferenze.
UPDATE order_history oh
SET oh.storeId = COALESCE(
  (
    SELECT u.preferredStoreId
    FROM users u
    WHERE u.id = oh.userId
      AND u.preferredStoreId IS NOT NULL
    LIMIT 1
  ),
  (
    SELECT s.id
    FROM stores s
    WHERE s.isActive = 1
    ORDER BY s.createdAt ASC
    LIMIT 1
  )
)
WHERE oh.storeId = 'default-store-001';
