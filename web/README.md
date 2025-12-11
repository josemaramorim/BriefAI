# BriefAI - Frontend

Frontend do BriefAI construído com Next.js 14+, TypeScript, Tailwind CSS e shadcn/ui.

## 🚀 Tecnologias

- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS 4
- **Componentes:** shadcn/ui + Radix UI
- **Estado:** Zustand
- **Formulários:** React Hook Form + Zod
- **HTTP Client:** Axios
- **i18n:** next-intl (pt, en, es)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
```

## ⚙️ Configuração

Edite o arquivo `.env.local`:

```env
# URL da API backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Configuração do app
NEXT_PUBLIC_APP_NAME=BriefAI
NEXT_PUBLIC_DEFAULT_LOCALE=pt
```

## 🏃 Executando

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm start
```

O frontend estará disponível em: http://localhost:3001 (ou porta disponível)

## 📁 Estrutura

```
web/
├── app/[locale]/     # Rotas internacionalizadas
├── components/ui/    # Componentes shadcn/ui
├── lib/api/          # API client e tipos
├── lib/store/        # Zustand stores
├── messages/         # Traduções (pt, en, es)
└── i18n.ts           # Configuração i18n
```

## 🌐 Idiomas Suportados

- Português (pt) - padrão
- Inglês (en)
- Espanhol (es)

Acesse `/en` ou `/es` para idiomas específicos.

## 📚 Documentação

- [Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://docs.pmnd.rs/zustand)

Ver `IMPLEMENTATION.md` para detalhes da implementação.
