# 📖 Contexto Atual - Nosso Caixa Backend

Este documento serve como um registro vivo (Walkthrough Geral) de todas as implementações já concluídas na API do Nosso Caixa, detalhando as estruturas de banco de dados, regras de negócio e cobertura de testes alcançada.

---

## 📌 1. Autenticação e Usuários
- **Banco de Dados**: Tabela `User` criada.
- **Funcionalidades**: Registro de usuário (com hash seguro via `bcryptjs`) e Login (geração de token JWT).
- **Segurança**: Criação do `authMiddleware` para proteger e bloquear o acesso não autorizado em todas as rotas restritas.

## 📌 2. Gestão de Grupos (Issue 3)
- **Banco de Dados**: Criação da tabela `Group` e da tabela pivot `UserGroup` (liga o `User` ao `Group` atribuindo papéis/roles como `OWNER` ou `MEMBER`).
- **Funcionalidades**: 
  - `POST /groups`: Criação de grupo.
  - `GET /groups`: Listagem de grupos pertencentes ao usuário.
  - `POST /groups/:groupId/add-member`: Adição de novos membros ao grupo.
- **Segurança**: Isolamento de dados, impedindo acessos cruzados.

## 📌 3. Infraestrutura de Testes Unitários (Issue 9)
- **Ferramentas**: Configuração oficial do `vitest` em conjunto com o `vitest-mock-extended`.
- **Design Pattern**: Implementação do arquivo `prisma.mock.ts` para injetar instâncias falsas do banco de dados na execução dos controladores. O banco real não é tocado durante a validação de regras.
- **Mock Interno**: Hashing de senhas e geração de tokens foram "mockados" para que a suíte de testes seja ultra-rápida.

## 📌 4. Módulo Financeiro e Transações (Issue 4)
- **Banco de Dados**: Modelagem rica com `Category` (Categorias Globais) e `Transaction` (Entradas e Saídas).
- **Seed (Dados Padrão)**: Criação do script `prisma/seed.ts` e sua inserção no pacote, populando categorias como "Alimentação", "Moradia", "Salário", etc.
- **Funcionalidades**: Rotas de `POST` (Criar), `GET` (Listar), e `DELETE` (Remover) para transações. Travas robustas (retornando `403 Forbidden`) para barrar intrometidos.

## 📌 5. Módulo de Parcelamentos / Installments (Issue 5)
- **Banco de Dados**: Tabela `Installment` e coluna estrangeira `installment_id` conectada à `Transaction`.
- **Motor Matemático**: Rota responsável por pegar o valor total de uma compra, dividir pelo número de parcelas, pular a data mês a mês (`+1`) e fazer inserções em lote (Batch Insert) espelhando `N` transações.
- **Integridade**: Uso de `prisma.$transaction([])` para garantir que o insert das múltiplas parcelas ocorra em operação atômica (tudo ou nada).

## 📌 6. Despesas Fixas Recorrentes (Issue 6)
- **Banco de Dados**: Tabela `FixedExpense` guardando metadados de recorrência (ex: "vence dia 10"). Criação do campo relacional `fixed_expense_id` em `Transaction`.
- **Gerador Mensal Inteligente**: Rota `POST /generate-month` que varre as contas fixas cadastradas no grupo. Ela checa, no banco, se a transação do mês de fato já foi gerada e, se não, cria pontualmente. Proibição absoluta de duplicação.

## 📌 7. Integração IA com Gemini (Issue 7)
- **Tecnologia**: SDK `@google/genai` utilizando o modelo ultrarrápido `gemini-2.5-flash-lite`.
- **Prompt Engineering**: Criação de um System Prompt restrito que força o Gemini a responder EXATAMENTE um objeto JSON validável, barrando alucinações (com validação via `zod` em cima do que a IA responde).
- **Auto-Classificação Dinâmica**: A IA é ensinada em tempo real com as Categorias ativas no banco de dados do grupo. Ex: Se o usuário diz "Comprei dipirona na farmácia", a IA escaneia as categorias e crava "Saúde" no campo `category_id`.
- **Roteamento Inteligente**: O endpoint `/ai/parse-transaction` lê o objeto devolvido pela IA e identifica automaticamente se deve acionar o motor de "Transação Simples" ou o motor atômico de "Parcelamentos" caso o usuário mencione parcelas.
- **Testes com Mocks Globais**: O `GoogleGenAI` foi completamente mockado no arquivo de testes usando `vi.hoisted`, garantindo que a suíte passe em milissegundos sem gastar créditos de API.

---

## 🧪 Status Atual (Qualidade)
O projeto conta hoje com **51 cenários de testes unitários passando**, englobando falhas de payload (Zod 400), quebras de segurança (401 e 403), não encontrados (404), caminhos de sucesso (200/201) e cenários da IA (incluindo IA inventando dado errado).
Toda a arquitetura MVC (Separando Controllers das Rotas) está solidificada e seguindo o TDD (Test Driven Development).
