# Contexto Atual do Projeto: Nosso Caixa

Este arquivo serve como um "ponto de salvamento" para iniciar novas conversas com a IA, garantindo que ela saiba exatamente onde paramos, quais as regras e qual a nossa stack de tecnologia.

## 1. Visão Geral
**Nome:** Nosso Caixa
**Objetivo:** Sistema de gestão financeira pessoal e familiar, suportado por inteligência artificial para entrada de dados via linguagem natural.
**Estágio Atual:** Backend inicial configurado.

## 2. Tecnologias e Arquitetura (Stack)
- **Linguagem:** TypeScript (Configurado com `NodeNext` e regras estritas, como `noUncheckedIndexedAccess`).
- **Servidor HTTP:** Express (com `express.json()`).
- **Banco de Dados:** MySQL / MariaDB (rodando localmente, autenticando via `127.0.0.1`).
- **ORM:** Prisma **v7**.
  - *Atenção:* Estamos utilizando o pacote `@prisma/adapter-mariadb` e `mariadb` para conexão via *Driver Adapters*, lidando com a URL do banco via classe `URL` nativa do Node (para extrair credenciais do `.env`) e utilizando a flag `allowPublicKeyRetrieval: true` para compatibilidade com o MySQL 8.
- **Segurança & Validação:** `zod` (validação de schemas), `bcryptjs` (hash de senhas com salt 10), `jsonwebtoken` (autenticação JWT).

## 3. O que já foi implementado? (Issues Fechadas)
**Issue 2: Sistema de Autenticação e Usuários**
- **Modelagem:** Tabela `User` (`id` UUID, `name`, `email` unique, `password_hash`).
- **Controlador (`src/controllers/authController.ts`):** 
  - `register`: Valida dados via Zod, embaralha senha via Bcrypt, salva no Prisma.
  - `login`: Compara senha, gera JWT de 7 dias e devolve ao usuário.
- **Middleware (`src/middlewares/authMiddleware.ts`):** Protege rotas. Lê o `Authorization: Bearer <token>`, extrai e decodifica a assinatura usando o tipo oficial `jwt.JwtPayload`, e anexa o `userId` na requisição (interface `AuthRequest`).
- **Rotas (`src/routes/auth.routes.ts`):** `/auth/register` e `/auth/login`.

## 4. Onde paramos? (Próximo Passo)
**Issue 3: Criação e Gestão de Caixas (Grupos de Finanças Compartilhadas)**
- O conceito central do app ("Nosso Caixa"): Um **Caixa** é um grupo onde vários usuários podem se juntar para compartilhar e gerenciar finanças juntos (família, amigos, etc).
- Precisamos criar a entidade `Caixa` (ou `Group`/`SharedFund`) no `schema.prisma`.
  - Relacionamento: N:M (Muitos para Muitos). Um `User` pode participar de vários Caixas, e um `Caixa` possui vários Usuários.
- Criar o `CaixaController` para permitir criar um novo grupo, listar os grupos que o usuário pertence, e possivelmente convidar pessoas.
- As novas rotas devem obrigatoriamente passar pelo `authMiddleware`.

## 5. Regras Douradas do Usuário (AGENTS.md)
1. **Didática de Iniciante:** Tudo deve ser explicado passo a passo, detalhando "o porquê" de cada linha e de cada arquivo. Nível descritivo alto.
2. **Nenhuma Ação sem Aprovação:** Nunca gerar código, criar arquivos, commitar ou modificar o sistema sem antes perguntar e obter o "ok" do usuário.
3. **Padrão de Commits:** Utilizar a skill `commit_standard` (ex: `feat(modulo): descricao`).
4. **Criação de Issues:** Utilizar a skill `create_issues` para o planejamento de tarefas.
