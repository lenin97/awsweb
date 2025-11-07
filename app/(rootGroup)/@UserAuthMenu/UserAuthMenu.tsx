'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'aws-amplify/auth'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMediaQuery } from 'usehooks-ts'
import { getCurrentUser } from 'aws-amplify/auth';
import { Hub } from "aws-amplify/utils";

/*
interface UserAuthMenuProps {
  username: string | null;
  ts?: string;
}
*/

export default function UserAuthMenu() {
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const user = await getCurrentUser(); // Amplify Gen 2 user fetch :contentReference[oaicite:1]{index=1}
      setUsername(user.username ?? null);
    } catch {
      setUsername(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // The Hub listener is set up once to catch all auth events
    const unsubscribe = Hub.listen('auth', ({ payload: { event } }) => {
      const events = [
        'signedIn', 'signedOut',
        'tokenRefresh', 'tokenRefresh_failure',
        'signInWithRedirect', 'signInWithRedirect_failure',
        'signUp', 'autoSignIn'
      ];
      if (events.includes(event)) {
        loadUser(); // Refresh user on every relevant auth event :contentReference[oaicite:2]{index=2}
      }
    });
    return unsubscribe; // Clean up listener to avoid leaks :contentReference[oaicite:3]{index=3}
  }, [loadUser]);

  const handleSignOut = async () => {
    await signOut(); // Amplify Gen 2 sign‑out :contentReference[oaicite:4]{index=4}
    router.push('/'); // Redirect after sign out
  };

  if (loading) return null;  

  if (!username) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="rounded-full px-4"
          onClick={() => router.push('/auth/signin')}
        >
          Sign in
        </Button>
        <Button
          className="rounded-full px-4"
          onClick={() => router.push('/auth/signup')}
        >
          Sign up
        </Button>
      </div>
    )
  }

  const avatarLetter = username?.charAt(0).toUpperCase() || '?'

  return isDesktop ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-full px-4 py-2 flex items-center gap-2 group"
        >
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{avatarLetter}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">Account</span>
          <ChevronDown className="h-4 w-4 hidden sm:inline-block group-hover:rotate-180 transition-transform" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent asChild className="w-56 p-2 rounded-2xl border shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DropdownMenuItem onClick={() => router.push('/dashboard')}>
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/auth/change-password')}>
            Change Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            Sign out
          </DropdownMenuItem>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="rounded-full w-10 h-10">
          <Avatar>
            <AvatarFallback>{avatarLetter}</AvatarFallback>
          </Avatar>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 p-4 space-y-4">
        <p className="text-sm font-semibold">Account</p>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push('/dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => router.push('/auth/change-password')}
        >
          Change Password
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-start mt-4"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </SheetContent>
    </Sheet>
  )
}

/*
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserAuthMenu() {

  console.log("Rendering app/page.tsx UserAuthMenu************+++++++++++++++++++++++++++++++++********");

  const [user, setUser] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser()
      .then((user) => setUser(user))
      .catch(() => setUser(null));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    router.push("/");
  };

  const avatarLetter = user?.signInDetails?.loginId?.charAt(0).toUpperCase() || "?";

  return user ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full w-10 h-10">
          <Avatar>
            <AvatarFallback>{avatarLetter}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/auth/change-password")}>Change Password</DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => router.push("/auth/signin")}>Sign in</Button>
      <Button onClick={() => router.push("/auth/signup")}>Sign up</Button>
    </div>
  );
}
*/