"use client"

import { useState } from 'react';
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

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  tenantName: z.string().min(2, 'Nome da empresa deve ter no mínimo 2 caracteres'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      tenantName: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    console.log('=== REGISTER SUBMIT START ===');
    console.log('Data:', data);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      console.log('Chamando register...');
      await register(data);
      console.log('Registro bem-sucedido!');
      
      toast({
        variant: 'success' as any,
        title: 'Conta criada com sucesso!',
        description: 'Bem-vindo ao BriefAI!',
        duration: 3000,
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('=== ERRO NO REGISTRO ===');
      console.error('Error object:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      
      // message pode ser um array de erros ou uma string
      const messageData = error?.response?.data?.message;
      console.log('Message data type:', Array.isArray(messageData) ? 'Array' : typeof messageData);
      console.log('Message data content:', messageData);
      
      const message = Array.isArray(messageData) 
        ? messageData.join(', ')
        : messageData || 'Erro ao criar conta. Tente novamente.';
      
      setErrorMessage(message);
      
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: message,
        duration: 8000,
      });
    } finally {
      console.log('=== REGISTER SUBMIT END ===');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.register')}
          </CardTitle>
          <CardDescription className="text-center">
            Crie sua conta e comece a usar o BriefAI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField>
              <FormLabel htmlFor="name">{t('auth.name')}</FormLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  {...form.register('name')}
                  disabled={isLoading}
                />
                {form.formState.errors.name && (
                  <FormMessage>{form.formState.errors.name.message}</FormMessage>
                )}
              </FormField>

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

              <FormField>
                <FormLabel htmlFor="tenantName">{t('auth.tenantName')}</FormLabel>
                <Input
                  id="tenantName"
                  type="text"
                  placeholder="Nome da sua empresa"
                  {...form.register('tenantName')}
                  disabled={isLoading}
                />
                {form.formState.errors.tenantName && (
                  <FormMessage>{form.formState.errors.tenantName.message}</FormMessage>
                )}
              </FormField>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('common.loading') : t('auth.register')}
              </Button>

              {errorMessage && (
                <p className="text-sm text-center" style={{ color: 'hsl(var(--destructive))' }}>
                  {errorMessage}
                </p>
              )}
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">{t('auth.alreadyHaveAccount')} </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t('auth.login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
