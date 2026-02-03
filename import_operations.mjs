import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { operations } from './drizzle/schema.js';
import { randomUUID } from 'crypto';
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('=== Importazione Operations ===\n');

const operationsData = [
  { name: 'Forno', costType: 'ENERGIA', maxKw: 15.0, efficiencyMultiplier: 0.5, avgConsumptionKw: 7.5, hourlyRate: 2.775 },
  { name: 'Lievitatore', costType: 'ENERGIA', maxKw: 1.5, efficiencyMultiplier: 0.3, avgConsumptionKw: 0.45, hourlyRate: 0.1665 },
  { name: 'Impastatrice', costType: 'ENERGIA', maxKw: 4.0, efficiencyMultiplier: 0.6, avgConsumptionKw: 2.4, hourlyRate: 0.888 },
  { name: 'Arrotondatrice', costType: 'ENERGIA', maxKw: 1.5, efficiencyMultiplier: 0.9, avgConsumptionKw: 1.35, hourlyRate: 0.4995 },
  { name: 'Abbattitore', costType: 'ENERGIA', maxKw: 4.0, efficiencyMultiplier: 0.7, avgConsumptionKw: 2.8, hourlyRate: 1.036 },
  { name: 'Mixer', costType: 'ENERGIA', maxKw: 1.5, efficiencyMultiplier: 0.7, avgConsumptionKw: 1.05, hourlyRate: 0.3885 },
  { name: 'Tagliaverdure', costType: 'ENERGIA', maxKw: 2.0, efficiencyMultiplier: 0.8, avgConsumptionKw: 1.6, hourlyRate: 0.592 },
  { name: 'Macinacarne', costType: 'ENERGIA', maxKw: 2.0, efficiencyMultiplier: 0.85, avgConsumptionKw: 1.7, hourlyRate: 0.629 },
  { name: 'Affettatrice', costType: 'ENERGIA', maxKw: 2.0, efficiencyMultiplier: 0.9, avgConsumptionKw: 1.8, hourlyRate: 0.666 },
  { name: 'Piastra', costType: 'ENERGIA', maxKw: 4.0, efficiencyMultiplier: 0.95, avgConsumptionKw: 3.8, hourlyRate: 1.406 },
  { name: 'Cuoco', costType: 'LAVORO', maxKw: null, efficiencyMultiplier: null, avgConsumptionKw: null, hourlyRate: 12 },
];

for (const op of operationsData) {
  await db.insert(operations).values({
    id: randomUUID(),
    name: op.name,
    costType: op.costType,
    maxKw: op.maxKw?.toString(),
    efficiencyMultiplier: op.efficiencyMultiplier?.toString(),
    avgConsumptionKw: op.avgConsumptionKw?.toString(),
    hourlyRate: op.hourlyRate.toString(),
  });
  console.log(`✓ Imported: ${op.name} (${op.costType}) - €${op.hourlyRate}/h`);
}

console.log(`\n✅ Importate ${operationsData.length} operations`);

await connection.end();
