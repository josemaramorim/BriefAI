import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedConfig() {
  console.log('🌱 Seeding app configurations...');

  // Configurações iniciais
  const configs = [
    {
      key: 'trial_days',
      value: '14',
      description: 'Número de dias do período de trial gratuito',
    },
    {
      key: 'trial_warning_percentage',
      value: '20',
      description: 'Porcentagem de tempo restante para mostrar aviso (20% = amarelo)',
    },
  ];

  for (const config of configs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
    console.log(`✅ Config "${config.key}" = "${config.value}"`);
  }

  console.log('✅ Configurations seeded successfully!');
}

seedConfig()
  .catch((e) => {
    console.error('❌ Error seeding config:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
