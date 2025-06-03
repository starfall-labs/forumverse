
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, PlusCircle, UserCircle2, Languages, User as UserIcon, Bell, ShieldCheck, Settings, Menu } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useContext, useEffect, useState } from 'react';
import { LanguageContext, SUPPORTED_LANGUAGES } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getUnreadNotificationCountAction } from '@/actions/threadActions';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export function Navbar() {
  const { user, logout, isLoading } = useAuth();
  const langContext = useContext(LanguageContext);
  const { t } = useTranslation();
  const pathname = usePathname(); 

  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUnreadCount() {
      if (user) {
        const count = await getUnreadNotificationCountAction(user.id);
        setUnreadCount(count);
      } else {
        setUnreadCount(0);
      }
    }
    if (user) {
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

  const commonUserMenuItems = (isSheet = false) => (
    <>
      <DropdownMenuItem asChild>
        <SheetClose asChild={isSheet}>
          <Link href={`/u/${user!.username}`}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>{t('navbar.myProfile', 'My Profile')}</span>
          </Link>
        </SheetClose>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <SheetClose asChild={isSheet}>
          <Link href="/account">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('navbar.accountSettings', 'Account Settings')}</span>
          </Link>
        </SheetClose>
      </DropdownMenuItem>
      {user!.isAdmin && (
        <DropdownMenuItem asChild>
          <SheetClose asChild={isSheet}>
            <Link href="/admin">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>{t('navbar.adminPage', 'Admin Page')}</span>
            </Link>
          </SheetClose>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => { logout(); if(isSheet) setIsMobileMenuOpen(false); }}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>{t('navbar.logout', 'Log out')}</span>
      </DropdownMenuItem>
    </>
  );
  
  const languageSwitcherContent = (
    <DropdownMenuRadioGroup value={currentLanguage} onValueChange={(value) => { setLanguage(value); setIsMobileMenuOpen(false); }}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <DropdownMenuRadioItem key={lang.code} value={lang.code}>
          {lang.name}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-2 md:mr-6 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <span className="font-bold text-xl font-headline">ForumVerse</span>
        </Link>

        <nav className="flex-1 items-center space-x-4 hidden md:flex">
          {/* Future nav items can go here */}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-3">
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
              {languageSwitcherContent}
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
                {commonUserMenuItems()}
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

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center space-x-2 ml-auto">
          <Link href="/submit" passHref>
            <Button variant="outline" size="icon" aria-label={t('navbar.createPost', 'Create Thread')}>
              <PlusCircle className="h-5 w-5" />
            </Button>
          </Link>
           {user && (
            <Link href="/notifications" passHref>
              <Button variant="ghost" size="icon" className="relative" aria-label={t('navbar.notifications', 'Notifications')}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[280px] sm:w-[320px]">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-3">
                {isLoading ? (
                   <div className="h-10 rounded-md bg-muted animate-pulse" />
                ) : user ? (
                  <>
                    <div className="flex items-center space-x-3 px-2 py-1.5">
                       <Link href={`/u/${user.username}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} alt={getUserDisplayName()} data-ai-hint="user avatar" />
                          <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                        </Avatar>
                       </Link>
                       <div className="flex flex-col">
                         <Link href={`/u/${user.username}`} className="hover:underline" onClick={() => setIsMobileMenuOpen(false)}>
                            <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                         </Link>
                         <Link href={`/u/${user.username}`} className="hover:underline" onClick={() => setIsMobileMenuOpen(false)}>
                            <p className="text-xs leading-none text-muted-foreground">u/{user.username}</p>
                         </Link>
                       </div>
                    </div>
                    <Separator />
                    {commonUserMenuItems(true)}
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link href="/login" passHref>
                        <Button variant="outline" className="w-full justify-start">
                          <LogIn className="mr-2 h-4 w-4" /> {t('navbar.login', 'Login')}
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/signup" passHref>
                        <Button className="w-full justify-start">
                          <UserCircle2 className="mr-2 h-4 w-4" /> {t('navbar.signup', 'Sign Up')}
                        </Button>
                      </Link>
                    </SheetClose>
                  </>
                )}
                <Separator />
                <div>
                  <p className="px-2 py-1.5 text-sm font-semibold">{t('navbar.selectLanguage', 'Select Language')}</p>
                  <div className="mt-1 flex flex-col space-y-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                       <Button 
                         key={lang.code} 
                         variant={currentLanguage === lang.code ? "secondary" : "ghost"}
                         className="w-full justify-start"
                         onClick={() => { setLanguage(lang.code); setIsMobileMenuOpen(false); }}
                       >
                         {lang.name}
                       </Button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

