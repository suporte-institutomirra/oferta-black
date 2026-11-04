// ============================================================
// CONTEÚDO — todos os textos do produto. Nada aqui usa IA:
// o app escolhe os blocos e encaixa as respostas da cliente.
// [nome] fica para ela trocar pelo nome de quem vai receber.
// ============================================================

const brl = (n) => "R$ " + Math.round(Number(n) || 0).toLocaleString("pt-BR");
const maiusc = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const dataLocal = (iso) => { const [y, m, d] = String(iso).split("-").map(Number); return new Date(y, m - 1, d); };
const somaDias = (dt, n) => { const x = new Date(dt); x.setDate(x.getDate() + n); return x; };
const chaveDia = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
const diaCurto = (dt) => dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const diaLongo = (dt) => dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
const entreDias = (a, b) => Math.round((dataLocal(chaveDia(b)) - dataLocal(chaveDia(a))) / 864e5);

// ---------- dados que todos os textos usam ----------
function dados(r) {
  const serv = ehServico(r);
  const preco = Number(r.preco) || 100;
  const abre = dataLocal(r.abre || BLACK_PADRAO);
  let fecha = dataLocal(r.fecha || FIM_PADRAO);
  if (fecha < abre) fecha = abre;
  const chefe = semArtigo(r.carro_chefe) || (serv ? "seu serviço principal" : "seu produto principal");
  const enc = semArtigo(r.encostado) || (serv ? "um atendimento extra" : "um mimo do estoque");
  const cap = Math.max(1, Number(r.capacidade) || 20);
  const canal = {
    whatsapp: "aqui no WhatsApp", instagram: "aqui no direct",
    grupo: "aqui no grupo", presencial: "por aqui",
  }[r.canal] || "por aqui";
  return {
    nome: r.nome || "", serv, preco, precoTxt: brl(preco), abre, fecha,
    abreTxt: diaLongo(abre), fechaTxt: diaLongo(fecha), abreCurto: diaCurto(abre), fechaCurto: diaCurto(fecha),
    diasBlack: entreDias(abre, fecha) + 1,
    chefe, enc, Chefe: maiusc(chefe), Enc: maiusc(enc), cap, canal,
    vagas: serv ? "vagas" : "unidades",
    presenteMax: Math.max(5, Math.round((preco * 0.15) / 5) * 5),
    primeiras: Math.max(3, Math.min(10, Math.round(cap / 3))),
  };
}

// ============================================================
// 1) IDEIAS DE CAMPANHA
// ============================================================
const OFERTAS = {
  leve_ganhe: {
    nome: "Compre e ganhe",
    montar: (d) => ({
      ideia: `Quem comprar ${d.chefe} leva ${d.enc} de presente.`,
      porque: "O presente sai do estoque parado — dinheiro que você já gastou. Seu preço fica inteiro.",
      exemplo: `Black da semana: comprou ${d.chefe}, ganhou ${d.enc}.`,
      regra: `na compra de ${d.chefe}, você ganha ${d.enc}`,
    }),
  },
  kit: {
    nome: "Kit Black (edição limitada)",
    montar: (d) => ({
      ideia: `Monte um kit com ${d.chefe} + ${d.enc}, vendido só na Black, em quantidade limitada.`,
      porque: "Kit não se compara com preço de ninguém. E a escassez é real: acabou o kit, acabou a Black.",
      exemplo: `Kit Black: ${d.Chefe} + ${d.Enc}. Só ${d.cap} kits.`,
      regra: `o Kit Black (${d.chefe} + ${d.enc}) existe só nesses dias, e são só ${d.cap} kits`,
    }),
  },
  primeiras: {
    nome: "Presente das primeiras",
    montar: (d) => ({
      ideia: `As ${d.primeiras} primeiras clientes ganham ${d.enc} (custo até ${brl(d.presenteMax)} para você).`,
      porque: "Cria urgência no primeiro dia, quando a atenção está mais alta.",
      exemplo: `As ${d.primeiras} primeiras que fecharem ${d.chefe} ganham ${d.enc}. Eu aviso quando acabar.`,
      regra: `as ${d.primeiras} primeiras que fecharem ${d.chefe} ganham ${d.enc}`,
    }),
  },
  natal: {
    nome: "Natal resolvido",
    montar: (d) => ({
      ideia: `Quem garantir ${d.chefe} na Black recebe embalagem de presente e cartão escrito à mão.`,
      porque: "Você vende o Natal antecipado e organiza a sua produção de dezembro desde já.",
      exemplo: `Garanta ${d.chefe} na Black e receba embrulhado, com cartão, pronto para dar.`,
      regra: `quem garantir ${d.chefe} agora recebe embalado para presente, com cartão escrito à mão`,
    }),
  },
  indica: {
    nome: "Traga uma amiga",
    montar: (d) => ({
      ideia: `Se duas amigas fecharem juntas, as duas ganham ${d.enc}.`,
      porque: "Cada venda traz outra. Seu custo para atrair cliente cai pela metade.",
      exemplo: `Black em dupla: você e sua amiga fecham ${d.chefe} e as duas ganham ${d.enc}.`,
      regra: `se você fechar ${d.chefe} junto com uma amiga, as duas ganham ${d.enc}`,
    }),
  },
  agenda: {
    nome: "Janeiro garantido",
    montar: (d) => ({
      ideia: `Quem fechar ${d.chefe} agora ganha ${d.enc} para usar em janeiro ou fevereiro.`,
      porque: "O presente sai da sua agenda vazia do começo do ano — tempo que hoje não te dá dinheiro.",
      exemplo: `Feche ${d.chefe} na Black e ganhe ${d.enc} para usar em janeiro.`,
      regra: `quem fechar ${d.chefe} agora ganha ${d.enc} para usar em janeiro ou fevereiro`,
    }),
  },
  bonus_impl: {
    nome: "Bônus que não volta",
    montar: (d) => ({
      ideia: `Quem entrar em ${d.chefe} na Black ganha ${d.enc}, um bônus que só existe nessa turma.`,
      porque: "Você entrega uma vez para várias pessoas: custa pouco e aumenta o resultado delas.",
      exemplo: `Entrou em ${d.chefe} na Black? Ganha ${d.enc}. Depois, esse bônus não volta.`,
      regra: `quem entrar em ${d.chefe} até ${d.fechaCurto} ganha ${d.enc}, que não volta depois`,
    }),
  },
  parceria: {
    nome: "Black em parceria",
    montar: (d) => ({
      ideia: `Junte-se a outra empreendedora do mesmo público: quem compra ${d.chefe} ganha um presente dela, e vice-versa.`,
      porque: "Você vende para a audiência dela sem gastar com anúncio.",
      exemplo: `Black em dupla com @parceira: comprou ${d.chefe}, ganhou um presente dela.`,
      regra: `quem comprar ${d.chefe} ganha um presente especial da @parceira`,
    }),
  },
};

const TRILHAS = {
  produto_parado: ["leve_ganhe", "kit", "primeiras"],
  produto_encomenda: ["primeiras", "natal", "indica"],
  servico: ["agenda", "indica", "primeiras"],
  digital: ["bonus_impl", "primeiras", "parceria"],
};

function montarCampanhas(r) {
  const d = dados(r);
  return (TRILHAS[r.tipo_negocio] || TRILHAS.produto_encomenda)
    .map((k) => ({ chave: k, nome: OFERTAS[k].nome, ...OFERTAS[k].montar(d) }));
}

// ============================================================
// 2) A OFERTA ESCRITA
// ============================================================
function montarOferta(r, c) {
  const d = dados(r);
  return {
    titulo: `${c.nome} · Black ${d.abreCurto} a ${d.fechaCurto}`,
    texto:
`✨ ${c.nome.toUpperCase()} ✨

De ${d.abreCurto} a ${d.fechaCurto}, ${c.regra}.

${d.Chefe}: ${d.precoTxt}
+ o presente da Black, só nesses dias

São só ${d.cap} ${d.vagas}. Quando acabar, acabou — e depois do dia ${d.fechaCurto} a condição não volta.

Para garantir o seu, me chama ${d.canal} 💬`,
    bio: `Black até ${d.fechaCurto}: ${c.exemplo}`,
    status: `🖤 BLACK ${d.abreCurto}–${d.fechaCurto} · ${c.nome} · só ${d.cap} ${d.vagas}`,
  };
}

// ============================================================
// 3) MENSAGENS (versão para clientes e para quem ainda não comprou)
// ============================================================
function montarMensagens(r, c) {
  const d = dados(r);
  const m = (id, quando, cliente, novo) => ({ id, quando, cliente, novo });
  return [
    m("convite", "2 a 3 semanas antes — monte a lista",
      `Oi, [nome]! Tudo bem? Você que já é minha cliente vai saber primeiro: dia ${d.abreCurto} começa a minha Black, com um presente que eu nunca dei antes. Quer entrar na lista de quem recebe antes de todo mundo?`,
      `Oi, [nome]! Tudo bem? Vi que você se interessou por ${d.chefe}. No dia ${d.abreCurto} começa a minha Black, com uma condição que só vai existir nesses dias. Quer que eu te avise primeiro?`),
    m("antecipa", "1 semana antes — crie expectativa",
      `[nome], passando para contar uma coisa: a Black deste ano vai ter ${d.enc} de presente. Como você já é cliente, vai ter prioridade. Abre dia ${d.abreCurto}, eu te chamo antes.`,
      `[nome], só uma prévia da Black: quem garantir ${d.chefe} vai levar ${d.enc} de presente. Mas são só ${d.cap} ${d.vagas}. Abre dia ${d.abreCurto} — você está na lista!`),
    m("faltam3", "3 dias antes — contagem",
      `Faltam 3 dias, [nome]! Já pensou em qual vai ser o seu? Se quiser, já me fala que eu deixo separado para você no dia ${d.abreCurto}.`,
      `Faltam 3 dias para a Black, [nome]! ⏳ Se tiver qualquer dúvida sobre ${d.chefe}, me pergunta agora que no dia é só garantir.`),
    m("vespera", "Véspera",
      `[nome], amanhã é o dia! Você recebe a mensagem antes de todo mundo. Fica de olho ${d.canal} 🖤`,
      `É amanhã, [nome]! A Black abre ${d.abreTxt}. Lembra: são só ${d.cap} ${d.vagas}. Te chamo assim que abrir.`),
    m("abertura", "Dia da abertura",
      `[nome], abriu — e você é das primeiras a saber! ${c.exemplo}\nQuer que eu separe o seu agora?`,
      `ABRIU, [nome]! 🖤 ${c.exemplo}\nCorre que são só ${d.cap} ${d.vagas}. Quer garantir o seu?`),
    m("prova", "Durante — mostre que está saindo",
      `[nome], a Black está indo muito bem, e várias clientes já garantiram. Lembrei de você: ainda tem ${d.vagas} com presente. Quer o seu?`,
      `[nome], já saiu mais da metade! 🙌 Se você ainda está pensando, me chama que eu tiro qualquer dúvida sobre ${d.chefe}.`),
    m("ultimodia", "Último dia",
      `[nome], hoje é o último dia da Black. Amanhã ${d.chefe} volta ao normal, sem presente. Não queria que você ficasse de fora — fecho o seu?`,
      `Último dia, [nome]! Hoje até meia-noite. Depois, ${d.chefe} volta para ${d.precoTxt} sem o presente. Quer garantir?`),
    m("quero_mas", "Para quem disse “quero, mas…”",
      `[nome], você comentou que queria, mas [motivo]. Pensei num jeito: [solução — parcelar, reservar, trocar a data]. Assim você não perde o presente. Combinado?`,
      `[nome], você me disse que queria ${d.chefe}, mas [motivo]. Posso te ajudar com [solução]. A Black termina ${d.fechaTxt}, quer que eu reserve?`),
    m("encerramento", "Depois que acabar",
      `[nome], a Black terminou e eu só queria agradecer por estar comigo mais uma vez. Você faz o meu negócio existir 🖤`,
      `[nome], a Black terminou! Obrigada por acompanhar. Se ficou alguma dúvida sobre ${d.chefe}, pode me chamar — vou adorar te atender.`),
  ];
}

// ============================================================
// 4) STORIES E REELS
// ============================================================
function montarStories(r, c) {
  const d = dados(r);
  return [
    { fase: "Aquecimento (2–3 semanas antes)", quadros: [
      `Enquete: “Você espera a Black para comprar ${d.chefe}?” (Sim / Já comprei)`,
      `Caixinha: “O que te impede de comprar ${d.chefe} hoje?” — as respostas viram conteúdo.`,
      `Bastidor: você preparando ${d.chefe} / organizando a agenda. Legenda: “vem coisa boa aí”.`,
      `Resultado de cliente (print ou foto) + “é por isso que eu faço o que eu faço”.`,
    ] },
    { fase: "Antecipação (última semana)", quadros: [
      `“Dia ${d.abreCurto} começa a minha Black. Quem estiver na lista fica sabendo primeiro.” + figurinha de link ou “me manda BLACK”.`,
      `Contagem regressiva (figurinha do Instagram) com data ${d.abreCurto}.`,
      `Dica sem revelar tudo: “O presente desse ano é algo que eu nunca dei…”`,
      `Enquete: “Quer que eu conte o presente agora?” (Sim! / Prefiro a surpresa)`,
    ] },
    { fase: "Semana da Black", quadros: [
      `Abertura: “ABRIU 🖤 ${c.exemplo}”`,
      `Prova de que está saindo: prints de pedidos (sem nome) ou “já foram X ${d.vagas}”.`,
      `Responda dúvidas da caixinha em vídeo: preço, prazo, entrega.`,
      `Último dia: “Termina hoje às 23h59. Depois, sem presente.”`,
    ] },
  ];
}

function montarReels(r, c) {
  const d = dados(r);
  const R = (tipo, gancho, corpo, chamada) => ({ tipo, gancho, corpo, chamada });
  return [
    R("Oportunidade", `Se você sempre quis ${d.chefe}, não compra nada até ${d.abreCurto}.`,
      `Conte o que ${d.chefe} resolve na vida da cliente, em 2 ou 3 frases. Mostre o produto/serviço acontecendo.`,
      `“Comenta BLACK que eu te coloco na lista.”`),
    R("Bastidor", `Olha o que eu estou preparando para a minha Black…`,
      `Mostre você separando ${d.enc} / montando a agenda. Fale que é limitado a ${d.cap} ${d.vagas}.`,
      `“Abre dia ${d.abreCurto}. Me segue para não perder.”`),
    R("Objeção: “é caro”", `“Ah, mas ${d.chefe} é caro…” Deixa eu te mostrar uma conta.`,
      `Compare ${d.precoTxt} com o que a cliente gasta/perde sem resolver isso. Mostre o presente da Black como algo a mais.`,
      `“Na Black você ainda leva ${d.enc}. Comenta EU.”`),
    R("Objeção: “depois eu compro”", `Todo ano alguém me fala “depois eu compro”…`,
      `Explique que o presente só existe até ${d.fechaCurto} e que são ${d.cap} ${d.vagas}. Depois disso, preço normal e sem presente.`,
      `“Quer garantir? Me chama ${d.canal}.”`),
    R("Depoimento", `O que a [nome da cliente] me falou depois de ${d.chefe}:`,
      `Mostre o print, foto ou vídeo da cliente. Conte em 1 frase como ela estava antes e como ficou.`,
      `“A próxima pode ser você — Black dia ${d.abreCurto}.”`),
    R("Abertura", `ABRIU a minha Black! 🖤`,
      `${c.exemplo} Mostre o produto, o presente e diga quantas ${d.vagas} existem.`,
      `“Link na bio / me chama ${d.canal}. Até ${d.fechaCurto}.”`),
  ];
}

// ============================================================
// 5) CHECKLIST antes de divulgar
// ============================================================
function montarChecklist(r) {
  const d = dados(r);
  return [
    { id: "c1", t: "Oferta principal escolhida (aba Ideias) e texto revisado (aba Oferta)" },
    { id: "c2", t: `Presente separado e custo conferido — até ${brl(d.presenteMax)} por venda` },
    { id: "c3", t: `Limite definido: ${d.cap} ${d.vagas}` },
    { id: "c4", t: "Um link ou página onde a cliente vê a oferta e compra", mirra: true },
    { id: "c5", t: "Pagamento testado (Pix, cartão, link de pagamento)" },
    { id: "c6", t: "Lista de clientes e interessadas montada para avisar primeiro" },
    { id: "c7", t: "Mensagens da Black salvas para copiar rápido" },
    { id: "c8", t: "Bio e destaques atualizados com a frase da Black" },
    { id: "c9", t: "Reels de aquecimento gravados (aba Stories e reels)" },
    { id: "c10", t: "Respostas prontas para dúvidas: prazo, entrega, parcelamento" },
  ];
}

// ============================================================
// 6) OS NÚMEROS
// ============================================================
function montarConta(r) {
  const d = dados(r);
  const meta = META_REF[r.meta] || 3000;
  const taxa = TAXA_REF[r.conversao] || 0.2;
  const vendas = Math.max(1, Math.ceil(meta / d.preco));
  const conversas = Math.ceil(vendas / taxa);
  return {
    meta, vendas, conversas, preco: d.preco, cap: d.cap, vagas: d.vagas,
    diasBlack: d.diasBlack,
    porDia: Math.ceil(conversas / d.diasBlack),
    presenteMax: d.presenteMax,
    passouLimite: vendas > d.cap,
    kitSugerido: Math.ceil(meta / d.cap / 5) * 5,
  };
}

// ============================================================
// 7) CALENDÁRIO — tarefas contadas a partir da abertura/fechamento
// ref: "abre" ou "fecha" · off: dias antes (-) ou depois (+)
// aba: onde está o material daquela tarefa
// ============================================================
const TAREFAS = [
  { id: "t01", ref: "abre", off: -21, t: "Escolha a sua oferta principal", aba: "ideias", urgente: true },
  { id: "t02", ref: "abre", off: -21, t: "Leia o checklist e veja o que falta", aba: "checklist" },
  { id: "t03", ref: "abre", off: -20, t: "Separe o presente e confira o custo", aba: "numeros", urgente: true },
  { id: "t04", ref: "abre", off: -19, t: "Atualize a bio com a frase da Black", aba: "oferta", urgente: true },
  { id: "t05", ref: "abre", off: -18, t: "Stories: enquete do aquecimento", aba: "conteudo", extra: true },
  { id: "t06", ref: "abre", off: -17, t: "Grave e poste o reels “Oportunidade”", aba: "conteudo", extra: true },
  { id: "t07", ref: "abre", off: -16, t: "Liste clientes e interessadas para avisar primeiro", aba: "mensagens", urgente: true },
  { id: "t08", ref: "abre", off: -15, t: "Envie a mensagem de convite para a lista", aba: "mensagens" },
  { id: "t09", ref: "abre", off: -14, t: "Stories: caixinha de dúvidas", aba: "conteudo", extra: true },
  { id: "t10", ref: "abre", off: -13, t: "Grave e poste o reels “Bastidor”", aba: "conteudo", extra: true },
  { id: "t11", ref: "abre", off: -12, t: "Deixe pronto o link/página onde a oferta vai ficar", aba: "checklist", urgente: true },
  { id: "t12", ref: "abre", off: -11, t: "Teste o pagamento (Pix, cartão, link)", aba: "checklist", urgente: true },
  { id: "t13", ref: "abre", off: -10, t: "Grave e poste o reels “é caro”", aba: "conteudo", extra: true },
  { id: "t14", ref: "abre", off: -8,  t: "Stories: depoimento de cliente", aba: "conteudo", extra: true },
  { id: "t15", ref: "abre", off: -7,  t: "Envie a mensagem de antecipação", aba: "mensagens" },
  { id: "t16", ref: "abre", off: -6,  t: "Grave e poste o reels “depois eu compro”", aba: "conteudo", extra: true },
  { id: "t17", ref: "abre", off: -5,  t: "Stories: contagem regressiva", aba: "conteudo" },
  { id: "t18", ref: "abre", off: -4,  t: "Grave e poste o reels “Depoimento”", aba: "conteudo", extra: true },
  { id: "t19", ref: "abre", off: -3,  t: "Envie a mensagem “faltam 3 dias”", aba: "mensagens" },
  { id: "t20", ref: "abre", off: -2,  t: "Deixe as respostas rápidas prontas no celular", aba: "checklist", extra: true },
  { id: "t21", ref: "abre", off: -1,  t: "Envie a mensagem da véspera", aba: "mensagens" },
  { id: "t22", ref: "abre", off: -1,  t: "Grave o reels “Abertura” para postar amanhã", aba: "conteudo" },
  { id: "t23", ref: "abre", off: 0,   t: "Envie a abertura: clientes primeiro, depois todos", aba: "mensagens" },
  { id: "t24", ref: "abre", off: 0,   t: "Poste o reels e os stories de abertura", aba: "conteudo" },
  { id: "t25", ref: "abre", off: 1,   t: "Mostre que está saindo + mensagem “durante”", aba: "mensagens", durante: true },
  { id: "t26", ref: "fecha", off: 0,  t: "Envie a mensagem de último dia", aba: "mensagens" },
  { id: "t27", ref: "fecha", off: 0,  t: "Chame quem disse “quero, mas…”", aba: "mensagens" },
  { id: "t28", ref: "fecha", off: 1,  t: "Mensagem de agradecimento/encerramento", aba: "mensagens" },
  { id: "t29", ref: "fecha", off: 2,  t: "Anote o resultado: vendas, faturamento, o que funcionou", aba: "numeros" },
];

// Monta o calendário a partir do dia em que a cliente começou (inicio).
// - Tarefas da reta final (3 dias antes, abertura, durante, fim) têm data fixa.
// - As de preparação se espalham pelos dias livres entre o início e a reta final.
// - Menos de 8 dias livres: só o essencial (sem as "extra").
// - Comprou na reta final (3 dias ou menos): só as "urgente".
const JANELA_IDEAL = 18;   // de 21 a 4 dias antes da abertura
const MINIMO_COMPLETO = 8;

function montarCalendario(r, feitas = {}, hoje = new Date(), inicioISO) {
  const d = dados(r);
  const hojeK = chaveDia(hoje);
  const inicio = dataLocal(inicioISO || hojeK);
  const diasLivres = entreDias(inicio, somaDias(d.abre, -4)) + 1;  // dias antes da reta final
  const compacto = diasLivres < JANELA_IDEAL;
  const enxuto = diasLivres < MINIMO_COMPLETO;
  const retaFinal = diasLivres < 1;

  const preparo = TAREFAS.filter((t) => t.ref === "abre" && t.off < -3 &&
    !(enxuto && t.extra) && !(retaFinal && !t.urgente));
  const fixas = TAREFAS.filter((t) => !(t.ref === "abre" && t.off < -3));

  const lista = [];
  if (!compacto) {
    // tempo de sobra: começa hoje mesmo e segue as datas ideais
    preparo.forEach((t) => lista.push({ ...t, data: t.off === -21 ? inicio : somaDias(d.abre, t.off) }));
  } else {
    // espalha na ordem pelos dias que ela tem (na reta final, até a véspera)
    const ultimo = retaFinal ? somaDias(d.abre, -1) : somaDias(d.abre, -4);
    const m = Math.max(1, entreDias(inicio, ultimo) + 1), n = preparo.length;
    preparo.forEach((t, i) => lista.push({ ...t, data: somaDias(inicio, Math.floor((i * m) / n)) }));
  }
  for (const t of fixas) {
    let dia = somaDias(t.ref === "abre" ? d.abre : d.fecha, t.off);
    if (t.durante && dia >= d.fecha) continue;               // Black de 1 dia: pula "durante"
    if (dia < inicio) {
      if (t.ref === "abre" && t.off < 0) continue;           // "faltam 3 dias" já passou: não faz sentido
      dia = inicio;                                          // comprou durante a Black: faz hoje
    }
    lista.push({ ...t, data: dia });
  }

  const porDia = {};
  const atrasadas = [];
  for (const item of lista) {
    item.feita = !!feitas[item.id];
    const k = chaveDia(item.data);
    if (k < hojeK) { if (!item.feita) atrasadas.push(item); continue; }
    (porDia[k] = porDia[k] || []).push(item);
  }
  const dias = Object.keys(porDia).sort().map((k) => ({
    k, data: dataLocal(k), hoje: k === hojeK,
    abre: k === chaveDia(d.abre), fecha: k === chaveDia(d.fecha),
    tarefas: porDia[k],
  }));
  return {
    atrasadas, dias, total: lista.length,
    feitasN: lista.filter((t) => feitas[t.id]).length,
    faltamDias: Math.max(0, entreDias(hoje, d.abre)),
    compacto, enxuto, diasAteAbrir: Math.max(0, entreDias(inicio, d.abre)),
  };
}
