'use server'

import client from "@/lib/mongodb";
import { auth } from "../auth";

export async function restoreProduct (id: number) {
  try {
    const session = await auth();
    if (!session?.user) {
        throw Error('unathorised')
    }
    
    const db = client.db("stock-management-next");
    const productsCollection = db.collection("products");

    const restoreRequest = await productsCollection.findOneAndUpdate({id}, { $set: { active: true } })

    if (!restoreRequest) throw new Error('unable to restore product');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}