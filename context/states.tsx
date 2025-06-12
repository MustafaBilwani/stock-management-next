"use client";

import { createContext, useState, ReactNode, useRef, RefObject, useOptimistic, Dispatch, SetStateAction } from "react";
import { comingActionType, productType, requiredValuesType, vendorPaymentType, vendorType } from "@/app/types";

interface StoreContextType {
  optimisticProducts: productType[];
  setProducts: Dispatch<SetStateAction<productType[]>>;
  setOptimisticProducts: Dispatch<SetStateAction<productType[]>>;

  optimisticVendors: vendorType[];
  setVendors: Dispatch<SetStateAction<vendorType[]>>;
  setOptimisticVendors: Dispatch<SetStateAction<vendorType[]>>;

  optimisticComingActionArray: comingActionType[];
  setComingActionArray: Dispatch<SetStateAction<comingActionType[]>>;
  setOptimisticComingActionArray: Dispatch<SetStateAction<comingActionType[]>>;

  optimisticVendorPaymentArray: vendorPaymentType[];
  setVendorPaymentArray: Dispatch<SetStateAction<vendorPaymentType[]>>;
  setOptimisticVendorPaymentArray: Dispatch<SetStateAction<vendorPaymentType[]>>;
  
  fetched: RefObject<{
    products: boolean,
    vendors: boolean,
    coming: boolean,
    darazGoing: boolean,
    courierGoing: boolean,
    hhcGoing: boolean,
    payment: boolean
  }>
}

export const CustomContext = createContext<StoreContextType>({} as StoreContextType);

export function Store({ children }: { children: ReactNode }) {

  const [products, setProducts] = useState<productType[]>([]);
  const [optimisticProducts, setOptimisticProducts] = useOptimistic(products)
  
  const [vendors, setVendors] = useState<vendorType[]>([]);
  const [optimisticVendors, setOptimisticVendors] = useOptimistic(vendors)

  const [comingActionArray, setComingActionArray] = useState<comingActionType[]>([]);
  const [optimisticComingActionArray, setOptimisticComingActionArray] = useOptimistic(comingActionArray)

  const [vendorPaymentDetailArray, setVendorPaymentArray] = useState<vendorPaymentType[]>([]);
  const [optimisticVendorPaymentArray, setOptimisticVendorPaymentArray] = useOptimistic(vendorPaymentDetailArray)
  
  const fetched = useRef({
    products: false,
    vendors: false,
    coming: false,
    darazGoing: false,
    courierGoing: false,
    hhcGoing: false,
    payment: false
  })

  return (
    <CustomContext.Provider value={{ 
      fetched,
      optimisticProducts, setProducts, setOptimisticProducts,
      optimisticVendors, setVendors, setOptimisticVendors, 
      optimisticComingActionArray, setComingActionArray, setOptimisticComingActionArray,
      optimisticVendorPaymentArray, setVendorPaymentArray, setOptimisticVendorPaymentArray,
    }}>
      {children}
    </CustomContext.Provider>
  );
}
