"use client";

import { CustomContext } from "@/context/states";
import React, { startTransition, useContext, useState } from "react";
import { handleFetchAll } from "../handleFetchAll";
import { productType } from "@/app/types";
import { addProduct } from "../action/addProduct";
import { MdDelete } from "react-icons/md";
import { TbRestore } from "react-icons/tb";
import { deleteProduct } from "../action/deleteProduct";
import { restoreProduct } from "../action/restoreProduct";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Box, Button, Input, NativeSelect, Table } from "@chakra-ui/react";

const Page = () => {
  const { 
		optimisticProducts,
		setOptimisticProducts,
		setProducts,
		fetched
	} = useContext(CustomContext);

	const [InputValue, setInputValue] = useState('')
	const [filter, setFilter] = useState('active');
  
	if (!fetched.current.products) {
    (async () => {
      const result = await handleFetchAll({ products: true });
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
			};
    })();
	}

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

		if (optimisticProducts.filter(product => product.active).some(product => (product.name.toLowerCase() === newName.toLowerCase()))) {
			toaster.create({
				description: "Product name already exist",
				type: "error",
			})
			return
		}

		const newProduct: productType = {
			id: Date.now(),
			name: newName,
			active: true
		};

		startTransition(() => {
			setOptimisticProducts(prev => [...prev, newProduct]);
		})

		
		const data = new Promise<void>(async (resolve) => {
			const response = await addProduct(newProduct);
			if (response.success) {
				setProducts(prev => [...prev, newProduct])
				resolve()
			} else {console.log(response.error)}
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

	async function handleDeleteProduct(id: number) {
		if (!window.confirm('are you sure you want to delete')) return
		startTransition(() => {
			setOptimisticProducts(prev => prev.map(product => product.id === id ? {...product, active: false} : product));
		})
		
		const data = new Promise<void>(async (resolve) => {
			const response = await deleteProduct(id);
			if (response.success) {
				setProducts(prev => prev.map(product => product.id === id ? {...product, active: false} : product));
				resolve()
			} else {console.log(response.error)}
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

	async function handleRestoreProduct(id: number) {
		if (!window.confirm('are you sure you want to restore')) return

		const newName = optimisticProducts.find(product => product.id === id)?.name

		if (optimisticProducts.filter(product => product.active).some(product => (product.name.toLowerCase() === newName?.toLowerCase()))) {
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
		
		const data = new Promise<void>(async (resolve) => {
			const response = await restoreProduct(id);
			if (response.success) {
				setProducts(prev => prev.map(product => product.id === id ? {...product, active: true} : product));
				resolve()
			} else {console.log(response.error)}
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
					disabled={!fetched.current.products} 
					border={"4"}
					borderColor={"black"}
					padding={2}
					mb='2'
				/>
        <Button onClick={handleAddProduct} disabled={!fetched.current.products} variant="solid" colorPalette={"blue"}>
          Add Product
        </Button>
      </Box>
      <Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>
				{fetched.current.products ? (
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
								<Table.Row key={product.id}>
									<Table.Cell>{product.name}</Table.Cell>
									<Table.Cell>{product.active ? 'Active' : 'Inactive'}</Table.Cell>
									<Table.Cell>
										{product.active ? (
											<Button bg={"none"} onClick={() => handleDeleteProduct(product.id)}>
												<MdDelete color="black" />
											</Button>
										) : (
											<Button bg={"none"} onClick={() => handleRestoreProduct(product.id)}>
												<TbRestore color="black" />
											</Button>
										)}
									</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table.Root>
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
