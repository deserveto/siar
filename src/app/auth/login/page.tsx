'use client';

/**
 * SIAR Login Page
 * Authentication with email/password credentials
 */

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GradientBackground } from '@/components/ui/gradient-background';
import { ThemeToggle } from '@/components/theme-toggle';
import { AccentPicker } from '@/components/accent-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                toast({
                    title: 'Login Gagal',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Login Berhasil',
                    description: 'Selamat datang di SIAR!',
                    variant: 'success',
                });
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Terjadi kesalahan. Silakan coba lagi.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Gradient Background */}
            <GradientBackground />

            {/* Theme Controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <AccentPicker />
                <ThemeToggle />
            </div>

            {/* Login Form */}
            <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-background/80 backdrop-blur-xl shadow-2xl animate-scale-in" style={{ borderColor: 'var(--accent-border)', boxShadow: '0 10px 40px -10px var(--accent-bg)' }}>
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto mb-4">
                            <h1
                                className="text-4xl font-bold bg-clip-text text-transparent font-offbit"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, var(--accent-primary), var(--accent-hover))'
                                }}
                            >
                                SIAR
                            </h1>
                        </div>
                        <CardTitle className="text-2xl">Masuk ke Akun</CardTitle>
                        <CardDescription>
                            Silakan masuk dengan akun karyawan Anda
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@ramayana.co.id"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    required
                                    disabled={isLoading}
                                    className="bg-background/50 transition-all duration-200 focus:scale-[1.02]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    required
                                    disabled={isLoading}
                                    className="bg-background/50 transition-all duration-200 focus:scale-[1.02]"
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                variant="neon"
                                size="lg"
                                className="w-full transition-all duration-300 hover:scale-[1.02]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-4 h-4 mr-2" />
                                        Masuk
                                    </>
                                )}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                Belum punya akun?{' '}
                                <Link
                                    href="/auth/register"
                                    style={{ color: 'var(--accent-primary)' }}
                                    className="hover:underline underline-offset-4 transition-all hover:opacity-80"
                                >
                                    Daftar di sini
                                </Link>
                            </div>

                            <Link href="/" className="w-full">
                                <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground transition-colors">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Kembali ke Beranda
                                </Button>
                            </Link>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* CSS Animation */}
            <style jsx global>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out forwards;
        }
      `}</style>
        </div>
    );
}
