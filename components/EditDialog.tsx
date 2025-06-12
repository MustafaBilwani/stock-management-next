import { Button, CloseButton, Dialog, Field, Heading, Input, NativeSelect, Portal } from '@chakra-ui/react'
import React, { useContext } from 'react'
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomContext } from '@/context/states';


const EditDialog = ({isEditing, rowData, handleEditComingAction} : {
  isEditing: boolean,
  rowData: undefined | {
    id: string,
    qty: number,
    pricePerPcs: number,
    vendor: string,
    product: string,
    date: string,
    notes: string
  }, 
  handleEditComingAction: (data: {
    qty: number,
    pricePerPcs: number,
    vendor: string,
    product: string,
    date: string,
    notes: string
  }) => void
  //   qty: number,
  //   pricePerPcs: number,
  //   vendor: string,
  //   product: string,
  //   date: string,
  //   notes: string
  // }) => void
}) => {

  const {
    optimisticProducts,
    optimisticVendors
  } = useContext(CustomContext);


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
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <Dialog.Root lazyMount open={isEditing}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Dialog Title</Dialog.Title>
            </Dialog.Header>
            {rowData ? (
              <form onSubmit={handleSubmit((data) => handleEditComingAction(data))}>
                <Dialog.Body>
                  {JSON.stringify(rowData)}
                  <Heading size={'2xl'}>Edit</Heading>

                <Field.Root invalid={!!errors.qty?.message} mb={"2"}>
                  <Field.Label>Quantity</Field.Label>
                  <Input 
                    {...register('qty', { valueAsNumber: true })} 
                    border={"4"}
                    borderColor={"black"}
                    padding={2}
                    type="number"
                    defaultValue={rowData.qty}
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
                    defaultValue={rowData.pricePerPcs}
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
                      defaultValue={rowData.vendor}
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
                      defaultValue={rowData.product}
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
                    defaultValue={rowData.date}
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
                    defaultValue={rowData.notes}
                  />
                  <Field.ErrorText>{errors.notes?.message && errors.notes?.message}</Field.ErrorText>
                </Field.Root>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </Dialog.ActionTrigger>
                  <Button type="submit">Save</Button>
                </Dialog.Footer>
              </form>
            ) : (
              <Dialog.Body>No data</Dialog.Body>
            )}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

export default EditDialog