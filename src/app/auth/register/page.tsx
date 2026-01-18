'use client';

/**
 * SIAR Registration Page
 * New user registration with auto-generated employee ID
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GradientBackground } from '@/components/ui/gradient-background';
import { ThemeToggle } from '@/components/theme-toggle';
import { AccentPicker } from '@/components/accent-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, ArrowLeft, Info } from 'lucide-react';

// Division options with codes
const DIVISIONS = [
    { name: 'Underwriting', code: 'UW' },
    { name: 'Claims', code: 'CL' },
    { name: 'Finance', code: 'FN' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Marketing', code: 'MK' },
    { name: 'Operations', code: 'OP' },
    { name: 'Legal', code: 'LG' },
];

const BRANCHES = [
    'Jakarta Pusat',
    'Jakarta Selatan',
    'Surabaya',
    'Bandung',
    'Medan',
    'Makassar',
    'Semarang',
    'Yogyakarta',
    'Denpasar',
    'Palembang',
];

export default function RegisterPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [generatedId, setGeneratedId] = useState('');
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        email: '',
        divisi: '',
        cabang: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Generate employee ID when division changes
    useEffect(() => {
        if (formData.divisi) {
            const division = DIVISIONS.find((d) => d.name === formData.divisi);
            if (division) {
                // Generate random 3-digit number
                const randomNum = Math.floor(100 + Math.random() * 900);
                setGeneratedId(`${division.code}-${randomNum}`);
            }
        }
    }, [formData.divisi]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            toast({
                title: 'Error',
                description: 'Password dan konfirmasi password tidak sama',
                variant: 'destructive',
            });
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            toast({
                title: 'Error',
                description: 'Password harus minimal 6 karakter',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nomor_id: generatedId,
                    nama_lengkap: formData.nama_lengkap,
                    email: formData.email,
                    divisi: formData.divisi,
                    cabang: formData.cabang,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registrasi gagal');
            }

            toast({
                title: 'Registrasi Berhasil',
                description: `Akun Anda telah dibuat dengan ID: ${generatedId}. Silakan login.`,
                variant: 'success',
            });

            router.push('/auth/login');
        } catch (error) {
            toast({
                title: 'Registrasi Gagal',
                description: error instanceof Error ? error.message : 'Terjadi kesalahan',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Gradient Background */}
            <GradientBackground />

            {/* Theme Controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <AccentPicker />
                <ThemeToggle />
            </div>

            {/* Registration Form */}
            <div className="relative z-20 min-h-screen flex items-center justify-center p-4 py-8">
                <Card className="w-full max-w-lg bg-background/80 backdrop-blur-xl shadow-2xl animate-scale-in" style={{ borderColor: 'var(--accent-border)', boxShadow: '0 10px 40px -10px var(--accent-bg)' }}>
                    <CardHeader className="text-center space-y-2">
                        <div className="mx-auto mb-2">
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent font-offbit"
                                style={{
                                    backgroundImage: 'linear-gradient(to right, var(--accent-primary), var(--accent-hover))'
                                }}
                            >
                                SIAR
                            </h1>
                        </div>
                        <CardTitle className="text-xl">Daftar Akun Baru</CardTitle>
                        <CardDescription>
                            Lengkapi data diri Anda untuk membuat akun SIAR
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {/* Nama Lengkap */}
                            <div className="space-y-2">
                                <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
                                <Input
                                    id="nama_lengkap"
                                    placeholder="Nama lengkap Anda"
                                    value={formData.nama_lengkap}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nama_lengkap: e.target.value })
                                    }
                                    required
                                    disabled={isLoading}
                                    className="bg-background/50 transition-all duration-200 focus:scale-[1.01]"
                                />
                            </div>

                            {/* Email */}
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
                                    className="bg-background/50 transition-all duration-200 focus:scale-[1.01]"
                                />
                            </div>

                            {/* Divisi & Cabang Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="divisi">Divisi</Label>
                                    <Select
                                        value={formData.divisi}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, divisi: value })
                                        }
                                        disabled={isLoading}
                                        required
                                    >
                                        <SelectTrigger className="bg-background/50">
                                            <SelectValue placeholder="Pilih divisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DIVISIONS.map((div) => (
                                                <SelectItem key={div.name} value={div.name}>
                                                    {div.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cabang">Cabang</Label>
                                    <Select
                                        value={formData.cabang}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, cabang: value })
                                        }
                                        disabled={isLoading}
                                        required
                                    >
                                        <SelectTrigger className="bg-background/50">
                                            <SelectValue placeholder="Pilih cabang" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BRANCHES.map((branch) => (
                                                <SelectItem key={branch} value={branch}>
                                                    {branch}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Auto-generated Employee ID */}
                            {generatedId && (
                                <div className="space-y-2 p-3 rounded-lg border" style={{ backgroundColor: 'var(--accent-bg)', borderColor: 'var(--accent-border)' }}>
                                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent-primary)' }}>
                                        <Info className="w-4 h-4" />
                                        <span>Nomor ID Karyawan (Otomatis)</span>
                                    </div>
                                    <p className="text-lg font-bold" style={{ color: 'var(--accent-hover)' }}>{generatedId}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ID ini akan menjadi identitas Anda di sistem SIAR
                                    </p>
                                </div>
                            )}

                            {/* Password Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Min. 6 karakter"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        required
                                        disabled={isLoading}
                                        className="bg-background/50 transition-all duration-200 focus:scale-[1.01]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Ulangi password"
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, confirmPassword: e.target.value })
                                        }
                                        required
                                        disabled={isLoading}
                                        className="bg-background/50 transition-all duration-200 focus:scale-[1.01]"
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                variant="neon"
                                size="lg"
                                className="w-full transition-all duration-300 hover:scale-[1.02]"
                                disabled={isLoading || !generatedId}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Daftar
                                    </>
                                )}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                Sudah punya akun?{' '}
                                <Link
                                    href="/auth/login"
                                    style={{ color: 'var(--accent-primary)' }}
                                    className="hover:underline underline-offset-4 transition-all hover:opacity-80"
                                >
                                    Masuk di sini
                                </Link>
                            </div>

                            <Link href="/" className="w-full">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground hover:text-foreground transition-colors"
                                >
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
