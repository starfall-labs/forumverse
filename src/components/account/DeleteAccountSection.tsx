
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { deleteCurrentUserAccountAction } from '@/actions/threadActions';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/hooks/useTranslation';
import { ShieldAlert } from 'lucide-react';

interface DeleteAccountSectionProps {
  currentUserId: string;
}

export function DeleteAccountSection({ currentUserId }: DeleteAccountSectionProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!password) {
      setPasswordError(t('error.passwordRequiredForDelete', 'Password is required to delete account.'));
      return;
    }
    setPasswordError(null);
    setIsDeleting(true);

    const result = await deleteCurrentUserAccountAction(currentUserId, password);
    setIsDeleting(false);

    if (result.success) {
      toast({
        title: t('toast.accountDeletedTitle', 'Account Deleted'),
        description: t('toast.accountDeletedDescription', 'Your account has been successfully deleted.'),
      });
      setIsDialogOpen(false);
      logout(); // This will also redirect to login page via AuthContext logic
    } else {
      toast({
        title: t('toast.errorTitle', 'Error Deleting Account'),
        description: result.error || t('toast.accountDeletionFailedDescription', 'Could not delete your account.'),
        variant: 'destructive',
      });
      if (result.error?.toLowerCase().includes('password')) {
        setPasswordError(result.error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('accountPage.deleteWarning', 'This action is irreversible. All your data, including posts and comments, will be permanently removed or anonymized.')}
      </p>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full sm:w-auto">
            <ShieldAlert className="mr-2 h-4 w-4" />
            {t('accountPage.deleteAccountButton', 'Delete My Account')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('accountPage.deleteConfirmTitle', 'Are you absolutely sure?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('accountPage.deleteConfirmDescription', 'This action cannot be undone. This will permanently delete your account and remove your data from our servers. To confirm, please enter your current password.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4">
            <Label htmlFor="delete-confirm-password">{t('accountPage.currentPasswordLabel', 'Current Password')}</Label>
            <Input
              id="delete-confirm-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              placeholder="••••••••"
              disabled={isDeleting}
            />
            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPassword(''); setPasswordError(null); }} disabled={isDeleting}>{t('dialog.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || !password}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? t('accountPage.deletingButton', 'Deleting...') : t('accountPage.confirmDeleteButton', 'Yes, Delete My Account')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
