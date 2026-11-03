// ============================================================
// CONFIGURAÇÃO — é só aqui que você mexe para personalizar
// ============================================================

const CONFIG = {
  // Supabase > Project Settings > API  (use a chave "anon public", NUNCA a service_role)
  SUPABASE_URL: "https://arpybthyjjzokqmxzvha.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHlidGh5amp6b2txbXh6dmhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MTY5MTcsImV4cCI6MjEwOTI5MjkxN30.kbE7YF9k2ZXNXkk7HxSXMlEFEu5kHKT7mfWq58D8ktE",

  // Marca
  MARCA: "Instituto Mirra",
  PRODUTO: "Monte a sua Black Friday",

  // Página de vendas / checkout da Kiwify (aparece para quem tenta entrar sem ter comprado)
  LINK_COMPRA: "https://pay.kiwify.com.br/DDQ2mnf",

  // Suporte (aparece na tela de login e no rodapé)
  SUPORTE: "https://wa.me/5500000000000?text=Oi!%20Preciso%20de%20ajuda%20com%20o%20Monte%20a%20sua%20Black",

  // Oferta da página de vendas feita pelo Instituto Mirra (aparece no checklist). "" esconde.
  CTA_PAGINA_TEXTO: "Quero que o Instituto Mirra faça a minha página",
  CTA_PAGINA_LINK: "https://wa.me/5500000000000?text=Oi!%20Quero%20uma%20p%C3%A1gina%20para%20a%20minha%20Black",

  // true = abre sem login e salva só no navegador (para você testar). Em produção: false.
  MODO_TESTE: false,
};
