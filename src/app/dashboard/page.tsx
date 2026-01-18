'use client';

/**
 * SIAR Main Dashboard Page
 * Role-based stats with real database integration
 * Uses global CSS animation classes from globals.css
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Wrench,
    FolderKanban,
    Calendar,
    FileText,
    Users,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Loader2,
    Bell,
    Monitor,
    XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp, scaleIn } from '@/lib/motion-variants';

interface DashboardStats {
    maintenance: {
        total: number;
        pending: number;
        inProgress: number;
        resolved: number;
        rejected: number;
    };
    projects: {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        rejected: number;
    };
    events: number;
    logs: number;
    users: number;
    notifications: number;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const isIT = session?.user?.role === 'IT';

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const moduleCards = [
        {
            title: 'Laporan Maintenance',
            value: stats?.maintenance.total || 0,
            description: `${stats?.maintenance.pending || 0} pending, ${stats?.maintenance.inProgress || 0} in progress`,
            icon: <Wrench className="w-6 h-6" />,
            href: '/dashboard/maintenance',
            color: 'from-orange-500 to-amber-500',
        },
        {
            title: 'Project Items',
            value: stats?.projects.total || 0,
            description: `${stats?.projects.inProgress || 0} project dalam progress`,
            icon: <FolderKanban className="w-6 h-6" />,
            href: '/dashboard/projects',
            color: 'from-purple-500 to-pink-500',
        },
        {
            title: 'Event Bulan Ini',
            value: stats?.events || 0,
            description: 'Jadwal kegiatan & deadline',
            icon: <Calendar className="w-6 h-6" />,
            href: '/dashboard/calendar',
            color: 'from-green-500 to-emerald-500',
        },
    ];

    // Add logs card for IT only
    if (isIT) {
        moduleCards.push({
            title: 'Activity Logs',
            value: stats?.logs || 0,
            description: 'Total log minggu ini',
            icon: <FileText className="w-6 h-6" />,
            href: '/dashboard/logs',
            color: 'from-cyan-500 to-blue-500',
        });
    }

    const maintenanceStats = [
        {
            label: 'Pending',
            value: stats?.maintenance.pending || 0,
            icon: <Clock className="w-4 h-4" />,
            color: 'text-yellow-500',
        },
        {
            label: 'In Progress',
            value: stats?.maintenance.inProgress || 0,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: 'text-blue-500',
        },
        {
            label: 'Resolved',
            value: stats?.maintenance.resolved || 0,
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: 'text-green-500',
        },
        {
            label: 'Rejected',
            value: stats?.maintenance.rejected || 0,
            icon: <XCircle className="w-4 h-4" />,
            color: 'text-red-500',
        },
    ];

    const projectStats = [
        {
            label: 'Pending',
            value: stats?.projects.pending || 0,
            icon: <Clock className="w-4 h-4" />,
            color: 'text-yellow-500',
        },
        {
            label: 'In Progress',
            value: stats?.projects.inProgress || 0,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: 'text-blue-500',
        },
        {
            label: 'Completed',
            value: stats?.projects.completed || 0,
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: 'text-green-500',
        },
        {
            label: 'Rejected',
            value: stats?.projects.rejected || 0,
            icon: <XCircle className="w-4 h-4" />,
            color: 'text-red-500',
        },
    ];

    const systemStats = [];

    if (isIT) {
        systemStats.push({
            label: 'Total Users',
            value: stats?.users || 0,
            icon: <Users className="w-4 h-4" />,
            color: 'text-cyan-500',
        });
    } else {
        systemStats.push({
            label: 'Notifikasi',
            value: stats?.notifications || 0,
            icon: <Bell className="w-4 h-4" />,
            color: 'text-cyan-500',
        });
    }

    return (
        <motion.div
            className="space-y-8"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
        >
            {/* Welcome Section */}
            <motion.div variants={fadeInUp} className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    <span style={{ color: 'var(--accent-primary)' }}>
                        SIAR Dashboard
                    </span>
                </h1>
                <p className="text-muted-foreground">
                    Selamat datang, <span className="font-medium text-foreground">{session?.user?.name}</span>!
                    Anda login sebagai{' '}
                    <span className="font-medium accent-text">
                        {isIT ? 'IT Administrator' : 'Staff'}{' '}
                    </span>
                    di divisi {session?.user?.divisi}.
                </p>
            </motion.div>

            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin accent-text" />
                </div>
            ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-8">
                    {/* Maintenance Stats */}
                    <motion.div variants={fadeInUp} className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-orange-500" />
                            Overview Maintenance
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {maintenanceStats.map((stat) => (
                                <motion.div key={stat.label} variants={scaleIn}>
                                    <Card
                                        className="bg-background/50 backdrop-blur border-border/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-full"
                                    >
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-2xl font-bold">{stat.value}</p>
                                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                                </div>
                                                <div className={`p-2 rounded-full bg-background ${stat.color}`}>
                                                    {stat.icon}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Project Stats */}
                    <motion.div variants={fadeInUp} className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <FolderKanban className="w-5 h-5 text-purple-500" />
                            Overview Project
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {projectStats.map((stat) => (
                                <motion.div key={stat.label} variants={scaleIn}>
                                    <Card
                                        className="bg-background/50 backdrop-blur border-border/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-full"
                                    >
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-2xl font-bold">{stat.value}</p>
                                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                                </div>
                                                <div className={`p-2 rounded-full bg-background ${stat.color}`}>
                                                    {stat.icon}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* System Overview */}
                    <motion.div variants={fadeInUp} className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Monitor className="w-5 h-5 text-cyan-500" />
                            System Overview
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {systemStats.map((stat) => (
                                <motion.div key={stat.label} variants={scaleIn}>
                                    <Card
                                        className="bg-background/50 backdrop-blur border-border/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg h-full"
                                    >
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-2xl font-bold">{stat.value}</p>
                                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                                </div>
                                                <div className={`p-2 rounded-full bg-background ${stat.color}`}>
                                                    {stat.icon}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Module Cards */}
                    <motion.div variants={fadeInUp}>
                        <h2 className="text-xl font-semibold mb-4">Modul SIAR</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {moduleCards.map((card) => (
                                <Link key={card.href} href={card.href}>
                                    <motion.div variants={scaleIn} className="h-full">
                                        <Card
                                            className="group relative overflow-hidden bg-background/50 backdrop-blur border-border/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 h-full hover:scale-[1.02]"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                                                        {card.icon}
                                                    </div>
                                                    <span className="text-3xl font-bold text-foreground/80">
                                                        {card.value}
                                                    </span>
                                                </div>
                                            </CardHeader>

                                            <CardContent>
                                                <CardTitle className="text-lg group-hover:accent-text transition-colors">
                                                    {card.title}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {card.description}
                                                </CardDescription>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* User Info Card */}
                    <motion.div variants={fadeInUp}>
                        <Card className="bg-background/50 backdrop-blur accent-border">
                            <CardHeader>
                                <CardTitle className="text-lg">Informasi Akun</CardTitle>
                                <CardDescription>Detail akun yang sedang login</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Nomor ID</p>
                                        <p className="font-medium">{session?.user?.nomor_id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium">{session?.user?.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Divisi</p>
                                        <p className="font-medium">{session?.user?.divisi}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Cabang</p>
                                        <p className="font-medium">{session?.user?.cabang}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}
