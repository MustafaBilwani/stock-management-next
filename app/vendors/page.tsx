"use client";

import React, { useState } from "react";
import { vendorType } from "@/app/types";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Accordion, Box, Button, Heading, Input, Menu, NativeSelect, Portal, Table } from "@chakra-ui/react";
import { addVendor, checkVendorAllowedToDelete, deleteVendor, restoreVendor } from "../server-action/vendorActions";
import { IoMdMenu } from "react-icons/io";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { getQueryOptions } from "../getQueryOptions";

const Page = () => {

	const router = useRouter()
	const { status: authStatus } = useSession()

	const [InputValue, setInputValue] = useState('')
	const [filter, setFilter] = useState('active');

	const [
		{ data: vendors, isSuccess: vendorsSuccess, isError: vendorsError, refetch: refetchVendors },
		{ data: comingActionArray, isSuccess: comingSuccess, isError: comingError, refetch: refetchComing },
		{ data: vendorPaymentArray, isSuccess: paymentSuccess, isError: paymentError, refetch: refetchPayment }
	] = useQueries({
		queries: [
			getQueryOptions('vendors'),
			getQueryOptions('coming'),
			getQueryOptions('payment'),
		]
	})

	const queryClient = useQueryClient()

	const addVendorMutation = useMutation({
		mutationKey: ['add', 'vendor'],
		mutationFn: async (newVendor: vendorType) => {
			const result = await addVendor(newVendor)
			if (!result?.success) throw new Error('error occured')
		},
		onSuccess: (_result, newVendor) => {
			queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
				return [...prev, newVendor]
			})
		}
	})

	const deleteVendorMutation = useMutation({
		mutationKey: ['delete', 'vendor'],
		mutationFn: async (id: string) => {
			const result = await deleteVendor(id)
			if (!result?.success) throw new Error('error occured')
		},
		onSuccess: (_result, id) => {
			queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
				return prev.map(vendor => vendor.id === id ? { ...vendor, active: false } : vendor)
			})
		}
	})

	const restoreVendorMutation = useMutation({
		mutationKey: ['restore', 'vendor'],
		mutationFn: async (id: string) => {
			const result = await restoreVendor(id)
			if (!result?.success) throw new Error('error occured')
		},
		onSuccess: (_result, id) => {
			queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
				return prev.map(vendor => vendor.id === id ? { ...vendor, active: true } : vendor)
			})
		}
	})

	const isSuccess = vendorsSuccess && comingSuccess && paymentSuccess
	const isError = vendorsError || comingError || paymentError

	const checkDuplicateName = (newName: string) => (vendors!
		.filter(vendor => vendor.active)
		.some(vendor => vendor.name.toLowerCase() === newName.toLowerCase())
	)

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

		const promise = addVendorMutation.mutateAsync(newVendor)

		toaster.promise(promise, {
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

		const promise = deleteVendorMutation.mutateAsync(id);

		toaster.promise(promise, {
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

		const newName = vendors!.find(vendor => vendor.id === id)?.name

		if (typeof newName !== 'string') return

		if (checkDuplicateName(newName)) {
			toaster.create({
				title: "Vendor name already exist",
				description: "Active vendor have same name cannot restore vendor",
				type: "error",
			})
			return
		}

		const promise = restoreVendorMutation.mutateAsync(id);
		
		toaster.promise(promise, {
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
				<Input
					type="text"
					placeholder="Enter Vendor Name"
					className="border-2 p-2 w-full"
					value={InputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => e.key === 'Enter' && handleAddVendor()}
					disabled={!vendorsSuccess}
					border={"4"}
					borderColor={"black"}
					padding={2}
					mb='2'
				/>
				<Button onClick={handleAddVendor} disabled={!vendorsSuccess} variant="solid" colorPalette={"blue"}>
					Add Vendor
				</Button>

				{isSuccess ? (
					<>
						{Array.from(new Set(vendors)).filter(vendor => {
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
											<Table.Root colorScheme="teal" size={"sm"} variant='outline' striped>
												<Table.Header>
													<Table.Row>
														<Table.ColumnHeader>Date</Table.ColumnHeader>
														<Table.ColumnHeader>Action</Table.ColumnHeader>
														<Table.ColumnHeader>Debit</Table.ColumnHeader>
														<Table.ColumnHeader>Credit</Table.ColumnHeader>
													</Table.Row>
												</Table.Header>
												<Table.Body>
													{[...comingActionArray, ...vendorPaymentArray].filter(action =>
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
				) : isError ? (
					<>
						<h1>Something went wrong</h1>
						<Button onClick={() => {
							refetchVendors()
							refetchComing()
							refetchPayment()
						}} w={"200px"}>Retry</Button>
					</>
				) : (
					<h1>Loading...</h1>
				)}
			</Box>
			<Box display={"flex"} flexDirection={"column"} width={"1/2"} px={"4"}>
				{vendorsSuccess ? (
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
								<NativeSelect.Indicator />
							</NativeSelect.Root>
						</Box>

						<Table.Root colorScheme="teal" size={"sm"} variant='outline' striped>
							<Table.Header>
								<Table.Row>
									<Table.ColumnHeader>Vendor Name</Table.ColumnHeader>
									<Table.ColumnHeader>Balance</Table.ColumnHeader>
									<Table.ColumnHeader></Table.ColumnHeader>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{Array.from(new Set(vendors)).filter(vendor => {
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
																{vendor.active ? 'Delete' : 'Restore'}
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
				) : isError ? (
					<>
						<h1>Something went wrong</h1>
						<Button onClick={() => {
							refetchVendors()
							refetchComing()
							refetchPayment()
						}} w={"200px"}>Retry</Button>
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
