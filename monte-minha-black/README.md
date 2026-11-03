# Monte a sua Black Friday (sem baixar o preço)

Quiz que faz 12 perguntas e entrega um plano de Black Friday: 3 campanhas, 3 mensagens prontas, a conta de vendas e PDF. As respostas ficam salvas no Supabase.

HTML + CSS + JavaScript puro. Sem instalar nada, sem build.

## Pastas

```
monte-minha-black/
├── index.html            ← a página
├── vercel.json           ← configuração da Vercel
├── css/
│   └── style.css         ← cores e visual (mude as cores no topo)
├── js/
│   ├── config.js         ← SUA CONFIGURAÇÃO (Supabase, marca, link do botão)
│   ├── perguntas.js      ← as perguntas
│   ├── campanhas.js      ← textos das campanhas e mensagens
│   └── app.js            ← motor das telas (não precisa mexer)
└── supabase/
    └── schema.sql        ← cole no Supabase para criar a tabela
```

## Passo a passo

### 1. Supabase (banco)
1. Crie conta em supabase.com → **New project**.
2. Menu **SQL Editor** → **New query** → cole o conteúdo de `supabase/schema.sql` → **Run**.
3. Menu **Project Settings → API**: copie a **Project URL** e a chave **anon public**.
4. Cole as duas em `js/config.js`.

> A chave anon pode ficar no site: o banco só deixa visitantes **inserir**. Ninguém lê as respostas além de você.

### 2. GitHub
1. github.com → **New repository** → nome `monte-minha-black` → Create.
2. **Add file → Upload files** → arraste o conteúdo desta pasta (as pastas `css`, `js`, `supabase` e os arquivos soltos) → **Commit changes**.

### 3. Vercel (no ar)
1. vercel.com → **Sign Up → Continue with GitHub**.
2. **Add New… → Project** → ao lado do repositório `monte-minha-black`, clique **Import**.
3. Framework Preset: **Other**. Não mude mais nada → **Deploy**.
4. O endereço fica `monte-minha-black.vercel.app`. Domínio próprio: **Settings → Domains**.

Toda vez que você editar um arquivo no GitHub, a Vercel atualiza sozinha.

## Testar
- `seusite.vercel.app/?demo` → mostra o resultado direto, com respostas de exemplo (não salva no banco).
- Abra o `index.html` no navegador para testar no seu computador.

## Ver as respostas
Supabase → **Table Editor → respostas**. Para planilha: botão **Export → CSV**.
No final do `schema.sql` tem consultas prontas (ex.: quem não tem página de vendas).

## Personalizar
- **Nova pergunta**: copie um bloco em `js/perguntas.js`. Ela é salva automaticamente na coluna `respostas` (JSON).
- **Nova campanha**: crie em `OFERTAS` e coloque a chave em `TRILHAS` (`js/campanhas.js`).
- **Cores**: topo do `css/style.css`.
- **Rastrear origem**: divulgue `seusite.vercel.app/?utm_source=instagram` — aparece na coluna `origem`.
