import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Store } from "@/context/states";
import Navbar from "@/components/Navbar";
import { Provider } from "@/components/ui/provider";
import SessionProviderWrapper from "./SessionProviderWrapper";
import { redirect } from "next/navigation";
import { auth } from "./auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Management",
  description: "Stock Management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  let redirectPath = '';

  try {
    console.log('*************************')

    const session = await auth().catch((error) => {
      console.error('Authentication error:', error);
      return null;
    });

    console.log('session', session)

    if (!!session?.user) {
      return (
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <SessionProviderWrapper>
              <Store>
                <Provider>
                  <Navbar />
                  {children}
                </Provider>
              </Store>
            </SessionProviderWrapper>
          </body>
        </html>
      );
    } else {
      redirectPath = "/api/auth/signin";
    }
  } catch (err) {
    console.log('authorization failed', err)
    return <html>
      <body>
        <h1>Something went wrong</h1>
      </body>
    </html>
  } finally {
    if (redirectPath) {
      redirect(redirectPath);
    }
  }
}
