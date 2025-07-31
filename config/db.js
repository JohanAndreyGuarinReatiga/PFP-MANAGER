import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const PFPmanager = process.env.PFPmanager || 'PFPmanager';

const cliente = new MongoClient(uri);

export async function connection() {
  await cliente.connect();
  return cliente.db('PFPmanager');
}
