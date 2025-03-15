'use client'

import { requiredValuesType } from "./types";

export async function handleFetchAll(requiredValues: requiredValuesType) {

  try {

    const response = await fetch(`/api/get-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requiredValues
      })
    });
    if (!response) throw new Error('unable to connect to backend');

    const data = await response.json();
    
    return data;
    
  } catch (error){
    return {success: false, error}
  }
}