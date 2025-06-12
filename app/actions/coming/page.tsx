'use client'

import { CustomContext } from "@/context/states";
import React, { startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { handleFetch } from "../../handleFetch";
import { Toaster, toaster } from "@/components/ui/toaster";
import { Accordion, Box, Button, Field, Heading, Input, Menu, NativeSelect, Portal, Span } from "@chakra-ui/react";
import { IoMdMenu } from "react-icons/io";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { comingActionType } from "@/app/types";
import { addComingAction, deleteComingAction, editComingAction, restoreComingAction } from "@/app/server-action/comingActions";
import { AllCommunityModule, ColDef, ICellRendererParams, IFilterOptionDef, ModuleRegistry, RowClassParams, RowValueChangedEvent } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { SetFilterModule } from 'ag-grid-enterprise'
import EditDialog from "@/components/EditDialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Page = () => {
  
  const router = useRouter()
  const {status} = useSession()
  const formSchema = z.object({
    qty: z.number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number and is required",
    }).positive()
      .int('Cannot be Decimal'),
  
    pricePerPcs: z.number({
      required_error: "Price is required",
      invalid_type_error: "Price must be a number and is required",
    }).positive(),
  
    vendor: z.string().min(1, "Vendor is required"),
  
    product: z.string().min(1, "Product is required"),
  
    date: z.string().min(1, "Date is required"),
    notes: z.string()
  });

  const {
		optimisticProducts,
		setProducts,
    setVendors,
    optimisticVendors,
		fetched,
    optimisticComingActionArray,
    setComingActionArray,
    setOptimisticComingActionArray
	} = useContext(CustomContext);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });
	const [Error, setError] = useState(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const gridRef = useRef<AgGridReact<comingActionType>>(null);

  // Register all Community features -- to be edited
  ModuleRegistry.registerModules([AllCommunityModule, SetFilterModule]);

  useEffect(() => {
    requiredValuesForComponent.forEach((value) => {
      if (status === 'authenticated' && !fetched.current[value.name]) {
        value.function();
      }
    })
	}, [status])

  const fetchProducts = useCallback(async () => {
		const result = await handleFetch('products');
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

  const fetchVendors = useCallback(async () => {
		const result = await handleFetch("vendors");
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

  const requiredValuesForComponent: {
    name: 'products' | 'vendors' | 'coming',
    function: () => void
  }[] = [
    {name: 'products', function: () => {fetchProducts()}},
    {name: 'vendors', function: () => {fetchVendors()}},
    {name: 'coming', function: () => {fetchComing()}}
  ]

  async function handleEditComingAction(
    newComingAction: Omit<comingActionType, 'id' | 'type' | 'active' | 'productName' | 'vendorName' | 'priceTotal'>
  ) {

    const oldComingAction = optimisticComingActionArray.find(action => action.id === editingRowId!);

    if (!oldComingAction) return;

    const processedNewComingAction: comingActionType = {
      ...newComingAction,
      id: editingRowId!,
      type: 'coming',
      active: oldComingAction.active,
      priceTotal: newComingAction.pricePerPcs * newComingAction.qty,
      productName: optimisticProducts.find(product => product.id === newComingAction.product)?.name || '',
      vendorName: optimisticVendors.find(vendor => vendor.id === newComingAction.vendor)?.name || ''
    }

    // reset()

    startTransition(() => {
      setOptimisticComingActionArray((prev) =>
        prev.map(action => action.id === processedNewComingAction.id ? processedNewComingAction : action)
      );
    });

    const data = new Promise<void>(async (resolve, reject) => {
      const response = await editComingAction({newComingAction: processedNewComingAction, oldComingAction: oldComingAction!});
      setIsEditing(false)
      setEditingRowId(null)
      if (response.success) {
        setComingActionArray(prev =>
          prev.map(action =>
            action.id === processedNewComingAction.id ? processedNewComingAction : action
          )
        );
        // setProducts(prev =>
        //   prev.map(product =>
        //     product.id === processedNewComingAction.product
        //       ? {
        //           ...product,
        //           stock:
        //             product.id === oldComingAction?.product
        //               ? product.stock - oldComingAction?.qty + processedNewComingAction.qty
        //               : product.stock,
        //         }
        //       : product
        //   )
        // );
        if (oldComingAction.active) { 
          setProducts(p =>
              p.map(prod => {
              if (prod.id === oldComingAction.product && prod.id === processedNewComingAction.product) {
                return { ...prod, stock: prod.stock - oldComingAction.qty + processedNewComingAction.qty };
              }
              if (prod.id === oldComingAction.product) { return { ...prod, stock: prod.stock - oldComingAction.qty }; }
              if (prod.id === processedNewComingAction.product) { return { ...prod, stock: prod.stock + processedNewComingAction.qty }; }
          
              return prod;
            })
          );
        
          setVendors(prev =>
            prev.map(vendor => {
              if (vendor.id === oldComingAction.vendor && vendor.id === processedNewComingAction.vendor) {
                return { ...vendor, balance: vendor.balance - oldComingAction.priceTotal + processedNewComingAction.priceTotal };
              }
              if (vendor.id === oldComingAction.vendor) return {...vendor, balance: vendor.balance - oldComingAction.priceTotal}; // subtract from debit
              if (vendor.id === processedNewComingAction.vendor) return {...vendor, balance: vendor.balance + processedNewComingAction.priceTotal}; // add to debit
              return vendor;
            })
          );
        }
        resolve()
      } else {
        console.log(response.error)
        reject()
      }
    })

    toaster.promise(data, {
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

    const processedNewComingAction: comingActionType = {
      ...newComingAction,
      id: Date.now().toString(),
      type: 'coming',
      active: true,
      priceTotal: newComingAction.pricePerPcs * newComingAction.qty,
      productName: optimisticProducts.find(product => product.id === newComingAction.product)?.name || '',
      vendorName: optimisticVendors.find(vendor => vendor.id === newComingAction.vendor)?.name || ''
    }

    reset()

    startTransition(() => {
      setOptimisticComingActionArray((prev) =>
        [...prev, processedNewComingAction]
      );
    });

    const data = new Promise<void>(async (resolve, reject) => {
      const response = await addComingAction(processedNewComingAction);
      if (response.success) {
        setComingActionArray(prev => [...prev, processedNewComingAction]);
        setProducts(prev =>
          prev.map(product =>
            product.id === processedNewComingAction.product
              ? { ...product, stock: product.stock + processedNewComingAction.qty }
              : product
          )
        );
        setVendors(prev =>
          prev.map(vendor =>
            vendor.id === processedNewComingAction.vendor 
            ? { ...vendor, balance: vendor.balance + processedNewComingAction.priceTotal } // add in debit 
            : vendor
          )
        );
        resolve()
      } else {
        console.log(response.error)
        reject()
      }
    })

    toaster.promise(data, {
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

    startTransition(() => {
      setOptimisticComingActionArray((prev) =>
        prev.map((action) =>
          action.id === id ? { ...action, active: false } : action
        )
      );
    });

    const data = new Promise<void>(async (resolve, reject) => {
      const currentAction = optimisticComingActionArray.find(action => action.id === id);
      if (!currentAction) return;
      const response = await deleteComingAction(currentAction);
      if (response.success) {
        setComingActionArray((prev) =>
          prev.map((action) =>
            action.id === id ? { ...action, active: false } : action
          )
        );
        setProducts(prev =>
          prev.map(product =>
            product.id === currentAction.product
              ? { ...product, stock: product.stock - currentAction.qty }
              : product
          )
        );
        setVendors(prev =>
          prev.map(vendor =>
            vendor.id === currentAction.vendor 
            ? { ...vendor, balance: vendor.balance - currentAction.priceTotal } // subtract from debit
            : vendor
          )
        );
        resolve();
      } else {
        console.log(response?.error);
        reject()
      }
    });

    toaster.promise(data, {
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

    startTransition(() => {
      setOptimisticComingActionArray((prev) =>
        prev.map((action) =>
          action.id === id ? { ...action, active: true } : action
        )
      );
    });

    const data = new Promise<void>(async (resolve, reject) => {
      const currentAction = optimisticComingActionArray.find(action => action.id === id);
      if (!currentAction) return;
      const response = await restoreComingAction(currentAction);
      if (response.success) {
        setComingActionArray((prev) =>
          prev.map((action) =>
            action.id === id ? { ...action, active: true } : action
          )
        );
        setProducts(prev =>
          prev.map(product =>
            product.id === currentAction.product
              ? { ...product, stock: product.stock + currentAction.qty }
              : product
          )
        );
        setVendors(prev =>
          prev.map(vendor =>
            vendor.id === currentAction.vendor 
            ? { ...vendor, balance: vendor.balance + currentAction.priceTotal } // add to debit
            : vendor
          )
        );
        resolve();
      } else {
        console.log(response?.error);
        reject()
      }
    });

    toaster.promise(data, {
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

  const colDefs: ColDef<comingActionType, any>[] = [
    {field: 'qty'},
    {field: 'pricePerPcs', headerName: 'Price per Pcs'},
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
                    {params.data?.active ? 'Delete' : 'Restore' }
                  </Menu.Item>
                  <Menu.Item value="" onClick={() => onBtStartEditing(rowId)}>
                    Edit
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
      )},
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

  const onBtStopEditing = useCallback(() => {
    setEditingRowId(null)
    setIsEditing(false)
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

  // suppressKeyboardEvent: (params) => {
  //   const { editing, event } = params;
  //   if (editing) return false;
    
  //   // Allow navigation and control keys that should not start editing.
  //   const allowedKeys = [
  //     "ArrowLeft",
  //     "ArrowRight",
  //     "ArrowUp",
  //     "ArrowDown",
  //     "Tab",
  //     "Escape",
  //     "PageUp",
  //     "PageDown",
  //     "Home",
  //     "End"
  //   ];
    
  //   if (allowedKeys.includes(event.key)) {
  //     return false;
  //   }
    
  //   // Also explicitly check for keys that can start editing.
  //   // If the key is a single printable character, it would normally trigger editing.
  //   if (event.key.length === 1) {
  //     return true;
  //   }
    
  //   // Additionally, suppress Enter and F2, which are known to start editing.
  //   if (event.key === "Enter" || event.key === "F2") {
  //     return true;
  //   }
    
  //   return false;
  // }

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
                      {optimisticVendors.filter(vendor => vendor.active).map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator/>
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
                      {optimisticProducts.filter(product => product.active).map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator/>
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
                
                <Button type="submit" disabled={requiredValuesForComponent.some(value => !fetched.current[value.name])} >Submit</Button>
              </form>
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      </Accordion.Root>

      <Box display={"flex"} flexDirection={"column"} h='90vh'>
        {requiredValuesForComponent.every(value => fetched.current[value.name]) ? (
          <>
            <Box mb={"4"} p={"2"}>
              <Heading size={'3xl'} mt={"4"} mr={'4'} display={"inline-block"}>Data</Heading>
              <Button mb={'2'} variant={'outline'} display={"inline-block"}
                onClick={() => gridRef.current!.api.exportDataAsCsv()}>
                Download CSV export file
              </Button>
              <Button mb={'2'} variant={'outline'} display={"inline-block"}
                onClick={() => onBtStartEditing('1743917415499')}>
                Start Editing
              </Button>
              <Button mb={'2'} variant={'outline'} display={"inline-block"}
                onClick={onBtStopEditing}>
                Stop Editing
              </Button>
              {/* <Button variant={'outline'} onClick={() => console.log(gridRef.current!.api.getDataAsCsv())}>
                Show CSV export content text</Button> */}
            </Box>

            <AgGridReact
              ref={gridRef}
              columnDefs={colDefs}
              rowData={optimisticComingActionArray}
              suppressDragLeaveHidesColumns
              getRowClass={getRowClass}
              initialState={initialState}
              onRowValueChanged={onRowValueChanged}
              defaultColDef={defaultColDef}
            />
            
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
      {isEditing && ( 
        <EditDialog
          isEditing={isEditing}
          rowData={optimisticComingActionArray.find(action => action.id === editingRowId)}
          handleEditComingAction={handleEditComingAction}
        />
      )}
    </Box>
  );
}

export default Page