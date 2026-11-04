// ============================================================
// PERGUNTAS — para criar/editar, copie um bloco { ... } e mude.
// tipos: "texto", "longo", "radio", "numero", "data"
// titulo/ajuda podem ser texto ou função (r) => texto, usando respostas anteriores
// ============================================================

const META_REF = { m1: 1000, m3: 3000, m5: 5000, m10: 10000, m20: 20000, m50: 50000 };
const TAXA_REF = { c1: 0.1, c2: 0.2, c3: 0.3, c5: 0.5 };

const ehServico = (r) => r.tipo_negocio === "servico" || r.tipo_negocio === "digital";

// Datas padrão: Black Friday 2026 = sexta 27/11, Cyber Monday = 30/11
const BLACK_PADRAO = "2026-11-27";
const FIM_PADRAO = "2026-11-30";

const PERGUNTAS = [
  // ---------- o negócio ----------
  { id: "nome", tipo: "texto", limite: 40,
    titulo: "Primeiro, como você se chama?",
    ajuda: "Só o primeiro nome." },

  { id: "vende", tipo: "texto", limite: 60,
    titulo: (r) => `Prazer, ${r.nome}! O que você vende?`,
    ajuda: "Em poucas palavras: doces, estética, mentoria, roupas..." },

  { id: "tipo_negocio", tipo: "radio",
    titulo: "Como é o seu negócio hoje?",
    ajuda: "Essa resposta escolhe as ideias que você vai receber.",
    opcoes: [
      { v: "produto_parado", t: "Vendo produto e tenho estoque parado" },
      { v: "produto_encomenda", t: "Vendo produto, mas faço por encomenda" },
      { v: "servico", t: "Vendo serviço (atendimento, procedimento, sessão)" },
      { v: "digital", t: "Vendo mentoria, curso ou produto digital" },
    ] },

  { id: "carro_chefe", tipo: "texto", limite: 60,
    titulo: (r) => ehServico(r) ? "Qual serviço você quer vender mais na Black?" : "Qual produto você quer vender mais na Black?",
    ajuda: "Só o nome. Ele vai aparecer em todos os seus textos." },

  { id: "preco", tipo: "numero", min: 1, prefixo: "R$",
    titulo: (r) => `Quanto custa ${semArtigo(r.carro_chefe) || "ele"} hoje?`,
    ajuda: "O preço normal, sem desconto. Só o número." },

  { id: "encostado", tipo: "texto", limite: 60,
    titulo: (r) => r.tipo_negocio === "produto_parado"
      ? "E o que fica parado no estoque?"
      : "O que você faz bem e quase ninguém pede?",
    ajuda: "É daqui que sai o presente da sua Black, custando pouco para você." },

  { id: "capacidade", tipo: "numero", min: 1,
    titulo: (r) => ehServico(r)
      ? "Quantos atendimentos/vagas você consegue entregar na semana da Black?"
      : "Quantas unidades você consegue entregar na semana da Black?",
    ajuda: "Pense no seu limite real. Isso vira a sua escassez — e evita vender o que você não dá conta." },

  // ---------- a meta ----------
  { id: "meta", tipo: "radio",
    titulo: "Quanto você quer faturar na Black?",
    opcoes: [
      { v: "m1", t: "R$ 1 mil" }, { v: "m3", t: "R$ 3 mil" },
      { v: "m5", t: "R$ 5 mil" }, { v: "m10", t: "R$ 10 mil" },
      { v: "m20", t: "R$ 20 mil" }, { v: "m50", t: "R$ 50 mil" },
    ] },

  { id: "conversao", tipo: "radio",
    titulo: "De cada 10 pessoas que pedem preço, quantas compram?",
    ajuda: "Chute com honestidade. Isso define com quantas pessoas você precisa falar.",
    opcoes: [
      { v: "c1", t: "1 ou menos" }, { v: "c2", t: "2" },
      { v: "c3", t: "3 ou 4" }, { v: "c5", t: "5 ou mais" },
    ] },

  // ---------- onde e para quem ----------
  { id: "canal", tipo: "radio",
    titulo: "Onde você mais vende hoje?",
    opcoes: [
      { v: "whatsapp", t: "WhatsApp (conversa ou lista de transmissão)" },
      { v: "instagram", t: "Instagram (direct e stories)" },
      { v: "grupo", t: "Grupo ou comunidade" },
      { v: "presencial", t: "Presencial / loja / consultório" },
    ] },

  { id: "base", tipo: "radio",
    titulo: "Você já tem clientes para avisar primeiro?",
    opcoes: [
      { v: "muitos", t: "Sim, tenho uma boa lista de clientes" },
      { v: "poucos", t: "Tenho alguns, poucos" },
      { v: "nenhum", t: "Estou começando, quase nenhum" },
    ] },

  // ---------- as datas ----------
  { id: "abre", tipo: "data", padrao: BLACK_PADRAO,
    titulo: "Em que dia a sua Black abre?",
    ajuda: "A Black Friday é sexta, 27/11. Muita gente abre antes para clientes. O seu calendário é montado a partir daqui." },

  { id: "fecha", tipo: "data", padrao: FIM_PADRAO,
    titulo: "E em que dia ela termina?",
    ajuda: "Sugestão: segunda, 30/11 (Cyber Monday). Ter fim é o que faz a cliente decidir." },
];

function semArtigo(s) {
  return String(s || "").trim()
    .replace(/^(umas|uma|uns|um|minhas|minha|meus|meu|os|as|o|a)\s+/i, "").trim();
}
