"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    console.log('=== LOGIN SUBMIT START ===');
    console.log('Data:', data);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      console.log('Chamando login...');
      await login(data);
      console.log('Login bem-sucedido!');

      // Clear any previous error message
      setErrorMessage(null);

      toast({
        variant: 'success' as any,
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo de volta',
        duration: 3000,
      });

      // Role-based redirect com locale
      const user = useAuthStore.getState().user;
      // Detecta locale da URL
      const locale = window.location.pathname.split('/')[1] || 'pt';
      if (user?.role === 'SUPER_ADMIN') {
        router.push(`/${locale}/admin/warning-days`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    } catch (error: any) {
      console.error('=== ERRO NO LOGIN ===');
      console.error('Error object:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      const message = error?.response?.data?.message || 'Credenciais inválidas';
      setErrorMessage(message);
      
      console.log('[TOAST] Chamando toast...');
      const result = toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: message,
        duration: 8000,
      });
      console.log('[TOAST] Toast retornou:', result);
    } finally {
      console.log('=== LOGIN SUBMIT END ===');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.login')}
          </CardTitle>
          <CardDescription className="text-center">
            Entre com suas credenciais para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField>
                <FormLabel htmlFor="email">{t('auth.email')}</FormLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...form.register('email')}
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <FormMessage>{form.formState.errors.email.message}</FormMessage>
                )}
              </FormField>

              <FormField>
                <FormLabel htmlFor="password">{t('auth.password')}</FormLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...form.register('password')}
                  disabled={isLoading}
                />
                {form.formState.errors.password && (
                  <FormMessage>{form.formState.errors.password.message}</FormMessage>
                )}
              </FormField>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.login')}
              </Button>

              {errorMessage && (
                <p className="text-sm text-center" style={{ color: 'hsl(var(--destructive))' }}>
                  {errorMessage}
                </p>
              )}
          </Form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">{t('auth.dontHaveAccount')} </span>
            <Link href="/register" className="text-primary hover:underline font-medium">
              {t('auth.register')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
