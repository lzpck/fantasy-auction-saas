# War Room Fantasy

Sistema SaaS de leilões para ligas de fantasy football, oferecendo uma plataforma completa para gestão de drafts, lances em tempo real e administração de salas de leilão personalizadas.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Requisitos do Sistema](#requisitos-do-sistema)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando o Projeto](#executando-o-projeto)
- [Estrutura de Diretórios](#estrutura-de-diretórios)
- [Exemplos de Uso](#exemplos-de-uso)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Contribuindo](#contribuindo)
- [Licença](#licença)
- [Créditos e Agradecimentos](#créditos-e-agradecimentos)

## Sobre o Projeto

O **War Room Fantasy** é uma plataforma SaaS desenvolvida para facilitar a realização de leilões em ligas de fantasy football. O sistema permite que administradores criem e gerenciem salas de leilão customizadas, enquanto participantes podem fazer lances em tempo real, acompanhar o progresso do draft e gerenciar seus times de forma intuitiva.

### Principais Diferenciais

- **Lances em Tempo Real**: Sincronização automática de lances e atualizações instantâneas para todos os participantes
- **Gestão Completa**: Configuração detalhada de regras financeiras, duração de lances e contratos
- **Importação de Jogadores**: Suporte para importação de listas de jogadores via CSV/Excel
- **Autenticação Segura**: Sistema robusto de autenticação de usuários e times com PIN de acesso
- **Interface Responsiva**: Design moderno e adaptável para desktop e dispositivos móveis

## Funcionalidades Principais

### Para Administradores

- Criação e configuração de salas de leilão personalizadas
- Importação de jogadores via CSV ou Excel
- Gerenciamento de times participantes
- Controle de status do leilão (Rascunho, Aberto, Pausado, Concluído)
- Configuração de regras financeiras (Salary Cap, FAAB)
- Definição de regras de contratos e duração de lances
- Dashboard administrativo com visão completa da sala

### Para Participantes

- Acesso seguro aos times via PIN
- Visualização em tempo real dos lances ativos
- Submissão de lances com valores e anos de contrato
- Acompanhamento do orçamento disponível
- Histórico completo de lances por jogador
- Grade de times com estatísticas atualizadas

### Recursos Técnicos

- Sincronização em tempo real via polling otimizado
- Validação de lances e regras de negócio no servidor
- Persistência de dados com SQLite via Prisma ORM
- API REST para integração e extensibilidade
- Sistema de notificações para eventos importantes

## Requisitos do Sistema

### Software Necessário

- **Node.js**: versão 18.x ou superior
- **npm**: versão 9.x ou superior (ou yarn/pnpm/bun como alternativa)
- **Git**: para controle de versão

### Sistemas Operacionais Suportados

- Windows 10/11
- macOS 10.15 ou superior
- Linux (Ubuntu 20.04+, Debian, Fedora, etc.)

### Requisitos de Hardware Mínimos

- 2 GB de RAM
- 500 MB de espaço em disco
- Conexão com a internet para instalação de dependências

## Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/fantasy-auction-saas.git
cd fantasy-auction-saas
```

### 2. Instale as Dependências

```bash
npm install
```

Ou, se preferir utilizar gerenciadores alternativos:

```bash
# Usando yarn
yarn install

# Usando pnpm
pnpm install

# Usando bun
bun install
```

### 3. Configure o Prisma

Gere o cliente do Prisma e crie o banco de dados:

```bash
npx prisma generate
npx prisma db push
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Banco de Dados
DATABASE_URL="file:./dev.db"

# Autenticação (gere uma chave secreta forte)
JWT_SECRET="sua-chave-secreta-muito-segura-aqui"

# Ambiente
NODE_ENV="development"
```

### Gerando Chave JWT Secreta

Para gerar uma chave JWT segura, execute:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configurações Opcionais

Para integração com o Sleeper (API de fantasy football):

```env
SLEEPER_API_URL="https://api.sleeper.app/v1"
```

## Executando o Projeto

### Modo Desenvolvimento

Inicie o servidor de desenvolvimento com hot-reload:

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Modo Produção

Para executar em produção:

```bash
# Compilar o projeto
npm run build

# Iniciar o servidor de produção
npm start
```

### Verificação de Código

Execute o linter para verificar a qualidade do código:

```bash
npm run lint
```

## Estrutura de Diretórios

```
fantasy-auction-saas/
├── prisma/                    # Configuração do banco de dados
│   └── schema.prisma         # Schema do Prisma (modelos de dados)
├── public/                    # Arquivos estáticos públicos
├── src/
│   ├── app/                  # Rotas e páginas do Next.js (App Router)
│   │   ├── (auth)/          # Grupo de rotas de autenticação
│   │   │   ├── login/       # Página de login
│   │   │   └── register/    # Página de registro
│   │   ├── actions/         # Server Actions do Next.js
│   │   ├── api/             # Rotas de API REST
│   │   ├── dashboard/       # Dashboard do usuário
│   │   ├── room/            # Páginas de salas de leilão
│   │   └── layout.tsx       # Layout principal
│   ├── components/           # Componentes React reutilizáveis
│   │   ├── admin/           # Componentes administrativos
│   │   ├── auction/         # Componentes de leilão
│   │   ├── dashboard/       # Componentes do dashboard
│   │   └── ui/              # Componentes de interface base
│   ├── constants/            # Constantes da aplicação
│   ├── hooks/                # React Hooks customizados
│   ├── lib/                  # Utilitários e configurações
│   └── types/                # Definições de tipos TypeScript
├── docs/                      # Documentação adicional
├── .env                       # Variáveis de ambiente (não versionado)
├── next.config.ts            # Configuração do Next.js
├── tailwind.config.ts        # Configuração do Tailwind CSS
├── tsconfig.json             # Configuração do TypeScript
└── package.json              # Dependências e scripts
```

### Descrição dos Principais Diretórios

- **`/prisma`**: Contém o schema do banco de dados e migrações
- **`/src/app`**: Implementação do App Router do Next.js 13+ com file-based routing
- **`/src/components`**: Componentes React organizados por contexto de uso
- **`/src/actions`**: Server Actions para mutações de dados seguras
- **`/src/api`**: Endpoints REST para sincronização em tempo real
- **`/src/hooks`**: Lógica reutilizável de estado e efeitos
- **`/src/types`**: Definições de tipos compartilhadas

## Exemplos de Uso

### 1. Criando uma Nova Sala de Leilão

Após fazer login, acesse o dashboard e clique em "Criar Nova Sala":

```typescript
// Exemplo de configuração de sala
{
  nome: "Liga 2024 - Leilão Principal",
  sleeperId: "opcional-id-sleeper",
  configuracoes: {
    financeiro: {
      salaryCap: 200,
      minimoBid: 1,
      incrementoMinimo: 1
    },
    leilao: {
      duracaoLance: 60, // segundos
      permitirRetirada: true
    },
    contratos: {
      anosMinimos: 1,
      anosMaximos: 3
    }
  }
}
```

### 2. Importando Jogadores

Na página administrativa da sala, utilize a funcionalidade de importação:

**Formato CSV esperado:**

```csv
name,position,nflTeam
Patrick Mahomes,QB,KC
Josh Allen,QB,BUF
Christian McCaffrey,RB,SF
```

**Formato Excel (.xlsx) esperado:**
| name | position | nflTeam |
|------|----------|---------|
| Patrick Mahomes | QB | KC |
| Josh Allen | QB | BUF |

### 3. Fazendo um Lance

Os participantes podem fazer lances através da interface do leilão:

```typescript
// Exemplo de estrutura de lance
{
  jogadorId: "clx123abc...",
  timeId: "clx456def...",
  valor: 45,
  anosContrato: 2
}
```

### 4. Acessando a API

A aplicação expõe endpoints REST para sincronização:

```bash
# Obter itens ativos da sala
GET /api/room/[id]/items

# Sincronizar estado da sala (para admins)
GET /api/room/[id]/sync

# Obter itens ativos (visão admin)
GET /api/room/[id]/admin/active-items
```

## Tecnologias Utilizadas

### Framework e Bibliotecas Core

- **[Next.js 16](https://nextjs.org/)**: Framework React com App Router e Server Actions
- **[React 19](https://react.dev/)**: Biblioteca de interface do usuário
- **[TypeScript 5](https://www.typescriptlang.org/)**: Superset tipado de JavaScript

### Estilização e UI

- **[Tailwind CSS 4](https://tailwindcss.com/)**: Framework CSS utility-first
- **[Framer Motion](https://www.framer.com/motion/)**: Biblioteca de animações
- **[Lucide React](https://lucide.dev/)**: Conjunto de ícones modernos
- **[clsx](https://github.com/lukeed/clsx)** + **[tailwind-merge](https://github.com/dcastil/tailwind-merge)**: Utilitários para classes CSS

### Banco de Dados e ORM

- **[Prisma 6](https://www.prisma.io/)**: ORM moderno para TypeScript
- **[SQLite](https://www.sqlite.org/)**: Banco de dados relacional leve

### Autenticação e Segurança

- **[jose](https://github.com/panva/jose)**: Biblioteca para JWT
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)**: Hashing de senhas

### Gerenciamento de Estado e Dados

- **[SWR](https://swr.vercel.app/)**: Hooks para data fetching e caching
- **Zustand** (via hooks customizados): Gerenciamento de estado leve

### Utilitários

- **[Papa Parse](https://www.papaparse.com/)**: Parser de CSV
- **[xlsx](https://sheetjs.com/)**: Leitura e escrita de arquivos Excel
- **[dotenv](https://github.com/motdotla/dotenv)**: Carregamento de variáveis de ambiente

### Ferramentas de Desenvolvimento

- **[ESLint 9](https://eslint.org/)**: Linting de código
- **[eslint-config-next](https://nextjs.org/docs/app/building-your-application/configuring/eslint)**: Configuração ESLint para Next.js

## Contribuindo

Contribuições são muito bem-vindas! Este projeto segue as boas práticas de código aberto e agradece a participação da comunidade.

### Como Contribuir

1. **Fork o Repositório**

   ```bash
   # Clique no botão "Fork" no GitHub
   ```

2. **Clone seu Fork**

   ```bash
   git clone https://github.com/seu-usuario/fantasy-auction-saas.git
   cd fantasy-auction-saas
   ```

3. **Crie uma Branch para sua Feature**

   ```bash
   git checkout -b feature/minha-nova-funcionalidade
   ```

4. **Faça suas Alterações**

   - Escreva código limpo e bem documentado
   - Siga as convenções de código do projeto
   - Adicione testes quando aplicável

5. **Commit suas Mudanças**

   ```bash
   git add .
   git commit -m "feat: adiciona funcionalidade X"
   ```

   **Convenções de Commit:**

   - `feat:` nova funcionalidade
   - `fix:` correção de bug
   - `docs:` alterações na documentação
   - `style:` formatação, ponto e vírgula, etc
   - `refactor:` refatoração de código
   - `test:` adição ou correção de testes
   - `chore:` atualização de dependências, configurações, etc

6. **Push para seu Fork**

   ```bash
   git push origin feature/minha-nova-funcionalidade
   ```

7. **Abra um Pull Request**
   - Acesse o repositório original no GitHub
   - Clique em "New Pull Request"
   - Descreva suas alterações detalhadamente
   - Aguarde a revisão da equipe

### Diretrizes de Código

- **TypeScript**: Todo código deve ser tipado adequadamente
- **Componentes**: Prefira componentes funcionais com hooks
- **Nomenclatura**: Use camelCase para variáveis e PascalCase para componentes
- **Formatação**: O projeto usa a configuração padrão do ESLint
- **Commits**: Use mensagens de commit descritivas e em português

### Reportando Bugs

Encontrou um bug? Ajude-nos a melhorar!

1. Verifique se o bug já não foi reportado nas [Issues](https://github.com/seu-usuario/fantasy-auction-saas/issues)
2. Crie uma nova issue com o template de bug report
3. Descreva o comportamento esperado vs. observado
4. Inclua passos para reproduzir o problema
5. Adicione screenshots se possível

### Sugerindo Melhorias

Tem uma ideia para melhorar o projeto?

1. Abra uma issue com o template de feature request
2. Descreva a funcionalidade desejada
3. Explique o caso de uso e benefícios
4. Discuta a implementação com a comunidade

## Licença

Este projeto está licenciado sob a **Licença MIT**.

A Licença MIT é uma licença de software permissiva que permite reutilização dentro de software proprietário, desde que a licença seja distribuída com o software. Você está livre para usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias do software.

Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

### Resumo da Licença

- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ⚠️ Sem garantia
- ⚠️ Limitação de responsabilidade

## Créditos e Agradecimentos

### Autor Principal

- **Desenvolvedor**: Leandro Zepechouka

### Bibliotecas e Ferramentas Open Source

Agradecimento especial aos mantenedores e contribuidores dos seguintes projetos que tornaram este sistema possível:

- **Vercel** - pela excelente plataforma Next.js e hospedagem
- **Prisma** - pelo ORM intuitivo e poderoso
- **Tailwind Labs** - pelo framework CSS que acelera o desenvolvimento
- **A comunidade React** - pelo ecossistema rico e colaborativo

### Inspirações

- **Sleeper App** - referência em plataformas de fantasy football
- **ESPN Fantasy** - pelos conceitos de leilão e draft
- **Yahoo Fantasy Sports** - pela experiência de usuário em ligas

### Agradecimentos Especiais

- À comunidade de fantasy football brasileira
- A todos os beta testers que ajudaram a melhorar o sistema
- Aos contribuidores que dedicaram tempo para melhorar este projeto

---

## Contato e Suporte

- **Documentação**: Consulte a pasta [docs/](docs/) para documentação adicional
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/fantasy-auction-saas/issues)
- **Discussões**: [GitHub Discussions](https://github.com/seu-usuario/fantasy-auction-saas/discussions)

---

**Desenvolvido com dedicação para a comunidade de fantasy football** 🏈
