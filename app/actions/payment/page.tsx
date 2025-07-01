'use client'

import React, { useCallback, useMemo, useRef } from "react";
import { Toaster, toaster } from "@/components/ui/toaster";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vendorPaymentType, vendorType } from "@/app/types";
import { addPayment, deletePayment, restorePayment } from "@/app/server-action/paymentActions";
import { Accordion, Box, Button, Field, Heading, Input, Menu, NativeSelect, Portal, Span } from "@chakra-ui/react";
import { IoMdMenu } from "react-icons/io";
import { AllCommunityModule, ColDef, ICellRendererParams, IFilterOptionDef, ModuleRegistry, RowClassParams } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { SetFilterModule } from 'ag-grid-enterprise'
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { getQueryOptions } from "@/app/getQueryOptions";

const schema = z.object({

  amount: z.number({
    required_error: "Amount is required",
    invalid_type_error: "Amount must be a number and is required",
  }).positive(),

  vendor: z.string().min(1, "Vendor is required"),

  date: z.string().min(1, "Date is required"),
  notes: z.string()
});

const Page = () => {
  
  const router = useRouter()
  const {status: authStatus} = useSession()

  const queryClient = useQueryClient()

  const [
    { data: paymentArray, isSuccess: paymentSuccess, isError: paymentError, refetch: refetchPayment },
    { data: vendorsArray, isSuccess: vendorsSuccess, isError: vendorsError, refetch: refetchVendors }
  ] = useQueries({
    queries: [
      getQueryOptions('payment'),
      getQueryOptions('vendors')
    ]
  })

  const isSuccess = paymentSuccess && vendorsSuccess
  const isError = paymentError || vendorsError

  const addPaymentMutation = useMutation({
    mutationKey: ['add', 'payment'],
    mutationFn: async (newPaymentAction: vendorPaymentType) => {
      const result = await addPayment(newPaymentAction)
      if (!result?.success) throw new Error('error occured')
    },
    onSuccess: (_result, newPaymentAction) => {
      queryClient.setQueryData(['fetch', 'payment'], (prev: vendorPaymentType[]) => [...prev, newPaymentAction])
      queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
        return prev.map(vendor =>
          vendor.id === newPaymentAction.vendor
            ? { ...vendor, balance: vendor.balance - newPaymentAction.amount } // add to credit
            : vendor
        )
      })
    }
  })

  const deletePaymentMutation = useMutation({
    mutationKey: ['delete', 'payment'],
    mutationFn: async (paymentAction: vendorPaymentType) => {
      const result = await deletePayment(paymentAction)
      if (!result?.success) throw new Error('error occured')
    },
    onSuccess: (_result, paymentAction) => {
      queryClient.setQueryData(['fetch', 'payment'], (prev: vendorPaymentType[]) => {
        return prev.map((action) =>
          action.id === paymentAction.id
            ? { ...action, active: false }
            : action
        )
      })
      queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
        return prev.map(vendor =>
          vendor.id === paymentAction.vendor
          ? { ...vendor, balance: vendor.balance + paymentAction.amount } // delete from credit
            : vendor
        )
      })
    },
    onError: (error) => {
      console.log(error)
    }
  })

  const restorePaymentMutation = useMutation({
    mutationKey: ['restore', 'payment'],
    mutationFn: async (paymentAction: vendorPaymentType) => {
      const result = await restorePayment(paymentAction)
      if (!result?.success) throw new Error('error occured')
    },
    onSuccess: (_result, paymentAction) => {
      queryClient.setQueryData(['fetch', 'payment'], (prev: vendorPaymentType[]) => {
        return prev.map((action) =>
          action.id === paymentAction.id
            ? { ...action, active: true }
            : action
        )
      })
      queryClient.setQueryData(['fetch', 'vendors'], (prev: vendorType[]) => {
        return prev.map(vendor =>
          vendor.id === paymentAction.vendor
            ? { ...vendor, balance: vendor.balance - paymentAction.amount } // add to credit
            : vendor
        )
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
    resolver: zodResolver(schema),
  });

  async function handleDeletePayment(id: string) {
    if (!window.confirm("Are you sure you want to delete?")) return;
    if (!isSuccess) {console.log('no data abondoning operation'); return};

    const currentAction = paymentArray.find(action => action.id === id);
    if (!currentAction) return;

    const promise = deletePaymentMutation.mutateAsync(currentAction);

    toaster.promise(promise, {
      success: {
        title: "Operation successful",
        description: "Payment deleted successfully",
      },
      error: {
        title: "Operation failed",
        description: "Something went wrong",
      },
      loading: { title: "Deleting..." },
    });
  }

  async function handleRestorePayment(id: string) {
    if (!window.confirm("Are you sure you want to restore?")) return;

    const currentAction = paymentArray?.find(action => action.id === id);
    if (!currentAction) return;
    const promise = restorePaymentMutation.mutateAsync(currentAction);

    toaster.promise(promise, {
      success: {
        title: "Operation successful",
        description: "Payment restored successfully",
      },
      error: {
        title: "Operation failed",
        description: "Something went wrong",
      },
      loading: { title: "Restoring..." },
    });
  }

  async function handleAddPayment(
    newPayment: Omit<vendorPaymentType, 'id' | 'type' | 'active' | 'vendorName'>
  ) {
    if (!isSuccess) {console.log('no data abondoning operation'); return};

    const processedNewPayment: vendorPaymentType = {
      ...newPayment,
      vendor: newPayment.vendor,
      vendorName: vendorsArray.find(vendor => vendor.id === newPayment.vendor)?.name || '',
      id: Date.now().toString(),
      type: 'payment',
      active: true
    }

    reset()

    const promise = addPaymentMutation.mutateAsync(processedNewPayment);

    toaster.promise(promise, {
      success: {
        title: "Operation successful",
        description: "Payment action added successfully",
      },
      error: {
        title: "Operation failed",
        description: "Something went wrong",
      },
      loading: { title: "Adding..." },
    })
  }

  const gridRef = useRef<AgGridReact<vendorPaymentType>>(null);

  // Register all Community features to be edited
  ModuleRegistry.registerModules([AllCommunityModule, SetFilterModule]);

  const colDefs: ColDef<vendorPaymentType, any>[] = [
    {field: 'amount'},
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
    {field: 'notes'},
    {field: 'vendorName', headerName: 'Vendor', filter: 'agSetColumnFilter'},
    {
      headerName: 'actions',
      colId: 'actions',
      sortable: false,
      valueGetter: (params) => params.data?.active,
      cellRenderer: (params: ICellRendererParams<vendorPaymentType>) => (
        <Box display={"flex"} alignItems={"center"} h={'100%'}>
          <Menu.Root>
            <Menu.Trigger asChild><IoMdMenu /></Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value=""
                    onClick={() => params.data?.active ? handleDeletePayment(params.data?.id) : handleRestorePayment(params.data?.id || '')}
                  >
                    {params.data?.active ? 'Delete' : 'Restore' }
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
      ),
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

  const getRowClass = useCallback((params: RowClassParams<vendorPaymentType>) => {
    if (params.data?.active === false) {
        return "text-red-900";
    }
  }, []);

  const initialState = useMemo(() => ({ // internal
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

  if (authStatus === 'unauthenticated') {
    router.push('/api/auth/signin')
    return <p>Unauthorized</p>
  }

  if (authStatus === 'loading') {
    return <p>Loading...</p>;
  }

	return ( 
    <Box display={"flex"} flexDirection={"column"} width={"95%"} m={"6"}>
      <Heading size={'3xl'}>Payment</Heading>
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
                <form onSubmit={handleSubmit((data) => handleAddPayment(data))}>

                  <Field.Root invalid={!!errors.amount?.message} mb={"2"}>
                    <Field.Label>Amount</Field.Label>
                    <Input 
                      {...register('amount', { valueAsNumber: true })} 
                      border={"4"}
                      borderColor={"black"}
                      padding={2}
                      type="number"
                    />
                    <Field.ErrorText>{errors.amount?.message}</Field.ErrorText>
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
                      <NativeSelect.Indicator/>
                    </NativeSelect.Root>
                    <Field.ErrorText>{errors.vendor?.message && errors.vendor?.message}</Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.date?.message} mb={"2"}>
                    <Field.Label>Date</Field.Label>
                    <Input
                      {...register('date')}
                      border={"4"}
                      borderColor={"black"}
                      padding={2}
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
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
              rowData={paymentArray}
              suppressDragLeaveHidesColumns
              getRowClass={getRowClass}
              initialState={initialState}
            />
          </>
        ) : isError ? (
          <>
            <h1>Something went wrong</h1>
						<Button onClick={() => {
              refetchPayment()
              refetchVendors()
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