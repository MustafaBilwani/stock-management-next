'use client'

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Accordion, Box, Button, Field, Heading, Input, Menu, NativeSelect, Portal, Span } from "@chakra-ui/react";
import { IoMdMenu } from "react-icons/io";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { comingActionType, productType, vendorType } from "@/app/types";
import { addComingAction, deleteComingAction, editComingAction, restoreComingAction } from "@/app/server-action/comingActions";
import { AllCommunityModule, ColDef, ICellRendererParams, IFilterOptionDef, ModuleRegistry, RowClassParams, RowValueChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { SetFilterModule } from 'ag-grid-enterprise'
import EditDialog from "@/components/EditDialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { getQueryOptions } from "@/app/getQueryOptions";

const formSchema = z.object({
  qty: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number and is required",
    })
    .positive()
    .int('Cannot be Fraction'),

  pricePerPcs: z
    .number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number and is required",
    })
    .positive(),

  vendor: z
    .string()
    .min(1, "Vendor is required"),

  product: z
    .string()
    .min(1, "Product is required"),

  date: z
    .string()
    .min(1, "Date is required"),

  notes: z.string()
});

const Page = () => {

  const router = useRouter()
  const { status } = useSession()

  const queryClient = useQueryClient()

  const [
    { data: comingActionArray, isSuccess: comingSuccess, isError: comingError, refetch: refetchComing },
    { data: productsArray, isSuccess: productsSuccess, isError: productsError, refetch: refetchProducts },
    { data: vendorsArray, isSuccess: vendorsSuccess, isError: vendorsError, refetch: refetchVendors }
  ] = useQueries({
    queries: [
      getQueryOptions('coming'),
      getQueryOptions('products'),
      getQueryOptions('vendors')
    ]
  })

  const isSuccess = comingSuccess && productsSuccess && vendorsSuccess
  const isError = comingError || productsError || vendorsError

  const addComingMutation = useMutation({
    mutationKey: ['add', 'coming'],
    mutationFn: async (newComingAction: comingActionType) => {
      const result = await addComingAction(newComingAction)
      if (!result?.success) throw new Error('error occured')
    },
    onSuccess: (_result, newComingAction) => {
      queryClient.setQueryData(['fetch', 'coming'], (prev: comingActionType[]) => [...prev, newComingAction])
      queryClient.setQueryData(['fetch', 'products'], (prev: productType[]) => {
        return prev.map(product =>
          product.id === newComingAction.product
            ? { ...product, stock: product.stock + newComingAction.qty }
            : product
        )
      });
      queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
        return prev.map(vendor =>
          vendor.id === newComingAction.vendor
            ? { ...vendor, balance: vendor.balance + newComingAction.priceTotal } // add in debit 
            : vendor
        )
      })
    }
  })

  const deleteComingMutation = useMutation({
    mutationKey: ['delete', 'coming'],
    mutationFn: async (comingAction: comingActionType) => {
      const result = await deleteComingAction(comingAction)
      if (!result?.success) throw new Error('error occured')
    },
    onSuccess: (_result, comingAction) => {
      queryClient.setQueryData(['fetch', 'coming'], (prev: comingActionType[]) => {
        return prev.map((action) =>
          action.id === comingAction.id
            ? { ...action, active: false }
            : action
        )
      })
      queryClient.setQueryData(['fetch', 'products'], (prev: productType[]) => {
        return prev.map(product =>
          product.id === comingAction.product
            ? { ...product, stock: product.stock - comingAction.qty }
            : product
        )
      })
      queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
        return prev.map(vendor =>
          vendor.id === comingAction.vendor
            ? { ...vendor, balance: vendor.balance - comingAction.priceTotal } // subtract from debit
            : vendor
        )
      })
    },
    onError: (error) => {
      console.log(error)
    }
  })

  const restoreComingMutation = useMutation({
    mutationKey: ['restore', 'coming'],
    mutationFn: async (comingAction: comingActionType) => {
      const result = await restoreComingAction(comingAction)
      if (!result?.success) throw new Error('error occured')
    },
    onSuccess: (_result, comingAction) => {
      queryClient.setQueryData(['fetch', 'coming'], (prev: comingActionType[]) => {
        return prev.map((action) =>
          action.id === comingAction.id
            ? { ...action, active: true }
            : action
        )
      })
      queryClient.setQueryData(['fetch', 'products'], (prev: productType[]) => {
        return prev.map(product =>
          product.id === comingAction.product
            ? { ...product, stock: product.stock + comingAction.qty }
            : product
        )
      })
      queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
        return prev.map(vendor =>
          vendor.id === comingAction.vendor
            ? { ...vendor, balance: vendor.balance + comingAction.priceTotal } // add to debit
            : vendor
        )
      })
    },
    onError: (error) => {
      console.log(error)
    }
  })

  const editComingMutation = useMutation({
    mutationKey: ['edit', 'coming'],
    mutationFn: async ({ newComingAction, oldComingAction }: { newComingAction: comingActionType, oldComingAction: comingActionType }) => {
      const result = await editComingAction({ newComingAction, oldComingAction })
      if (!result?.success) throw new Error('error occured')
    },
    onSuccess: (_result, { newComingAction, oldComingAction }: { newComingAction: comingActionType, oldComingAction: comingActionType }) => {
      queryClient.setQueryData(['fetch', 'coming'], (prev: comingActionType[]) => {
        return prev.map(action =>
          action.id === newComingAction.id
            ? newComingAction
            : action
        )
      })
      queryClient.setQueryData(['fetch', 'products'], (prev: productType[]) => {
        return prev.map(prod => {
          if (prod.id === oldComingAction.product && prod.id === newComingAction.product) {
            return { ...prod, stock: prod.stock - oldComingAction.qty + newComingAction.qty };
          }
          if (prod.id === oldComingAction.product) { return { ...prod, stock: prod.stock - oldComingAction.qty }; }
          if (prod.id === newComingAction.product) { return { ...prod, stock: prod.stock + newComingAction.qty }; }

          return prod;
        })
      })
      queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
        return prev.map(vendor => {
          if (vendor.id === oldComingAction.vendor && vendor.id === newComingAction.vendor) {
            return { ...vendor, balance: vendor.balance - oldComingAction.priceTotal + newComingAction.priceTotal };
          }
          if (vendor.id === oldComingAction.vendor) return { ...vendor, balance: vendor.balance - oldComingAction.priceTotal }; // subtract from debit
          if (vendor.id === newComingAction.vendor) return { ...vendor, balance: vendor.balance + newComingAction.priceTotal }; // add to debit
          return vendor;
        })
      })
    },
    onError: (error) => {
      console.log(error)
    }
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const gridRef = useRef<AgGridReact<comingActionType>>(null);

  // Register all Community features -- to be edited
  ModuleRegistry.registerModules([AllCommunityModule, SetFilterModule]);

  async function handleEditComingAction(
    newComingAction: Omit<comingActionType, 'id' | 'type' | 'active' | 'productName' | 'vendorName' | 'priceTotal'>
  ) {
    if (!isSuccess) { console.log('no data'); return; }

    const oldComingAction = comingActionArray.find(action => action.id === editingRowId!);

    if (!oldComingAction) return;

    const processedNewComingAction: comingActionType = {
      ...newComingAction,
      id: editingRowId!,
      type: 'coming',
      active: oldComingAction.active,
      priceTotal: newComingAction.pricePerPcs * newComingAction.qty,
      productName: productsArray.find(product => product.id === newComingAction.product)?.name || '',
      vendorName: vendorsArray.find(vendor => vendor.id === newComingAction.vendor)?.name || ''
    }

    const promise = editComingMutation.mutateAsync({ newComingAction: processedNewComingAction, oldComingAction: oldComingAction });
    setIsEditing(false)
    setEditingRowId(null)

    toaster.promise(promise, {
      success: {
        title: "Operation successful",
        description: "Coming action edited successfully",
      },
      error: {
        title: "Operation failed",
        description: "Something went wrong",
      },
      loading: { title: "Editing..." },
    })
  }

  async function handleAddComingAction(
    newComingAction: Omit<comingActionType, 'id' | 'type' | 'active' | 'productName' | 'vendorName' | 'priceTotal'>
  ) {

    if (!isSuccess) { console.log('no data'); return; }

    const processedNewComingAction: comingActionType = {
      ...newComingAction,
      id: Date.now().toString(),
      type: 'coming',
      active: true,
      priceTotal: newComingAction.pricePerPcs * newComingAction.qty,
      productName: productsArray.find(product => product.id === newComingAction.product)?.name || '',
      vendorName: vendorsArray.find(vendor => vendor.id === newComingAction.vendor)?.name || ''
    }

    reset()

    const promise = addComingMutation.mutateAsync(processedNewComingAction)

    toaster.promise(promise, {
      success: {
        title: "Operation successful",
        description: "Coming action added successfully",
      },
      error: {
        title: "Operation failed",
        description: "Something went wrong",
      },
      loading: { title: "Adding..." },
    })
  }

  async function handleDeleteComingAction(id: string) {
    if (!window.confirm("Are you sure you want to delete?")) return;
    if (!isSuccess) { console.log('no data'); return; }

    const currentAction = comingActionArray.find(action => action.id === id);
    if (!currentAction) return;

    const promise = deleteComingMutation.mutateAsync(currentAction);

    toaster.promise(promise, {
      success: {
        title: "Operation successful",
        description: "Coming Action deleted successfully",
      },
      error: {
        title: "Operation failed",
        description: "Something went wrong",
      },
      loading: { title: "Deleting..." },
    });
  }

  async function handleRestoreComingAction(id: string) {
    if (!window.confirm("Are you sure you want to restore?")) return;
    if (!isSuccess) { console.log('no data'); return; }


    const currentAction = comingActionArray.find(action => action.id === id);
    if (!currentAction) return;
    const promise = restoreComingMutation.mutateAsync(currentAction);

    toaster.promise(promise, {
      success: {
        title: "Operation successful",
        description: "Coming Action restored successfully",
      },
      error: {
        title: "Operation failed",
        description: "Something went wrong",
      },
      loading: { title: "Restoring..." },
    });
  }

  // ag-grid

  const colDefs: ColDef<comingActionType, any>[] = [
    { field: 'qty' },
    { field: 'pricePerPcs', headerName: 'Price per Pcs' },
    {
      field: 'date',
      filter: 'agDateColumnFilter',
      filterParams: {
        defaultOption: 'inRange',
        maxNumConditions: 1,
        buttons: ['reset'],
        inRangeInclusive: true
      }
    },
    { field: 'notes' },
    {
      field: 'productName',
      headerName: 'Product',
      filter: 'agSetColumnFilter',
    },
    {
      field: 'vendorName',
      headerName: 'Vendor',
      filter: 'agSetColumnFilter'
    },
    {
      headerName: 'actions',
      colId: 'actions',
      sortable: false,
      valueGetter: (params) => params.data?.active,
      cellRenderer: (params: ICellRendererParams<comingActionType>) => {
        const rowId = params.data?.id
        if (!rowId) return <>Not Found</>
        return (
          <Box display={"flex"} alignItems={"center"} h={'100%'}>
            <Menu.Root>
              <Menu.Trigger asChild><IoMdMenu /></Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="" onClick={() => params.data?.active ?
                      handleDeleteComingAction(rowId) : handleRestoreComingAction(rowId)
                    }>
                      {params.data?.active ? 'Delete' : 'Restore'}
                    </Menu.Item>
                    <Menu.Item value="" onClick={() => onBtStartEditing(rowId)}>
                      Edit
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Box>
        )
      },
      filter: 'agNumberColumnFilter',
      filterParams: {
        filterOptions: [
          {
            displayKey: 'true',
            displayName: 'Active',
            predicate: (_, cellValue) => +cellValue === 1,
            numberOfInputs: 0,
          },
          {
            displayKey: 'false',
            displayName: 'Deleted',
            predicate: (_, cellValue) => +cellValue === 0,
            numberOfInputs: 0,
          },
          {
            displayKey: '',
            displayName: 'All',
            predicate: () => true,
            numberOfInputs: 0,
          },
        ] as IFilterOptionDef[],
        maxNumConditions: 1,
      },
    }
  ]

  // make row red if it is not active
  const getRowClass = useCallback((params: RowClassParams<comingActionType>) => {
    if (params.data?.active === false) {
      return "text-red-900";
    }
  }, []);

  // apply filter for active by default
  const initialState = useMemo(() => ({
    filter: {
      filterModel: {
        actions: {
          filterType: 'number',
          type: 'equals',
          filter: 1
        }
      }
    }
  }), []);

  const onRowValueChanged = useCallback((event: RowValueChangedEvent) => {
    const data = event.data;
    console.log(data);
  }, []);

  const onBtStartEditing = (rowId: string) => {
    if (editingRowId) {
      toaster.create({
        title: 'cannot edit',
        description: 'another edit is going on',
        type: 'error'
      })
      return
    }
    setEditingRowId(rowId)
    setIsEditing(true)
  }

  const defaultColDef = useMemo<ColDef>(() => ({
    editable: false
  }), []);


  if (status === 'unauthenticated') {
    router.push('/api/auth/signin')
    return <p>Unauthorized</p>
  }

  if (status === 'loading') {
    return <p>Loading...</p>;
  }


  return (
    <Box display={"flex"} flexDirection={"column"} width={"95%"} m={"6"}>

      <Heading size={'3xl'}>Coming</Heading>

      {isSuccess && (
        <Accordion.Root collapsible width={'80%'}>
          <Accordion.Item key={'form'} value={'form'}>
            <Accordion.ItemTrigger bg={"gray.100"} p={"2"}>
              <Span flex="1">Form</Span>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <Heading size={'2xl'}>New Entry</Heading>
                <form onSubmit={handleSubmit((data) => handleAddComingAction(data))}>

                  <Field.Root invalid={!!errors.qty?.message} mb={"2"}>
                    <Field.Label>Quantity</Field.Label>
                    <Input
                      {...register('qty', { valueAsNumber: true })}
                      border={"4"}
                      borderColor={"black"}
                      padding={2}
                      type="number"
                    />
                    <Field.ErrorText>{errors.qty?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.pricePerPcs?.message} mb={"2"}>
                    <Field.Label>Price per Pcs</Field.Label>
                    <Input
                      {...register('pricePerPcs', { valueAsNumber: true })}
                      border={"4"}
                      borderColor={"black"}
                      padding={2}
                      type="number"
                    />
                    <Field.ErrorText>{errors.pricePerPcs?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.vendor?.message} mb={"2"}>
                    <Field.Label>Vendor</Field.Label>
                    <NativeSelect.Root
                      display={"inline-block"}
                    >
                      <NativeSelect.Field
                        {...register('vendor')}
                        borderColor={'gray.400'}
                        h={'8'}
                        defaultValue={''}
                      >
                        <option hidden value={''}>Select Vendor</option>
                        {vendorsArray.filter(vendor => vendor.active).map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.ErrorText>{errors.vendor?.message && errors.vendor?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.product?.message} mb={"2"}>
                    <Field.Label>Product</Field.Label>
                    <NativeSelect.Root
                      display={"inline-block"}
                    >
                      <NativeSelect.Field
                        {...register('product')}
                        borderColor={'gray.400'}
                        h={'8'}
                        defaultValue={''}
                      >
                        <option hidden value={''}>Select Product</option>
                        {productsArray.filter(product => product.active).map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Field.ErrorText>{errors.product?.message && errors.product?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.date?.message} mb={"2"}>
                    <Field.Label>Date</Field.Label>
                    <Input
                      {...register('date')}
                      border={"4"}
                      borderColor={"black"}
                      padding={2}
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                    <Field.ErrorText>{errors.date?.message && errors.date?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.notes?.message} mb={"2"}>
                    <Field.Label>Notes</Field.Label>
                    <Input
                      {...register('notes')}
                      border={"4"}
                      borderColor={"black"}
                      padding={2}
                    />
                    <Field.ErrorText>{errors.notes?.message && errors.notes?.message}</Field.ErrorText>
                  </Field.Root>

                  <Button type="submit" disabled={!isSuccess} >Submit</Button>
                </form>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      )}
      <Box display={"flex"} flexDirection={"column"} h='90vh'>
        {isSuccess ? (
          <>
            <Box mb={"4"} p={"2"}>
              <Heading size={'3xl'} mt={"4"} mr={'4'} display={"inline-block"}>Data</Heading>
              <Button mb={'2'} variant={'outline'} display={"inline-block"}
                onClick={() => gridRef.current!.api.exportDataAsCsv()}>
                Download CSV export file
              </Button>
              {/* <Button variant={'outline'} onClick={() => console.log(gridRef.current!.api.getDataAsCsv())}>
                Show CSV export content text</Button> */}
            </Box>

            <AgGridReact
              ref={gridRef}
              columnDefs={colDefs}
              rowData={comingActionArray}
              suppressDragLeaveHidesColumns
              getRowClass={getRowClass}
              initialState={initialState}
              onRowValueChanged={onRowValueChanged}
              defaultColDef={defaultColDef}
            />

          </>
        ) : isError ? (
          <>
            <h1>Something went wrong</h1>
            <Button onClick={() => {
              refetchComing();
              refetchProducts();
              refetchVendors();
            }} w={"200px"}>Retry</Button>
          </>
        ) : (
          <h1>Loading...</h1>
        )}
      </Box>
      <Toaster />
      {isEditing && (
        <EditDialog
          isEditing={isEditing}
          rowData={comingActionArray!.find(action => action.id === editingRowId)}
          handleEditComingAction={handleEditComingAction}
          abortEditiing={() => {
            setIsEditing(false)
            setEditingRowId(null)
          }}
        />
      )}
    </Box>
  );
}

export default Page