import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGO_URI;
const nombreDB = process.env.DB_NAME;

const cliente = new MongoClient(uri);

export async function connection() {
  await cliente.connect();
  return cliente.db(nombreDB);
}
