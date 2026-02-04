ALTER TABLE ingredients 
MODIFY COLUMN category ENUM(
  'Additivi',
  'Alcolici',
  'Bevande',
  'Birra',
  'Carni',
  'Farine',
  'Latticini',
  'Non Food',
  'Packaging',
  'Spezie',
  'Verdura',
  'Altro'
) NOT NULL;
