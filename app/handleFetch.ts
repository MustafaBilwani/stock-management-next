'use client'

export async function handleFetch(requestedValue: 'coming' | 'products' | 'vendors' | 'payment') {

  try {

    const response = await fetch(`/api/get-all?requiredValue=${requestedValue}`);
    if (!response) throw new Error('unable to connect to backend');

    const data = await response.json();
    
    return data;
    
  } catch (error){
    return {success: false, error}
  }
}