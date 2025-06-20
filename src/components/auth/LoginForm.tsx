
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: 'alice@example.com', // Pre-fill for demo
      password: 'password123', // Pre-fill for demo
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const success = await login(values.email, values.password);
    setIsLoading(false);

    if (success) {
      toast({ 
        title: t('toast.loginSuccessTitle', "Login Successful"), 
        description: t('toast.loginSuccessDescription', "Welcome back!") 
      });
      router.push('/');
      router.refresh(); 
    } else {
      toast({ 
        title: t('toast.loginFailedTitle', "Login Failed"), 
        description: t('toast.loginFailedDescription', "Invalid email or password. Try 'alice@example.com' with 'password123'."), 
        variant: "destructive" 
      });
      form.setError("email", { type: "manual", message: " " }); 
      form.setError("password", { type: "manual", message: "Invalid email or password." });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('loginPage.emailLabel', 'Email')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('loginPage.passwordLabel', 'Password')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>
                {t('loginPage.demoHint', 'For demo, try: alice@example.com / password123')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('loginPage.loggingInButton', 'Logging in...') : t('loginPage.loginButton', 'Log In')}
        </Button>
      </form>
    </Form>
  );
}

    