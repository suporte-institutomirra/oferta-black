// ============================================================
// APP — login, perguntas, plano salvo. Normalmente não precisa mexer.
// ============================================================

const $ = (s) => document.querySelector(s);
const app = $("#app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const val = (x) => (typeof x === "function" ? x(r) : x || "");

// Símbolo da marca (ramo). A cor vem do CSS (currentColor).
const RAMO = `<svg class="ramo" viewBox="0 0 60 100" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M30 96V22"/><path d="M30 22c-7-6-7-15 0-20 7 5 7 14 0 20z"/>
  <path d="M30 44c-6-1-12-5-14-12 7-1 12 3 14 12z"/><path d="M30 44c6-1 12-5 14-12-7-1-12 3-14 12z"/>
  <path d="M30 64c-8-1-15-7-17-15 9-1 15 5 17 15z"/><path d="M30 64c8-1 15-7 17-15-9-1-15 5-17 15z"/>
  <path d="M30 82c-8 0-15-6-18-14 9-1 15 5 18 14z"/><path d="M30 82c8 0 15-6 18-14-9-1-15 5-18 14z"/>
  <circle cx="13" cy="20" r="1.6" fill="currentColor" stroke="none"/><circle cx="48" cy="26" r="1.6" fill="currentColor" stroke="none"/>
  <circle cx="51" cy="44" r="1.6" fill="currentColor" stroke="none"/><circle cx="8" cy="40" r="1.6" fill="currentColor" stroke="none"/>
</svg>`;
const ETIQUETA = `<div class="etiqueta">${RAMO}<span>Black<br>Edition</span></div>`;
const FAIXA = "BLACK FRIDAY ✦ EDIÇÃO MIRRA ✦ IDEIAS PARA O SEU NEGÓCIO ✦ ";
const faixa = () => `<div class="faixa" aria-hidden="true"><span>${FAIXA.repeat(3)}</span><span>${FAIXA.repeat(3)}</span></div>`;
const assina = () => `<p class="assina">${RAMO}Ferramenta ${esc(CONFIG.MARCA)}</p>`;

// ---------- estado ----------
let sb = null;        // cliente Supabase
let usuario = null;   // pessoa logada
let plano = novoPlano();
let r = plano.respostas;
let passo = -1;
let aba = "hoje";
let publico = "cliente";
let diaSel = null;      // dia aberto no calendário
let planoAberto = false; // "ver o plano inteiro"
let atrasoAberto = false;
let copias = [];
let souAdmin = false;

function novoPlano() {
  return { respostas: {}, passo: 0, escolha: null, feitas: {}, checklist: {}, concluido: false, inicio: null };
}

// ============================================================
// SALVAR / CARREGAR
// ============================================================
const CHAVE_LOCAL = "mmb_plano_teste";
let timerSalvar = null;

async function carregarPlano() {
  if (CONFIG.MODO_TESTE) {
    try { return JSON.parse(localStorage.getItem(CHAVE_LOCAL) || "null"); } catch { return null; }
  }
  const { data, error } = await sb.from("planos").select("dados").maybeSingle();
  if (error) throw error;
  return data ? data.dados : null;
}

function salvar() {
  clearTimeout(timerSalvar);
  timerSalvar = setTimeout(async () => {
    if (CONFIG.MODO_TESTE) {
      try { localStorage.setItem(CHAVE_LOCAL, JSON.stringify(plano)); } catch {}
      return;
    }
    const { error } = await sb.from("planos").upsert({
      user_id: usuario.id, dados: plano, atualizado_em: new Date().toISOString(),
    });
    if (error) aviso("Não consegui salvar agora. Confira a sua internet.", true);
  }, 400);
}

function aviso(msg, erro) {
  let t = $("#aviso");
  if (!t) { t = document.createElement("div"); t.id = "aviso"; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = "aviso mostra" + (erro ? " erro" : "");
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.className = "aviso"), 2600);
}

// ============================================================
// LOGIN (link no e-mail)
// ============================================================
function telaLogin(msg) {
  app.innerHTML = `
    <section class="card abertura">
      ${faixa()}
      <div class="corpo">
        <div class="topo"><p class="selo">ÁREA DA COMPRADORA</p>${ETIQUETA}</div>
        <h1>Monte a sua <span class="bf">Black Friday</span></h1>
        <p class="sub">Entre com o <b>e-mail que você usou na compra</b>. Vamos te mandar um link de acesso — sem senha.</p>
        <form id="form-login" class="login" novalidate>
          <input id="email" type="email" autocomplete="email" inputmode="email" placeholder="seu@email.com" required>
          <button class="btn" id="entrar" type="submit">Receber link de acesso</button>
        </form>
        <div id="login-msg" class="login-msg">${msg || ""}</div>
        ${assina()}
      </div>
    </section>`;

  $("#form-login").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase();
    const caixa = $("#login-msg");
    if (!/^\S+@\S+\.\S+$/.test(email)) { caixa.innerHTML = `<p class="erro">Digite um e-mail válido.</p>`; return; }

    const botao = $("#entrar");
    botao.disabled = true; botao.textContent = "Conferindo…";

    const { data: temAcesso, error: e1 } = await sb.rpc("email_tem_acesso", { p_email: email });
    if (e1) { falha("Não consegui conferir agora. Tente de novo em instantes."); return; }

    if (!temAcesso) {
      botao.disabled = false; botao.textContent = "Receber link de acesso";
      caixa.innerHTML = `
        <div class="caixa">
          <p><b>Não encontramos uma compra com ${esc(email)}.</b></p>
          <p>Confira se é o mesmo e-mail que você usou na Kiwify. Se a compra foi por Pix ou boleto, o acesso libera assim que o pagamento cair.</p>
          <p class="links">
            <a class="btn btn-cta" href="${esc(CONFIG.LINK_COMPRA)}" target="_blank" rel="noopener">Ainda não comprei</a>
            <a href="${esc(CONFIG.SUPORTE)}" target="_blank" rel="noopener">Já comprei e não consigo entrar</a>
          </p>
        </div>`;
      return;
    }

    const { error: e2 } = await sb.auth.signInWithOtp({
      email, options: { emailRedirectTo: location.origin + location.pathname },
    });
    if (e2) {
      const muitas = /rate|limit|seconds/i.test(e2.message);
      falha(muitas ? "Você pediu vários links seguidos. Espere 1 minuto e tente de novo." : "Não consegui enviar o link. Tente de novo.");
      return;
    }
    app.innerHTML = `
      <section class="card">
        <div class="topo"><p class="selo">QUASE LÁ</p>${ETIQUETA}</div>
        <h2>Confira o seu e-mail</h2>
        <p class="ajuda">Enviamos um link de acesso para <b>${esc(email)}</b>. Abra o e-mail <b>neste mesmo aparelho</b> e toque em entrar.</p>
        <p class="nota">Não chegou em 2 minutos? Olhe a caixa de spam e promoções.</p>
        <div class="nav"><button class="voltar" id="outro">← Usar outro e-mail</button></div>
      </section>`;
    $("#outro").onclick = () => telaLogin();

    function falha(t) {
      botao.disabled = false; botao.textContent = "Receber link de acesso";
      caixa.innerHTML = `<p class="erro">${t}</p>`;
    }
  };
}

async function telaSemAcesso() {
  let expirou = null;
  try {
    const { data } = await sb.rpc("meu_acesso");
    const a = Array.isArray(data) ? data[0] : data;
    if (a && a.ativo && a.expira_em && new Date(a.expira_em) <= new Date()) expirou = new Date(a.expira_em);
  } catch {}
  const texto = expirou
    ? `<h2>Seu acesso de 1 ano terminou</h2>
      <p class="ajuda">O acesso de <b>${esc(usuario.email)}</b> ao ${esc(CONFIG.PRODUTO)} foi válido por 365 dias e terminou em <b>${expirou.toLocaleDateString("pt-BR")}</b>.</p>`
    : `<h2>Seu acesso não está ativo</h2>
      <p class="ajuda">Entramos com <b>${esc(usuario.email)}</b>, mas não há uma compra ativa com esse e-mail.</p>`;
  app.innerHTML = `
    <section class="card">
      <div class="topo"><p class="selo">ACESSO</p>${ETIQUETA}</div>
      ${texto}
      <div class="acoes">
        <a class="btn" href="${esc(CONFIG.LINK_COMPRA)}" target="_blank" rel="noopener">Garantir o meu acesso</a>
        <a class="btn btn-cta" href="${esc(CONFIG.SUPORTE)}" target="_blank" rel="noopener">Falar com o suporte</a>
        <button class="voltar" id="sair">Sair e entrar com outro e-mail</button>
      </div>
    </section>`;
  $("#sair").onclick = sair;
}

async function entrar(user) {
  if (usuario && usuario.id === user.id) return;
  usuario = user;
  app.innerHTML = `<section class="card"><p class="ajuda">Carregando a sua Black…</p></section>`;
  const { data: ok, error } = await sb.rpc("tem_acesso");
  if (error) { app.innerHTML = `<section class="card"><p class="erro">Não consegui carregar. Recarregue a página.</p></section>`; return; }
  if (!ok) return telaSemAcesso();
  try { const { data: adm } = await sb.rpc("sou_admin"); souAdmin = !!adm; } catch { souAdmin = false; }
  try { plano = (await carregarPlano()) || novoPlano(); } catch { plano = novoPlano(); }
  iniciar();
}

async function sair() {
  if (sb) await sb.auth.signOut();
  usuario = null; plano = novoPlano(); r = plano.respostas;
  telaLogin();
}

// ============================================================
// BOAS-VINDAS
// ============================================================
function iniciar() {
  plano = Object.assign(novoPlano(), plano);
  r = plano.respostas;
  if (plano.concluido && !plano.inicio) { plano.inicio = chaveDia(new Date()); salvar(); }
  if (plano.concluido) return resultado();
  if (plano.passo > 0 && plano.passo < PERGUNTAS.length) { passo = plano.passo; return render(); }
  abertura();
}

function abertura() {
  app.innerHTML = `
    <section class="card abertura">
      ${faixa()}
      <div class="corpo">
        <div class="topo"><p class="selo">SUA BLACK FRIDAY</p>${ETIQUETA}</div>
        <h1>Monte a sua <span class="bf">Black Friday</span> <em>com ideias para o seu produto ou serviço</em></h1>
        <p class="sub">Responda ${PERGUNTAS.length} perguntas rápidas e receba:</p>
        <ul class="entregas">
          <li><b>📅</b><span>o seu calendário dia a dia até a Black</span></li>
          <li><b>3</b><span>ideias de campanha para o que você vende</span></li>
          <li><b>✍️</b><span>a sua oferta escrita, frase para bio e status</span></li>
          <li><b>9</b><span>mensagens prontas, para clientes e para novas</span></li>
          <li><b>6</b><span>roteiros de reels + stories de cada fase</span></li>
          <li><b>R$</b><span>a sua meta em números e o checklist final</span></li>
        </ul>
        <button class="btn" id="comecar">Montar minha Black</button>
        ${assina()}
      </div>
    </section>`;
  $("#comecar").onclick = () => { passo = 0; render(); };
}

// ============================================================
// PERGUNTAS — uma por tela
// ============================================================
function render() {
  const p = PERGUNTAS[passo];
  const pct = Math.round((passo / PERGUNTAS.length) * 100);
  let campo = "";
  const atual = r[p.id] ?? (p.padrao || "");

  if (p.tipo === "radio") {
    campo = `<div class="opcoes">${p.opcoes.map((o) => `
      <button class="opcao ${r[p.id] === o.v ? "marcada" : ""}" data-v="${esc(o.v)}">${esc(o.t)}</button>`).join("")}</div>`;
  } else if (p.tipo === "longo") {
    campo = `<textarea id="campo" rows="5">${esc(atual)}</textarea>`;
  } else if (p.tipo === "numero") {
    campo = `<div class="com-prefixo">${p.prefixo ? `<span>${p.prefixo}</span>` : ""}
      <input id="campo" type="number" inputmode="decimal" min="${p.min || 0}" step="any" value="${esc(atual)}"></div>`;
  } else if (p.tipo === "data") {
    campo = `<input id="campo" type="date" value="${esc(atual)}" min="2026-11-01" max="2026-12-31">`;
  } else {
    campo = `<input id="campo" type="text" maxlength="${p.limite || 60}" value="${esc(atual)}">`;
  }

  app.innerHTML = `
    <section class="card">
      <div class="barra"><span style="width:${pct}%"></span></div>
      <p class="contador">${passo + 1} de ${PERGUNTAS.length}</p>
      <h2>${esc(val(p.titulo))}</h2>
      ${p.ajuda ? `<p class="ajuda">${esc(val(p.ajuda))}</p>` : ""}
      ${campo}
      <p class="erro" id="erro"></p>
      <div class="nav">
        <button class="voltar" id="voltar">← Voltar</button>
        ${p.tipo !== "radio" ? `<button class="btn" id="avancar">Continuar</button>` : ""}
      </div>
    </section>`;

  $("#voltar").onclick = () => { passo--; passo < 0 ? abertura() : render(); };

  if (p.tipo === "radio") {
    app.querySelectorAll(".opcao").forEach((b) => (b.onclick = () => { r[p.id] = b.dataset.v; avancar(); }));
    return;
  }
  const c = $("#campo");
  if (p.tipo !== "data") c.focus();
  c.onkeydown = (e) => { if (e.key === "Enter" && p.tipo !== "longo") $("#avancar").click(); };
  $("#avancar").onclick = () => {
    const v = c.value.trim();
    if (!v && !p.opcional) return erro("Preencha para continuar.");
    if (p.tipo === "numero" && !(Number(v) >= (p.min || 0))) return erro("Coloque só o número.");
    if (p.id === "fecha" && v < (r.abre || BLACK_PADRAO)) return erro("O fim precisa ser no mesmo dia ou depois da abertura.");
    r[p.id] = p.tipo === "numero" ? Number(v) : v;
    avancar();
  };
}

function erro(msg) { $("#erro").textContent = msg; }

function avancar() {
  passo++;
  plano.passo = passo;
  salvar();
  passo >= PERGUNTAS.length ? finalizar() : render();
}

function finalizar() {
  const camps = montarCampanhas(r);
  if (!plano.escolha || !camps.some((c) => c.chave === plano.escolha)) plano.escolha = camps[0].chave;
  plano.concluido = true;
  plano.inicio = chaveDia(new Date());   // o calendário começa no dia em que ela terminou
  salvar();
  aba = "hoje";
  resultado();
}

// ============================================================
// O PLANO (abas)
// ============================================================
const ABAS = [
  ["hoje", "Calendário"], ["ideias", "Ideias"], ["oferta", "Oferta"],
  ["mensagens", "Mensagens"], ["conteudo", "Stories e reels"],
  ["checklist", "Checklist"], ["numeros", "Números"],
];

function campanhaEscolhida() {
  const camps = montarCampanhas(r);
  return camps.find((c) => c.chave === plano.escolha) || camps[0];
}

function botaoCopiar(texto, rotulo = "Copiar") {
  copias.push(texto);
  return `<button class="copiar" data-copia="${copias.length - 1}">${rotulo}</button>`;
}

function resultado(imprimir) {
  copias = [];
  const cal = montarCalendario(r, plano.feitas, new Date(), plano.inicio);
  const pct = Math.round((cal.feitasN / cal.total) * 100);
  const corpo = imprimir
    ? ABAS.map(([k, n]) => `<section class="painel impresso"><h3 class="titulo-aba">${n}</h3>${htmlAba(k, true)}</section>`).join("")
    : `<nav class="abas" role="tablist">${ABAS.map(([k, n]) =>
        `<button role="tab" class="aba ${aba === k ? "ativa" : ""}" data-aba="${k}" aria-selected="${aba === k}">${n}</button>`).join("")}</nav>
       <section class="painel">${htmlAba(aba)}</section>`;

  app.innerHTML = `
    <section class="card resultado">
      <div class="topo"><p class="selo">SUA BLACK FRIDAY</p>${ETIQUETA}</div>
      <h1>${esc(r.nome)}, <em>aqui está a sua Black</em></h1>
      <div class="progresso">
        <div class="barra"><span style="width:${pct}%"></span></div>
        <p>${cal.feitasN} de ${cal.total} tarefas feitas${cal.faltamDias ? ` · faltam <b>${cal.faltamDias} dias</b> para abrir` : ""}</p>
      </div>
      ${corpo}
      <div class="acoes rodape-acoes">
        <button class="btn" id="baixar">Baixar tudo em PDF</button>
        <div class="acoes-linha">
          <button class="voltar" id="refazer">Refazer respostas</button>
          ${CONFIG.MODO_TESTE ? "" : `<button class="voltar" id="sair">Sair</button>`}
        </div>
      </div>
      <p class="rodape">${esc(CONFIG.PRODUTO)} · Ferramenta ${esc(CONFIG.MARCA)} · <a href="${esc(CONFIG.SUPORTE)}" target="_blank" rel="noopener">Suporte</a>${souAdmin ? ` · <a href="/app/admin/">Área admin</a>` : ""}</p>
    </section>`;

  $("#baixar").onclick = () => { resultado(true); setTimeout(() => window.print(), 300); };
  $("#refazer").onclick = () => {
    if (!confirm("Refazer as respostas? Suas tarefas marcadas continuam salvas.")) return;
    plano.concluido = false; plano.passo = 0; passo = 0; salvar(); render();
  };
  if ($("#sair")) $("#sair").onclick = sair;
}
window.addEventListener("afterprint", () => { if (plano.concluido && document.querySelector(".impresso")) resultado(); });

function htmlAba(k, imprimir) {
  const c = campanhaEscolhida();
  const d = dados(r);

  if (k === "hoje") return htmlCalendario(imprimir);

  if (k === "ideias") {
    return `<p class="nota">Escolha a ideia que você vai usar. A oferta, as mensagens e os roteiros se ajustam a ela.</p>` +
      montarCampanhas(r).map((x, i) => `
        <article class="campanha ${x.chave === c.chave ? "escolhida" : ""}">
          <p class="num">Ideia ${i + 1}</p>
          <h4>${esc(x.nome)}</h4>
          <p>${esc(x.ideia)}</p>
          <p class="porque"><b>Por que funciona:</b> ${esc(x.porque)}</p>
          <p class="exemplo">“${esc(x.exemplo)}”</p>
          ${x.chave === c.chave
            ? `<p class="escolhida-tag">✓ Esta é a sua oferta</p>`
            : `<button class="copiar" data-escolha="${x.chave}">Usar esta ideia</button>`}
        </article>`).join("");
  }

  if (k === "oferta") {
    const o = montarOferta(r, c);
    return `
      <p class="nota">Baseada na ideia <b>${esc(c.nome)}</b>. Troque na aba Ideias se quiser.</p>
      <article class="msg"><p class="num">Texto da oferta</p><pre>${esc(o.texto)}</pre>${botaoCopiar(o.texto)}</article>
      <article class="msg"><p class="num">Frase para a bio</p><pre>${esc(o.bio)}</pre>${botaoCopiar(o.bio)}</article>
      <article class="msg"><p class="num">Status do WhatsApp / destaque</p><pre>${esc(o.status)}</pre>${botaoCopiar(o.status)}</article>`;
  }

  if (k === "mensagens") {
    return `
      <div class="alternar">
        <button class="${publico === "cliente" ? "ativa" : ""}" data-publico="cliente">Para clientes</button>
        <button class="${publico === "novo" ? "ativa" : ""}" data-publico="novo">Para quem ainda não comprou</button>
      </div>
      <p class="nota">Troque [nome] pelo nome da pessoa. Mandar pelo nome, uma a uma, vende muito mais do que mensagem em massa.</p>
      ${montarMensagens(r, c).map((m, i) => `
        <article class="msg">
          <p class="num">${i + 1}. ${esc(m.quando)}</p>
          <pre>${esc(m[publico])}</pre>
          ${botaoCopiar(m[publico])}
        </article>`).join("")}`;
  }

  if (k === "conteudo") {
    return `
      <h3>Stories de cada fase</h3>
      ${montarStories(r, c).map((s) => `
        <article class="msg"><p class="num">${esc(s.fase)}</p>
          <ol class="quadros">${s.quadros.map((q) => `<li>${esc(q)}</li>`).join("")}</ol></article>`).join("")}
      <h3>Roteiros de reels</h3>
      <p class="nota">Grave todos no mesmo dia e poste nas datas do calendário.</p>
      ${montarReels(r, c).map((x, i) => {
        const roteiro = `GANCHO: ${x.gancho}\n\nDESENVOLVIMENTO: ${x.corpo}\n\nCHAMADA: ${x.chamada}`;
        return `<article class="campanha">
          <p class="num">Reels ${i + 1} · ${esc(x.tipo)}</p>
          <p><b>Gancho:</b> ${esc(x.gancho)}</p>
          <p class="porque"><b>Desenvolvimento:</b> ${esc(x.corpo)}</p>
          <p class="porque"><b>Chamada:</b> ${esc(x.chamada)}</p>
          ${botaoCopiar(roteiro, "Copiar roteiro")}
        </article>`;
      }).join("")}`;
  }

  if (k === "checklist") {
    const lista = montarChecklist(r);
    const feitos = lista.filter((i) => plano.checklist[i.id]).length;
    return `
      <p class="nota">${feitos} de ${lista.length} prontos. Marque antes de começar a divulgar.</p>
      ${lista.map((i) => `
        <label class="tarefa ${plano.checklist[i.id] ? "feita" : ""}">
          <input type="checkbox" data-check="${i.id}" ${plano.checklist[i.id] ? "checked" : ""}>
          <span><b>${esc(i.t)}</b></span>
        </label>
        ${i.mirra && !plano.checklist[i.id] && CONFIG.CTA_PAGINA_LINK ? `
          <div class="caixa mirra">
            ${RAMO}
            <div><p><b>Ainda não tem uma página para a sua oferta?</b></p>
            <p class="nota">O Instituto Mirra monta a página de vendas da sua Black, com a sua oferta, pronta para receber clientes.</p>
            <a class="btn btn-cta" href="${esc(CONFIG.CTA_PAGINA_LINK)}" target="_blank" rel="noopener">${esc(CONFIG.CTA_PAGINA_TEXTO)}</a></div>
          </div>` : ""}`).join("")}`;
  }

  if (k === "numeros") {
    const n = montarConta(r);
    return `
      <div class="numeros">
        <div><strong>${brl(n.meta)}</strong><span>sua meta</span></div>
        <div><strong>${n.vendas}</strong><span>vendas de ${brl(n.preco)}</span></div>
        <div><strong>${n.conversas}</strong><span>conversas no total</span></div>
        <div><strong>${n.porDia}</strong><span>conversas por dia (${n.diasBlack} ${n.diasBlack > 1 ? "dias" : "dia"} de Black)</span></div>
      </div>
      <p class="nota">O presente de cada venda pode custar até <b>${brl(n.presenteMax)}</b>. Acima disso, começa a sair do seu lucro.</p>
      ${n.passouLimite ? `
        <div class="caixa alerta">
          <p><b>Atenção: a meta pede ${n.vendas} vendas, mas você entrega ${n.cap} ${n.vagas}.</b></p>
          <p class="nota">Para chegar lá sem passar do seu limite, cada venda precisa valer uns ${brl(n.kitSugerido)} — monte um kit ou pacote nesse valor, ou ajuste a meta.</p>
        </div>` : `<p class="nota">Sua capacidade (${n.cap} ${n.vagas}) dá conta da meta. 👏</p>`}`;
  }
  return "";
}

// ============================================================
// CALENDÁRIO — um dia de cada vez
// ============================================================
const DOW = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function faseDe(dt, d) {
  const ate = entreDias(dt, d.abre);
  if (dt > d.fecha) return { k: "pos", n: "Depois da Black" };
  if (dt >= d.abre) return { k: "black", n: "Semana da Black" };
  if (ate <= 7) return { k: "antecipa", n: "Reta final" };
  return { k: "prepara", n: "Preparação" };
}

function linhaTarefa(t, mostrarData) {
  return `
    <label class="tarefa ${t.feita ? "feita" : ""}">
      <input type="checkbox" data-tarefa="${t.id}" ${t.feita ? "checked" : ""}>
      <span><b>${esc(t.t)}</b>${mostrarData ? `<small>era para ${diaCurto(t.data)}</small>` : ""}</span>
      <a href="#" data-aba="${t.aba}" class="ver">ver →</a>
    </label>`;
}

function htmlCalendario(imprimir) {
  const d = dados(r);
  const cal = montarCalendario(r, plano.feitas, new Date(), plano.inicio);
  const hojeK = chaveDia(new Date());
  const porK = Object.fromEntries(cal.dias.map((x) => [x.k, x]));

  const aviso = cal.compacto ? `
    <div class="caixa fina">
      <p><b>Plano ajustado para ${cal.diasAteAbrir} ${cal.diasAteAbrir === 1 ? "dia" : "dias"} até a abertura.</b>
      ${cal.enxuto ? "Ficou só o essencial — o que mais vende." : "As tarefas foram distribuídas nos dias que você tem."}</p>
    </div>` : "";

  // PDF: lista completa, sem faixa de dias
  if (imprimir) {
    return aviso + cal.dias.map((x) => `
      <div class="dia"><p class="dia-nome">${diaLongo(x.data)}</p>${x.tarefas.map((t) => linhaTarefa(t)).join("")}</div>`).join("");
  }

  if (!cal.dias.length && !cal.atrasadas.length) {
    return `<p class="nota">Sua Black já passou. Atualize as datas em “Refazer respostas” para montar um novo calendário.</p>`;
  }

  // faixa de dias: de hoje até o último dia com tarefa
  const ultimo = cal.dias.length ? cal.dias[cal.dias.length - 1].data : new Date();
  const chips = [];
  for (let dt = dataLocal(hojeK); dt <= ultimo; dt = somaDias(dt, 1)) chips.push(dt);

  if (!diaSel || chaveDia(dataLocal(diaSel)) < hojeK || !chips.some((x) => chaveDia(x) === diaSel)) {
    diaSel = porK[hojeK] ? hojeK : (cal.dias[0] ? cal.dias[0].k : hojeK);
  }
  const sel = porK[diaSel];
  const selData = dataLocal(diaSel);
  const fase = faseDe(selData, d);
  const feitasDia = sel ? sel.tarefas.filter((t) => t.feita).length : 0;
  const totalDia = sel ? sel.tarefas.length : 0;
  const proximo = cal.dias.find((x) => x.k > diaSel);

  const chip = (dt) => {
    const k = chaveDia(dt), dia = porK[k];
    const estado = !dia ? "livre" : dia.tarefas.every((t) => t.feita) ? "ok" : "tem";
    const marca = k === chaveDia(d.abre) ? "abre" : k === chaveDia(d.fecha) ? "fecha" : "";
    return `<button class="chip ${estado} ${marca} ${k === diaSel ? "sel" : ""}" data-dia="${k}" aria-label="${diaLongo(dt)}">
      <span class="dow">${k === hojeK ? "hoje" : DOW[dt.getDay()]}</span>
      <span class="n">${dt.getDate()}</span>
      <span class="ponto"></span>
    </button>`;
  };

  // plano inteiro, por fase
  const fases = {};
  cal.dias.forEach((x) => { const f = faseDe(x.data, d); (fases[f.k] = fases[f.k] || { n: f.n, dias: [] }).dias.push(x); });

  return `
    ${aviso}
    ${cal.atrasadas.length ? `
      <details class="atraso-box" ${atrasoAberto ? "open" : ""}>
        <summary><span class="bolinha">${cal.atrasadas.length}</span> ${cal.atrasadas.length === 1 ? "tarefa ficou" : "tarefas ficaram"} para trás <span class="abrir">ver</span></summary>
        <p class="nota">Tudo bem. Faça na ordem, antes das de hoje.</p>
        ${cal.atrasadas.map((t) => linhaTarefa(t, true)).join("")}
      </details>` : ""}

    <div class="faixa-dias" role="tablist">${chips.map(chip).join("")}</div>

    <div class="dia-card fase-${fase.k}">
      <div class="dia-topo">
        <div>
          <p class="fase">${fase.n}</p>
          <h4>${diaSel === hojeK ? "Hoje" : DOW[selData.getDay()] + ", " + diaCurto(selData)}
            ${diaSel === chaveDia(d.abre) ? `<span class="tag tag-bf">abertura</span>` : ""}
            ${diaSel === chaveDia(d.fecha) ? `<span class="tag tag-bf">último dia</span>` : ""}</h4>
        </div>
        ${totalDia ? `<div class="anel" style="--p:${Math.round((feitasDia / totalDia) * 100)}"><span>${feitasDia}/${totalDia}</span></div>` : ""}
      </div>
      ${totalDia
        ? sel.tarefas.map((t) => linhaTarefa(t)).join("") +
          (feitasDia === totalDia ? `<p class="parabens">Dia concluído 🖤 ${proximo ? `Próximo: <a href="#" data-dia="${proximo.k}">${diaCurto(proximo.data)} →</a>` : ""}</p>` : "")
        : `<p class="livre-txt">Dia livre. ${proximo ? `Se quiser adiantar, a próxima tarefa é em <a href="#" data-dia="${proximo.k}">${diaCurto(proximo.data)} →</a>` : ""}</p>`}
    </div>

    <details class="plano-todo" ${planoAberto ? "open" : ""}>
      <summary>Ver o plano inteiro</summary>
      ${Object.values(fases).map((f) => {
        const ts = f.dias.flatMap((x) => x.tarefas), ok = ts.filter((t) => t.feita).length;
        return `<div class="fase-bloco">
          <p class="fase-nome">${f.n} <span>${ok}/${ts.length}</span></p>
          ${f.dias.map((x) => `<button class="linha-dia ${x.tarefas.every((t) => t.feita) ? "ok" : ""}" data-dia="${x.k}">
            <span class="ld-data">${DOW[x.data.getDay()]} ${diaCurto(x.data)}</span>
            <span class="ld-txt">${esc(x.tarefas.map((t) => t.t).join(" · "))}</span>
          </button>`).join("")}
        </div>`;
      }).join("")}
    </details>`;
}

// lembra se os blocos recolhíveis estavam abertos
app.addEventListener("toggle", (e) => {
  if (e.target.classList.contains("plano-todo")) planoAberto = e.target.open;
  if (e.target.classList.contains("atraso-box")) atrasoAberto = e.target.open;
}, true);

// cliques dentro do plano (um só ouvinte)
app.addEventListener("click", async (e) => {
  const el = e.target.closest("[data-aba],[data-copia],[data-escolha],[data-publico],[data-dia]");
  if (!el) return;
  if (el.dataset.aba) { e.preventDefault(); aba = el.dataset.aba; resultado(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (el.dataset.copia) {
    try { await navigator.clipboard.writeText(copias[el.dataset.copia]); } catch { return aviso("Não consegui copiar. Selecione o texto e copie.", true); }
    const antes = el.textContent; el.textContent = "Copiado ✓";
    setTimeout(() => (el.textContent = antes), 1600);
  }
  if (el.dataset.escolha) { plano.escolha = el.dataset.escolha; salvar(); resultado(); aviso("Oferta atualizada em todas as abas"); }
  if (el.dataset.publico) { publico = el.dataset.publico; resultado(); }
  if (el.dataset.dia) {
    e.preventDefault(); diaSel = el.dataset.dia; planoAberto = false; resultado();
    const card = document.querySelector(".dia-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});
app.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.tarefa) { plano.feitas[t.dataset.tarefa] = t.checked; salvar(); resultado(); }
  if (t.dataset.check) { plano.checklist[t.dataset.check] = t.checked; salvar(); resultado(); }
});

// ============================================================
// INÍCIO
// ============================================================
(async function () {
  if (CONFIG.MODO_TESTE) {
    usuario = { id: "teste", email: "teste@local" };
    if (location.search.includes("demo")) {
      plano = Object.assign(novoPlano(), {
        concluido: true, passo: PERGUNTAS.length,
        inicio: new URLSearchParams(location.search).get("inicio") || null,
        respostas: {
          nome: "Ana", vende: "doces finos", tipo_negocio: "produto_encomenda",
          carro_chefe: "a caixa de brigadeiros", preco: 89, encostado: "os bombons de licor",
          capacidade: 40, meta: "m5", conversao: "c2", canal: "whatsapp", base: "muitos",
          abre: "2026-11-27", fecha: "2026-11-30",
        },
      });
      return iniciar();
    }
    plano = (await carregarPlano()) || novoPlano();
    return iniciar();
  }

  if (!window.supabase || CONFIG.SUPABASE_URL.includes("SEU-PROJETO") || CONFIG.SUPABASE_ANON_KEY.includes("COLE-AQUI")) {
    app.innerHTML = `<section class="card"><h2>Falta configurar</h2><p class="ajuda">Preencha SUPABASE_URL e SUPABASE_ANON_KEY em js/config.js (ou ligue MODO_TESTE para testar sem login).</p></section>`;
    return;
  }
  sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  sb.auth.onAuthStateChange((ev, sessao) => {
    if (sessao && sessao.user) setTimeout(() => entrar(sessao.user), 0);
  });
  const linkVencido = /error_code|error_description/.test(location.hash + location.search);
  const { data: { session } } = await sb.auth.getSession();
  if (session) entrar(session.user);
  else telaLogin(linkVencido ? `<p class="erro">Esse link expirou ou já foi usado. Peça um novo abaixo.</p>` : "");
  if (linkVencido) history.replaceState(null, "", location.pathname);
})();
