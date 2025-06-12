"use client";

import { CustomContext } from "@/context/states";
import React, { startTransition, useCallback, useContext, useEffect, useState } from "react";
import { handleFetch } from "../handleFetch";
import {  vendorType } from "@/app/types";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Accordion, Box, Button, Heading, Input, Menu, NativeSelect, Portal, Table } from "@chakra-ui/react";
import { addVendor, restoreVendor, deleteVendor, checkVendorAllowedToDelete } from "../server-action/vendorActions";
import { IoMdMenu } from "react-icons/io";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Page = () => {
	
	const router = useRouter()
	const {status} = useSession()

  const { 
		optimisticVendors,
		setOptimisticVendors,
		setVendors,
		optimisticComingActionArray,
		optimisticVendorPaymentArray,
		fetched,
		setComingActionArray,
		setVendorPaymentArray
	} = useContext(CustomContext);

	const [InputValue, setInputValue] = useState('')
	const [filter, setFilter] = useState('active');
	const [Error, setError] = useState(false)
  
	

  const requiredValuesForComponent: {
    name: 'products' | 'vendors' | 'payment' | 'coming',
    function: () => void
  }[] = [
    {name: 'vendors', function: () => {fetchVendors()}},
    {name: 'payment', function: () => {fetchPayment()}},
    {name: 'coming', function: () => {fetchComing()}}
  ]
	
	useEffect(() => {
		requiredValuesForComponent.forEach((value) => {
			if (status === 'authenticated' && !fetched.current[value.name]) {
				value.function();
			}
		})
	}, [status])

	const checkDuplicateName = (newName: string) => (optimisticVendors.filter(vendor => vendor.active).some(vendor => (vendor.name.toLowerCase() === newName.toLowerCase())))

	const fetchVendors = useCallback(async () => {
		const result = await handleFetch('vendors');
		if (result.success) {
			setVendors(result.vendors);
			fetched.current.vendors = true;
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
	
	const fetchComing = useCallback(async () => {
		const result = await handleFetch('coming');
		if (result.success) {
			setComingActionArray(result.coming);
			fetched.current.coming = true;
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
	
	const fetchPayment = useCallback(async () => {
		const result = await handleFetch('payment');
		if (result.success) {
			setVendorPaymentArray(result.payment);
			fetched.current.payment = true;
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

	async function handleAddVendor() {

		const newName = InputValue.trim().replace(/\s+/g, ' ')
		setInputValue('')

		if (!newName) {
			toaster.create({
				description: "Please enter a vendor name",
				type: "error",
			})
			return
		};

		if (checkDuplicateName(newName)) {
			toaster.create({
				description: "Vendor name already exist",
				type: "error",
			})
			return
		}

		const newVendor: vendorType = {
			id: Date.now().toString(),
			name: newName,
			active: true,
      balance: 0
		};

		startTransition(() => {
			setOptimisticVendors(prev => [...prev, newVendor]);
		})
		
		const data = new Promise<void>(async (resolve, reject) => {
			const response = await addVendor(newVendor);
			if (response.success) {
				setVendors(prev => [...prev, newVendor])
				resolve()
			} else {
				console.log(response.error)
				reject()
			}
		})

		toaster.promise(data, {
			success: {
				title: "Operation successful",
				description: "Vendor added successfully",
			},
			error: {
				title: "Operation failed",
				description: "Something went wrong",
			},
			loading: { title: "Uploading...", description: "Please wait" },
		})
	}

	async function handleDeleteVendor(id: string) {
		if (!window.confirm('are you sure you want to delete')) return

		const allowed = await checkVendorAllowedToDelete(id)
		if (!allowed?.success) {
			toaster.create({
				title: "OPeration Failed",
				description: "Unexpected error occured",
				type: "error",
			})
			return
		}
		
		if (!allowed?.allowed) {
			toaster.create({
				title: "Vendor cannot be deleted",
				description: "Vendor has active data",
				type: "error",
			})
			return
		}
		
		startTransition(() => {
			setOptimisticVendors(prev => prev.map(vendor => vendor.id === id ? {...vendor, active: false} : vendor));
		})
		
		const data = new Promise<void>(async (resolve, reject) => {
			const response = await deleteVendor(id);
			if (response.success) {
				setVendors(prev => prev.map(vendor => vendor.id === id ? {...vendor, active: false} : vendor));
				resolve()
			} else {
				console.log(response.error)
				reject()
			}
		})
		
		toaster.promise(data, {
			success: {
				title: "Operation successful",
				description: "Vendor deleted successfully",
			},
			error: {
				title: "Operation failed",
				description: "Something went wrong",
			},
			loading: { title: "Deleting..." },
		})
	}

	async function handleRestoreVendor(id: string) {
		if (!window.confirm('are you sure you want to restore')) return

		const newName = optimisticVendors.find(vendor => vendor.id === id)?.name

		if (typeof newName !== 'string') return

		if (checkDuplicateName(newName)) {
			toaster.create({
				title: "Vendor name already exist",
				description: "Active vendor have same name cannot restore vendor",
				type: "error",
			})
			return
		}

		startTransition(() => {
			setOptimisticVendors(prev => prev.map(vendor => vendor.id === id ? {...vendor, active: true} : vendor));
		})		
		
		const data = new Promise<void>(async (resolve, reject) => {
			const response = await restoreVendor(id);
			if (response.success) {
				setVendors(prev => prev.map(vendor => vendor.id === id ? {...vendor, active: true} : vendor));
				resolve()
			} else {
				console.log(response.error)
				reject()
			}
		})
		toaster.promise(data, {
			success: {
				title: "Operation successful",
				description: "Vendor restored successfully",
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
          placeholder="Enter Vendor Name"
          className="border-2 p-2 w-full"
          value={InputValue}
          onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleAddVendor()}
					disabled={!fetched.current.vendors} 
					border={"4"}
					borderColor={"black"}
					padding={2}
					mb='2'
				/>
        <Button onClick={handleAddVendor} disabled={!fetched.current.vendors} variant="solid" colorPalette={"blue"}>
          Add Vendor
        </Button>

				{requiredValuesForComponent.every(value => fetched.current[value.name]) ? (
					<>
						{Array.from(new Set(optimisticVendors)).filter(vendor => {
							if (filter === 'active') return vendor.active;
							if (filter === 'inactive') return !vendor.active;
							return true;
						}).map(vendor => (
							<Accordion.Root collapsible width={'80%'} key={vendor.id}>
								<Accordion.Item key={'form'} value={vendor.id}>
									<Accordion.ItemTrigger bg={"gray.100"} p={"2"}>
										<Heading size={'md'}>{vendor.name}</Heading>			
										<Accordion.ItemIndicator />
									</Accordion.ItemTrigger>

									<Accordion.ItemContent>
										<Accordion.ItemBody>
											<Table.Root colorScheme="teal"  size={"sm"} variant='outline' striped>
												<Table.Header>
													<Table.Row>
														<Table.ColumnHeader>Date</Table.ColumnHeader>
														<Table.ColumnHeader>Action</Table.ColumnHeader>
														<Table.ColumnHeader>Debit</Table.ColumnHeader>
														<Table.ColumnHeader>Credit</Table.ColumnHeader>
													</Table.Row>
												</Table.Header>
												<Table.Body>
													{[...optimisticComingActionArray, ...optimisticVendorPaymentArray].filter(action => 
														(action.vendor === vendor.id && action.active)
													).map(action => (

														<Table.Row key={action.id}>
															<Table.Cell>{action.date}</Table.Cell>
															<Table.Cell>{action.type === 'coming' ? 'Purchase made' : 'Payment'}</Table.Cell>
															<Table.Cell>{action.type === 'coming' ? action.priceTotal : ''}</Table.Cell>
															<Table.Cell>{action.type === 'payment' ? action.amount : ''}</Table.Cell>
														</Table.Row>
											
													))}
												</Table.Body>
											</Table.Root>
										</Accordion.ItemBody>
									</Accordion.ItemContent>
								</Accordion.Item>
							</Accordion.Root>
						))}
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
      <Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>
				{fetched.current.vendors ? (
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
								<option value="inactive">Deleted</option>
							</NativeSelect.Field>
							<NativeSelect.Indicator/>
						</NativeSelect.Root>
					</Box>

					<Table.Root colorScheme="teal"  size={"sm"} variant='outline' striped>
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeader>Vendor Name</Table.ColumnHeader>
								<Table.ColumnHeader>Balance</Table.ColumnHeader>
								<Table.ColumnHeader></Table.ColumnHeader>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{Array.from(new Set(optimisticVendors)).filter(vendor => {
								if (filter === 'active') return vendor.active;
								if (filter === 'inactive') return !vendor.active;
								return true;
							}).map(vendor => (

									<Table.Row key={vendor.id} color={vendor.active ? 'black' : 'red'}>
										<Table.Cell>{vendor.name}</Table.Cell>
										<Table.Cell>{vendor.active ? vendor.balance : "Deleted"}</Table.Cell>
										<Table.Cell>
										<Menu.Root>
												<Menu.Trigger asChild><IoMdMenu /></Menu.Trigger>
												<Portal>
													<Menu.Positioner>
														<Menu.Content>
															<Menu.Item value="" onClick={() => vendor.active ?
																handleDeleteVendor(vendor.id) : handleRestoreVendor(vendor.id)
															}>
																{vendor.active ? 'Delete' : 'Restore' }
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
				) : Error ? (
					<>
						<h1>Something went wrong</h1>
						<Button onClick={() => {setError(false); fetchVendors()}} w={"200px"}>Retry</Button>
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
