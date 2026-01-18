'use client';

/**
 * SIAR Profile Page
 * View and edit profile, upload profile picture, change accent color
 * Uses global CSS animations from globals.css
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAccent, accentColors } from '@/components/accent-provider';
import {
    User,
    Mail,
    Building2,
    MapPin,
    BadgeCheck,
    Camera,
    Palette,
    Save,
    Loader2,
    Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion-variants';

export default function ProfilePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const { accent, setAccent } = useAccent();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        email: '',
        divisi: '',
        cabang: '',
        nomor_id: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (session?.user) {
                try {
                    const res = await fetch('/api/profile');
                    if (res.ok) {
                        const data = await res.json();
                        setFormData({
                            nama_lengkap: data.nama_lengkap || '',
                            email: data.email || '',
                            divisi: data.divisi || '',
                            cabang: data.cabang || '',
                            nomor_id: data.nomor_id || '',
                        });
                        // Load profile image from API
                        if (data.profile_picture) {
                            setProfileImage(data.profile_picture);
                            // Also update localStorage for fallback/speed
                            const user = session.user as { id: string };
                            localStorage.setItem(`siar-profile-${user.id}`, data.profile_picture);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                }
            }
        };

        fetchProfile();
    }, [session]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast({
                    title: 'Error',
                    description: 'Ukuran file terlalu besar. Maksimal 2MB.',
                    variant: 'destructive',
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const imageData = event.target?.result as string;

                // Optimistic update
                setProfileImage(imageData);

                try {
                    // Send to API
                    const res = await fetch('/api/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            profile_picture: imageData,
                        }),
                    });

                    if (res.ok) {
                        // Update localStorage too
                        const user = session?.user as { id?: string };
                        if (user?.id) {
                            localStorage.setItem(`siar-profile-${user.id}`, imageData);
                        }

                        window.dispatchEvent(new Event('profile-update'));
                        toast({
                            title: 'Foto Profil Diperbarui',
                            description: 'Foto profil Anda telah berhasil diperbarui dan disinkronkan.',
                            variant: 'success',
                        });
                    } else {
                        throw new Error('Failed to save image');
                    }
                } catch (err) {
                    console.error('Failed to upload image:', err);
                    toast({
                        title: 'Error',
                        description: 'Gagal menyimpan foto ke server.',
                        variant: 'destructive',
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAccentChange = (colorValue: string) => {
        setAccent(colorValue);
        const colorName = accentColors.find(c => c.value === colorValue)?.name || colorValue;
        toast({
            title: 'Warna Aksen Diperbarui',
            description: `Warna aksen berhasil diubah menjadi ${colorName}.`,
            variant: 'success',
        });
    };

    const handleSaveProfile = async () => {
        if (!formData.nama_lengkap.trim()) {
            toast({
                title: 'Error',
                description: 'Nama lengkap tidak boleh kosong',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nama_lengkap: formData.nama_lengkap.trim(),
                }),
            });

            const data = await res.json();

            if (res.ok) {
                window.dispatchEvent(new Event('profile-update'));
                toast({
                    title: 'Profil Diperbarui',
                    description: 'Profil Anda telah berhasil diperbarui.',
                    variant: 'success',
                });
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal memperbarui profil',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const currentAccent = accentColors.find(c => c.value === accent) || accentColors[0];
    const userRole = (session?.user as { role?: string })?.role;

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="max-w-4xl mx-auto space-y-8">
            {/* Page Header */}
            <motion.div variants={fadeInUp}>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <User className="w-6 h-6 accent-text" />
                    Profil Saya
                </h1>
                <p className="text-muted-foreground">
                    Kelola informasi profil dan preferensi tampilan Anda
                </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-1 bg-background/50 backdrop-blur border-border/50">
                    <CardContent className="pt-6 flex flex-col items-center">
                        {/* Avatar with upload */}
                        <div className="relative group">
                            <Avatar className="w-32 h-32 border-4 border-border/50 transition-all duration-300 group-hover:border-[var(--accent-primary)]/50">
                                <AvatarImage src={profileImage || undefined} alt={formData.nama_lengkap} />
                                <AvatarFallback
                                    className="text-white text-3xl font-bold"
                                    style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-hover))` }}
                                >
                                    {getInitials(formData.nama_lengkap)}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-background border border-border rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-accent"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <h2 className="text-xl font-bold mt-4">{formData.nama_lengkap || 'User'}</h2>
                        <p className="text-muted-foreground text-sm">{formData.email}</p>

                        <div
                            className="mt-3 px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ background: `linear-gradient(to right, var(--accent-primary), var(--accent-hover))` }}
                        >
                            {userRole === 'IT' ? 'Administrator IT' : 'Staff'}
                        </div>

                        <div className="w-full mt-6 space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                                <BadgeCheck className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Nomor ID</p>
                                    <p className="font-medium">{formData.nomor_id || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Divisi</p>
                                    <p className="font-medium">{formData.divisi || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Cabang</p>
                                    <p className="font-medium">{formData.cabang || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Profile & Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Edit Profile */}
                    <Card className="bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Informasi Profil
                            </CardTitle>
                            <CardDescription>
                                Ubah informasi profil Anda
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nama Lengkap</Label>
                                    <Input
                                        value={formData.nama_lengkap}
                                        onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                                        className="transition-all duration-200 focus:scale-[1.01]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            value={formData.email}
                                            disabled
                                            className="pl-9 bg-muted/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Divisi</Label>
                                    <Input
                                        value={formData.divisi}
                                        disabled
                                        className="bg-muted/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cabang</Label>
                                    <Input
                                        value={formData.cabang}
                                        disabled
                                        className="bg-muted/50"
                                    />
                                </div>
                            </div>

                            <Button
                                variant="neon"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Accent Color */}
                    <Card className="bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5" />
                                Warna Aksen Website
                            </CardTitle>
                            <CardDescription>
                                Pilih warna aksen untuk mengubah tampilan seluruh website
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                {accentColors.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => handleAccentChange(color.value)}
                                        className={`relative w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 ${accent === color.value ? 'ring-2 ring-offset-2 ring-offset-background ring-white shadow-lg' : ''
                                            }`}
                                        style={{ background: color.primary }}
                                        title={color.name}
                                    >
                                        {accent === color.value && (
                                            <div className="absolute inset-0 flex items-center justify-center animate-scaleIn">
                                                <Check className="w-6 h-6 text-white drop-shadow-lg" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div
                                className="mt-4 p-4 rounded-lg"
                                style={{ background: `linear-gradient(to right, var(--accent-bg), transparent)` }}
                            >
                                <p className="text-sm text-center">
                                    Warna aksen saat ini: <strong className="accent-text">{currentAccent.name}</strong>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </motion.div>
    );
}
