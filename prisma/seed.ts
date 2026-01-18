/**
 * Prisma Seed Script for SIAR Dashboard - Phase 2
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // ============================================
    // SEED DIVISIONS WITH CODES
    // ============================================
    const divisions = [
        { name: 'Underwriting', code: 'UW' },
        { name: 'Claims', code: 'CL' },
        { name: 'Finance', code: 'FN' },
        { name: 'Human Resources', code: 'HR' },
        { name: 'Information Technology', code: 'IT' },
        { name: 'Marketing', code: 'MK' },
        { name: 'Operations', code: 'OP' },
        { name: 'Legal', code: 'LG' },
    ];

    console.log('📁 Seeding divisions...');
    for (const div of divisions) {
        await prisma.division.upsert({
            where: { name: div.name },
            update: { code: div.code },
            create: div,
        });
    }

    // ============================================
    // SEED BRANCHES
    // ============================================
    const branches = [
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

    console.log('🏢 Seeding branches...');
    for (const name of branches) {
        await prisma.branch.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    // ============================================
    // SEED USERS
    // ============================================
    console.log('👤 Seeding users...');

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Admin IT User
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@ramayana.co.id' },
        update: {},
        create: {
            nomor_id: 'IT-001',
            nama_lengkap: 'Administrator SIAR',
            email: 'admin@ramayana.co.id',
            password: hashedPassword,
            divisi: 'Information Technology',
            cabang: 'Jakarta Pusat',
            role: 'IT',
        },
    });

    // Regular Non-IT User
    const regularUser = await prisma.user.upsert({
        where: { email: 'staff@ramayana.co.id' },
        update: {},
        create: {
            nomor_id: 'UW-001',
            nama_lengkap: 'Staff Underwriting',
            email: 'staff@ramayana.co.id',
            password: hashedPassword,
            divisi: 'Underwriting',
            cabang: 'Jakarta Pusat',
            role: 'NON_IT',
        },
    });

    // ============================================
    // SEED SAMPLE MAINTENANCE ISSUES
    // ============================================
    console.log('🔧 Seeding maintenance issues...');

    await prisma.maintenanceIssue.deleteMany({});

    await prisma.maintenanceIssue.createMany({
        data: [
            {
                kategori: 'Hardware',
                jenis_masalah: 'Printer tidak berfungsi',
                deskripsi: 'Printer di lantai 2 tidak dapat mencetak dokumen. Sudah dicoba restart tetapi masih bermasalah.',
                status: 'PENDING',
                deadline: new Date('2026-01-10'),
                userId: regularUser.id,
            },
            {
                kategori: 'Software',
                jenis_masalah: 'Aplikasi sering crash',
                deskripsi: 'Aplikasi Excel sering tidak responding ketika membuka file besar',
                status: 'IN_PROGRESS',
                deadline: new Date('2026-01-08'),
                userId: regularUser.id,
            },
            {
                kategori: 'Network',
                jenis_masalah: 'WiFi lambat di ruang meeting',
                deskripsi: 'Koneksi WiFi sangat lambat di ruang meeting lantai 3',
                status: 'RESOLVED',
                userId: regularUser.id,
            },
        ],
    });

    // ============================================
    // SEED SAMPLE PROJECTS
    // ============================================
    console.log('📂 Seeding projects...');

    await prisma.projectItem.deleteMany({});

    await prisma.projectItem.createMany({
        data: [
            {
                title: 'Dokumen SOP Underwriting 2026',
                description: 'Update dokumen SOP untuk proses underwriting tahun 2026',
                fileOrLink: 'https://drive.google.com/file/sop-underwriting',
                status: 'PENDING',
                deadline: new Date('2026-01-20'),
                userId: regularUser.id,
            },
            {
                title: 'Template Laporan Klaim',
                description: 'Pembuatan template baru untuk laporan klaim berformat Excel',
                fileOrLink: '',
                status: 'IN_PROGRESS',
                deadline: new Date('2026-01-15'),
                userId: regularUser.id,
            },
        ],
    });

    // ============================================
    // SEED SAMPLE EVENTS
    // ============================================
    console.log('📅 Seeding events...');

    await prisma.event.deleteMany({});

    await prisma.event.createMany({
        data: [
            {
                date: new Date('2026-01-15'),
                title: 'Training Sistem SIAR',
                description: 'Pelatihan penggunaan sistem SIAR untuk seluruh karyawan',
                color: 'blue',
                eventType: 'custom',
                userId: adminUser.id,
            },
            {
                date: new Date('2026-01-20'),
                title: 'Rapat Divisi IT',
                description: 'Rapat bulanan divisi IT untuk evaluasi sistem',
                color: 'green',
                eventType: 'custom',
                userId: adminUser.id,
            },
            {
                date: new Date('2026-01-25'),
                title: 'Deadline Laporan Q1',
                description: 'Batas waktu pengumpulan laporan kuartal pertama',
                color: 'red',
                eventType: 'custom',
                userId: adminUser.id,
            },
        ],
    });

    // ============================================
    // SEED SAMPLE NOTIFICATIONS
    // ============================================
    console.log('🔔 Seeding notifications...');

    await prisma.notification.deleteMany({});

    await prisma.notification.createMany({
        data: [
            {
                userId: regularUser.id,
                type: 'maintenance_status',
                title: 'Status Maintenance Diperbarui',
                message: 'Laporan maintenance "Printer tidak berfungsi" Anda sedang dalam proses penanganan.',
                isRead: false,
            },
            {
                userId: regularUser.id,
                type: 'project_status',
                title: 'Project Request Diterima',
                message: 'Request project "Template Laporan Klaim" telah diterima dan sedang dikerjakan.',
                isRead: true,
            },
        ],
    });

    // ============================================
    // SEED SAMPLE LOG
    // ============================================
    console.log('📝 Seeding logs...');

    await prisma.log.deleteMany({});

    await prisma.log.createMany({
        data: [
            {
                userId: adminUser.id,
                type: 'LOGIN',
                description: 'User logged in successfully',
                status: 'SUCCESS',
                ip: '127.0.0.1',
            },
            {
                userId: regularUser.id,
                type: 'CREATE',
                description: 'Created maintenance issue: Printer tidak berfungsi',
                status: 'SUCCESS',
                ip: '192.168.1.100',
            },
        ],
    });

    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('   IT Admin: admin@ramayana.co.id / password123');
    console.log('   Staff: staff@ramayana.co.id / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
