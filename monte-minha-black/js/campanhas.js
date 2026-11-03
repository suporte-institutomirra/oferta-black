// ============================================================
// CAMPANHAS — textos prontos. Nada aqui usa IA:
// o app só escolhe quais blocos mostrar e encaixa as respostas.
// ============================================================

const brl = (n) => "R$ " + Math.round(n).toLocaleString("pt-BR");
const semArtigo = (s) => String(s || "").trim()
  .replace(/^(umas|uma|uns|um|minhas|minha|meus|meu|os|as|o|a)\s+/i, "").trim();
const maiusc = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function dados(r) {
  const ticket = TICKET_REF[r.ticket] || 100;
  const serv = ehServico(r);
  const chefe = semArtigo(r.carro_chefe) || (serv ? "seu serviço principal" : "seu produto principal");
  const enc = semArtigo(r.encostado) || (serv ? "um atendimento extra" : "um produto do estoque");
  return {
    ticket, serv, chefe, enc,
    Chefe: maiusc(chefe), Enc: maiusc(enc),
    presenteMax: Math.max(5, Math.round((ticket * 0.15) / 5) * 5),
  };
}

// Biblioteca. Cada campanha recebe os dados e devolve o texto.
const OFERTAS = {
  leve_ganhe: {
    nome: "Compre e ganhe",
    montar: (d) => ({
      ideia: `Quem comprar ${d.chefe} leva ${d.enc} de presente.`,
      porque: "O presente sai do estoque parado — dinheiro que você já gastou. Seu preço fica inteiro.",
      exemplo: `Black da semana: comprou ${d.chefe}, ganhou ${d.enc}. Sem cupom, sem desconto, só presente.`,
    }),
  },
  kit: {
    nome: "Kit Black (edição limitada)",
    montar: (d) => ({
      ideia: `Monte um kit com ${d.chefe} + ${d.enc} e venda só nesta semana, em quantidade limitada.`,
      porque: "Kit não se compara com preço de ninguém. A escassez é real: acabou o kit, acabou a Black.",
      exemplo: `Kit Black: ${d.Chefe} + ${d.Enc}. Só 15 unidades, só até domingo.`,
    }),
  },
  primeiras: {
    nome: "Presente das primeiras",
    montar: (d) => ({
      ideia: `As primeiras 10 clientes da semana ganham ${d.enc} (custo até ${brl(d.presenteMax)}).`,
      porque: "Cria urgência no primeiro dia, quando a atenção está mais alta.",
      exemplo: `As 10 primeiras que fecharem ${d.chefe} até quarta ganham ${d.enc}. Eu aviso quando acabar.`,
    }),
  },
  natal: {
    nome: "Natal resolvido",
    montar: (d) => ({
      ideia: `Quem encomendar ${d.chefe} na Black recebe embalagem de presente e cartão escrito à mão.`,
      porque: "Você vende o Natal antecipado e organiza sua produção de dezembro desde já.",
      exemplo: `Encomende agora ${d.chefe} para o Natal e receba embrulhado, com cartão, pronto para dar.`,
    }),
  },
  indica: {
    nome: "Traga uma amiga",
    montar: (d) => ({
      ideia: `Se duas amigas fecharem juntas, as duas ganham ${d.enc}.`,
      porque: "Cada venda traz outra. Seu custo de divulgação cai pela metade.",
      exemplo: `Black em dupla: você e sua amiga fecham ${d.chefe} e as duas ganham ${d.enc}.`,
    }),
  },
  agenda: {
    nome: "Janeiro garantido",
    montar: (d) => ({
      ideia: `Quem fechar pacote de ${d.chefe} agora ganha ${d.enc} para usar em janeiro ou fevereiro.`,
      porque: "O presente sai da sua agenda vazia do começo do ano — tempo que hoje não te dá dinheiro.",
      exemplo: `Feche ${d.chefe} na Black e ganhe ${d.enc} para usar em janeiro. Começa o ano já cuidada.`,
    }),
  },
  bonus_impl: {
    nome: "Bônus de implementação",
    montar: (d) => ({
      ideia: `Quem entrar em ${d.chefe} nesta semana ganha ${d.enc} ao vivo com você.`,
      porque: "Bônus que você entrega uma vez para várias pessoas: custa pouco e aumenta o resultado delas.",
      exemplo: `Entrou em ${d.chefe} na Black? Ganha ${d.enc} comigo, ao vivo, em dezembro.`,
    }),
  },
  parceria: {
    nome: "Black em parceria",
    montar: (d) => ({
      ideia: `Junte-se a outra empreendedora que atende o mesmo público: quem compra ${d.chefe} ganha um presente dela, e vice-versa.`,
      porque: "Você vende para a lista dela sem gastar com anúncio.",
      exemplo: `Black em dupla com @parceira: comprou ${d.chefe}, ganhou um presente dela.`,
    }),
  },
};

// Quais 3 campanhas cada tipo de negócio recebe
const TRILHAS = {
  produto_parado: ["leve_ganhe", "kit", "primeiras"],
  produto_encomenda: ["primeiras", "natal", "indica"],
  servico: ["agenda", "indica", "primeiras"],
  digital: ["bonus_impl", "parceria", "primeiras"],
};

function montarCampanhas(r) {
  const d = dados(r);
  return (TRILHAS[r.tipo_negocio] || TRILHAS.produto_encomenda)
    .map((k) => ({ chave: k, nome: OFERTAS[k].nome, ...OFERTAS[k].montar(d) }));
}

function montarConta(r) {
  const d = dados(r);
  const meta = META_REF[r.meta] || 3000;
  const taxa = TAXA_REF[r.conversao] || 0.2;
  const vendas = Math.max(1, Math.ceil(meta / d.ticket));
  const conversas = Math.ceil(vendas / taxa);
  return {
    meta, vendas, conversas,
    porDia: Math.ceil(conversas / 7),
    presenteMax: d.presenteMax,
    ticket: d.ticket,
  };
}

function montarMensagens(r, camp) {
  const d = dados(r);
  return [
    { dia: "Segunda — aquece",
      texto: `Oi, [nome]! Tudo bem? Essa semana vou fazer uma Black diferente: sem baixar preço, com presente. Quer que eu te mande primeiro quando abrir?` },
    { dia: "Quarta — abre",
      texto: `[nome], abriu! ${camp.exemplo}\nQuer que eu separe o seu?` },
    { dia: "Sexta — último dia",
      texto: `[nome], passando só para avisar: hoje é o último dia da Black. Depois, ${d.chefe} volta normal, sem presente. Fecho o seu?` },
  ];
}
