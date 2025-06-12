"use client"

import { Box, Text } from "@chakra-ui/react"
import Link from "next/link"

const Navbar = () => {
  return (
    <Box display='flex' gap={4} p={4} bg="gray.800" color="white" className="flex space-x-4 p-4 bg-gray-800 text-white">
      <Link href="/" className="hover:text-gray-400">
        <Text display={"inline"} _hover={{color: "gray.400"}}>Home</Text>
      </Link>
      <Link href="/products" className="hover:text-gray-400">
        <Text display={"inline"} _hover={{color: "gray.400"}}>Products</Text>
      </Link>
      <Link href="/vendors" className="hover:text-gray-400">
        <Text display={"inline"} _hover={{color: "gray.400"}}>Vendors</Text>
      </Link>
      <Link href="/actions/coming" className="hover:text-gray-400">
        <Text display={"inline"} _hover={{color: "gray.400"}}>Coming</Text>
      </Link>
      <Link href="/actions/payment" className="hover:text-gray-400">
        <Text display={"inline"} _hover={{color: "gray.400"}}>Payment</Text>
      </Link>
      <Link href="/stock" className="hover:text-gray-400">
        <Text display={"inline"} _hover={{color: "gray.400"}}>Stock</Text>
      </Link>
    </Box>
  )
}

export default Navbar