import { queryOptions, type UseQueryOptions } from "@tanstack/react-query"
import { productType, vendorType, comingActionType, vendorPaymentType } from "./types"

type QueryData<K extends 'products' | 'vendors' | 'coming' | 'payment'> =
  K extends 'products' ? productType[] :
  K extends 'vendors' ? vendorType[] :
  K extends 'coming' ? comingActionType[] :
  vendorPaymentType[]

export function getQueryOptions<K extends 'products' | 'vendors' | 'coming' | 'payment'>(id: K): UseQueryOptions<QueryData<K>, Error, QueryData<K>, ["fetch", K]> {
  return queryOptions({
    queryKey: ['fetch', id],
    queryFn: async (): Promise<QueryData<K>> => {
      const response = await fetch(`/api/get-all?requiredValue=${id}`)
      if (!response.ok) throw new Error('unable to connect to backend')
      const result = await response.json()
      if (!result?.success) throw new Error(result.error)
      const newData = result[id] as QueryData<K>
      return newData
    },
  })
}