'use client'

import { Toaster } from "@/components/ui/toaster";
import { Box, Button, Heading, Table } from "@chakra-ui/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFetch } from "../useFetch";

const Page = () => {
  
  const router = useRouter()
  const {status} = useSession()

  // const {setProducts} = useContext(CustomContext);

  const {optimisticProducts, fetchStatus, setFetchStatus} = useFetch(['products']);

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
        {fetchStatus === 'success' ? (
          <>
            {JSON.stringify(optimisticProducts)}
          </>
        ) : fetchStatus === 'error' ? (
          <>
            <h1>Something went wrong</h1>
						<Button onClick={() => {
              setFetchStatus('loading');         
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