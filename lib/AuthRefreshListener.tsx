// components/AuthChangeRefresher.tsx
"use client";

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

Amplify.configure(outputs,{ ssr: true });
//Amplify.configure(outputs);

export default function AuthRefreshListener() {
 
  return null;
}

/*
// app/components/AuthChangeRefresher.tsx
"use client";

import { Hub } from "aws-amplify";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthChangeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const sub = Hub.listen("auth", ({ payload: { event } }) => {
      if (event === "signIn" || event === "signOut") {
        router.refresh(); // triggers server re-render
      }
    });

    return () => sub();
  }, [router]);

  return null;
}
*/
/*
// components/AuthChangeRefresher.tsx
"use client";

import { Hub } from "aws-amplify";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthChangeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const listener = ({ payload: { event } }) => {
      if (
        event === "signIn" ||
        event === "signOut" ||
        event === "tokenRefresh" ||
        event === "signUp" ||
        event === "autoSignIn"
      ) {
        router.refresh(); // re-executes server components
      }
    };

    const unsubscribe = Hub.listen("auth", listener);
    return () => unsubscribe(); // avoid leaks
  }, [router]);

  return null;
}
*/

/*
// app/dashboard/layout.tsx
import AuthChangeRefresher from "@/components/AuthChangeRefresher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthChangeRefresher />
      {children}
    </>
  );
}
*/

/*
// app/dashboard/page.tsx
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // ⬅ disables static rendering

export default async function DashboardPage() {
  const userSession = cookies().get("session")?.value;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">
        {userSession ? "✅ Logged in session" : "❌ Not signed in"}
      </p>
    </div>
  );
}
*/