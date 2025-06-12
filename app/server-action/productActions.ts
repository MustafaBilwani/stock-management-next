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

export async function deleteProduct (id: string) {
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

export async function restoreProduct (id: string) {
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

export async function checkProductAllowedToDelete (id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
        throw Error('unathorised')
    }

    const db = client.db("stock-management-next");
    const comingCollection = db.collection("coming");

    const record = await comingCollection.findOne({product:id, active:true})
    if (record) return { success: true, allowed: false};
    return { success: true, allowed: true};
  } catch (error) {
    return { success: false, error };
  }
}
