'use server'

import clientPromise from "@/lib/mongodb";

export async function restoreProduct (id: number) {
  try {
    const client = await clientPromise;
    if (!client) throw new Error('unable to connect to database');
    const db = client.db("stock-management-next");
    const productsCollection = db.collection("products");

    const restoreRequest = await productsCollection.findOneAndUpdate({id}, { $set: { active: true } })

    if (!restoreRequest) throw new Error('unable to restore product');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}