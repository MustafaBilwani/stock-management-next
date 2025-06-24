"use client";

import { CustomContext } from "@/context/states";
import React, { startTransition, useContext, useState } from "react";
import { productType } from "@/app/types";
import { addProduct, checkProductAllowedToDelete, deleteProduct, restoreProduct } from "../server-action/productActions";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Box, Button, Input, Menu, NativeSelect, Portal, Table } from "@chakra-ui/react";
import { IoMdMenu } from "react-icons/io";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFetch } from "../useFetch";

const Page = () => {
	
	const router = useRouter()
	const {status} = useSession()
  	const {
		setOptimisticProducts,
		setProducts,
	} = useContext(CustomContext);

	const [InputValue, setInputValue] = useState('')
	const [filter, setFilter] = useState('active');
  
	const {optimisticProducts, fetchStatus, setFetchStatus} = useFetch(['coming', 'products', "vendors"]);

	const checkDuplicateName = (newName: string) => (optimisticProducts.filter(product => product.active).some(product => (product.name.toLowerCase() === newName.toLowerCase())))

	async function handleAddProduct() {

		const newName = InputValue.trim().replace(/\s+/g, ' ')
		setInputValue('')

		if (!newName) {
			toaster.create({
				description: "Please enter a product name",
				type: "error",
			})
			return
		};

		if (checkDuplicateName(newName)) {
			toaster.create({
				description: "Product name already exist",
				type: "error",
			})
			return
		}

		const newProduct: productType = {
			id: Date.now().toString(),
			name: newName,
			active: true,
			stock: 0
		};

		startTransition(() => {
			setOptimisticProducts(prev => [...prev, newProduct]);
		})
		
		const data = new Promise<void>(async (resolve, reject) => {
			const response = await addProduct(newProduct);
			if (response.success) {
				setProducts(prev => [...prev, newProduct])
				resolve()
			} else {
				console.error(response.error)
				reject()
			}
		})

		toaster.promise(data, {
			success: {
				title: "Operation successful",
				description: "Product added successfully",
			},
			error: {
				title: "Operation failed",
				description: "Something went wrong",
			},
			loading: { title: "Uploading...", description: "Please wait" },
		})
	}

	async function handleDeleteProduct(id: string) {
		if (!window.confirm('are you sure you want to delete')) return

		const allowed = await checkProductAllowedToDelete(id)
		if (!allowed.success) {
			toaster.create({
				title: "Operation failed",
				description: "Unexpected error occured",
				type: "error",
			})
			return
		}
		
		if (!allowed.allowed) {
			toaster.create({
				title: "Request declined",
				description: "Product has some record it cannot be deleted",
				type: "error",
			})
			return
		}
		
		startTransition(() => {
			setOptimisticProducts(prev => prev.map(product => product.id === id ? {...product, active: false} : product));
		})
		
		const data = new Promise<void>(async (resolve, reject) => {
			const response = await deleteProduct(id);
			if (response.success) {
				setProducts(prev => prev.map(product => product.id === id ? {...product, active: false} : product));
				resolve()
			} else {
				console.log(response.error)
				reject()
			}
		})
		
		toaster.promise(data, {
			success: {
				title: "Operation successful",
				description: "Product deleted successfully",
			},
			error: {
				title: "Operation failed",
				description: "Something went wrong",
			},
			loading: { title: "Deleting..." },
		})
	}

	async function handleRestoreProduct(id: string) {
		if (!window.confirm('are you sure you want to restore')) return

		const newName = optimisticProducts.find(product => product.id === id)?.name

		if (!newName) return

		if (checkDuplicateName(newName)) {
			toaster.create({
				title: "Product name already exist",
				description: "Active product have same name cannot restore product",
				type: "error",
			})
			return
		}

		startTransition(() => {
			setOptimisticProducts(prev => prev.map(product => product.id === id ? {...product, active: true} : product));
		})		
		
		const data = new Promise<void>(async (resolve, reject) => {
			const response = await restoreProduct(id);
			if (response.success) {
				setProducts(prev => prev.map(product => product.id === id ? {...product, active: true} : product));
				resolve()
			} else {
				console.log(response.error)
				reject()
			}
		})
		toaster.promise(data, {
			success: {
				title: "Operation successful",
				description: "Product restored successfully",
			},
			error: {
				title: "Operation failed",
				description: "Something went wrong",
			},
			loading: { title: "Restoring..." },
		})
	}

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
        <Input
			type="text"
			placeholder="Enter Product Name"
			className="border-2 p-2 w-full"
			value={InputValue}
			onChange={(e) => setInputValue(e.target.value)}
			onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
			disabled={fetchStatus !== 'success'} 
			border={"4"}
			borderColor={"black"}
			padding={2}
			mb='2'
		/>
        <Button onClick={handleAddProduct} disabled={fetchStatus !== 'success'} variant="solid" colorPalette={"blue"}>
          Add Product
        </Button>
      </Box>
      <Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>
				{fetchStatus === 'success' ? (
					<>		

					<Box mb={"4"} p={"2"}>
						<label className="mr-2 font-medium">Filter:</label>
						<NativeSelect.Root
							display={"inline-block"}
							width={"200px"}
							ml={"4"}
							>
							<NativeSelect.Field
								value={filter}
								onChange={e => setFilter(e.target.value)}
								borderColor={'gray.400'}
								h={'8'}
							>
								<option value="all">All</option>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</NativeSelect.Field>
							<NativeSelect.Indicator/>
						</NativeSelect.Root>
					</Box>

					<Table.Root colorScheme="teal"  size={"sm"} variant='outline' striped>
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader>Product Name</Table.ColumnHeader>
								<Table.ColumnHeader>Status</Table.ColumnHeader>
								<Table.ColumnHeader></Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{Array.from(new Set(optimisticProducts)).filter(product => {
								if (filter === 'active') return product.active;
								if (filter === 'inactive') return !product.active;
								return true;
							}).map(product => (
								<Table.Row key={product.id} color={product.active ? 'black' : 'red'}>
									<Table.Cell>{product.name}</Table.Cell>
									<Table.Cell>{product.active ? 'Active' : 'Inactive'}</Table.Cell>
									<Table.Cell>
										<Menu.Root>
											<Menu.Trigger asChild><IoMdMenu /></Menu.Trigger>
											<Portal>
												<Menu.Positioner>
													<Menu.Content>
														<Menu.Item value="" onClick={() => product.active ?
															handleDeleteProduct(product.id) : handleRestoreProduct(product.id)
														}>
															{product.active ? 'Delete' : 'Restore' }
														</Menu.Item>
													</Menu.Content>
												</Menu.Positioner>
											</Portal>
										</Menu.Root>
									</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table.Root>
					</>
				) : fetchStatus === 'error' ? (
					<>
						<h1>Something went wrong</h1>
						<Button onClick={() => {setFetchStatus('loading')}} w={"200px"}>Retry</Button>
					</>
				) : (
					<h1>Loading...</h1>
				)}
      </Box>
			<Toaster />
    </Box>
  );
};

export default Page;
