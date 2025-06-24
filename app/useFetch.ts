import { toaster } from "@/components/ui/toaster";
import { CustomContext } from "@/context/states";
import { useSession } from "next-auth/react";
import { useContext, useEffect, useState } from "react";

type requiredValues = ('products' | 'vendors' | 'coming' | 'payment')[]
export const useFetch = (requiredValues: requiredValues) => {
  const [fetchStatus, setFetchStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const {
    optimisticComingActionArray,
    fetched,
    setComingActionArray,
    setProducts,
    setVendors,
    optimisticProducts,
    optimisticVendors,
    setVendorPaymentArray,
    optimisticVendorPaymentArray
  } = useContext(CustomContext);
  const requiredValuesDetails = {
    coming: { setterFunction: setComingActionArray },
    products: { setterFunction: setProducts },
    vendors: { setterFunction: setVendors },
    payment: { setterFunction: setVendorPaymentArray }
  } as const;

  const { status } = useSession()
  useEffect(() => {
    const fetchData = async () => {
      if (status === 'authenticated') {
        requiredValues.forEach(async (value) => {
          if (!fetched.current[value]) {
            try {

              const response = await fetch(`/api/get-all?requiredValue=${value}`);
              if (!response.ok) throw new Error('unable to connect to backend');

              const data = await response.json();

              requiredValuesDetails[value].setterFunction(data[value]);
              fetched.current[value] = true;
              if (fetchStatus === 'loading') setFetchStatus('success');

            } catch (error) {
              toaster.error({
                title: 'Failed',
                description: 'failed to fetch',
                type: "error"
              })
              console.log(error);
              setFetchStatus('error');
            }
          }
        })
      }
    }
    fetchData();
  })
  return { optimisticComingActionArray, fetchStatus, optimisticProducts, optimisticVendors, optimisticVendorPaymentArray, setFetchStatus }
};