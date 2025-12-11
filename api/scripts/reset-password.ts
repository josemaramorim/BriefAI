import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'admin@versatus.com';
  const newPassword = 'Admin123!'; // Nova senha

  try {
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { tenant: true } } }
    });

    if (!user) {
      console.log(`❌ Usuário ${email} não encontrado no banco de dados.`);
      console.log('\n💡 Use a opção de registro para criar uma nova conta.');
      return;
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword }
    });

    console.log('✅ Senha resetada com sucesso!');
    console.log('\n📧 Email:', email);
    console.log('🔑 Nova senha:', newPassword);
    console.log('\n🏢 Tenant(s):');
    user.memberships.forEach(m => {
      console.log(`   - ${m.tenant.name} (${m.role})`);
    });

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
