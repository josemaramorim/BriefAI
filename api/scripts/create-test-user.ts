import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@brief.ai';
  const password = 'ChangeMe123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Delete if exists
  await prisma.user.deleteMany({
    where: { email },
  });

  // Create new user
  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      locale: 'pt-BR',
    },
  });

  console.log('✅ Usuário criado com sucesso!');
  console.log('Email:', email);
  console.log('Senha:', password);
  console.log('User ID:', user.id);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
