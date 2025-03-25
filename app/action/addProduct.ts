'use server'

import { productType } from "@/app/types";
import client from "@/lib/mongodb";
import { auth } from "../auth";

export async function addProduct (newProduct: productType) {
  try {
    const session = await auth();
    if (!session?.user) {
        throw Error('unathorised')
    }

    const db = client.db("stock-management-next");
    const productsCollection = db.collection("products");

    const insertRequest = await productsCollection.insertOne(newProduct)

    if (!insertRequest) throw new Error('unable to add product');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}