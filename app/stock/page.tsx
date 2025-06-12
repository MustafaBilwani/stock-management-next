'use client'

import { CustomContext } from "@/context/states";
import { useCallback, useContext, useEffect, useState } from "react";
import { handleFetch } from "../handleFetch";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Box, Button, Heading, Table } from "@chakra-ui/react";
import { requiredValuesForComponentType } from "@/app/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Page = () => {
  
  const router = useRouter()
  const {status} = useSession()

  const {
		fetched,
    optimisticProducts,
    setProducts
  } = useContext(CustomContext);
  
	const [Error, setError] = useState(false)

  useEffect(() => {
    requiredValuesForComponent.forEach((value) => {
      if (status === 'authenticated' && !fetched.current[value.name]) {
        value.function();
      }
    })
	}, [status])

  const fetchProducts = useCallback(async () => {
		const result = await handleFetch("products");
		if (result.success) {
			setProducts(result.products);
			fetched.current.products = true;
		} else {
			toaster.error({
				title: 'Failed',
				description: 'failed to fetch',
				type: "error"
			})
			console.log(result.error);
			setError(true)
		};
	}, []);

  const requiredValuesForComponent: requiredValuesForComponentType[] = [
    {name: 'products', function: () => {fetchProducts()}},
  ]

  if (status === 'unauthenticated') {
    router.push('/api/auth/signin')
    return <p>Unauthorized</p>
  }

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

	return ( 
    <Box display={"flex"} flexDirection={"row"} width={"100%"} my={"4"}>
      <Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>
        <Heading size={'3xl'}>Stock</Heading>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Product</Table.ColumnHeader>
              <Table.ColumnHeader>Stock</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {optimisticProducts.filter(product => product.active).map((product) => (
              <Table.Row key={product.id}>
                <Table.Cell>{product.name}</Table.Cell>
                <Table.Cell>{product.stock}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
      <Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>
        {requiredValuesForComponent.every(value => fetched.current[value.name]) ? (
          <>
            {JSON.stringify(optimisticProducts)}
          </>
        ) : Error ? (
          <>
            <h1>Something went wrong</h1>
						<Button onClick={() => {
              setError(false);
              requiredValuesForComponent.forEach((value) => {
                if (!fetched.current[value.name]) {
                  value.function();
                }
              })          
            }} w={"200px"}>Retry</Button>
          </>
        ) : (
          <h1>Loading...</h1>
        )}
      </Box>
			<Toaster />
    </Box>
  );
}

export default Page