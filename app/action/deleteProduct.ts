'use server'

import clientPromise from "@/lib/mongodb";

export async function deleteProduct (id: number) {
  try {
    const client = await clientPromise;
    if (!client) throw new Error('unable to connect to database');
    const db = client.db("stock-management-next");
    const productsCollection = db.collection("products");

    const deleteRequest = await productsCollection.findOneAndUpdate({id}, { $set: { active: false } })

    if (!deleteRequest) throw new Error('unable to delete product');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}