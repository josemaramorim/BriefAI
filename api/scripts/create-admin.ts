import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  const email = 'admin@versatus.com';
  const password = 'admin123'; // Senha padrão
  const name = 'Admin Versatus';
  const tenantName = 'Versatus';

  try {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`✅ Usuário ${email} já existe!`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Para resetar a senha, delete o usuário primeiro.`);
      return;
    }

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        locale: 'pt',
      },
    });

    // Criar membership
    await prisma.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'OWNER',
      },
    });

    console.log('\n✅ Usuário admin criado com sucesso!');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`🏢 Tenant: ${tenantName}`);
    console.log('═══════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
