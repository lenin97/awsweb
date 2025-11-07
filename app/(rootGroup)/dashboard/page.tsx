import { getCurrentUser } from "aws-amplify/auth";
import { redirect } from "next/navigation";
import { Dashboard } from "./Dashboard";

export default async function DashboardPage() {
  try {
    const user = await getCurrentUser();
    return <Dashboard user={user} onDeleteAccount={async () => { /* delete logic here */ }} />;
  } catch {
    redirect("/auth/signin");
  }
}
