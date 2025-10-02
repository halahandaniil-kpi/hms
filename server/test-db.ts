import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const newUser = await prisma.user.create({
        data: {
            email: 'test@test.com',
            passwordHash: '12345',
            fullName: 'Test User',
        },
    });
    console.log('Користувача створено успішно:', newUser);
    const allUsers = await prisma.user.findMany();
    console.log('Всі користувачі:', allUsers);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
