'use client'

import { Toaster } from "@/components/ui/toaster";
import { Box, Button, Heading, Table } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getQueryOptions } from "../getQueryOptions";

const Page = () => {
  
  const router = useRouter()
  const {status: authStatus} = useSession()

  const {data: products, status, refetch} = useQuery(getQueryOptions('products'))

  if (authStatus === 'unauthenticated') {
    router.push('/api/auth/signin')
    return <p>Unauthorized</p>
  }

  if (authStatus === 'loading') {
    return <p>Loading...</p>;
  }

	return ( 
    <Box display={"flex"} flexDirection={"row"} width={"100%"} my={"4"}>
      <Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>
        {status === 'success' ? (
          <>
            <Heading size={'3xl'}>Stock</Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Product</Table.ColumnHeader>
                  <Table.ColumnHeader>Stock</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {products.filter(product => product.active).map((product) => (
                  <Table.Row key={product.id}>
                    <Table.Cell>{product.name}</Table.Cell>
                    <Table.Cell>{product.stock}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </>
        ) : status === 'error' ? (
          <>
            <h1>Something went wrong</h1>
						<Button onClick={() => {
              refetch()
            }} w={"200px"}>Retry</Button>
          </>
        ) : (
          <h1>Loading...</h1>
        )}
      </Box>
      <Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>

      </Box>
			<Toaster />
    </Box>
  );
}

export default Page