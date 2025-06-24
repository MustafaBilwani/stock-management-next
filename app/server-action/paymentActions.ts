'use server'

import { vendorPaymentType } from "@/app/types";
import client from "@/lib/mongodb";
import { auth } from "../auth";

export async function addPayment(newPayment: vendorPaymentType) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw Error('unathorised')
    }

    const db = client.db("stock-management-next");
    const paymentCollection = db.collection("payment");
    const vendorCollection = db.collection("vendors");

    const dbSession = client.startSession();

    await dbSession.withTransaction(async () => {
      const insertRequest = await paymentCollection.insertOne(newPayment, { session: dbSession });
      const updateRequestVendor = await vendorCollection.findOneAndUpdate(
        { id: newPayment.vendor },
        { $inc: { balance: -newPayment.amount } }, // add to credit
        { session: dbSession }
      )
      if (!insertRequest || !updateRequestVendor) throw new Error('something went wrong unable to add payment');

      await dbSession.commitTransaction();
    })

    return { success: true };

  } catch (error) {
    return { success: false, error };
  }
}

export async function deletePayment(payment: vendorPaymentType) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("unauthorised");
    }
    const dbSession = client.startSession();

    const db = client.db("stock-management-next");
    const paymentCollection = db.collection("payment");
    const vendorCollection = db.collection("vendors");

    await dbSession.withTransaction(async () => {
      const deleteRequest = await paymentCollection.findOneAndUpdate(
        { id: payment.id },
        { $set: { active: false } },
        { session: dbSession }
      );

      const updateRequestVendor = await vendorCollection.findOneAndUpdate(
        { id: payment.vendor },
        { $inc: { balance: payment.amount } }, // delete from credit
        { session: dbSession }
      )


      if (!deleteRequest || !updateRequestVendor) {
        throw new Error("unable to delete payment");
      }
    })

    await dbSession.endSession();

    return { success: true };
  } catch (error: any) {
    console.error("Error in deletePayment:", error);
    return { success: false, error: (error as Error).message || error };
  }
}

export async function restorePayment(payment: vendorPaymentType) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("unauthorised");
    }

    const dbSession = client.startSession();
    const db = client.db("stock-management-next");
    const paymentCollection = db.collection("payment");
    const vendorsCollection = db.collection("vendors");

    await dbSession.withTransaction(async () => {
      const restoreRequest = await paymentCollection.findOneAndUpdate(
        { id: payment.id },
        { $set: { active: true } },
        { session: dbSession }
      );

      const updateRequestVendor = await vendorsCollection.findOneAndUpdate(
        { id: payment.vendor },
        { $inc: { balance: -payment.amount } }, // add to credit
        { session: dbSession }
      )

      if (!restoreRequest || !updateRequestVendor) {
        throw new Error("unable to restore payment");
      }
    })

    return { success: true };
  } catch (error: any) {
    console.error("Error in restorePayment:", error);
    return { success: false, error: (error as Error).message || error };
  }
}