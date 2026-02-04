import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute(
  "SELECT id, name, packageSize, packageQuantity, packagePrice, pricePerKgOrUnit, unitType FROM ingredients WHERE name LIKE '%nutella%' OR name LIKE '%Nutella%'"
);
console.log(JSON.stringify(rows, null, 2));
await connection.end();
