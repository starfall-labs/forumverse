
'use client';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">{t('loginPage.title', 'Welcome Back!')}</CardTitle>
          <CardDescription>{t('loginPage.description', 'Log in to continue to ForumVerse.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('loginPage.signupPrompt', "Don't have an account?")}{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              {t('loginPage.signupLink', 'Sign up')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    