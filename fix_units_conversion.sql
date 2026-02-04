-- Script per correggere la conversione errata grammi -> kg nelle ricette finali
-- Problema: i valori in grammi sono stati salvati come kg (es. 490g salvato come 490kg)
-- Soluzione: dividere per 1000 tutti i componenti che hanno quantità sospette (> 100 kg)

-- ATTENZIONE: Questo script modifica i dati esistenti
-- Eseguire un backup prima di procedere!

-- Step 1: Identificare ricette con componenti sospetti (quantità > 100 kg)
-- Questo query mostra quali ricette hanno problemi
SELECT 
    id,
    name,
    code,
    components
FROM final_recipes
WHERE components LIKE '%"quantity":%'
  AND (
    components REGEXP '"quantity":[0-9]{3,}'  -- 3+ cifre = >= 100
  );

-- Step 2: Per correggere manualmente una ricetta specifica:
-- UPDATE final_recipes 
-- SET components = JSON_SET(
--     components,
--     '$[0].quantity', JSON_EXTRACT(components, '$[0].quantity') / 1000
-- )
-- WHERE code = 'SALSE_MEMPHIS';

-- Step 3: Script Python per correzione automatica
-- Salvare come fix_units_python.py e eseguire con: python3 fix_units_python.py
