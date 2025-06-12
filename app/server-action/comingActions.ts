'use server'

import { comingActionType } from "@/app/types";
import client from "@/lib/mongodb";
import { auth } from "../auth";

export async function addComingAction (newComingAction: comingActionType) {
  try {
    const authSession = await auth();
    if (!authSession?.user) {
      throw Error('unauthorised')
    }

    console.log('request received')

    const dbSession = client.startSession();

    const db = client.db("stock-management-next");
    const comingCollection = db.collection("coming");
    const productsCollection = db.collection("products");
    const vendorCollection = db.collection("vendors");

    await dbSession.withTransaction(async () => {
      const insertResult = await comingCollection.insertOne(newComingAction, { session: dbSession })
      if (!insertResult) throw new Error('unable to add coming action')
      const updatedProduct = await productsCollection.findOneAndUpdate(
        { id: newComingAction.product },
        { $inc: { stock: newComingAction.qty } },
        { session: dbSession }
      )
      if (!updatedProduct) throw new Error('unable to update product stock')
      const updatedVendor = await vendorCollection.findOneAndUpdate(
        { id: newComingAction.vendor },
        { $inc: { balance: newComingAction.priceTotal } }, // add to debit
        { session: dbSession }
      )
      if (!updatedVendor) throw new Error('unable to update vendor balance')
    })

    await dbSession.endSession();

    return { success: true };

  } catch (error) {
    console.error("Error in addComingAction:", error);
    return { success: false, error };
  }
}

export async function editComingAction ({newComingAction, oldComingAction} : {newComingAction: comingActionType, oldComingAction: comingActionType}) {
  try {
    const authSession = await auth();
    if (!authSession?.user) {
      throw Error('unauthorised')
    }

    console.log('request received')

    const dbSession = client.startSession();

    const db = client.db("stock-management-next");
    const comingCollection = db.collection("coming");
    const productsCollection = db.collection("products");
    const vendorCollection = db.collection("vendors");

    await dbSession.withTransaction(async () => {
      const insertResult = await comingCollection.findOneAndUpdate({id: oldComingAction.id}, { $set: { ...newComingAction } }, { session: dbSession })
      if (oldComingAction.active) {
        
        const subtractStock = await productsCollection.findOneAndUpdate(
          { id: oldComingAction.product },
          { $inc: { stock: -oldComingAction.qty } },
          { session: dbSession }
        )
        const addStock = await productsCollection.findOneAndUpdate(
          { id: newComingAction.product },
          { $inc: { stock: newComingAction.qty } },
          { session: dbSession }
        )
        const subtractBalance = await vendorCollection.findOneAndUpdate(
          { id: oldComingAction.vendor },
          { $inc: { balance: -oldComingAction.priceTotal } },
          { session: dbSession }
        )
        const addBalance = await vendorCollection.findOneAndUpdate(
          { id: newComingAction.vendor },
          { $inc: { balance: newComingAction.priceTotal } },
          { session: dbSession }
        )
        if (!subtractStock || !addStock || !subtractBalance || !addBalance) throw new Error('unable to edit coming action')
      }
      // const updatedVendor = await vendorCollection.findOneAndUpdate(
      //   { id: newComingAction.vendor },
      //   { $inc: { balance: -newComingAction.priceTotal } },
      //   { session: dbSession }
      // )
      if (!insertResult) throw new Error('unable to edit coming action')
    })

    await dbSession.endSession();

    return { success: true };

  } catch (error) {
    console.error("Error in editComingAction:", error);
    return { success: false, error };
  }
}

export async function deleteComingAction (comingAction: comingActionType) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("unauthorised");
    }
    const dbSession = client.startSession();

    console.log('request received')

    const db = client.db("stock-management-next");
    const comingCollection = db.collection("coming");
    const productsCollection = db.collection("products");
    const vendorCollection = db.collection("vendors");
    await dbSession.withTransaction(async () => {
      const deletedComing = await comingCollection.findOneAndUpdate(
        { id: comingAction.id },
        { $set: { active: false } },
        { session: dbSession }
      )
      if (!deletedComing) throw new Error('unable to delete coming action')
      const updatedProduct = await productsCollection.findOneAndUpdate(
        {id: comingAction.product}, 
        { $inc: { stock: -comingAction.qty } },
        {session: dbSession}
      )
      if (!updatedProduct) throw new Error('unable to update product stock')
      const updatedVendor = await vendorCollection.findOneAndUpdate(
        {id: comingAction.vendor},
        { $inc: { balance: -comingAction.priceTotal } }, // subtract from debit
        {session: dbSession}
      )
      if (!updatedVendor) throw new Error('unable to update vendor balance')
    })

    await dbSession.endSession();

    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteComingAction:", error);
    return { success: false, error: (error as Error).message || error };
  }
}

export async function restoreComingAction(comingAction: comingActionType) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("unauthorised");
    }

    console.log('request received')
    
    const dbSession = client.startSession();
    const db = client.db("stock-management-next");
    const comingCollection = db.collection("coming");
    const productsCollection = db.collection("products");
    const vendorCollection = db.collection("vendors");

    await dbSession.withTransaction(async () => {
      const restoredComing = await comingCollection.findOneAndUpdate(
        { id: comingAction.id },
        { $set: { active: true } },
        { session: dbSession }
      )
      if (!restoredComing) throw new Error('unable to restore coming action')
      const updatedProduct = await productsCollection.findOneAndUpdate(
        {id: comingAction.product},
        { $inc: { stock: comingAction.qty } }, 
        {session: dbSession}
      )
      if (!updatedProduct) throw new Error('unable to update product stock')
      const updatedVendor = await vendorCollection.findOneAndUpdate(
        {id: comingAction.vendor},
        { $inc: { balance: comingAction.priceTotal } }, // add to debit
        {session: dbSession}
      )
      if (!updatedVendor) throw new Error('unable to update vendor balance')
    })

    return { success: true };
  } catch (error: any) {
    console.error("Error in restoreComingAction:", error);
    return { success: false, error: (error as Error).message || error };
  }
}
