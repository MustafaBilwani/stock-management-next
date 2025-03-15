"use server"

import { productType } from "@/app/types";
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { requiredValuesType } from "@/app/types";

export async function POST (request: Request) {

    try {
        const {requiredValues} : {
            requiredValues: requiredValuesType
        } = await request.json();
        console.log('fetch request received')

        const client = await clientPromise;
        if (!client) {
            console.log('unable to connect to database')
            throw new Error('unable to connect to database');
        };
        const db = client.db("stock-management-next");
        const productsCollection = db.collection("products");

        let products: productType[] = [];
        if (requiredValues.products) {
            const proTemp = await productsCollection.find({}).toArray();
            if (!proTemp) throw new Error('unable to fetch products');
            products = proTemp.map(({ id, name, active }) => ({
                id,
                name,
                active
            }));
        }        

        return NextResponse.json({ success: true, products });

    } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, error });
    }
}