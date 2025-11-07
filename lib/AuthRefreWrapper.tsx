// app/components/ClientWrapper.tsx
"use client";
import AuthChangeRefresher from '@/lib/AuthRefreshListener';


export default function AuthRefreWrapper() {
  return <AuthChangeRefresher />;
}
