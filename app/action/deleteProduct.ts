'use server'

import client from "@/lib/mongodb";
import { auth } from "../auth";

export async function deleteProduct (id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
        throw Error('unathorised')
    }

    const db = client.db("stock-management-next");
    const productsCollection = db.collection("products");

    const deleteRequest = await productsCollection.findOneAndUpdate({id}, { $set: { active: false } })

    if (!deleteRequest) throw new Error('unable to delete product');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}