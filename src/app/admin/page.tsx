
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import type { User, Thread } from '@/lib/types';
import { getAllUsersForAdminAction, getThreadsAction, setUserAdminStatusAction, deleteUserAction } from '@/actions/threadActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Users, FileText, AlertTriangle, Trash2, UserCog, UserCheck, UserX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null); // userId for ongoing action

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    actionType: 'makeAdmin' | 'removeAdmin' | 'deleteUser' | null;
    targetUser: User | null;
  }>({ isOpen: false, actionType: null, targetUser: null });


  const fetchData = useCallback(async () => {
    if (currentUser?.isAdmin) {
      setIsLoadingData(true);
      try {
        const [fetchedUsers, fetchedThreads] = await Promise.all([
          getAllUsersForAdminAction(),
          getThreadsAction(),
        ]);
        setUsers(fetchedUsers);
        setThreads(fetchedThreads);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast({ title: t('toast.errorTitle', "Error"), description: t('toast.admin.errorFetchingData', "Could not fetch admin data."), variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
  }, [currentUser, toast, t]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || !currentUser.isAdmin) {
        router.replace('/'); 
      } else {
        fetchData();
      }
    }
  }, [currentUser, authLoading, router, fetchData]);

  const handleSetAdminStatus = async (targetUserId: string, makeAdmin: boolean) => {
    if (!currentUser?.id) return;
    setActionInProgress(targetUserId);
    const result = await setUserAdminStatusAction(targetUserId, makeAdmin, currentUser.id);
    setActionInProgress(null);
    if (result.success) {
      toast({ title: t('toast.successTitle', "Success"), description: makeAdmin ? t('toast.admin.userMadeAdmin', "User is now an admin.") : t('toast.admin.userRemovedAdmin', "User is no longer an admin.") });
      fetchData(); // Refresh data
      if (targetUserId === currentUser.id) { // If current user's status changed
        router.refresh(); // Force refresh to update AuthContext related UI
      }
    } else {
      toast({ title: t('toast.errorTitle', "Error"), description: result.error || t('toast.admin.errorUpdatingAdminStatus', "Could not update admin status."), variant: "destructive" });
    }
    setDialogState({ isOpen: false, actionType: null, targetUser: null });
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!currentUser?.id) return;
    setActionInProgress(targetUserId);
    const result = await deleteUserAction(targetUserId, currentUser.id);
    setActionInProgress(null);
    if (result.success) {
      toast({ title: t('toast.successTitle', "Success"), description: t('toast.admin.userDeleted', "User has been deleted.") });
      fetchData(); // Refresh data
    } else {
      toast({ title: t('toast.errorTitle', "Error"), description: result.error || t('toast.admin.errorDeletingUser', "Could not delete user."), variant: "destructive" });
    }
    setDialogState({ isOpen: false, actionType: null, targetUser: null });
  };

  const openConfirmationDialog = (actionType: 'makeAdmin' | 'removeAdmin' | 'deleteUser', targetUser: User) => {
    setDialogState({ isOpen: true, actionType, targetUser });
  };


  if (authLoading || (!currentUser && !authLoading) || (isLoadingData && currentUser?.isAdmin)) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <ShieldCheck className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold font-headline">{t('adminPage.title', 'Admin Dashboard')}</h1>
        </div>
        <Skeleton className="h-10 w-48 mb-4" /> 
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('adminPage.accessDeniedTitle', 'Access Denied')}</h1>
        <p className="text-muted-foreground">{t('adminPage.accessDeniedDescription', 'You do not have permission to view this page.')}</p>
        <Button onClick={() => router.push('/')} className="mt-6">{t('notFoundPage.homeButton', 'Return Home')}</Button>
      </div>
    );
  }
  
  const getAuthorDisplayName = (author: User) => author.displayName || author.username;


  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <ShieldCheck className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold font-headline">{t('adminPage.title', 'Admin Dashboard')}</h1>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="users">
            <Users className="mr-2 h-5 w-5" />
            {t('adminPage.tabs.users', 'Manage Users')}
          </TabsTrigger>
          <TabsTrigger value="threads">
            <FileText className="mr-2 h-5 w-5" />
            {t('adminPage.tabs.threads', 'Manage Threads')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminPage.usersTable.title', 'All Users')}</CardTitle>
              <CardDescription>{t('adminPage.usersTable.description', 'Overview of all registered users.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('adminPage.usersTable.username', 'Username')}</TableHead>
                    <TableHead>{t('adminPage.usersTable.displayName', 'Display Name')}</TableHead>
                    <TableHead>{t('adminPage.usersTable.email', 'Email')}</TableHead>
                    <TableHead>{t('adminPage.usersTable.joined', 'Joined')}</TableHead>
                    <TableHead>{t('adminPage.usersTable.role', 'Role')}</TableHead>
                    <TableHead className="text-right">{t('adminPage.usersTable.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link href={`/u/${u.username}`} className="hover:underline text-primary font-medium">
                            {u.username}
                        </Link>
                        </TableCell>
                      <TableCell>{u.displayName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : '-'}</TableCell>
                      <TableCell>
                        {u.isAdmin ? (
                          <Badge variant="default" className="bg-accent hover:bg-accent/90">
                            <UserCog className="mr-1 h-3.5 w-3.5" />
                            {t('adminPage.usersTable.adminRole', 'Admin')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">{t('adminPage.usersTable.userRole', 'User')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {u.isAdmin ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openConfirmationDialog('removeAdmin', u)}
                            disabled={actionInProgress === u.id || (currentUser.id === u.id && users.filter(usr => usr.isAdmin).length <= 1)}
                            title={ (currentUser.id === u.id && users.filter(usr => usr.isAdmin).length <= 1) ? t('adminPage.usersTable.cannotRemoveLastAdminTooltip', 'Cannot remove the last admin.') : t('adminPage.usersTable.removeAdminButton', 'Remove Admin')}
                          >
                            <UserX className="mr-1 h-4 w-4" /> {t('adminPage.usersTable.removeAdminButtonShort', 'Demote')}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openConfirmationDialog('makeAdmin', u)}
                            disabled={actionInProgress === u.id}
                            title={t('adminPage.usersTable.makeAdminButton', 'Make Admin')}
                          >
                             <UserCheck className="mr-1 h-4 w-4" /> {t('adminPage.usersTable.makeAdminButtonShort', 'Promote')}
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openConfirmationDialog('deleteUser', u)}
                          disabled={actionInProgress === u.id || currentUser.id === u.id}
                          title={currentUser.id === u.id ? t('adminPage.usersTable.cannotDeleteSelfTooltip', 'Cannot delete yourself.') : t('adminPage.usersTable.deleteUserButton', 'Delete User')}
                        >
                          <Trash2 className="mr-1 h-4 w-4" /> {t('adminPage.usersTable.deleteUserButtonShort', 'Delete')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && <p className="p-4 text-center text-muted-foreground">{t('adminPage.usersTable.noUsers', 'No users found.')}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threads" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminPage.threadsTable.title', 'All Threads')}</CardTitle>
              <CardDescription>{t('adminPage.threadsTable.description', 'Overview of all created threads.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">{t('adminPage.threadsTable.titleHeader', 'Title')}</TableHead>
                    <TableHead>{t('adminPage.threadsTable.author', 'Author')}</TableHead>
                    <TableHead>{t('adminPage.threadsTable.createdAt', 'Created At')}</TableHead>
                    <TableHead className="text-center">{t('adminPage.threadsTable.comments', 'Comments')}</TableHead>
                    <TableHead className="text-center">{t('adminPage.threadsTable.score', 'Score')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threads.map((thread) => (
                    <TableRow key={thread.id}>
                      <TableCell>
                        <Link href={`/t/${thread.id}`} className="hover:underline text-primary font-medium">
                          {thread.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/u/${thread.author.username}`} className="hover:underline">
                            {getAuthorDisplayName(thread.author)}
                        </Link>
                         {thread.author.id === 'deleted_user_placeholder' && <span className="text-xs text-muted-foreground ml-1">({t('adminPage.threadsTable.deletedUser', 'Deleted')})</span>}
                      </TableCell>
                      <TableCell>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</TableCell>
                      <TableCell className="text-center">{thread.commentCount}</TableCell>
                      <TableCell className="text-center">{thread.upvotes - thread.downvotes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {threads.length === 0 && <p className="p-4 text-center text-muted-foreground">{t('adminPage.threadsTable.noThreads', 'No threads found.')}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dialogState.isOpen && dialogState.targetUser && (
        <AlertDialog open={dialogState.isOpen} onOpenChange={(open) => !open && setDialogState({ isOpen: false, actionType: null, targetUser: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogState.actionType === 'makeAdmin' && t('adminPage.dialog.makeAdminTitle', 'Confirm Make Admin')}
                {dialogState.actionType === 'removeAdmin' && t('adminPage.dialog.removeAdminTitle', 'Confirm Remove Admin')}
                {dialogState.actionType === 'deleteUser' && t('adminPage.dialog.deleteUserTitle', 'Confirm Delete User')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogState.actionType === 'makeAdmin' && t('adminPage.dialog.makeAdminDescription', `Are you sure you want to make ${dialogState.targetUser.username} an admin?`)}
                {dialogState.actionType === 'removeAdmin' && t('adminPage.dialog.removeAdminDescription', `Are you sure you want to remove admin privileges from ${dialogState.targetUser.username}?`)}
                {dialogState.actionType === 'deleteUser' && t('adminPage.dialog.deleteUserDescription', `Are you sure you want to delete user ${dialogState.targetUser.username}? This action cannot be undone.`)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDialogState({ isOpen: false, actionType: null, targetUser: null })}>{t('adminPage.dialog.cancelButton', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (dialogState.actionType === 'makeAdmin' && dialogState.targetUser) handleSetAdminStatus(dialogState.targetUser.id, true);
                  if (dialogState.actionType === 'removeAdmin' && dialogState.targetUser) handleSetAdminStatus(dialogState.targetUser.id, false);
                  if (dialogState.actionType === 'deleteUser' && dialogState.targetUser) handleDeleteUser(dialogState.targetUser.id);
                }}
                className={dialogState.actionType === 'deleteUser' ? buttonVariants({ variant: "destructive" }) : ""}
              >
                {dialogState.actionType === 'deleteUser' ? t('adminPage.dialog.confirmDeleteButton', 'Delete') : t('adminPage.dialog.confirmButton', 'Confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
