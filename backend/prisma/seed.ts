import { prisma } from '../src/lib/prisma.js';

async function main() {
    console.log('🌱 Iniciando o Seed de Categorias...');

    const defaultCategories = [
        { name: 'Alimentação', icon: 'utensils', color: '#FF5733' },
        { name: 'Moradia', icon: 'home', color: '#3357FF' },
        { name: 'Transporte', icon: 'car', color: '#F1C40F' },
        { name: 'Lazer', icon: 'gamepad', color: '#9B59B6' },
        { name: 'Saúde', icon: 'heartbeat', color: '#E74C3C' },
        { name: 'Educação', icon: 'book', color: '#3498DB' },
        { name: 'Salário', icon: 'money-bill-wave', color: '#2ECC71' }, // Categoria comum para Receita
        { name: 'Rendimento', icon: 'chart-line', color: '#1ABC9C' },   // Categoria comum para Receita
    ];

    for (const category of defaultCategories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {}, // Se já existir, não altera nada
            create: category
        });
    }

    console.log('✅ Seed finalizado com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
