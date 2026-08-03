import { PrismaClient, Role, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default organization
  const org = await prisma.organization.upsert({
    where: { domain: 'enterprise.com' },
    update: {},
    create: {
      name: 'Acme Enterprise Solutions',
      domain: 'enterprise.com',
    },
  });
  console.log(`✅ Organization created/verified: ${org.name} (${org.id})`);

  // Create superadmin user
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@enterprise.com' },
    update: {},
    create: {
      email: 'admin@enterprise.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: Role.SUPERADMIN,
      permissions: ['ALL'],
      organizationId: org.id,
    },
  });
  console.log(`✅ Superadmin created: ${adminUser.email} (${adminUser.id})`);

  // Create default workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'acme-core-workspace' },
    update: {},
    create: {
      name: 'Acme Core Workspace',
      slug: 'acme-core-workspace',
      organizationId: org.id,
      members: {
        connect: [{ id: adminUser.id }],
      },
    },
  });
  console.log(`✅ Workspace created: ${workspace.name} (${workspace.id})`);

  // Create default project
  const project = await prisma.project.create({
    data: {
      name: 'Enterprise AI Implementation MVP',
      description: 'Cerefy OS deployment for Enterprise AI Governance & Workflow Automation',
      workspaceId: workspace.id,
      ownerId: adminUser.id,
    },
  });
  console.log(`✅ Project created: ${project.name} (${project.id})`);

  // Add initial requirements
  await prisma.requirement.createMany({
    data: [
      {
        title: 'Multi-Tenant RBAC & JWT Authentication',
        description: 'Provide secure authentication, refresh token rotation, and role-based permissions',
        projectId: project.id,
        priority: 1,
        status: Status.ACTIVE,
      },
      {
        title: 'Enterprise Knowledge Graph Engine',
        description: 'Store entity node connections and embeddings for context augmented generation',
        projectId: project.id,
        priority: 2,
        status: Status.ACTIVE,
      },
    ],
  });
  console.log(`✅ Requirements seeded`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
