import { PrismaClient, Currency, UserRole, TenantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'ChangeMe123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Plano Starter (grátis)
  const planStarter = await prisma.plan.upsert({
    where: { name: 'Starter' },
    update: {},
    create: {
      name: 'Starter',
      priceCents: 0,
      currency: Currency.USD,
      limitsJson: {
        briefingsLimit: 200,
        aiTokens: 200000,
        storageMb: 5120,
        pdfExports: 200,
      },
      isDefault: true,
    },
  });

  // Plano Pro
  const planPro = await prisma.plan.upsert({
    where: { name: 'Pro' },
    update: {},
    create: {
      name: 'Pro',
      priceCents: 4900,
      currency: Currency.USD,
      limitsJson: {
        briefingsLimit: 2000,
        aiTokens: 2000000,
        storageMb: 20480,
        pdfExports: 2000,
      },
      isDefault: false,
    },
  });

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@brief.ai' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@brief.ai',
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      locale: 'pt-BR',
    },
  });

  // Tenant Demo
  const tenantDemo = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Studio',
      slug: 'demo',
      status: TenantStatus.ACTIVE,
      planId: planStarter.id,
      limitsOverride: {},
    },
  });

  // Arquiteto Demo (Tenant Admin)
  const architectDemo = await prisma.user.upsert({
    where: { email: 'arquiteto@brief.ai' },
    update: {},
    create: {
      name: 'Arquiteto Demo',
      email: 'arquiteto@brief.ai',
      passwordHash: hashedPassword,
      role: UserRole.TENANT_ADMIN,
      locale: 'pt-BR',
    },
  });

  // Membership do Arquiteto Demo no Tenant Demo
  await prisma.membership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenantDemo.id,
        userId: architectDemo.id,
      },
    },
    update: {},
    create: {
      tenantId: tenantDemo.id,
      userId: architectDemo.id,
      role: 'TENANT_ADMIN',
    },
  });

  // Template Demo
  const templateDemo = await prisma.template.create({
    data: {
      tenantId: tenantDemo.id,
      ownerId: architectDemo.id,
      title: 'Apartamento 120m2',
      jsonSchema: {
        title: 'Apartamento 120m2',
        sections: [
          {
            title: 'Estilo',
            questions: [
              {
                type: 'image-choice',
                question: 'Qual estilo você prefere?',
                options: [
                  { image: '/img/industrial.jpg', label: 'Industrial' },
                  { image: '/img/minimalista.jpg', label: 'Minimalista' },
                ],
              },
            ],
          },
          {
            title: 'Cômodos',
            questions: [
              {
                type: 'boolean',
                question: 'Deseja integração sala-cozinha?',
              },
            ],
          },
        ],
      },
      version: 1,
      isPublic: true,
    },
  });

  // Template Version
  await prisma.templateVersion.create({
    data: {
      tenantId: tenantDemo.id,
      templateId: templateDemo.id,
      version: 1,
      jsonSchema: templateDemo.jsonSchema as any,
    },
  });

  console.log('✅ Seed completed!');
  console.log({
    planStarter,
    planPro,
    superAdmin,
    tenantDemo,
    architectDemo,
    templateDemo,
  });
  console.log('🔐 Default seed password:', defaultPassword);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
