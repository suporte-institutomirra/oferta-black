// ============================================================
// APP — controla as telas. Normalmente você não precisa mexer aqui.
// ============================================================

const r = {};       // respostas
let passo = -1;     // -1 = tela de abertura
const $ = (s) => document.querySelector(s);
const app = $("#app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const val = (x) => (typeof x === "function" ? x(r) : x || "");

// ---------- abertura ----------
function abertura() {
  app.innerHTML = `
    <section class="card abertura">
      <p class="selo">BLACK FRIDAY · ${esc(CONFIG.MARCA)}</p>
      <h1>Monte a sua Black Friday <em>sem baixar o preço</em></h1>
      <p>Responda 12 perguntas rápidas e receba:</p>
      <ul>
        <li>3 campanhas escolhidas para o que você vende</li>
        <li>3 mensagens prontas para copiar e mandar</li>
        <li>A sua conta: quantas vendas e quantas conversas</li>
        <li>Tudo em PDF para guardar</li>
      </ul>
      <button class="btn" id="comecar">Começar</button>
      <p class="assina">— ${esc(CONFIG.AUTORA)}</p>
    </section>`;
  $("#comecar").onclick = () => { passo = 0; render(); };
}

// ---------- uma pergunta por tela ----------
function render() {
  const p = PERGUNTAS[passo];
  const pct = Math.round((passo / PERGUNTAS.length) * 100);
  let campo = "";

  if (p.tipo === "radio") {
    campo = `<div class="opcoes">${p.opcoes.map((o) => `
      <button class="opcao ${r[p.id] === o.v ? "marcada" : ""}" data-v="${esc(o.v)}">${esc(o.t)}</button>`).join("")}
    </div>`;
  } else if (p.tipo === "longo") {
    campo = `<textarea id="campo" rows="5">${esc(r[p.id])}</textarea>`;
  } else {
    const tipo = p.tipo === "tel" ? "tel" : "text";
    const ph = p.tipo === "tel" ? "(85) 99999-9999" : "";
    campo = `<input id="campo" type="${tipo}" maxlength="${p.limite || 20}" placeholder="${ph}" value="${esc(r[p.id])}">`;
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
    app.querySelectorAll(".opcao").forEach((b) => (b.onclick = () => {
      r[p.id] = b.dataset.v;
      avancar();
    }));
  } else {
    const c = $("#campo");
    c.focus();
    if (p.tipo === "tel") c.oninput = () => (c.value = mascaraTel(c.value));
    c.onkeydown = (e) => { if (e.key === "Enter" && p.tipo !== "longo") $("#avancar").click(); };
    $("#avancar").onclick = () => {
      const v = c.value.trim();
      if (!v && !p.opcional) return erro("Preencha para continuar.");
      if (p.tipo === "tel" && v.replace(/\D/g, "").length < 10) return erro("Coloque o número com DDD.");
      r[p.id] = v;
      avancar();
    };
  }
}

function erro(msg) { $("#erro").textContent = msg; }
function avancar() { passo++; passo >= PERGUNTAS.length ? finalizar() : render(); }

function mascaraTel(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

// ---------- resultado ----------
function finalizar() {
  const camps = montarCampanhas(r);
  const conta = montarConta(r);
  const msgs = montarMensagens(r, camps[0]);

  app.innerHTML = `
    <section class="card resultado" id="resultado">
      <p class="selo">A SUA BLACK FRIDAY</p>
      <h1>${esc(r.nome)}, aqui está o seu plano</h1>

      <h3>1. A sua conta</h3>
      <div class="numeros">
        <div><strong>${brl(conta.meta)}</strong><span>meta extra</span></div>
        <div><strong>${conta.vendas}</strong><span>vendas de ~${brl(conta.ticket)}</span></div>
        <div><strong>${conta.conversas}</strong><span>conversas na semana</span></div>
        <div><strong>${conta.porDia}</strong><span>conversas por dia</span></div>
      </div>
      <p class="nota">O presente de cada venda pode custar até <b>${brl(conta.presenteMax)}</b>. Acima disso, começa a sair do seu lucro.</p>

      <h3>2. As suas 3 campanhas</h3>
      ${camps.map((c, i) => `
        <article class="campanha">
          <p class="num">Campanha ${i + 1}</p>
          <h4>${esc(c.nome)}</h4>
          <p>${esc(c.ideia)}</p>
          <p class="porque"><b>Por que funciona:</b> ${esc(c.porque)}</p>
          <p class="exemplo">“${esc(c.exemplo)}”</p>
        </article>`).join("")}

      <h3>3. As mensagens da semana</h3>
      <p class="nota">Usando a campanha 1. Troque [nome] pelo nome da cliente.</p>
      ${msgs.map((m, i) => `
        <article class="msg">
          <p class="num">${esc(m.dia)}</p>
          <pre id="m${i}">${esc(m.texto)}</pre>
          <button class="copiar" data-i="${i}">Copiar</button>
        </article>`).join("")}

      <div class="acoes">
        <button class="btn" id="baixar">Baixar PDF</button>
        ${CONFIG.CTA_LINK ? `<a class="btn btn-cta" href="${esc(CONFIG.CTA_LINK)}" target="_blank" rel="noopener">${esc(CONFIG.CTA_TEXTO)}</a>` : ""}
      </div>

      <p class="rodape">Montado para ${esc(r.nome)} em ${new Date().toLocaleDateString("pt-BR")} · ${esc(CONFIG.MARCA)} · ${esc(CONFIG.INSTAGRAM)}</p>
    </section>`;

  $("#baixar").onclick = () => window.print();
  app.querySelectorAll(".copiar").forEach((b) => (b.onclick = async () => {
    await navigator.clipboard.writeText($("#m" + b.dataset.i).textContent);
    b.textContent = "Copiado ✓";
    setTimeout(() => (b.textContent = "Copiar"), 1800);
  }));
  window.scrollTo(0, 0);

  if (!location.search.includes("demo")) salvar(camps); // demo não suja o banco
}

// ---------- salvar no Supabase ----------
function rotulo(id) {
  const p = PERGUNTAS.find((x) => x.id === id);
  const o = p?.opcoes?.find((x) => x.v === r[id]);
  return o ? o.t : r[id] || "";
}

function salvar(camps) {
  if (!CONFIG.SUPABASE_URL.includes("supabase.co") || CONFIG.SUPABASE_URL.includes("SEU-PROJETO")) {
    console.warn("Supabase não configurado (js/config.js). Respostas não foram salvas.", r);
    return;
  }
  const linha = {
    nome: r.nome, vende: r.vende,
    tipo_negocio: rotulo("tipo_negocio"),
    carro_chefe: r.carro_chefe, encostado: r.encostado,
    ticket: rotulo("ticket"), meta: rotulo("meta"),
    conversao: rotulo("conversao"), ponto_fraco: rotulo("ponto_fraco"),
    pagina_vendas: rotulo("pagina_vendas"),
    instagram: r.instagram || null, whatsapp: r.whatsapp,
    campanhas_entregues: camps.map((c) => c.nome),
    respostas: r,
    origem: location.search.slice(1) || null,
  };
  fetch(`${CONFIG.SUPABASE_URL}/rest/v1/respostas`, {
    method: "POST",
    headers: {
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(linha),
  }).then((res) => { if (!res.ok) res.text().then((t) => console.error("Supabase:", t)); })
    .catch((e) => console.error("Supabase:", e));
}

// ---------- atalho para testar sem responder tudo: /?demo ----------
if (location.search.includes("demo")) {
  Object.assign(r, {
    nome: "Ana", vende: "doces finos", tipo_negocio: "produto_encomenda",
    carro_chefe: "a caixa de brigadeiros", encostado: "os bombons de licor",
    ticket: "50a100", meta: "m5", conversao: "c2", ponto_fraco: "prejuizo",
    pagina_vendas: "Não tenho", instagram: "@ana.doces", whatsapp: "(85) 99999-0000",
  });
  finalizar();
} else {
  abertura();
}
