import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed global settings
  const setting = await prisma.setting.upsert({
    where: { id: 'global_settings' },
    update: {},
    create: {
      id: 'global_settings',
      officeStartTime: '09:00',
      officeEndTime: '17:00',
      emailsEnabled: true,
    },
  });
  console.log('Office settings seeded:', setting);

  // 2. Create hashed passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const headPassword = await bcrypt.hash('head123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // 3. Seed users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@innovibe.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@innovibe.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin seeded:', admin.email);

  const head = await prisma.user.upsert({
    where: { email: 'head@innovibe.com' },
    update: {},
    create: {
      name: 'Sarah Connor',
      email: 'head@innovibe.com',
      password: headPassword,
      role: 'DEPT_HEAD',
    },
  });
  console.log('Department Head seeded:', head.email);

  // Create engineering department and link head
  const dept = await prisma.department.upsert({
    where: { name: 'Engineering' },
    update: {
      headId: head.id,
    },
    create: {
      name: 'Engineering',
      headId: head.id,
    },
  });
  console.log('Engineering Department seeded:', dept.name);

  // Update head's departmentId now that the department is created
  await prisma.user.update({
    where: { id: head.id },
    data: { departmentId: dept.id },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@innovibe.com' },
    update: {
      departmentId: dept.id,
    },
    create: {
      name: 'John Doe',
      email: 'employee@innovibe.com',
      password: employeePassword,
      role: 'EMPLOYEE',
      departmentId: dept.id,
    },
  });
  console.log('Employee seeded:', employee.email);

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
