'use client';

/**
 * SIAR Maintenance Module - Full Featured with Animations
 * Staff: Create maintenance reports with file upload
 * Admin: Manage reports and update status, delete any
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    Wrench,
    Plus,
    Search,
    Loader2,
    CheckCircle2,
    Clock,
    AlertTriangle,
    XCircle,
    Upload,
    X,
    Eye,
    Pencil,
    Trash2,
    Calendar,
    User,
    Monitor,
    Code2,
    Network,
    MoreHorizontal,
    FileImage,
    FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/motion-variants';

interface MaintenanceIssue {
    id: number;
    kategori: string;
    otherKategori: string | null;
    jenis_masalah: string;
    deskripsi: string;
    status: string;
    deadline: string | null;
    date: string;
    user: {
        id: number;
        nama_lengkap: string;
        email: string;
        divisi: string;
        cabang: string;
        nomor_id: string;
    };
    attachments?: FileUpload[];
}

interface FileUpload {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
}

const statusConfig = {
    PENDING: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-500', icon: AlertTriangle },
    RESOLVED: { label: 'Resolved', color: 'bg-green-500/20 text-green-500', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', color: 'bg-red-500/20 text-red-500', icon: XCircle },
};

const categoryConfig = {
    Hardware: { icon: Monitor, color: 'text-orange-500 bg-orange-500/10' },
    Software: { icon: Code2, color: 'text-purple-500 bg-purple-500/10' },
    Network: { icon: Network, color: 'text-blue-500 bg-blue-500/10' },
    Other: { icon: MoreHorizontal, color: 'text-gray-500 bg-gray-500/10' },
};

export default function MaintenancePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const isIT = session?.user?.role === 'IT';
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;

    const [issues, setIssues] = useState<MaintenanceIssue[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        kategori: '',
        otherKategori: '',
        jenis_masalah: '',
        deskripsi: '',
        deadline: '',
    });

    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dialog state
    const [selectedIssue, setSelectedIssue] = useState<MaintenanceIssue | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isCreatedModalOpen, setIsCreatedModalOpen] = useState(false);
    const [createdIssue, setCreatedIssue] = useState<MaintenanceIssue | null>(null);
    const [editFormData, setEditFormData] = useState({
        kategori: '',
        otherKategori: '',
        jenis_masalah: '',
        deskripsi: '',
        deadline: '',
    });

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<MaintenanceIssue | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            const res = await fetch('/api/maintenance');
            if (res.ok) {
                const data = await res.json();
                setIssues(data);
            }
        } catch (error) {
            console.error('Failed to fetch issues:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles((prev) => [...prev, ...files]);

        files.forEach((file) => {
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrls((prev) => [...prev, url]);
            } else {
                setPreviewUrls((prev) => [...prev, '']);
            }
        });
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        if (previewUrls[index]) {
            URL.revokeObjectURL(previewUrls[index]);
        }
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            const issue = await res.json();

            // Upload files
            for (const file of selectedFiles) {
                const uploadData = new FormData();
                uploadData.append('file', file);
                uploadData.append('entityType', 'maintenance');
                uploadData.append('entityId', issue.id.toString());

                await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });
            }

            // Show created issue detail popup
            setCreatedIssue({ ...issue, ...formData });
            setIsCreatedModalOpen(true);

            toast({
                title: 'Laporan Dibuat',
                description: 'Laporan maintenance Anda telah berhasil dikirim.',
                variant: 'success',
            });

            setFormData({ kategori: '', otherKategori: '', jenis_masalah: '', deskripsi: '', deadline: '' });
            setSelectedFiles([]);
            setPreviewUrls([]);
            fetchIssues();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal membuat laporan',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewDetail = async (issue: MaintenanceIssue) => {
        try {
            const res = await fetch(`/api/maintenance/${issue.id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedIssue(data);
                setIsDetailOpen(true);
                setIsEditMode(false);
            }
        } catch (error) {
            console.error('Failed to fetch issue details:', error);
        }
    };

    const handleEdit = (issue: MaintenanceIssue) => {
        setSelectedIssue(issue);
        setEditFormData({
            kategori: issue.kategori,
            otherKategori: issue.otherKategori || '',
            jenis_masalah: issue.jenis_masalah,
            deskripsi: issue.deskripsi,
            deadline: issue.deadline ? format(new Date(issue.deadline), 'yyyy-MM-dd') : '',
        });
        setIsEditMode(true);
        setIsDetailOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedIssue) return;

        try {
            const res = await fetch(`/api/maintenance/${selectedIssue.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            });

            if (res.ok) {
                toast({
                    title: 'Berhasil',
                    description: 'Laporan berhasil diperbarui',
                    variant: 'success',
                });
                setIsDetailOpen(false);
                fetchIssues();
            }
        } catch (error) {
            console.error('Failed to update:', error);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!selectedIssue) return;

        try {
            const res = await fetch(`/api/maintenance/${selectedIssue.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                toast({
                    title: 'Status Diperbarui',
                    description: `Status berhasil diubah menjadi ${status}`,
                    variant: 'success',
                });
                setIsDetailOpen(false);
                fetchIssues();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleDeleteClick = (issue: MaintenanceIssue) => {
        setDeleteTarget(issue);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        try {
            const res = await fetch(`/api/maintenance/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({
                    title: 'Berhasil',
                    description: 'Laporan berhasil dihapus',
                    variant: 'success',
                });
                fetchIssues();
            } else {
                const data = await res.json();
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menghapus laporan',
                variant: 'destructive',
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    const filteredIssues = issues.filter((issue) =>
        issue.jenis_masalah.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.user.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            {/* Page Header */}
            <motion.div variants={fadeInUp}>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wrench className="w-6 h-6 text-orange-500" />
                    Maintenance
                </h1>
                <p className="text-muted-foreground">
                    {isIT ? 'Kelola semua laporan maintenance' : 'Buat dan kelola laporan maintenance'}
                </p>
            </motion.div>

            {/* Request Form - Only for Staff */}
            {!isIT && (
                <motion.div variants={fadeInUp}>
                    <Card className="bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Lapor Masalah Baru
                            </CardTitle>
                            <CardDescription>Laporkan masalah IT yang Anda alami</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label>Kategori</Label>
                                        <Select
                                            value={formData.kategori}
                                            onValueChange={(value: string) => setFormData({ ...formData, kategori: value, otherKategori: '' })}
                                        >
                                            <SelectTrigger className="bg-background/50 transition-all duration-200 hover:bg-background/70">
                                                <SelectValue placeholder="Pilih kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Hardware">Hardware</SelectItem>
                                                <SelectItem value="Software">Software</SelectItem>
                                                <SelectItem value="Network">Network</SelectItem>
                                                <SelectItem value="Other">Lainnya</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Other Category */}
                                    {formData.kategori === 'Other' && (
                                        <div className="space-y-2 animate-fadeIn">
                                            <Label>Kategori Lainnya</Label>
                                            <Input
                                                placeholder="Jelaskan kategori..."
                                                value={formData.otherKategori}
                                                onChange={(e) => setFormData({ ...formData, otherKategori: e.target.value })}
                                                className="bg-background/50"
                                            />
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    <div className="space-y-2">
                                        <Label>Deadline (Opsional)</Label>
                                        <Input
                                            type="date"
                                            value={formData.deadline}
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                            className="bg-background/50"
                                        />
                                    </div>
                                </div>

                                {/* Issue Title */}
                                <div className="space-y-2">
                                    <Label>Jenis Masalah</Label>
                                    <Input
                                        placeholder="Contoh: Monitor tidak menyala"
                                        value={formData.jenis_masalah}
                                        onChange={(e) => setFormData({ ...formData, jenis_masalah: e.target.value })}
                                        required
                                        className="bg-background/50 transition-all duration-200 focus:scale-[1.01]"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label>Deskripsi</Label>
                                    <textarea
                                        placeholder="Jelaskan detail masalah yang terjadi..."
                                        value={formData.deskripsi}
                                        onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                                        required
                                        rows={4}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm resize-none transition-all duration-200 focus:scale-[1.01]"
                                    />
                                </div>

                                {/* File Upload */}
                                <div className="space-y-2">
                                    <Label>Lampiran (Gambar/File)</Label>
                                    <div className="flex gap-4 items-start flex-wrap">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="relative group animate-scaleIn">
                                                <div className="w-24 h-24 rounded-lg border border-border/50 overflow-hidden bg-background/50 flex items-center justify-center">
                                                    {previewUrls[index] ? (
                                                        <Image src={previewUrls[index]} alt={file.name} fill className="object-cover" />
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                                                            <p className="text-[10px] text-muted-foreground truncate max-w-full mt-1">{file.name}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-24 h-24 rounded-lg border-2 border-dashed border-border/50 hover:border-orange-500/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-orange-500 transition-all duration-200 hover:scale-105"
                                        >
                                            <Upload className="w-6 h-6" />
                                            <span className="text-xs">Upload</span>
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                <Button type="submit" variant="neon" disabled={isSubmitting} className="transition-all duration-200 hover:scale-105 active:scale-95">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Kirim Laporan
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Issues List */}
            <motion.div variants={fadeInUp}>
                <Card className="bg-background/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Daftar Laporan Maintenance</CardTitle>
                                <CardDescription>{filteredIssues.length} laporan ditemukan</CardDescription>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari laporan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full sm:w-[250px] transition-all duration-200 focus:w-[300px]"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                            </div>
                        ) : filteredIssues.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground animate-fadeIn">
                                Tidak ada laporan yang ditemukan
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredIssues.map((issue, index) => {
                                    const status = statusConfig[issue.status as keyof typeof statusConfig] || statusConfig.PENDING;
                                    const StatusIcon = status.icon;
                                    const category = categoryConfig[issue.kategori as keyof typeof categoryConfig] || categoryConfig.Other;
                                    const CategoryIcon = category.icon;
                                    const isOwner = issue.user.id === userId;
                                    const canDelete = isOwner || isIT;

                                    return (
                                        <Card
                                            key={issue.id}
                                            className="bg-background/30 border-border/30 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5 hover:scale-[1.02] animate-fadeIn"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <CardContent className="pt-4">
                                                {/* Category & Status */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${category.color}`}>
                                                        <CategoryIcon className="w-3 h-3" />
                                                        {issue.kategori === 'Other' ? issue.otherKategori || 'Lainnya' : issue.kategori}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color}`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-medium text-lg mb-2 line-clamp-1">{issue.jenis_masalah}</h3>

                                                {/* Description */}
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{issue.deskripsi}</p>

                                                {/* Meta info */}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {issue.user.nama_lengkap}
                                                    </span>
                                                    {issue.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(issue.deadline), 'd MMM', { locale: id })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-3 border-t border-border/30">
                                                    <Button variant="ghost" size="sm" className="flex-1 transition-all duration-200 hover:scale-105" onClick={() => handleViewDetail(issue)}>
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Detail
                                                    </Button>
                                                    {isOwner && (
                                                        <Button variant="ghost" size="sm" className="flex-1 transition-all duration-200 hover:scale-105" onClick={() => handleEdit(issue)}>
                                                            <Pencil className="w-4 h-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 hover:scale-105"
                                                            onClick={() => handleDeleteClick(issue)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Detail/Edit Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditMode ? 'Edit Laporan' : 'Detail Laporan'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Ubah informasi laporan Anda' : 'Informasi lengkap laporan maintenance'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedIssue && (
                        <div className="space-y-4">
                            {isEditMode ? (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Kategori</Label>
                                            <Select
                                                value={editFormData.kategori}
                                                onValueChange={(value: string) => setEditFormData({ ...editFormData, kategori: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Hardware">Hardware</SelectItem>
                                                    <SelectItem value="Software">Software</SelectItem>
                                                    <SelectItem value="Network">Network</SelectItem>
                                                    <SelectItem value="Other">Lainnya</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Deadline</Label>
                                            <Input
                                                type="date"
                                                value={editFormData.deadline}
                                                onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {editFormData.kategori === 'Other' && (
                                        <div className="space-y-2">
                                            <Label>Kategori Lainnya</Label>
                                            <Input
                                                value={editFormData.otherKategori}
                                                onChange={(e) => setEditFormData({ ...editFormData, otherKategori: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Jenis Masalah</Label>
                                        <Input
                                            value={editFormData.jenis_masalah}
                                            onChange={(e) => setEditFormData({ ...editFormData, jenis_masalah: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Deskripsi</Label>
                                        <textarea
                                            value={editFormData.deskripsi}
                                            onChange={(e) => setEditFormData({ ...editFormData, deskripsi: e.target.value })}
                                            rows={4}
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" onClick={() => setIsEditMode(false)}>Batal</Button>
                                        <Button variant="neon" onClick={handleSaveEdit}>Simpan</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fadeIn">
                                    {/* Status & Category */}
                                    <div className="flex gap-2">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${categoryConfig[selectedIssue.kategori as keyof typeof categoryConfig]?.color
                                            }`}>
                                            {selectedIssue.kategori === 'Other' ? selectedIssue.otherKategori : selectedIssue.kategori}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusConfig[selectedIssue.status as keyof typeof statusConfig].color
                                            }`}>
                                            {statusConfig[selectedIssue.status as keyof typeof statusConfig].label}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <Label className="text-muted-foreground">Jenis Masalah</Label>
                                        <p className="text-lg font-medium">{selectedIssue.jenis_masalah}</p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label className="text-muted-foreground">Deskripsi</Label>
                                        <p className="whitespace-pre-wrap">{selectedIssue.deskripsi}</p>
                                    </div>

                                    {/* User Info */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg">
                                        <div>
                                            <Label className="text-muted-foreground">Pelapor</Label>
                                            <p className="font-medium">{selectedIssue.user.nama_lengkap}</p>
                                            <p className="text-sm text-muted-foreground">{selectedIssue.user.email}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Divisi / Cabang</Label>
                                            <p className="font-medium">{selectedIssue.user.divisi}</p>
                                            <p className="text-sm text-muted-foreground">{selectedIssue.user.cabang}</p>
                                        </div>
                                    </div>

                                    {/* Deadline */}
                                    {selectedIssue.deadline && (
                                        <div>
                                            <Label className="text-muted-foreground">Deadline</Label>
                                            <p className="font-medium">
                                                {format(new Date(selectedIssue.deadline), 'd MMMM yyyy', { locale: id })}
                                            </p>
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                                        <div>
                                            <Label className="text-muted-foreground mb-2 block">Lampiran</Label>
                                            <div className="flex gap-2 flex-wrap">
                                                {selectedIssue.attachments.map((file) => (
                                                    <a
                                                        key={file.id}
                                                        href={file.filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/50 hover:border-orange-500/50 transition-all duration-200 hover:scale-105"
                                                    >
                                                        {file.fileType.startsWith('image/') ? (
                                                            <FileImage className="w-4 h-4 text-orange-500" />
                                                        ) : (
                                                            <FileText className="w-4 h-4 text-orange-500" />
                                                        )}
                                                        <span className="text-sm">{file.fileName}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin: Status Update */}
                                    {isIT && (
                                        <div className="pt-4 border-t">
                                            <Label className="text-muted-foreground mb-2 block">Update Status</Label>
                                            <div className="flex gap-2 flex-wrap">
                                                {Object.entries(statusConfig).map(([key, config]) => (
                                                    <Button
                                                        key={key}
                                                        variant={selectedIssue.status === key ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleStatusChange(key)}
                                                        className={`${selectedIssue.status === key ? config.color : ''} transition-all duration-200 hover:scale-105`}
                                                    >
                                                        {config.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Created Issue Detail Popup */}
            <Dialog open={isCreatedModalOpen} onOpenChange={setIsCreatedModalOpen}>
                <DialogContent className="max-w-md animate-scaleIn">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-500">
                            <CheckCircle2 className="w-5 h-5" />
                            Laporan Berhasil Dibuat!
                        </DialogTitle>
                        <DialogDescription>
                            Berikut adalah detail laporan yang Anda buat
                        </DialogDescription>
                    </DialogHeader>

                    {createdIssue && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Kategori</Label>
                                        <p className="font-medium">
                                            {createdIssue.kategori === 'Other' ? createdIssue.otherKategori : createdIssue.kategori}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Jenis Masalah</Label>
                                        <p className="font-medium">{createdIssue.jenis_masalah}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Deskripsi</Label>
                                        <p className="text-sm">{createdIssue.deskripsi}</p>
                                    </div>
                                    {formData.deadline && (
                                        <div>
                                            <Label className="text-muted-foreground text-xs">Deadline</Label>
                                            <p className="text-sm">{format(new Date(formData.deadline), 'd MMMM yyyy', { locale: id })}</p>
                                        </div>
                                    )}
                                    {selectedFiles.length > 0 && (
                                        <div>
                                            <Label className="text-muted-foreground text-xs">Lampiran</Label>
                                            <p className="text-sm">{selectedFiles.length} file dilampirkan</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button variant="neon" className="w-full" onClick={() => setIsCreatedModalOpen(false)}>
                                Tutup
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="animate-scaleIn">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-500">
                            <Trash2 className="w-5 h-5" />
                            Hapus Laporan?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus laporan <strong>"{deleteTarget?.jenis_masalah}"</strong>?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}
