import { prisma } from './src/lib/prisma.js'

const categories = [
  // Despesas
  { name: 'Alimentação', icon: 'food', color: '#EF4444' }, // Vermelho
  { name: 'Moradia (Aluguel/Condomínio)', icon: 'home', color: '#F97316' }, // Laranja
  { name: 'Contas (Água/Luz/Internet)', icon: 'bills', color: '#F59E0B' }, // Amarelo escuro
  { name: 'Transporte (Combustível/Uber)', icon: 'car', color: '#EAB308' }, // Amarelo
  { name: 'Saúde & Farmácia', icon: 'health', color: '#22C55E' }, // Verde
  { name: 'Educação', icon: 'education', color: '#3B82F6' }, // Azul
  { name: 'Lazer & Restaurantes', icon: 'entertainment', color: '#A855F7' }, // Roxo
  { name: 'Compras & Vestuário', icon: 'shopping', color: '#EC4899' }, // Rosa
  { name: 'Pet', icon: 'pet', color: '#8B5CF6' }, // Violeta
  { name: 'Serviços & Assinaturas', icon: 'services', color: '#64748B' }, // Cinza
  { name: 'Cuidados Pessoais', icon: 'personal', color: '#F43F5E' }, // Rose
  { name: 'Impostos & Taxas', icon: 'taxes', color: '#78716C' }, // Stone
  
  // Receitas e Investimentos
  { name: 'Salário', icon: 'salary', color: '#10B981' }, // Esmeralda (Verde Finza)
  { name: 'Rendimentos & Dividendos', icon: 'investments', color: '#14B8A6' }, // Teal
  { name: 'Transferência/Pix', icon: 'transfer', color: '#0EA5E9' }, // Sky
  { name: 'Vendas', icon: 'sales', color: '#06B6D4' }, // Cyan
  { name: 'Outros', icon: 'other', color: '#94A3B8' }, // Slate
]

async function main() {
  console.log('Seeding categories to database...')
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {}, // Não faz nada se já existir
      create: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      }
    })
  }
  console.log('Categorias inseridas com sucesso!')
}

main()
  .catch(e => {
    console.error('Erro ao popular categorias:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
