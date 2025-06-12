import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client from "@/lib/mongodb"
import Resend from "next-auth/providers/resend"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(client),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM
    })
  ],
  trustHost: true,
  callbacks: {
    authorized: async ({ auth }) => {
      // Logged in users are authenticated, otherwise redirect to login page
      return !!auth
    },
    signIn: async ({user}) => {
      const db = client.db("stock-management-next");
      const usersCollection = db.collection("allowed-users");
      const userExists = await usersCollection.findOne({ email: user.email });

      if (userExists) {return true}

      return false
    }
  }
})