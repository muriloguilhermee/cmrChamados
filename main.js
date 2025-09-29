// ===== VARIÁVEIS =====
let idChamado = 0, boardState = JSON.parse(localStorage.getItem('kanbanData')) || null;
const boardEl = document.getElementById('kanban'), previewContainer = document.getElementById('preview-container');
let chart;
const imageModal = document.getElementById('image-modal');
const imageModalImg = document.getElementById('image-modal-img');

// ===== FORM PREVIEW =====
document.getElementById('print').addEventListener('change', () => {
  previewContainer.innerHTML = '';
  Array.from(document.getElementById('print').files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const thumb = document.createElement('div'); thumb.className = 'print-thumb'; thumb.draggable = true;
      const img = document.createElement('img'); img.src = e.target.result;
      img.onclick = () => { imageModalImg.src = e.target.result; imageModal.style.display = 'flex'; };
      const btn = document.createElement('button'); btn.textContent = '✕';
      btn.onclick = () => thumb.remove();
      thumb.appendChild(img); thumb.appendChild(btn);
      previewContainer.appendChild(thumb);
      initDragImage(thumb);
    }
    reader.readAsDataURL(file);
  });
});

function limparFormulario() { 
  document.getElementById('form-chamado').reset(); 
  previewContainer.innerHTML = ''; 
}

// ===== CRIAR CARD =====
function criarCard({ cliente, empresa, problema, imagens }) {
  const card = document.createElement('div'); 
  card.className = 'card'; 
  card.draggable = true; 
  card.id = 'chamado-' + (idChamado++);
  
  card.ondragstart = e => e.dataTransfer.setData('text/plain', card.id);

  const cDiv = document.createElement('div'); cDiv.className = 'cliente'; cDiv.textContent = cliente;
  const eDiv = document.createElement('div'); eDiv.className = 'empresa'; eDiv.textContent = empresa;
  const pDiv = document.createElement('div'); pDiv.className = 'problema'; pDiv.textContent = problema;
  card.appendChild(cDiv); card.appendChild(eDiv); card.appendChild(pDiv);

  const gallery = document.createElement('div'); gallery.className = 'gallery';
  (imagens || []).forEach(src => {
    const thumb = document.createElement('div');
    const img = document.createElement('img'); img.src = src;
    img.onclick = () => { imageModalImg.src = src; imageModal.style.display = 'flex'; };
    const btn = document.createElement('button'); btn.textContent = '✕'; btn.onclick = () => { thumb.remove(); salvarBoard(); };
    thumb.appendChild(img); thumb.appendChild(btn);
    gallery.appendChild(thumb);
    initDragImage(thumb);
  });
  card.appendChild(gallery);

  // Ações
  const actions = document.createElement('div'); actions.className = 'actions';
  const doneBtn = document.createElement('button'); doneBtn.textContent = 'Concluir'; doneBtn.className = 'done-btn';
  doneBtn.onclick = () => {
  const concl = Array.from(boardEl.querySelectorAll('.column'))
                      .find(c => c.querySelector('h2')?.textContent.trim() === 'Concluído');
  if (concl) {
    concl.appendChild(card);
    salvarBoard();
  } else {
    alert('Coluna "Concluído" não encontrada!');
  }
};

  const delBtn = document.createElement('button'); delBtn.textContent = 'Excluir'; delBtn.className = 'delete-btn';
  delBtn.onclick = () => { card.remove(); salvarBoard(); };
  const editBtn = document.createElement('button'); editBtn.textContent = 'Editar'; editBtn.className = 'edit-btn';
  actions.appendChild(doneBtn); actions.appendChild(delBtn); actions.appendChild(editBtn);
  card.appendChild(actions);

  // Modal de edição
  const modal = document.createElement('div'); 
  modal.className = 'card-modal';
  modal.innerHTML = `
    <h3>Editar Chamado</h3>
    <input class="modal-cliente" value="${cliente}">
    <input class="modal-empresa" value="${empresa}">
    <textarea class="modal-problema">${problema}</textarea>
    <input type="file" class="modal-print" accept="image/*" multiple>
    <div class="modal-preview"></div>
    <button class="add-files-btn">Adicionar Arquivos</button>
    <button class="save-modal">Salvar</button>
    <button class="close-modal">Fechar</button>
  `;
  modal.querySelector('.close-modal').onclick = () => modal.style.display = 'none';

  const modalPreview = modal.querySelector('.modal-preview');
  const modalPrint = modal.querySelector('.modal-print');

  // Carregar imagens já existentes do card na pré-visualização
  card.querySelectorAll('.gallery img').forEach(img => {
    const thumb = document.createElement('div');
    const imgel = document.createElement('img'); imgel.src = img.src;
    imgel.onclick = () => { imageModalImg.src = img.src; imageModal.style.display = 'flex'; };
    const btn = document.createElement('button'); btn.textContent = '✕';
    btn.onclick = () => { thumb.remove(); img.parentElement.remove(); salvarBoard(); };
    thumb.appendChild(imgel); thumb.appendChild(btn);
    modalPreview.appendChild(thumb);
  });

  // Botão adicionar arquivos no modal
  modal.querySelector('.add-files-btn').onclick = () => modalPrint.click();

  // Adicionar novas imagens selecionadas no modal
  modalPrint.addEventListener('change', () => {
    Array.from(modalPrint.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        // Pré-visualização do modal
        const thumb = document.createElement('div');
        const img = document.createElement('img'); img.src = e.target.result;
        img.onclick = () => { imageModalImg.src = e.target.result; imageModal.style.display = 'flex'; };
        const btn = document.createElement('button'); btn.textContent = '✕';
        btn.onclick = () => { thumb.remove(); cardThumb.remove(); salvarBoard(); };
        thumb.appendChild(img); thumb.appendChild(btn);
        modalPreview.appendChild(thumb);

        // Adicionar na galeria do card
        const cardThumb = document.createElement('div');
        const cardImg = document.createElement('img'); cardImg.src = e.target.result;
        cardImg.onclick = () => { imageModalImg.src = e.target.result; imageModal.style.display = 'flex'; };
        const cardBtn = document.createElement('button'); cardBtn.textContent = '✕';
        cardBtn.onclick = () => { cardThumb.remove(); salvarBoard(); };
        cardThumb.appendChild(cardImg); cardThumb.appendChild(cardBtn);
        card.querySelector('.gallery').appendChild(cardThumb);
        initDragImage(cardThumb);

        salvarBoard();
      };
      reader.readAsDataURL(file);
    });
  });

  modal.querySelector('.save-modal').onclick = () => {
    card.querySelector('.cliente').textContent = modal.querySelector('.modal-cliente').value;
    card.querySelector('.empresa').textContent = modal.querySelector('.modal-empresa').value;
    card.querySelector('.problema').textContent = modal.querySelector('.modal-problema').value;
    salvarBoard(); 
    modal.style.display = 'none';
  };

  editBtn.onclick = () => modal.style.display = 'block';
  card.appendChild(modal);

  return card;
}

// ===== COLUNAS FIXAS =====
function adicionarColuna(nome) {
  const coluna = document.createElement('div'); 
  coluna.className = 'column';
  coluna.innerHTML = `<h2>${nome}</h2>`; // sem botões de editar/excluir
  coluna.ondragover = e => e.preventDefault();
  coluna.ondrop = e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const card = document.getElementById(id);
    if (card) coluna.appendChild(card);
    salvarBoard();
  };
  boardEl.appendChild(coluna); 
  return coluna;
}

// ===== OUTRAS FUNÇÕES =====
function adicionarEtapa() { 
  const nome = document.getElementById('nova-etapa').value.trim(); 
  if (!nome) return; 
  adicionarColuna(nome); 
  document.getElementById('nova-etapa').value = ''; 
  salvarBoard(); 
}

function filtrarChamados() { 
  const termo = document.getElementById('busca').value.toLowerCase(); 
  document.querySelectorAll('.card').forEach(c => { 
    c.style.display = (c.querySelector('.cliente').textContent.toLowerCase().includes(termo) || 
                       c.querySelector('.empresa').textContent.toLowerCase().includes(termo)) ? 'block' : 'none'; 
  }); 
}

// ===== GRÁFICO =====
function atualizarChart() {
  const etapas = [], valores = [];
  boardEl.querySelectorAll('.column').forEach(c => { 
    etapas.push(c.querySelector('h2').textContent); 
    valores.push(c.querySelectorAll('.card').length); 
  });
  const total = valores.reduce((a, b) => a + b, 0);
  const porcentagens = valores.map(v => total ? (v / total * 100).toFixed(1) : 0);
  if(chart) chart.destroy();
  const colors = ['#7c5cff','#00e0ff','#3de07a','#ff4d4d','#ffaa00','#ff66cc','#66ffcc'];
  const ctx = document.getElementById('chart').getContext('2d');
  chart = new Chart(ctx,{
    type:'bar',
    data:{
      labels:etapas.map((t,i)=>`${t} (${porcentagens[i]}%)`),
      datasets:[{label:'Chamados',data:valores,backgroundColor:valores.map((_,i)=>colors[i%colors.length]),borderColor:'#fff',borderWidth:2,borderRadius:8}]
    },
    options:{
      responsive:true,
      plugins:{legend:{display:false},tooltip:{enabled:true}},
      scales:{y:{beginAtZero:true,ticks:{stepSize:1}}},
      animation:{duration:800,easing:'easeOutQuart'}
    }
  });
}

// ===== SALVAR / RESTAURAR =====
function salvarBoard() {
  const data = [];
  boardEl.querySelectorAll('.column').forEach(col => {
    const colData = { titulo: col.querySelector('h2').textContent, chamados: [] };
    col.querySelectorAll('.card').forEach(c => {
      const imgs = []; c.querySelectorAll('.gallery img').forEach(i=>imgs.push(i.src));
      colData.chamados.push({ cliente: c.querySelector('.cliente').textContent, empresa: c.querySelector('.empresa').textContent, problema: c.querySelector('.problema').textContent, imagens: imgs });
    });
    data.push(colData);
  });
  localStorage.setItem('kanbanData',JSON.stringify(data));
  atualizarChart();
}

function restaurarBoard() {
  boardEl.innerHTML = '';
  if(!boardState){ adicionarColuna('Pendente'); adicionarColuna('Em Andamento'); adicionarColuna('Concluído'); return; }
  boardState.forEach(col => {
    const coluna = adicionarColuna(col.titulo);
    col.chamados.forEach(ch => coluna.appendChild(criarCard(ch)));
  });
  atualizarChart();
}

// ===== FORM SUBMIT =====
document.getElementById('form-chamado').onsubmit = function (e) {
  e.preventDefault();
  const cliente = document.getElementById('cliente').value;
  const empresa = document.getElementById('empresa').value;
  const problema = document.getElementById('problema').value;
  const imgs = [];
  previewContainer.querySelectorAll('img').forEach(img => imgs.push(img.src));
  const card = criarCard({ cliente, empresa, problema, imagens: imgs });
  const pendente = Array.from(boardEl.querySelectorAll('.column')).find(c => c.querySelector('h2').textContent === 'Pendente');
  pendente.appendChild(card); salvarBoard(); limparFormulario();
}

// ===== ARRASTAR IMAGENS DENTRO DO CARD =====
function initDragImage(el) {
  let startEl = null;
  el.addEventListener('dragstart', e => { startEl = e.currentTarget; e.dataTransfer.effectAllowed = 'move'; });
  el.addEventListener('dragover', e => e.preventDefault());
  el.addEventListener('drop', e => {
    e.preventDefault();
    if(startEl && startEl !== e.currentTarget){
      const parent = e.currentTarget.parentElement;
      parent.insertBefore(startEl,e.currentTarget.nextSibling);
      salvarBoard();
    }
  });
  // Mobile touch
  el.addEventListener('touchstart', e => { startEl = e.currentTarget; });
  el.addEventListener('touchmove', e => { e.preventDefault(); });
  el.addEventListener('touchend', e => {
    const touch = e.changedTouches[0];
    const elAt = document.elementFromPoint(touch.clientX,touch.clientY);
    if(elAt && elAt.parentElement && elAt.parentElement.classList.contains('gallery') && startEl){ elAt.parentElement.insertBefore(startEl,elAt.nextSibling); salvarBoard(); }
  });
}

// ===== INICIALIZAÇÃO =====
restaurarBoard();   
