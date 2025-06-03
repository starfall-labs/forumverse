
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, PlusCircle, UserCircle2, Languages, User as UserIcon, Bell, ShieldCheck, Settings } from 'lucide-react'; // Added Settings
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useContext, useEffect, useState } from 'react';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getUnreadNotificationCountAction } from '@/actions/threadActions';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const langContext = useContext(LanguageContext);
  const { t } = useTranslation();
  const pathname = usePathname(); 

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnreadCount() {
      if (user) {
        const count = await getUnreadNotificationCountAction(user.id);
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    }
    if (user) { // Only fetch if user is defined
        fetchUnreadCount();
    }
  }, [user, pathname]);


  if (!langContext) {
    return null; 
  }
  const { currentLanguage, setLanguage } = langContext;

  const getAvatarFallback = () => {
    if (!user) return '';
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.username) return user.username.charAt(0).toUpperCase();
    return user.email.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.displayName || user.username;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span className="font-bold text-xl font-headline">ForumVerse</span>
        </Link>

        <nav className="flex flex-1 items-center space-x-4">
          {/* Future nav items can go here */}
        </nav>

        <div className="flex items-center space-x-3">
          <Link href="/submit" passHref>
            <Button variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('navbar.createPost', 'Create Thread')}
            </Button>
          </Link>

          {user && (
            <Link href="/notifications" passHref>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="sr-only">{t('navbar.notifications', 'Notifications')}</span>
              </Button>
            </Link>
          )}


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Languages className="h-4 w-4" />
                <span className="sr-only">{t('navbar.changeLanguage', 'Change language')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('navbar.selectLanguage', 'Select Language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currentLanguage} onValueChange={setLanguage}>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenuRadioItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} alt={getUserDisplayName()} data-ai-hint="user avatar" />
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      <Link href={`/u/${user.username}`} className="hover:underline">
                        {getUserDisplayName()}
                      </Link>
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                       <Link href={`/u/${user.username}`} className="hover:underline">
                        u/{user.username}
                       </Link>
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/u/${user.username}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>{t('navbar.myProfile', 'My Profile')}</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/account">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('navbar.accountSettings', 'Account Settings')}</span>
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>{t('navbar.adminPage', 'Admin Page')}</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('navbar.logout', 'Log out')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button variant="ghost">
                  <LogIn className="mr-2 h-4 w-4" /> {t('navbar.login', 'Login')}
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button>
                  <UserCircle2 className="mr-2 h-4 w-4" /> {t('navbar.signup', 'Sign Up')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
