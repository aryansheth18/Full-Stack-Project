import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.rating.deleteMany();
  await prisma.store.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash('Admin@12345', SALT_ROUNDS);
  const userPasswordHash = await bcrypt.hash('User@12345', SALT_ROUNDS);
  const ownerPasswordHash = await bcrypt.hash('Owner@12345', SALT_ROUNDS);

  // 1. Create Default Admin User
  const admin = await prisma.user.create({
    data: {
      name: 'Alexander Vance Harrison',
      email: 'admin@storerating.com',
      passwordHash: adminPasswordHash,
      address: '100 Executive Boulevard, Suite 500, New York, NY 10001',
      role: Role.ADMIN
    }
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 2. Create Store Owners
  const owner1 = await prisma.user.create({
    data: {
      name: 'Eleanor Vance-Montgomery',
      email: 'owner.eleanor@apextech.com',
      passwordHash: ownerPasswordHash,
      address: '450 Market Street, Financial District, San Francisco, CA 94105',
      role: Role.STORE_OWNER
    }
  });

  const owner2 = await prisma.user.create({
    data: {
      name: 'Marcus Aurelius Thorne',
      email: 'owner.marcus@artisanbakery.com',
      passwordHash: ownerPasswordHash,
      address: '1288 Grand Boulevard, Loop District, Chicago, IL 60601',
      role: Role.STORE_OWNER
    }
  });

  const owner3 = await prisma.user.create({
    data: {
      name: 'Sophia Isabella Sterling',
      email: 'owner.sophia@luxecouture.com',
      passwordHash: ownerPasswordHash,
      address: '742 Fifth Avenue, Manhattan, New York, NY 10019',
      role: Role.STORE_OWNER
    }
  });

  // 3. Create Stores
  const store1 = await prisma.store.create({
    data: {
      name: 'Apex Electronics & Tech Hub',
      email: 'contact@apextech.com',
      address: '450 Market Street, San Francisco, CA 94105',
      ownerId: owner1.id
    }
  });

  const store2 = await prisma.store.create({
    data: {
      name: 'Artisan Bakers & Coffee Roasters',
      email: 'hello@artisanbakery.com',
      address: '1288 Grand Boulevard, Chicago, IL 60601',
      ownerId: owner2.id
    }
  });

  const store3 = await prisma.store.create({
    data: {
      name: 'Luxe Couture Fashion House',
      email: 'concierge@luxecouture.com',
      address: '742 Fifth Avenue, New York, NY 10019',
      ownerId: owner3.id
    }
  });

  console.log(`✅ Created 3 stores.`);

  // 4. Create Normal Users
  const user1 = await prisma.user.create({
    data: {
      name: 'Benjamin Franklin Roosevelt',
      email: 'benjamin.roosevelt@example.com',
      passwordHash: userPasswordHash,
      address: '350 Pennsylvania Avenue, Washington, DC 20004',
      role: Role.USER
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Charlotte Elizabeth Pemberton',
      email: 'charlotte.pemberton@example.com',
      passwordHash: userPasswordHash,
      address: '88 Newbury Street, Boston, MA 02116',
      role: Role.USER
    }
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Dominic Sebastian Vance',
      email: 'dominic.vance@example.com',
      passwordHash: userPasswordHash,
      address: '1200 Ocean Drive, Miami Beach, FL 33139',
      role: Role.USER
    }
  });

  const user4 = await prisma.user.create({
    data: {
      name: 'Genevieve Juliette Dupont',
      email: 'genevieve.dupont@example.com',
      passwordHash: userPasswordHash,
      address: '500 Pike Street, Seattle, WA 98101',
      role: Role.USER
    }
  });

  console.log(`✅ Created 4 normal users.`);

  // 5. Submit Initial Ratings
  await prisma.rating.createMany({
    data: [
      { userId: user1.id, storeId: store1.id, ratingValue: 5 },
      { userId: user2.id, storeId: store1.id, ratingValue: 4 },
      { userId: user3.id, storeId: store1.id, ratingValue: 5 },

      { userId: user1.id, storeId: store2.id, ratingValue: 5 },
      { userId: user2.id, storeId: store2.id, ratingValue: 5 },
      { userId: user4.id, storeId: store2.id, ratingValue: 4 },

      { userId: user3.id, storeId: store3.id, ratingValue: 3 },
      { userId: user4.id, storeId: store3.id, ratingValue: 4 }
    ]
  });

  console.log(`✅ Created sample ratings.`);
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
