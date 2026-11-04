# Monte a sua Black Friday · Instituto Mirra

Ferramenta paga. A compradora entra com o e-mail da compra na Kiwify, responde 13 perguntas e recebe:
calendário dia a dia, 3 ideias de campanha, a oferta escrita, 9 mensagens (clientes e novas),
stories e 6 roteiros de reels, checklist e a meta em números. Tudo fica salvo na conta dela.

## Pastas

```
monte-minha-black/
├── index.html
├── vercel.json
├── package.json            ← só avisa a Vercel que o webhook usa JavaScript moderno
├── api/
│   └── kiwify.js           ← recebe a venda da Kiwify e libera/bloqueia o acesso
├── css/style.css
├── js/
│   ├── config.js           ← SUA CONFIGURAÇÃO
│   ├── perguntas.js        ← as perguntas
│   ├── campanhas.js        ← todos os textos (ideias, oferta, mensagens, reels, calendário)
│   └── app.js              ← login, telas e salvamento (não precisa mexer)
└── supabase/
    ├── schema.sql          ← cole no Supabase
    └── email-link.html     ← e-mail de acesso em português
```

## Configuração (uma vez só)

### 1. Supabase
1. **SQL Editor → New query** → cole `supabase/schema.sql` → **Run**.
2. **Authentication → URL Configuration**
   - Site URL: `https://SEU-SITE.vercel.app`
   - Redirect URLs: adicione `https://SEU-SITE.vercel.app/**`
3. **Authentication → Emails → Magic Link**: assunto `Seu acesso ao Monte a sua Black` e cole o conteúdo de `supabase/email-link.html`.
4. **Importante — envio de e-mails:** o envio padrão do Supabase manda poucos e-mails por hora (serve só para teste).
   Antes de vender, configure um SMTP próprio em **Authentication → Emails → SMTP Settings**.
   O mais simples é o **Resend** (resend.com, tem plano grátis): crie a conta, verifique o seu domínio e cole os dados de SMTP lá.
5. **Project Settings → API**: copie a **Project URL**, a chave **anon public** e a chave **service_role** (esta é secreta).

### 2. `js/config.js`
Preencha `SUPABASE_URL`, `SUPABASE_ANON_KEY` (a **anon**, nunca a service_role), `LINK_COMPRA`, `SUPORTE` e `CTA_PAGINA_LINK`.

### 3. Vercel
**Settings → Environment Variables** → adicione:

| Nome | Valor |
|---|---|
| `SUPABASE_URL` | a Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave service_role |
| `KIWIFY_TOKEN` | o token do webhook (passo 4) |

Depois: **Deployments → ⋯ → Redeploy**.

### 4. Kiwify
1. **Apps → Webhooks → Criar webhook**
   - URL: `https://SEU-SITE.vercel.app/api/kiwify`
   - Produto: o Monte a sua Black
   - Eventos: **Compra aprovada**, **Reembolso**, **Chargeback**
2. Copie o **token** que a Kiwify mostra e cole em `KIWIFY_TOKEN` na Vercel (e faça Redeploy).
3. No produto, em entrega/área de membros, coloque o link do app (`https://SEU-SITE.vercel.app`) para a compradora receber no e-mail da compra.

### 5. Testar
- Abra `https://SEU-SITE.vercel.app/api/kiwify` → deve aparecer "Webhook da Kiwify ativo."
- Libere o seu e-mail na mão (SQL Editor):
  `insert into compradores (email, status) values ('seu@email.com','manual');`
- Entre no app com esse e-mail.
- Faça uma compra teste na Kiwify (ou cupom 100%) e veja o e-mail aparecer em **Table Editor → compradores**.

## Dia a dia
- **Compradoras:** Table Editor → `compradores` (ativo = true/false).
- **Liberar ou bloquear na mão:** consultas prontas no final do `schema.sql`.
- **Testar sem login:** em `js/config.js`, `MODO_TESTE: true` e abra `index.html?demo`. **Volte para `false` antes de subir.**

## Personalizar
- **Textos:** `js/campanhas.js` (cada bloco tem um título explicando o que é).
- **Perguntas:** `js/perguntas.js`.
- **Tarefas do calendário:** lista `TAREFAS` em `js/campanhas.js` (`off: -7` = 7 dias antes da abertura).
- **Cores:** topo do `css/style.css`.
