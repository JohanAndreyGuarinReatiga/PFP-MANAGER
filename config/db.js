import {MongoClient} from 'mongodb';

const uri = "mongodb://localhost:27017/";
const nombreDB = "PFP-MANAGER";
const cliente = new MongoClient(uri);

export async function connection() {
    await cliente.connect();
    return cliente.db(nombreDB);
}