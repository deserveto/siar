'use client';

/**
 * SIAR Activity Logs Page (IT Only)
 * View and export system activity logs
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
    FileText,
    Search,
    Filter,
    Download,
    Loader2,
    CheckCircle2,
    XCircle,
    LogIn,
    UserPlus,
    Pencil,
    Trash,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/motion-variants';

interface Log {
    id: number;
    timestamp: string;
    userId: number;
    type: string;
    description: string;
    status: string;
    ip: string;
    user: {
        nama_lengkap: string;
        email: string;
    };
}

const typeIcons: Record<string, React.ReactNode> = {
    LOGIN: <LogIn className="w-4 h-4" />,
    REGISTER: <UserPlus className="w-4 h-4" />,
    CREATE: <Pencil className="w-4 h-4" />,
    UPDATE: <Pencil className="w-4 h-4" />,
    DELETE: <Trash className="w-4 h-4" />,
};

export default function LogsPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const isIT = session?.user?.role === 'IT';

    const [logs, setLogs] = useState<Log[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        if (isIT) {
            fetchLogs();
        }
    }, [isIT]);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportCSV = () => {
        const headers = ['Timestamp', 'User', 'Type', 'Description', 'Status', 'IP Address'];
        const csvContent = [
            headers.join(','),
            ...filteredLogs.map((log) =>
                [
                    format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
                    log.user.nama_lengkap,
                    log.type,
                    `"${log.description.replace(/"/g, '""')}"`,
                    log.status,
                    log.ip,
                ].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `siar_logs_${format(new Date(), 'yyyyMMdd')}.csv`);
        link.click();

        toast({
            title: 'Export Berhasil',
            description: 'File CSV berhasil diunduh.',
            variant: 'success',
        });
    };

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.user.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.ip.includes(searchQuery);
        const matchesType = filterType === 'all' || log.type === filterType;
        return matchesSearch && matchesType;
    });

    if (!isIT) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
                    <p className="text-muted-foreground">Halaman ini hanya dapat diakses oleh IT Administrator</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            {/* Page Header */}
            <motion.div variants={fadeInUp} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 accent-text" />
                        Activity Logs
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor aktivitas sistem dan pengguna
                    </p>
                </div>

                <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </motion.div>

            {/* Logs Table */}
            <motion.div variants={fadeInUp}>
                <Card className="bg-background/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Daftar Log Aktivitas</CardTitle>
                                <CardDescription>{filteredLogs.length} log ditemukan</CardDescription>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari log..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 w-full sm:w-[200px]"
                                    />
                                </div>

                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-full sm:w-[150px]">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Tipe</SelectItem>
                                        <SelectItem value="LOGIN">Login</SelectItem>
                                        <SelectItem value="REGISTER">Register</SelectItem>
                                        <SelectItem value="CREATE">Create</SelectItem>
                                        <SelectItem value="UPDATE">Update</SelectItem>
                                        <SelectItem value="DELETE">Delete</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Tidak ada log yang ditemukan
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Waktu</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tipe</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deskripsi</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">IP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.map((log) => (
                                            <tr key={log.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                                                <td className="py-3 px-4 text-sm">
                                                    {format(new Date(log.timestamp), 'd MMM HH:mm', { locale: id })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="text-sm font-medium">{log.user.nama_lengkap}</p>
                                                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-accent/50">
                                                        {typeIcons[log.type]}
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                                                    {log.description}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${log.status === 'SUCCESS'
                                                        ? 'bg-green-500/20 text-green-500'
                                                        : 'bg-red-500/20 text-red-500'
                                                        }`}>
                                                        {log.status === 'SUCCESS' ? (
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        ) : (
                                                            <XCircle className="w-3 h-3" />
                                                        )}
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground font-mono">
                                                    {log.ip}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
