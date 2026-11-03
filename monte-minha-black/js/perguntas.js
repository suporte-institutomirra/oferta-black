// ============================================================
// PERGUNTAS — para criar/editar, copie um bloco { ... } e mude.
// tipos: "texto", "longo", "radio", "tel"
// titulo/ajuda podem ser texto ou função (r) => texto, usando respostas anteriores
// ============================================================

// Valor de referência de cada faixa (usado na conta)
const TICKET_REF = {
  ate50: 40, "50a100": 80, "100a200": 150, "200a500": 350,
  "500a1000": 750, "1000a3000": 2000, acima3000: 4000,
};
const META_REF = { m1: 1000, m3: 3000, m5: 5000, m10: 10000, m20: 20000, m50: 50000 };
const TAXA_REF = { c1: 0.1, c2: 0.2, c3: 0.3, c5: 0.5 };

const ehServico = (r) => r.tipo_negocio === "servico" || r.tipo_negocio === "digital";

const PERGUNTAS = [
  // ---------- BLOCO 1: o negócio dela ----------
  { id: "nome", tipo: "texto", limite: 40,
    titulo: "Primeiro, como você se chama?",
    ajuda: "Só o primeiro nome." },

  { id: "vende", tipo: "texto", limite: 60,
    titulo: (r) => `Prazer, ${r.nome}! O que você vende?`,
    ajuda: "Em poucas palavras: doces, estética, mentoria, roupas..." },

  { id: "tipo_negocio", tipo: "radio",
    titulo: "Como é o seu negócio hoje?",
    ajuda: "Essa resposta escolhe as campanhas que você vai receber.",
    opcoes: [
      { v: "produto_parado", t: "Vendo produto e tenho estoque parado" },
      { v: "produto_encomenda", t: "Vendo produto, mas faço por encomenda" },
      { v: "servico", t: "Vendo serviço (atendimento, procedimento, sessão)" },
      { v: "digital", t: "Vendo mentoria, curso ou produto digital" },
    ] },

  { id: "carro_chefe", tipo: "texto", limite: 60,
    titulo: (r) => ehServico(r) ? "Qual serviço seu mais sai?" : "Qual produto seu mais sai?",
    ajuda: "Só o nome. Ele vai aparecer nos seus exemplos." },

  { id: "encostado", tipo: "texto", limite: 60,
    titulo: (r) => r.tipo_negocio === "produto_parado"
      ? "E o que fica parado no estoque?"
      : "O que você faz bem e quase ninguém pede?",
    ajuda: "É daqui que sai o presente da sua Black — sem mexer no preço." },

  { id: "ticket", tipo: "radio",
    titulo: "Numa venda normal, quanto a cliente paga?",
    ajuda: "Escolha a faixa onde cai a maioria das vendas.",
    opcoes: [
      { v: "ate50", t: "Até R$ 50" },
      { v: "50a100", t: "R$ 50 a R$ 100" },
      { v: "100a200", t: "R$ 100 a R$ 200" },
      { v: "200a500", t: "R$ 200 a R$ 500" },
      { v: "500a1000", t: "R$ 500 a R$ 1.000" },
      { v: "1000a3000", t: "R$ 1.000 a R$ 3.000" },
      { v: "acima3000", t: "Acima de R$ 3.000" },
    ] },

  { id: "meta", tipo: "radio",
    titulo: "Quanto você quer faturar A MAIS na semana da Black?",
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

  { id: "ponto_fraco", tipo: "radio",
    titulo: "O que mais te trava para vender nesta Black?",
    opcoes: [
      { v: "oferta", t: "Não sei o que oferecer" },
      { v: "prejuizo", t: "Medo de baixar o preço e ter prejuízo" },
      { v: "divulgar", t: "Não sei o que postar / mandar" },
      { v: "pagina", t: "Não tenho um lugar bonito para mostrar a oferta" },
    ] },

  // ---------- BLOCO 2: contato ----------
  { id: "pagina_vendas", tipo: "radio",
    titulo: "Você tem uma página de vendas para a sua oferta?",
    opcoes: [
      { v: "Tenho e funciona", t: "Tenho e funciona bem" },
      { v: "Tenho mas não converte", t: "Tenho, mas não vende" },
      { v: "Não tenho", t: "Não tenho" },
    ] },

  { id: "instagram", tipo: "texto", limite: 40, opcional: true,
    titulo: "Qual o @ do seu Instagram?",
    ajuda: "Opcional." },

  { id: "whatsapp", tipo: "tel",
    titulo: (r) => `Última, ${r.nome}: qual o seu WhatsApp?`,
    ajuda: "Com DDD. Seu plano aparece logo em seguida." },
];
