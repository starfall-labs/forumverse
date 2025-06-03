
'use client';
import { SignupForm } from '@/components/auth/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function SignupPage() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">{t('signupPage.title', 'Create an Account')}</CardTitle>
          <CardDescription>{t('signupPage.description', 'Join ForumVerse today!')}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
           <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('signupPage.loginPrompt', 'Already have an account?')}{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              {t('signupPage.loginLink', 'Log in')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

    