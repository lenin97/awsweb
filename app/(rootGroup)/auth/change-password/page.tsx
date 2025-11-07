'use client';

import { useState } from 'react';
import { updatePassword } from '@aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; // ✅ added

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const router = useRouter(); // ✅ added

  const handleChange = async () => {
    try {
      await updatePassword({ oldPassword, newPassword });
      toast.success('Password changed successfully!');
      //window.location.href = '/api/auth';
      router.replace('/api/auth');
    } catch (error) {
      console.error('Password change failed:', error);
      toast.error('Password change failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-3xl font-bold mb-6">Change Password</h1>
      <input
        type="password"
        placeholder="Old Password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        className="mb-2 w-full max-w-sm p-3 rounded border"
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="mb-4 w-full max-w-sm p-3 rounded border"
      />
      <Button className="w-full max-w-sm" onClick={handleChange}>
        Change Password
      </Button>
    </div>
  );
}
