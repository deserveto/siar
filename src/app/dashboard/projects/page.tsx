'use client';

/**
 * SIAR Projects Module - Full Featured with Animations
 * Staff: Create project requests with file upload
 * Admin: Manage requests and update status, delete any
 */

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    FolderKanban,
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
    ExternalLink,
    Link as LinkIcon,
    FileImage,
    FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, scaleIn } from '@/lib/motion-variants';

interface ProjectItem {
    id: number;
    title: string;
    description: string;
    fileOrLink: string | null;
    status: string;
    deadline: string | null;
    date: string;
    resultType?: string | null;
    resultValue?: string | null;
    resultName?: string | null;
    user: {
        id: number;
        nama_lengkap: string;
        email: string;
        divisi: string;
        cabang: string;
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
    COMPLETED: { label: 'Completed', color: 'bg-green-500/20 text-green-500', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', color: 'bg-red-500/20 text-red-500', icon: XCircle },
};

export default function ProjectsPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const isIT = session?.user?.role === 'IT';
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;

    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        fileOrLink: '',
        deadline: '',
    });

    // File upload state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dialog state
    const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isCreatedModalOpen, setIsCreatedModalOpen] = useState(false);
    const [createdProject, setCreatedProject] = useState<ProjectItem | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: '',
        description: '',
        fileOrLink: '',
        deadline: '',
    });

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState<ProjectItem | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Completion Dialog
    const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
    const [completionData, setCompletionData] = useState({
        type: 'LINK', // LINK or FILE
        value: '',
        name: '',
        file: null as File | null,
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
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
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            const project = await res.json();

            // Upload files
            for (const file of selectedFiles) {
                const uploadData = new FormData();
                uploadData.append('file', file);
                uploadData.append('entityType', 'project');
                uploadData.append('entityId', project.id.toString());

                await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });
            }

            // Show created project detail popup
            setCreatedProject({ ...project, ...formData });
            setIsCreatedModalOpen(true);

            toast({
                title: 'Project Dibuat',
                description: 'Request project Anda telah berhasil dikirim.',
                variant: 'success',
            });

            setFormData({ title: '', description: '', fileOrLink: '', deadline: '' });
            setSelectedFiles([]);
            setPreviewUrls([]);
            fetchProjects();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal membuat project',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewDetail = async (project: ProjectItem) => {
        try {
            const res = await fetch(`/api/projects/${project.id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedProject(data);
                setIsDetailOpen(true);
                setIsEditMode(false);
            }
        } catch (error) {
            console.error('Failed to fetch project details:', error);
        }
    };

    const handleEdit = (project: ProjectItem) => {
        setSelectedProject(project);
        setEditFormData({
            title: project.title,
            description: project.description,
            fileOrLink: project.fileOrLink || '',
            deadline: project.deadline ? format(new Date(project.deadline), 'yyyy-MM-dd') : '',
        });
        setIsEditMode(true);
        setIsDetailOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedProject) return;

        try {
            const res = await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            });

            if (res.ok) {
                toast({
                    title: 'Berhasil',
                    description: 'Project berhasil diperbarui',
                    variant: 'success',
                });
                setIsDetailOpen(false);
                fetchProjects();
            }
        } catch (error) {
            console.error('Failed to update:', error);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!selectedProject) return;

        if (status === 'COMPLETED') {
            setCompletionData({ type: 'LINK', value: '', name: '', file: null });
            setIsCompletionDialogOpen(true);
            return;
        }

        updateStatus(status);
    };

    const updateStatus = async (status: string) => {
        if (!selectedProject) return;

        try {

            const res = await fetch(`/api/projects/${selectedProject.id}`, {
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
                fetchProjects();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleConfirmCompletion = async () => {
        if (!selectedProject) return;
        setIsSubmitting(true);

        try {
            let resultValue = completionData.value;
            let resultName = completionData.name;

            if (completionData.type === 'FILE') {
                if (!completionData.file) {
                    throw new Error('Please select a file');
                }

                const uploadData = new FormData();
                uploadData.append('file', completionData.file);
                uploadData.append('entityType', 'project_result');
                uploadData.append('entityId', selectedProject.id.toString());

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });

                if (!res.ok) throw new Error('Failed to upload result file');
                const fileData = await res.json();
                resultValue = fileData.filePath;
                resultName = completionData.file.name;
            } else if (completionData.type === 'LINK') {
                if (!resultValue) throw new Error('Link url is required');
                if (!resultValue.startsWith('http')) {
                    resultValue = `https://${resultValue}`;
                }
                resultName = resultName || resultValue;
            }

            const res = await fetch(`/api/projects/${selectedProject.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'COMPLETED',
                    resultType: completionData.type,
                    resultValue,
                    resultName
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Project Completed',
                    description: 'Project has been marked as completed with result.',
                    variant: 'success',
                });
                setIsCompletionDialogOpen(false);
                setIsDetailOpen(false);
                fetchProjects();
            } else {
                throw new Error('Failed to update project status');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to complete project',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (project: ProjectItem) => {
        setDeleteTarget(project);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;

        try {
            const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({
                    title: 'Berhasil',
                    description: 'Project berhasil dihapus',
                    variant: 'success',
                });
                fetchProjects();
            } else {
                const data = await res.json();
                throw new Error(data.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Gagal menghapus project',
                variant: 'destructive',
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteTarget(null);
        }
    };

    const filteredProjects = projects.filter((project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.user.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            {/* Page Header */}
            <motion.div variants={fadeInUp}>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FolderKanban className="w-6 h-6 text-purple-500" />
                    Projects
                </h1>
                <p className="text-muted-foreground">
                    {isIT ? 'Kelola semua request project' : 'Buat dan kelola request project'}
                </p>
            </motion.div>

            {/* Request Form - Only for Staff */}
            {!isIT && (
                <motion.div variants={fadeInUp}>
                    <Card className="bg-background/50 backdrop-blur border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Request Project Baru
                            </CardTitle>
                            <CardDescription>Buat request project atau upload dokumen</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Title */}
                                <div className="space-y-2">
                                    <Label>Judul Project</Label>
                                    <Input
                                        placeholder="Contoh: Update Sistem Klaim 2026"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        className="transition-all duration-200 focus:scale-[1.01]"
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label>Deskripsi</Label>
                                    <textarea
                                        placeholder="Jelaskan detail project yang dibutuhkan..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        rows={4}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm resize-none transition-all duration-200 focus:scale-[1.01]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Link */}
                                    <div className="space-y-2">
                                        <Label>Link Referensi (Opsional)</Label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="https://..."
                                                value={formData.fileOrLink}
                                                onChange={(e) => setFormData({ ...formData, fileOrLink: e.target.value })}
                                                className="pl-9 bg-background/50"
                                            />
                                        </div>
                                    </div>

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
                                            className="w-24 h-24 rounded-lg border-2 border-dashed border-border/50 hover:border-purple-500/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-purple-500 transition-all duration-200 hover:scale-105"
                                        >
                                            <Upload className="w-6 h-6" />
                                            <span className="text-xs">Upload</span>
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
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
                                            Kirim Request
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Projects List */}
            <motion.div variants={fadeInUp}>
                <Card className="bg-background/50 backdrop-blur border-border/50">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Daftar Project Items</CardTitle>
                                <CardDescription>{filteredProjects.length} project ditemukan</CardDescription>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari project..."
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
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground animate-fadeIn">
                                Tidak ada project yang ditemukan
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredProjects.map((project, index) => {
                                    const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.PENDING;
                                    const StatusIcon = status.icon;
                                    const isOwner = project.user.id === userId;
                                    const canDelete = isOwner || isIT;

                                    return (
                                        <Card
                                            key={project.id}
                                            className="bg-background/30 border-border/30 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 hover:scale-[1.02] animate-fadeIn"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <CardContent className="pt-4">
                                                {/* Status */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.color} transition-all duration-200`}>
                                                        <StatusIcon className="w-3 h-3" />
                                                        {status.label}
                                                    </span>
                                                    {project.fileOrLink && (
                                                        <a
                                                            href={project.fileOrLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-all duration-200 hover:scale-110"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className="font-medium text-lg mb-2 line-clamp-1">{project.title}</h3>

                                                {/* Description */}
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>

                                                {/* Meta info */}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {project.user.nama_lengkap}
                                                    </span>
                                                    {project.deadline && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(project.deadline), 'd MMM', { locale: id })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-3 border-t border-border/30">
                                                    <Button variant="ghost" size="sm" className="flex-1 transition-all duration-200 hover:scale-105" onClick={() => handleViewDetail(project)}>
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        Detail
                                                    </Button>
                                                    {isOwner && (
                                                        <Button variant="ghost" size="sm" className="flex-1 transition-all duration-200 hover:scale-105" onClick={() => handleEdit(project)}>
                                                            <Pencil className="w-4 h-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {canDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 hover:scale-105"
                                                            onClick={() => handleDeleteClick(project)}
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
                            {isEditMode ? 'Edit Project' : 'Detail Project'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Ubah informasi project Anda' : 'Informasi lengkap project'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedProject && (
                        <div className="space-y-4">
                            {isEditMode ? (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="space-y-2">
                                        <Label>Judul</Label>
                                        <Input
                                            value={editFormData.title}
                                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Deskripsi</Label>
                                        <textarea
                                            value={editFormData.description}
                                            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                            rows={4}
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Link</Label>
                                            <Input
                                                value={editFormData.fileOrLink}
                                                onChange={(e) => setEditFormData({ ...editFormData, fileOrLink: e.target.value })}
                                            />
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

                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" onClick={() => setIsEditMode(false)}>Batal</Button>
                                        <Button variant="neon" onClick={handleSaveEdit}>Simpan</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fadeIn">
                                    {/* Status */}
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusConfig[selectedProject.status as keyof typeof statusConfig].color
                                        }`}>
                                        {statusConfig[selectedProject.status as keyof typeof statusConfig].label}
                                    </span>

                                    {/* Title */}
                                    <div>
                                        <Label className="text-muted-foreground">Judul</Label>
                                        <p className="text-lg font-medium">{selectedProject.title}</p>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label className="text-muted-foreground">Deskripsi</Label>
                                        <p className="whitespace-pre-wrap">{selectedProject.description}</p>
                                    </div>

                                    {/* Link */}
                                    {selectedProject.fileOrLink && (
                                        <div>
                                            <Label className="text-muted-foreground">Link Referensi</Label>
                                            <a
                                                href={selectedProject.fileOrLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {selectedProject.fileOrLink}
                                            </a>
                                        </div>
                                    )}

                                    {/* User Info */}
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-lg">
                                        <div>
                                            <Label className="text-muted-foreground">Requester</Label>
                                            <p className="font-medium">{selectedProject.user.nama_lengkap}</p>
                                            <p className="text-sm text-muted-foreground">{selectedProject.user.email}</p>
                                        </div>
                                        <div>
                                            <Label className="text-muted-foreground">Divisi / Cabang</Label>
                                            <p className="font-medium">{selectedProject.user.divisi}</p>
                                            <p className="text-sm text-muted-foreground">{selectedProject.user.cabang}</p>
                                        </div>
                                    </div>

                                    {/* Deadline */}
                                    {selectedProject.deadline && (
                                        <div>
                                            <Label className="text-muted-foreground">Deadline</Label>
                                            <p className="font-medium">
                                                {format(new Date(selectedProject.deadline), 'd MMMM yyyy', { locale: id })}
                                            </p>
                                        </div>
                                    )}

                                    {/* Result - Only if Completed */}
                                    {selectedProject.status === 'COMPLETED' && (selectedProject.resultValue || selectedProject.resultType) && (
                                        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                            <Label className="text-green-500 mb-2 block font-semibold flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Hasil Project
                                            </Label>
                                            <div className="space-y-2">
                                                {selectedProject.resultName && (
                                                    <p className="font-medium text-sm">{selectedProject.resultName}</p>
                                                )}

                                                <a
                                                    href={selectedProject.resultValue || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-primary hover:underline bg-background/50 p-3 rounded border border-border/50 hover:border-green-500/50 transition-all duration-200"
                                                >
                                                    {selectedProject.resultType === 'LINK' ? (
                                                        <LinkIcon className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <FileText className="w-4 h-4 text-green-500" />
                                                    )}
                                                    <span className="text-sm truncate max-w-[300px]">
                                                        {selectedProject.resultValue}
                                                    </span>
                                                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Attachments */}
                                    {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                                        <div>
                                            <Label className="text-muted-foreground mb-2 block">Lampiran</Label>
                                            <div className="flex gap-2 flex-wrap">
                                                {selectedProject.attachments.map((file) => (
                                                    <a
                                                        key={file.id}
                                                        href={file.filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/50 hover:border-purple-500/50 transition-all duration-200 hover:scale-105"
                                                    >
                                                        {file.fileType.startsWith('image/') ? (
                                                            <FileImage className="w-4 h-4 text-purple-500" />
                                                        ) : (
                                                            <FileText className="w-4 h-4 text-purple-500" />
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
                                                        variant={selectedProject.status === key ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handleStatusChange(key)}
                                                        className={`${selectedProject.status === key ? config.color : ''} transition-all duration-200 hover:scale-105`}
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

            {/* Completion Dialog */}
            <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Project</DialogTitle>
                        <DialogDescription>
                            Provide the result of the project (File or Link) to complete it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant={completionData.type === 'LINK' ? 'default' : 'outline'}
                                onClick={() => setCompletionData({ ...completionData, type: 'LINK' })}
                                className="flex-1"
                            >
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Link
                            </Button>
                            <Button
                                type="button"
                                variant={completionData.type === 'FILE' ? 'default' : 'outline'}
                                onClick={() => setCompletionData({ ...completionData, type: 'FILE' })}
                                className="flex-1"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                File Attachment
                            </Button>
                        </div>

                        {completionData.type === 'LINK' ? (
                            <div className="space-y-2">
                                <Label>Result Link</Label>
                                <Input
                                    placeholder="https://google.drive.com/..."
                                    value={completionData.value || ''}
                                    onChange={(e) => setCompletionData({ ...completionData, value: e.target.value })}
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Result File</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setCompletionData({ ...completionData, file, name: file?.name || '' });
                                    }}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Result Name (Optional)</Label>
                            <Input
                                placeholder="e.g. Final Report PDF"
                                value={completionData.name || ''}
                                onChange={(e) => setCompletionData({ ...completionData, name: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>Cancel</Button>
                            <Button variant="neon" onClick={handleConfirmCompletion} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Project'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Created Project Detail Popup */}
            <Dialog open={isCreatedModalOpen} onOpenChange={setIsCreatedModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-500">
                            <CheckCircle2 className="w-5 h-5" />
                            Project Berhasil Dibuat!
                        </DialogTitle>
                        <DialogDescription>
                            Berikut adalah detail project yang Anda buat
                        </DialogDescription>
                    </DialogHeader>

                    {createdProject && (
                        <div className="space-y-4 animate-fadeIn">
                            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Judul</Label>
                                        <p className="font-medium">{createdProject.title}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground text-xs">Deskripsi</Label>
                                        <p className="text-sm">{createdProject.description}</p>
                                    </div>
                                    {formData.fileOrLink && (
                                        <div>
                                            <Label className="text-muted-foreground text-xs">Link</Label>
                                            <p className="text-sm text-purple-500">{formData.fileOrLink}</p>
                                        </div>
                                    )}
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
                            Hapus Project?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus project <strong>"{deleteTarget?.title}"</strong>?
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
