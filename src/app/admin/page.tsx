
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
import { ShieldCheck, Users, FileText, AlertTriangle, Trash2, UserCog, UserCheck, UserX, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null); 

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    actionType: 'makeAdmin' | 'removeAdmin' | 'deleteUser' | null;
    targetUser: User | null;
  }>({ isOpen: false, actionType: null, targetUser: null });


  const fetchData = useCallback(async () => {
    if (currentUser?.isAdmin) { // Owner is also an admin
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
      if (!currentUser || !currentUser.isAdmin) { // Owner is also an admin
        router.replace('/'); 
      } else {
        fetchData();
      }
    }
  }, [currentUser, authLoading, router, fetchData]);

  const handleSetAdminStatus = async (targetUserId: string, makeAdmin: boolean) => {
    if (!currentUser?.id || !currentUser.isOwner) { // Only owner can change admin status
         toast({ title: t('toast.errorTitle', "Error"), description: t('error.ownerOnlyAction', "Only an owner can perform this action."), variant: "destructive" });
        setDialogState({ isOpen: false, actionType: null, targetUser: null });
        return;
    }
    setActionInProgress(targetUserId);
    const result = await setUserAdminStatusAction(targetUserId, makeAdmin, currentUser.id);
    setActionInProgress(null);
    if (result.success) {
      toast({ title: t('toast.successTitle', "Success"), description: makeAdmin ? t('toast.admin.userMadeAdmin', "User is now an admin.") : t('toast.admin.userRemovedAdmin', "User is no longer an admin.") });
      fetchData(); 
      if (targetUserId === currentUser.id && !makeAdmin) { // If owner demoted themselves (which should be prevented by action)
        router.refresh(); 
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
      fetchData(); 
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

  if (!currentUser?.isAdmin) { // Also covers !isOwner
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
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="users">
            <Users className="mr-2 h-5 w-5" />
            {t('adminPage.tabs.users', 'Manage Users')}
          </TabsTrigger>
          <TabsTrigger value="threads">
            <FileText className="mr-2 h-5 w-5" />
            {t('adminPage.tabs.threads', 'Manage Threads')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminPage.usersTable.title', 'All Users')}</CardTitle>
              <CardDescription>{t('adminPage.usersTable.description', 'Overview of all registered users.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] sm:w-[200px]">{t('adminPage.usersTable.username', 'Username')}</TableHead>
                    <TableHead className="w-[150px] sm:w-[200px]">{t('adminPage.usersTable.displayName', 'Display Name')}</TableHead>
                    <TableHead className="w-[200px] sm:w-[250px]">{t('adminPage.usersTable.email', 'Email')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('adminPage.usersTable.joined', 'Joined')}</TableHead>
                    <TableHead>{t('adminPage.usersTable.role', 'Role')}</TableHead>
                    <TableHead className="text-right min-w-[200px]">{t('adminPage.usersTable.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="max-w-[150px] sm:max-w-[200px] break-words">
                        <Link href={`/u/${u.username}`} className="hover:underline text-primary font-medium">
                            {u.username}
                        </Link>
                        </TableCell>
                      <TableCell className="max-w-[150px] sm:max-w-[200px] break-words">{u.displayName}</TableCell>
                      <TableCell className="max-w-[200px] sm:max-w-[250px] break-words">{u.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{u.createdAt ? formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }) : '-'}</TableCell>
                      <TableCell>
                        {u.isOwner ? (
                            <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap">
                                <Crown className="mr-1 h-3.5 w-3.5" />
                                {t('adminPage.usersTable.ownerRole', 'Owner')}
                            </Badge>
                        ) : u.isAdmin ? (
                          <Badge variant="default" className="bg-accent hover:bg-accent/90 whitespace-nowrap">
                            <UserCog className="mr-1 h-3.5 w-3.5" />
                            {t('adminPage.usersTable.adminRole', 'Admin')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="whitespace-nowrap">{t('adminPage.usersTable.userRole', 'User')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {currentUser.isOwner && !u.isOwner && ( // Only Owner can manage admin status of non-owners
                          u.isAdmin ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openConfirmationDialog('removeAdmin', u)}
                              disabled={actionInProgress === u.id || u.id === currentUser.id} // Owner cannot demote self here
                              title={u.id === currentUser.id ? t('adminPage.usersTable.cannotDemoteSelfTooltip', 'Owner cannot demote themselves.') : t('adminPage.usersTable.removeAdminButton', 'Remove Admin')}
                              className="whitespace-nowrap"
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
                              className="whitespace-nowrap"
                            >
                               <UserCheck className="mr-1 h-4 w-4" /> {t('adminPage.usersTable.makeAdminButtonShort', 'Promote')}
                            </Button>
                          )
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openConfirmationDialog('deleteUser', u)}
                          disabled={
                            actionInProgress === u.id || 
                            u.id === currentUser.id || // Cannot delete self
                            u.isOwner || // Cannot delete owner
                            (u.isAdmin && !currentUser.isOwner) // Admin cannot delete another admin
                          }
                          title={
                            u.id === currentUser.id ? t('adminPage.usersTable.cannotDeleteSelfTooltip', 'Cannot delete yourself.') 
                            : u.isOwner ? t('adminPage.usersTable.cannotDeleteOwnerTooltip', 'Cannot delete an owner.')
                            : (u.isAdmin && !currentUser.isOwner) ? t('adminPage.usersTable.ownerOnlyDeleteAdminTooltip', 'Only an owner can delete an admin.')
                            : t('adminPage.usersTable.deleteUserButton', 'Delete User')
                          }
                          className="whitespace-nowrap"
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

        <TabsContent value="threads">
          <Card>
            <CardHeader>
              <CardTitle>{t('adminPage.threadsTable.title', 'All Threads')}</CardTitle>
              <CardDescription>{t('adminPage.threadsTable.description', 'Overview of all created threads.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%] min-w-[200px]">{t('adminPage.threadsTable.titleHeader', 'Title')}</TableHead>
                    <TableHead className="w-[150px] sm:w-[200px]">{t('adminPage.threadsTable.author', 'Author')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('adminPage.threadsTable.createdAt', 'Created At')}</TableHead>
                    <TableHead className="text-center">{t('adminPage.threadsTable.comments', 'Comments')}</TableHead>
                    <TableHead className="text-center">{t('adminPage.threadsTable.score', 'Score')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threads.map((thread) => (
                    <TableRow key={thread.id}>
                      <TableCell className="max-w-xs md:max-w-md lg:max-w-lg break-words">
                        <Link href={`/t/${thread.id}`} className="hover:underline text-primary font-medium">
                          {thread.title}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[150px] sm:max-w-[200px] break-words">
                        <Link href={`/u/${thread.author.username}`} className="hover:underline">
                            {getAuthorDisplayName(thread.author)}
                        </Link>
                         {thread.author.id === 'deleted_user_placeholder' && <span className="text-xs text-muted-foreground ml-1">({t('adminPage.threadsTable.deletedUser', 'Deleted')})</span>}
                      </TableCell>
                      <TableCell className="hidden md:table-cell whitespace-nowrap">{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</TableCell>
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
                className={cn(buttonVariants({ variant: "default" }), dialogState.actionType === 'deleteUser' && buttonVariants({ variant: "destructive" }))}
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
