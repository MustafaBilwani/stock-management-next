'use server'

import { vendorType } from "@/app/types";
import client from "@/lib/mongodb";
import { auth } from "../auth";

export async function addVendor (Vendor: vendorType) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw Error('unathorised')
    }

    const db = client.db("stock-management-next");
    const vendorsCollection = db.collection("vendors");

    const insertRequest = await vendorsCollection.insertOne(Vendor)

    if (!insertRequest) throw new Error('unable to add vendor');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteVendor (id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw Error('unathorised')
    }

    const db = client.db("stock-management-next");
    const vendorsCollection = db.collection("vendors");

    const deleteRequest = await vendorsCollection.findOneAndUpdate({id}, { $set: { active: false } })

    if (!deleteRequest) throw new Error('unable to delete Vendor');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}

export async function restoreVendor (id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
        throw Error('unathorised')
    }
    
    const db = client.db("stock-management-next");
    const vendorsCollection = db.collection("vendors");

    const restoreRequest = await vendorsCollection.findOneAndUpdate({id}, { $set: { active: true } })

    if (!restoreRequest) throw new Error('unable to restore vendor');

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}

export async function checkVendorAllowedToDelete (id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
        throw Error('unathorised')
    }

    const db = client.db("stock-management-next");
    const paymentCollection = db.collection("payment");
    const comingCollection = db.collection("coming");

    const paymentRecord = await paymentCollection.findOne({vendor:id, active:true});
    const comingRecord = await comingCollection.findOne({vendor:id, active:true})
    if (paymentRecord || comingRecord) return { success: true, allowed: false};
    return { success: true, allowed: true};
  } catch (error) {
    return { success: false, error };
  }
}