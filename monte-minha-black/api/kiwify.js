// ============================================================
// Webhook da Kiwify → libera ou bloqueia o acesso no Supabase.
// URL para colar na Kiwify:  https://SEU-SITE.vercel.app/api/kiwify
//
// Variáveis na Vercel (Settings > Environment Variables):
//   SUPABASE_URL               https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase > Project Settings > API > service_role — SECRETA)
//   KIWIFY_TOKEN               (o token que a Kiwify mostra ao criar o webhook)
//   KIWIFY_PRODUTO_ID          (opcional: só aceita vendas deste produto)
// ============================================================
import crypto from "node:crypto";

const LIBERA = new Set(["order_approved"]);
const BLOQUEIA = new Set(["order_refunded", "chargeback"]);

// não apaga nome/produto já gravados quando o evento vem sem eles
const semVazios = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));

export function GET() {
  return new Response("Webhook da Kiwify ativo.", { status: 200 });
}

export async function POST(request) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, KIWIFY_TOKEN, KIWIFY_PRODUTO_ID } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !KIWIFY_TOKEN) {
    return new Response("Variáveis de ambiente faltando na Vercel.", { status: 500 });
  }

  // 1) Confere a assinatura (HMAC-SHA1 do corpo cru, com o token)
  const corpo = await request.text();
  const recebida = new URL(request.url).searchParams.get("signature") || "";
  const esperada = crypto.createHmac("sha1", KIWIFY_TOKEN).update(corpo).digest("hex");
  const valida = recebida.length === esperada.length &&
    crypto.timingSafeEqual(Buffer.from(recebida), Buffer.from(esperada));
  if (!valida) return new Response("Assinatura inválida.", { status: 401 });

  // 2) Lê o evento
  let ev;
  try { ev = JSON.parse(corpo); } catch { return new Response("JSON inválido.", { status: 400 }); }

  const tipo = ev.webhook_event_type || "";
  const status = ev.order_status || "";
  const cliente = ev.Customer || ev.customer || {};
  const produto = ev.Product || ev.product || {};
  const email = String(cliente.email || "").trim().toLowerCase();

  let ativo = null;
  if (LIBERA.has(tipo) || status === "paid") ativo = true;
  if (BLOQUEIA.has(tipo) || status === "refunded" || status === "chargedback") ativo = false;

  if (ativo === null || !email) return new Response("Evento ignorado.", { status: 200 });
  if (KIWIFY_PRODUTO_ID && produto.product_id && produto.product_id !== KIWIFY_PRODUTO_ID) {
    return new Response("Outro produto, ignorado.", { status: 200 });
  }

  // 3) Grava no Supabase (cria ou atualiza pelo e-mail)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/compradores?on_conflict=email`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(semVazios({
      email, ativo, status: status || tipo,
      pedido_id: ev.order_id,
      produto: produto.product_name,
      nome: cliente.full_name || cliente.name,
      atualizado_em: new Date().toISOString(),
    })),
  });

  if (!res.ok) {
    console.error("Supabase:", res.status, await res.text());
    return new Response("Erro ao gravar.", { status: 500 }); // Kiwify tenta de novo
  }
  return new Response(ativo ? "Acesso liberado." : "Acesso bloqueado.", { status: 200 });
}
