
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import type { User, Thread } from '@/lib/types';
import { getAllUsersForAdminAction, getThreadsAction } from '@/actions/threadActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Users, FileText, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.isAdmin) {
        router.replace('/'); // Redirect non-admins
      } else {
        const fetchData = async () => {
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
            // Handle error (e.g., show a toast)
          } finally {
            setIsLoadingData(false);
          }
        };
        fetchData();
      }
    }
  }, [user, authLoading, router]);

  if (authLoading || (!user && !authLoading) || isLoadingData && user?.isAdmin) {
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

  if (!user?.isAdmin) {
     // This case should ideally be handled by the redirect, but as a fallback:
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
                          <Badge variant="destructive">{t('adminPage.usersTable.adminRole', 'Admin')}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('adminPage.usersTable.userRole', 'User')}</Badge>
                        )}
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
    </div>
  );
}
