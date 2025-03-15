'use server'

import { productType } from "@/app/types";
import clientPromise from "@/lib/mongodb";

export async function addProduct (newProduct: productType) {
  try {
    const client = await clientPromise;
    if (!client) throw new Error('unable to connect to database');
    const db = client.db("stock-management-next");
    const productsCollection = db.collection("products");

    const insertRequest = await productsCollection.insertOne(newProduct)

    if (!insertRequest) throw new Error('unable to add product');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}