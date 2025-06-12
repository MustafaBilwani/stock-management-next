export interface productType {
    id: string,
    name: string,
    active: boolean,
    stock: number
}

export interface vendorType {
    id: string,
    name: string,
    active: boolean,
    balance: number
}

export interface vendorPaymentType {
    type: 'payment',
    vendor: string,
    amount: number,
    date: string,
    notes: string,
    id: string,
    active: boolean,
    vendorName: string
}

export interface comingActionType {
    type: 'coming',
    qty: number,
    pricePerPcs: number,
    priceTotal: number,
    date: string,
    notes: string,
    id: string,
    product: string,
    vendor: string,
    active: boolean,
    productName: string,
    vendorName: string
}

// export interface darazGoingType {
//     type: 'daraz',
//     trackingNumber: string,
//     orderNumber?: string,
//     product: string,
//     qty: number,
//     purchasingPrice: number,
//     sellingPrice?: number,
//     date: string,
//     notes: string,
//     id: string,
//     status: 'pending' | 'delivered' | 'failed'
// }

// export interface courierGoingType {
//     type: 'courier'
//     product: string,
//     qty: number,
//     purchasingPrice: number,
//     sellingPrice: number,
//     date: string,
//     notes: string,
//     id: string,
//     status: 'pending' | 'delivered' | 'failed'
// }

// export interface hhcGoingType {
//     type: 'hhc',
//     orderNumber: string,
//     product: string,
//     qty: number,
//     purchasingPrice: number,
//     sellingPrice: number,
//     date: string,
//     notes: string,
//     id: string,
//     status: 'pending' | 'delivered' | 'failed'
// }

export interface requiredValuesType {
    products?: boolean,
    vendors?: boolean,
    coming?: boolean,
    darazGoing?: boolean,
    courierGoing?: boolean,
    hhcGoing?: boolean,
    payment?: boolean
}


export interface requiredValuesForComponentType {
    name: 'products' | 'vendors' | 'payment',
    function: () => void
}