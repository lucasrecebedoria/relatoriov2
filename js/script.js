const app = document.getElementById('app');
let currentUser = null;
let reports = JSON.parse(localStorage.getItem('reports_v8') || '[]');
let users = JSON.parse(localStorage.getItem('users_v6') || '[]');
const admins = ["0001","admin","6266","70029","4144"];
let adminViewMatricula = null;
const brl = (n)=>`R$ ${Number(n||0).toFixed(2)}`;
const saveReports = ()=>localStorage.setItem('reports_v8', JSON.stringify(reports));
const saveUsers   = ()=>localStorage.setItem('users_v6', JSON.stringify(users));
const byDateDesc = (a,b)=> (a.data>b.data?-1:a.data<b.data?1:0);

// Screens
function renderLogin(){
  app.innerHTML = `<header><h1>Relatório de Diferenças</h1></header>
  <div class="container"><div class="card">
    <div class="row"><input id="matricula" placeholder="Matrícula"><input id="senha" type="password" placeholder="Senha"></div>
    <div class="row"><button onclick="login()">Login</button><button onclick="renderRegister()">Cadastrar novo usuário</button></div>
  </div></div>`;
}
function renderRegister(){
  app.innerHTML = `<header><h1>Cadastrar Usuário</h1></header>
  <div class="container"><div class="card">
    <div class="row"><input id="matricula" placeholder="Matrícula"><input id="nome" placeholder="Nome"><input id="senha" type="password" placeholder="Senha"></div>
    <div class="row"><button onclick="register()">Cadastrar</button><button onclick="renderLogin()">Voltar</button></div>
  </div></div>`;
}

// Auth
function register(){
  const m = document.getElementById('matricula').value.trim();
  const n = document.getElementById('nome').value.trim();
  const s = document.getElementById('senha').value.trim();
  if(!m||!n||!s) return alert("Preencha todos os campos.");
  if(users.find(u=>u.matricula===m)) return alert("Matrícula já cadastrada.");
  users.push({matricula:m,nome:n,senha:s});
  saveUsers(); alert("Usuário cadastrado!"); renderLogin();
}


function login() {
    console.log("Usando login do Firestore");
    const matricula = document.getElementById('matricula')?.value || '';
    const senha = document.getElementById('senha')?.value || '';

    if (!matricula || !senha) {
        alert("Preencha matrícula e senha.");
        return;
    }

    db.collection("usuarios").doc(matricula).get()
        .then(doc => {
            if (!doc.exists) {
                alert("Usuário não encontrado.");
                return;
            }
            const dados = doc.data();
            if (dados.senha === senha) {
                alert("Login realizado com sucesso!");
                renderMain();
            } else {
                alert("Senha incorreta.");
            }
        })
        .catch(error => {
            console.error("Erro ao buscar usuário:", error);
            alert("Erro no login.");
        });
}

    db.collection("usuarios").doc(matricula).get()
        .then(doc => {
            if (!doc.exists) {
                alert("Usuário não encontrado.");
                return;
            }
            const dados = doc.data();
            if (dados.senha === senha) {
                alert("Login realizado com sucesso!");
                renderMain(); // mantém o fluxo atual
            } else {
                alert("Senha incorreta.");
            }
        })
        .catch(error => {
            console.error("Erro ao buscar usuário:", error);
            alert("Erro no login.");
        });
}

function logout(){ currentUser=null; renderLogin(); }
function changePassword(){
  const nova = prompt("Digite a nova senha:");
  if(!nova) return;
  users = users.map(u=>u.matricula===currentUser.matricula? {...u,senha:nova}:u);
  saveUsers(); alert("Senha alterada!");
}

// Pós conferência
function openObsPopup(idx){
  const isAdmin = admins.includes(currentUser.matricula);
  const overlay = document.createElement('div'); overlay.className='overlay'; overlay.id='overlayObs';
  const popup   = document.createElement('div'); popup.className='popup'; popup.id='popupObs';

  const r = reports[idx];
  const thumbs = (r.posObs.images||[]).map((src, j)=>`
    <div class="thumb">
      <img src="${src}" alt="thumb">
      <div class="actions">
        <button onclick="window.open('${src}','_blank')">Visualizar</button>
        ${isAdmin? `<button onclick="deleteObsImage(${idx},${j})">Excluir</button>`:""}
      </div>
    </div>`).join("");

  
  // (reconstruido) conteúdo do popup de Pós conferência
  r.posObs = r.posObs || { images: [], text: "" };
  popup.innerHTML = `
    <div class="popup-header">
      <h3>Obs pos conferencia</h3>
      <button class="close" onclick="closeObsPopup()">×</button>
    </div>
    <div class="popup-body">
      <div class="row">
        <textarea id="posObsField" style="color:#fff; -webkit-text-fill-color:#fff; background-color:#333; caret-color:#fff;" ${isAdmin ? "" : "readonly"}>${r.posObs.text || ""}</textarea>
      </div>
      ${isAdmin ? `<div class="row"><input id="imgInput" type="file" accept="image/*" multiple></div>` : ``}
      <div class="thumbs">${thumbs || ''}</div>
    </div>
    <div class="popup-actions">
      ${isAdmin ? `<button onclick="saveObs(${idx})">Salvar</button><button onclick="addObsImages(${idx})">Adicionar Imagens</button>` : ``}
      <button onclick="closeObsPopup()">Fechar</button>
    </div>
  `;

  // força cor branca no campo de pós-conferência
  setTimeout(() => {
    const f = document.getElementById('posObsField');
    if (f) {
      f.style.color = '#fff';
      f.style.backgroundColor = '#333';
      f.style.caretColor = '#fff';
      try { f.style.webkitTextFillColor = '#fff'; } catch(e) {}
    }
  }, 0);


  document.body.appendChild(overlay); document.body.appendChild(popup);
}
function closeObsPopup(){ document.getElementById('overlayObs')?.remove(); document.getElementById('popupObs')?.remove(); }
function addObsImages(idx){
  const input = document.getElementById('imgInput');
  if(!input || !input.files?.length) return;
  const r = reports[idx];
  r.posObs.images = r.posObs.images || [];
  const files = Array.from(input.files);
  let pending = files.length;
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = e=>{
      r.posObs.images.push(e.target.result);
      if(--pending===0){ saveReports();
        closeObsPopup(); openObsPopup(idx); renderMain();
      }};
    reader.readAsDataURL(file);
  });
}
function deleteObsImage(idx, j){
  const r = reports[idx]; if(!r.posObs?.images) return;
  r.posObs.images.splice(j,1);
  saveReports(); closeObsPopup(); openObsPopup(idx); renderMain();
}
function saveObs(idx){
  const r = reports[idx];
  r.posObs.text = document.getElementById('posObsField').value;
  saveReports(); alert('Pós conferência salva!'); renderMain();
}

// CRUD
function addReport(){
  const data = document.getElementById('data').value;
  const folha = parseFloat(document.getElementById('folha').value);
  const dinheiro = parseFloat(document.getElementById('dinheiro').value);
  if(isNaN(folha)||isNaN(dinheiro) || !data) return alert("Preencha data e valores numéricos.");
  const obs = document.getElementById('obs').value;
  const sf = (dinheiro - folha).toFixed(2);
  const matricula = document.getElementById('userSelect') ? document.getElementById('userSelect').value : currentUser.matricula;
  reports.push({data, folha, dinheiro, sf, obs, matricula, posObs:{text:"", images:[]}});
  saveReports(); renderMain();
}
function deleteReport(i){
  if(!confirm("Excluir este relatório?")) return;
  reports.splice(i,1); saveReports(); renderMain();
}
function toggleReport(i){ document.getElementById('report-'+i)?.classList.toggle('hidden'); }

// List
function renderMain(){
  const isAdmin = admins.includes(currentUser.matricula);
  let top = `<header><h1>Relatório de Diferenças <span class="badge">${isAdmin?'Admin':'Usuário'}</span></h1>
    <div><span class="small">${currentUser.nome} (${currentUser.matricula})</span>
    <button onclick="changePassword()">Alterar Senha</button><button onclick="logout()">Logout</button></div></header>`;
  let content = `<div class="container">`;

  if(isAdmin){
    if(!adminViewMatricula){
      const matsSet = new Set(reports.map(r=>r.matricula));
      const mats = Array.from(matsSet).sort();
      const userOptions = users.map(u=>`<option value="${u.matricula}">${u.matricula} - ${u.nome}</option>`).join('');
      content += `
        <div class="card">
          <h3>Gerar Relatório</h3>
          <div class="row">
            <select id="userSelect">${userOptions}</select>
            <input id="data" type="date">
            <input id="folha" type="number" step="0.01" placeholder="Valor folha (R$)">
            <input id="dinheiro" type="number" step="0.01" placeholder="Valor em dinheiro (R$)">
            <input id="obs" placeholder="Observação">
          </div>
          <div class="row"><button onclick="addReport()">Salvar</button></div>
        </div>
        <div class="card">
          <h3>Matrículas</h3>
          ${(mats.length? mats.map(m=>`<button class="chip group" onclick="openAdminMat('${m}')">${m}</button>`).join('') : '<span class="small">Sem relatórios.</span>')}
          <p class="small">Clique numa matrícula para ver os caixas.</p>
        </div>`;
    } else {
      const all = reports.filter(r=>r.matricula===adminViewMatricula).sort(byDateDesc);
      const latest = all.slice(0,20);
      content += `
        <div class="card">
          <div class="row">
            <button onclick="adminViewMatricula=null; renderMain()">← Voltar</button>
            <div class="badge">Matrícula ${adminViewMatricula}</div>
          </div>
          <h3>Últimos 20 relatórios</h3>
          ${renderReports(latest, true)}
          <hr/>
          <div class="row"><input type="date" id="filterDateAdmin"><button onclick="filterOlderAdmin()">Filtrar mais antigos</button></div>
          <div id="olderAdmin"></div>
        </div>`;
    }
  } else {
    const mine = reports.filter(r=>r.matricula===currentUser.matricula).sort(byDateDesc);
    const top15 = mine.slice(0,15);
    const rest = mine.slice(15);
    content += `<div class="card">
        <h3>Meus relatórios</h3>
        ${renderReports(top15, false, false)}
        ${rest.length? `<hr/><details><summary>Relatórios antigos (minimizados)</summary>${renderReports(rest, false, true)}</details>` : ''}
      </div>`;
  }
  content += `</div>`;
  app.innerHTML = top + content;
}
function renderReports(list, asAdmin, startMinimized=false){
  if(!list.length) return '<span class="small">Sem relatórios.</span>';
  return list.map(r=>{
    const i = reports.indexOf(r);
    const hasPos = r.posObs && ((r.posObs.text||"").trim().length>0 || (r.posObs.images||[]).length>0);
    return `<div class="report">
      <div class="head">
        <div class="meta"><strong>${r.data}</strong> — Matrícula: ${r.matricula} ${hasPos?'<span class="alert">Verificar pós conferência</span>':''}</div>
        <div class="actions">
          ${asAdmin? `<button onclick="deleteReport(${i})">Excluir</button>`:''}
          <button onclick="toggleReport(${i})">Ver/Esconder</button>
          <button onclick="openObsPopup(${i})">Pós conferência</button>
        </div>
      </div>
      <div id="report-${i}" class="${startMinimized?'hidden':''}">
        Folha: <span class="kbd">${brl(r.folha)}</span> &nbsp;|&nbsp;
        Dinheiro: <span class="kbd">${brl(r.dinheiro)}</span> &nbsp;|&nbsp;
        Sobra/Falta: <span class="kbd">${brl(r.sf)}</span><br/>
        Observação: ${r.obs||''}
      </div>
    </div>`;
  }).join('');
}
function filterOlderAdmin(){
  const date = document.getElementById('filterDateAdmin').value;
  if(!date){ document.getElementById('olderAdmin').innerHTML = '<span class="small">Escolha uma data.</span>'; return; }
  const older = reports.filter(r=>r.matricula===adminViewMatricula && r.data<=date)
                       .sort(byDateDesc).slice(20);
  document.getElementById('olderAdmin').innerHTML = renderReports(older, true, true);
}
function openAdminMat(mat){ adminViewMatricula = mat; renderMain(); }

renderLogin();

function salvarUsuario() {
    const matricula = document.getElementById('matricula')?.value || '';
    const nome = document.getElementById('nome')?.value || '';
    const data = document.getElementById('data')?.value || '';
    const folha = parseFloat(document.getElementById('folha')?.value || 0);
    const dinheiro = parseFloat(document.getElementById('dinheiro')?.value || 0);
    const obs = document.getElementById('obs')?.value || '';
    const posObs = document.getElementById('posObsField')?.value || '';

    if (!matricula) {
        alert("Matrícula é obrigatória.");
        return;
    }

    db.collection("usuarios").doc(matricula).set({
        matricula: matricula,
        nome: nome,
        data: data,
        folha: folha,
        dinheiro: dinheiro,
        obs: obs,
        posObs: posObs,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("Usuário salvo com sucesso!");
    })
    .catch((error) => {
        console.error("Erro ao salvar usuário: ", error);
        alert("Erro ao salvar. Verifique o console.");
    });
}


function cadastrarUsuario() {
    const matricula = document.getElementById('matricula')?.value || '';
    const nome = document.getElementById('nome')?.value || '';
    const senha = document.getElementById('senha')?.value || '';
    const data = document.getElementById('data')?.value || '';
    const folha = parseFloat(document.getElementById('folha')?.value || 0);
    const dinheiro = parseFloat(document.getElementById('dinheiro')?.value || 0);
    const obs = document.getElementById('obs')?.value || '';
    const posObs = document.getElementById('posObsField')?.value || '';

    if (!matricula || !senha) {
        alert("Matrícula e senha são obrigatórias.");
        return;
    }

    db.collection("usuarios").doc(matricula).set({
        matricula: matricula,
        nome: nome,
        senha: senha,
        data: data,
        folha: folha,
        dinheiro: dinheiro,
        obs: obs,
        posObs: posObs,
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("Usuário cadastrado com sucesso!");
    })
    .catch((error) => {
        console.error("Erro ao cadastrar usuário: ", error);
        alert("Erro ao cadastrar. Verifique o console.");
    });
}
