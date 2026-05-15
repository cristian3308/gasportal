'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Fuel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        toast.error('Credenciales inválidas');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      toast.error('Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado izquierdo — Decorativo */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-zinc-950" />
        <div className="relative z-10 text-center max-w-md">
          <div className="bg-amber-500/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
            <Fuel size={40} className="text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">GasPortal</h1>
          <p className="text-zinc-400 text-lg">
            Plataforma integral de gestión, documentos y control financiero para tu estación de servicio.
          </p>
        </div>
      </div>

      {/* Lado derecho — Formulario */}
      <div className="flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Bienvenido de vuelta</h2>
            <p className="text-muted-foreground">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@estacion.com"
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-12"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white text-lg font-medium"
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">¿No tienes cuenta? </span>
              <a href="/register" className="text-amber-600 hover:underline font-medium">
                Regístrate con un código
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
