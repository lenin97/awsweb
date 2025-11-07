"use server";
//import { signOut } from "aws-amplify";
import { revalidatePath } from "next/cache";

export async function signOutAndRevalidate() {
  //await signOut();
  revalidatePath("/", "layout"); // clear cache for root layout and its slots
}
