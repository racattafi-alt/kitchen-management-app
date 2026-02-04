-- Popolare measurementType e pieceWeight per tutte le ricette

-- 1. Salse e Spezie: solo peso (weight_only)
UPDATE final_recipes 
SET measurementType = 'weight_only'
WHERE code LIKE 'SALSA_%' OR code LIKE 'SPEZIE_%';

-- 2. Tenders: sia peso che pezzi (both) con peso pezzo 0.05097 kg
UPDATE final_recipes 
SET measurementType = 'both', pieceWeight = 0.05097
WHERE code = 'CARNE_TENDERS';

-- 3. Sovracosce: sia peso che pezzi (both) con peso pezzo 0.06397 kg
UPDATE final_recipes 
SET measurementType = 'both', pieceWeight = 0.06397
WHERE code = 'CARNE_SOVRACOSCE';

-- 4. BBQ Ribs: solo peso (weight_only)
UPDATE final_recipes 
SET measurementType = 'weight_only'
WHERE code = 'BBQ_RIBS';

-- 5. Altre carni (Pulled Pork, Bacon): solo peso (weight_only)
UPDATE final_recipes 
SET measurementType = 'weight_only'
WHERE code LIKE 'CARNE_%' AND measurementType IS NULL;

-- 6. Verdure: solo peso (weight_only)
UPDATE final_recipes 
SET measurementType = 'weight_only'
WHERE code LIKE 'VERDURE_%';

-- Verifica risultati
SELECT 
    measurementType,
    COUNT(*) as count,
    GROUP_CONCAT(name SEPARATOR ', ') as recipes
FROM final_recipes
GROUP BY measurementType;
