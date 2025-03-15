export interface productType {
    id: number,
    name: string,
    active: boolean
}

export interface vendorType {
    id: number,
    name: string
}

export interface comingActionType {
    type: 'coming',
    qty: number,
    price: number,
    date: string,
    notes: string,
    id: number,
    product: string,
    vendor: string
}

export interface darazGoingType {
    type: 'daraz',
    trackingNumber: string,
    orderNumber?: string,
    product: string,
    qty: number,
    purchasingPrice: number,
    sellingPrice?: number,
    date: string,
    notes: string,
    id: number,
    status: 'pending' | 'delivered' | 'failed'
}

export interface courierGoingType {
    type: 'courier'
    product: string,
    qty: number,
    purchasingPrice: number,
    sellingPrice: number,
    date: string,
    notes: string,
    id: number,
    status: 'pending' | 'delivered' | 'failed'
}

export interface hhcGoingType {
    type: 'hhc',
    orderNumber: string,
    product: string,
    qty: number,
    purchasingPrice: number,
    sellingPrice: number,
    date: string,
    notes: string,
    id: number,
    status: 'pending' | 'delivered' | 'failed'
}

export interface requiredValuesType {
    products?: boolean,
    vendors?: boolean,
    coming?: boolean,
    darazGoing?: boolean,
    courierGoing?: boolean,
    hhcGoing?: boolean,
    stock?: boolean
}
