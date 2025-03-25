"use client";

import { createContext, useState, ReactNode, useRef, RefObject, useOptimistic, Dispatch, SetStateAction } from "react";
import { productType } from "@/app/types";

// Define the context type
interface StoreContextType {
  optimisticProducts: productType[];
  setProducts: Dispatch<SetStateAction<productType[]>>;
  setOptimisticProducts: Dispatch<SetStateAction<productType[]>>;
  fetched: RefObject<{
    products: boolean,
    vendors: boolean,
    coming: boolean,
    darazGoing: boolean,
    courierGoing: boolean,
    hhcGoing: boolean,
    stock: boolean
  }>
}

// Create context without default value
export const CustomContext = createContext<StoreContextType>({} as StoreContextType);


export function Store({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<productType[]>([]);
  const [optimisticProducts, setOptimisticProducts] = useOptimistic(products)
  const fetched = useRef({
    products: false,
    vendors: false,
    coming: false,
    darazGoing: false,
    courierGoing: false,
    hhcGoing: false,
    stock: false
  })

  return (
    <CustomContext.Provider value={{ optimisticProducts, setProducts, fetched, setOptimisticProducts}}>
      {children}
    </CustomContext.Provider>
  );
}
