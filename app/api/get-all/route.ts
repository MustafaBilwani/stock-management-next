"use server"

import { comingActionType, productType, vendorPaymentType, vendorType } from "@/app/types";
import client from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/auth";

export async function GET (request: NextRequest) {

    try {

        const session = await auth();
        if (!session?.user) {
            throw Error('unathorised')
        }

        const { searchParams} = request.nextUrl
        const requestedValue = searchParams.get('requiredValue')
        console.log('fetch request received')

        if (!client) {
            console.log('unable to connect to database')
            throw new Error('unable to connect to database');
        };

        const db = client.db("stock-management-next");
        
        if (requestedValue === 'products') {
            let products: productType[] = [];
            const productsCollection = db.collection("products");
            const proTemp = await productsCollection.find({}).toArray();
            if (!proTemp) throw new Error('unable to fetch products');
            products = proTemp.map(({ id, name, active, stock }) => ({
                id,
                name,
                active,
                stock
            }));
            return NextResponse.json({ success: true, products});
        }

        if (requestedValue === 'vendors') {
            let vendors: vendorType[] = [];
            const vendorsCollection = db.collection("vendors");
            const venTemp = await vendorsCollection.find({}).toArray();
            if (!venTemp) throw new Error('unable to fetch vendors');
            vendors = venTemp.map(({ id, name, active, balance }) => ({
                id,
                name,
                active,
                balance
            }));
            return NextResponse.json({ success: true, vendors });
        }

        if (requestedValue === 'coming') {
            let coming: comingActionType[] = [];
            const comingCollection = db.collection("coming");
            const venTemp = await comingCollection.find({}).toArray();
            if (!venTemp) throw new Error('unable to fetch coming');
            coming = venTemp.map(({ type, qty, pricePerPcs, priceTotal, date, notes, id, product, vendor, active,
                productName, vendorName }) => ({
                id, type, qty, pricePerPcs, priceTotal, date, notes, product, vendor, active, productName, vendorName
            }));
            return NextResponse.json({ success: true, coming });
        }

        if (requestedValue === 'payment') {
            let payment: vendorPaymentType[] = [];
            const paymentCollection = db.collection("payment");
            const venTemp = await paymentCollection.find({}).toArray();
            if (!venTemp) throw new Error('unable to fetch payment');
            payment = venTemp.map(({ type, amount, date, notes, id, vendor, active, vendorName }) => ({
                id, type, amount, date, notes, vendor, active, vendorName
            }));
            return NextResponse.json({ success: true, payment });
        }

        throw Error ('requested value not recognized')

    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, error });
    }
}