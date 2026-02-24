import { MongoClient } from "mongodb";
import { config } from 'dotenv';

config();

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const cluster = process.env.MONGO_CLUSTER;

const mongo_URI = `mongodb+srv://${username}:${password}@${cluster}.dxkfyc9.mongodb.net/?appName=${cluster}`;

//console.log(mongo_URI); //bacalo gresku sa krivim userom, zato ispisujem

let db;

async function connectToDatabase() {
    if (db) return db;
    try {
        const client = new MongoClient(mongo_URI);
        await client.connect();
        console.log("Baza uspjesno povezana");
        db = client.db("");
        return db
    } catch (error) {
        console.error("Connection error: ", error);
    }
}

export default connectToDatabase;