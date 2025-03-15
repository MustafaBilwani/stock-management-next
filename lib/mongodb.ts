import { MongoClient } from 'mongodb'

const uri:string = process.env.MONGODB_URI || ''
if(!uri) {
  throw new Error('MONGODB_URI is not defined')
}

interface MyGlobal {
  [key: string]: any; // Allows dynamic property access
}

const myGlobal: MyGlobal = global;

let client
let clientPromise: Promise<MongoClient>

if (!process.env.MONGODB_URI) {
  throw new Error('Add Mongo URI to .env.local')
}

if (process.env.NODE_ENV === 'development') { 
  if (!myGlobal._mongoClientPromise) {
    client = new MongoClient(uri)
    myGlobal._mongoClientPromise = client.connect()
  }
  clientPromise = myGlobal._mongoClientPromise
} else {
  client = new MongoClient(uri)
  clientPromise = client.connect()
}

export default clientPromise