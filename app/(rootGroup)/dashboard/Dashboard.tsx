import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent } from "@/components/ui/alert-dialog";
import type { AuthUser } from '@aws-amplify/auth';

export function Dashboard({ user, onDeleteAccount }: { user: AuthUser, onDeleteAccount: () => void }) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Welcome, {user?.signInDetails?.loginId || "User"} 👋</h1>
      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-2">Available Tool</h2>
          <p className="mb-4 text-muted-foreground">Use the AI-powered resume builder tool</p>
          <Button onClick={() => window.location.href = "/tool"}>Use Tool</Button>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <p>Are you sure you want to delete your account? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button variant="destructive" onClick={onDeleteAccount}>Delete</Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
