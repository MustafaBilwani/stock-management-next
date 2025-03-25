"use client"

import { useSession, signIn, signOut } from "next-auth/react"

export default function Home() {

  const { data: session, status } = useSession()

  return (
    <>
        {status === "loading" ? (
          <div>Loading...</div>
        ) : status === "authenticated" ? (
          <>
            <div>Signed in as {session?.user?.email}</div><br/>
            <button onClick={() => {
              if (!window.confirm("Are you sure you want to sign out?")) return
              signOut()
            }}>Sign out</button>
          </>
        ) : (
          <>
            Not signed in <br />
            <button onClick={() => signIn()}>Sign in</button>
          </>
        )}
    </>
  )
}