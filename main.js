// ===== VARIÁVEIS =====
let idChamado=0, colunaSendoArrastada=null, boardState=JSON.parse(localStorage.getItem('kanbanData'))||null;
const boardEl=document.getElementById('kanban'), previewContainer=document.getElementById('preview-container');
let chart;

// ===== FUNÇÕES DE FORM PREVIEW =====
const printInput = document.getElementById('print');
printInput.addEventListener('change', ()=>{
  previewContainer.innerHTML='';
  Array.from(printInput.files).forEach(file=>{
    const reader = new FileReader();
    reader.onload=e=>{
      const thumb=document.createElement('div'); thumb.className='print-thumb'; thumb.draggable=true;
      const img=document.createElement('img'); img.src=e.target.result;
      const btn=document.createElement('button'); btn.textContent='✕';
      btn.onclick=()=>thumb.remove();
      thumb.appendChild(img); thumb.appendChild(btn);

      thumb.addEventListener('dragstart', e=>{
        e.dataTransfer.setData('text/plain', ''); window.draggedPreview=thumb;
      });
      thumb.addEventListener('dragover', e=>e.preventDefault());
      thumb.addEventListener('drop', e=>{
        e.preventDefault();
        if(window.draggedPreview && window.draggedPreview!==thumb){
          previewContainer.insertBefore(window.draggedPreview, thumb);
        }
      });

      previewContainer.appendChild(thumb);
    }
    reader.readAsDataURL(file);
  });
});

function limparFormulario(){ document.getElementById('form-chamado').reset(); previewContainer.innerHTML=''; }

// ===== FUNÇÃO CRIAR CARD =====
function criarCard({cliente,empresa,problema,imagens}){
  const card=document.createElement('div'); card.className='card'; card.draggable=true; card.id='chamado-'+(idChamado++);
  card.ondragstart=e=>e.dataTransfer.setData('text/plain', e.target.id);

  const cDiv=document.createElement('div'); cDiv.className='editable cliente'; cDiv.textContent=cliente;
  const eDiv=document.createElement('div'); eDiv.className='editable empresa'; eDiv.textContent=empresa;
  const pDiv=document.createElement('div'); pDiv.className='editable problema'; pDiv.textContent=problema;
  card.appendChild(cDiv); card.appendChild(eDiv); card.appendChild(pDiv);

  const gallery=document.createElement('div'); gallery.className='gallery';
  (imagens||[]).forEach(src=>{
    const imgDiv=document.createElement('div'); imgDiv.style.position='relative'; imgDiv.draggable=true;
    const img=document.createElement('img'); img.src=src;
    const btn=document.createElement('button'); btn.textContent='✕';
    btn.onclick=()=>{ imgDiv.remove(); salvarBoard(); };
    imgDiv.appendChild(img); imgDiv.appendChild(btn);

    imgDiv.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain',''); window.draggedGallery=imgDiv; });
    imgDiv.addEventListener('dragover', e=>e.preventDefault());
    imgDiv.addEventListener('drop', e=>{ e.preventDefault(); if(window.draggedGallery && window.draggedGallery!==imgDiv){ gallery.insertBefore(window.draggedGallery, imgDiv); salvarBoard(); } });

    gallery.appendChild(imgDiv);
  });
  card.appendChild(gallery);

  // Ações
  const actions=document.createElement('div'); actions.className='actions';
  const doneBtn=document.createElement('button'); doneBtn.textContent='Concluir'; doneBtn.className='done-btn';
  doneBtn.onclick=()=>{ const concl=Array.from(boardEl.querySelectorAll('.column')).find(c=>c.querySelector('h2').textContent==='Concluído'); if(concl) concl.appendChild(card); salvarBoard(); };
  const delBtn=document.createElement('button'); delBtn.textContent='Excluir'; delBtn.className='delete-btn';
  delBtn.onclick=()=>{ card.remove(); salvarBoard(); };
  const editBtn=document.createElement('button'); editBtn.textContent='Editar'; editBtn.className='edit-btn';
  actions.appendChild(doneBtn); actions.appendChild(delBtn); actions.appendChild(editBtn);
  card.appendChild(actions);

  // Modal
  const modal=document.createElement('div'); modal.className='card-modal';
  modal.innerHTML=`
    <h3>Editar Chamado</h3>
    <input class="modal-cliente" value="${cliente}">
    <input class="modal-empresa" value="${empresa}">
    <textarea class="modal-problema">${problema}</textarea>
    <input type="file" class="modal-print" accept="image/*" multiple>
    <button class="save-modal">Salvar</button>
    <button class="close-modal">Fechar</button>
  `;
  modal.querySelector('.close-modal').onclick=()=>modal.style.display='none';
  modal.querySelector('.save-modal').onclick=()=>{
    card.querySelector('.cliente').textContent=modal.querySelector('.modal-cliente').value;
    card.querySelector('.empresa').textContent=modal.querySelector('.modal-empresa').value;
    card.querySelector('.problema').textContent=modal.querySelector('.modal-problema').value;

    const files=Array.from(modal.querySelector('.modal-print').files);
    files.forEach(file=>{
      const reader=new FileReader();
      reader.onload=e=>{
        const imgDiv=document.createElement('div'); imgDiv.style.position='relative'; imgDiv.draggable=true;
        const img=document.createElement('img'); img.src=e.target.result;
        const btn=document.createElement('button'); btn.textContent='✕';
        btn.onclick=()=>{ imgDiv.remove(); salvarBoard(); };
        imgDiv.appendChild(img); imgDiv.appendChild(btn);

        imgDiv.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain',''); window.draggedGallery=imgDiv; });
        imgDiv.addEventListener('dragover', e=>e.preventDefault());
        imgDiv.addEventListener('drop', e=>{ e.preventDefault(); if(window.draggedGallery && window.draggedGallery!==imgDiv){ gallery.insertBefore(window.draggedGallery, imgDiv); salvarBoard(); } });

        gallery.appendChild(imgDiv); salvarBoard();
      }
      reader.readAsDataURL(file);
    });
    salvarBoard(); modal.style.display='none';
  };
  editBtn.onclick=()=>modal.style.display='block';
  card.appendChild(modal);

  return card;
}

// ===== COLUNAS =====
function adicionarColuna(nome){
  const coluna=document.createElement('div'); coluna.className='column'; coluna.draggable=true;
  coluna.ondragstart=e=>colunaSendoArrastada=e.currentTarget; coluna.ondragover=e=>e.preventDefault();
  coluna.ondrop=e=>{ e.preventDefault(); if(colunaSendoArrastada && colunaSendoArrastada!==e.currentTarget){ boardEl.insertBefore(colunaSendoArrastada,e.currentTarget); colunaSendoArrastada=null; salvarBoard(); } };
  coluna.innerHTML=`<div class="col-actions">
    <button onclick="renomearEtapa(this.closest('.column'))">✎</button>
    <button onclick="removerEtapa(this.closest('.column'))">✕</button>
  </div><h2>${nome}</h2>`;
  boardEl.appendChild(coluna); return coluna;
}
function adicionarEtapa(){ const nome=document.getElementById('nova-etapa').value.trim(); if(!nome)return; adicionarColuna(nome); document.getElementById('nova-etapa').value=''; salvarBoard(); }
function removerEtapa(coluna){ if(confirm('Remover etapa e chamados?')){ coluna.remove(); salvarBoard(); } }
function renomearEtapa(coluna){ const titulo=coluna.querySelector('h2'); const novo=prompt('Novo nome:',titulo.textContent); if(novo){ titulo.textContent=novo.trim(); salvarBoard(); } }

// ===== FILTRAR =====
function filtrarChamados(){ const termo=document.getElementById('busca').value.toLowerCase(); document.querySelectorAll('.card').forEach(c=>{ c.style.display=(c.querySelector('.cliente').textContent.toLowerCase().includes(termo)||c.querySelector('.empresa').textContent.toLowerCase().includes(termo))?'block':'none'; }); }

// ===== GRÁFICO =====
function atualizarChart(){
  const etapas=[], valores=[];
  boardEl.querySelectorAll('.column').forEach(c=>{ etapas.push(c.querySelector('h2').textContent); valores.push(c.querySelectorAll('.card').length); });
  const total = valores.reduce((a,b)=>a+b,0);
  const porcentagens = valores.map(v=> total ? (v/total*100).toFixed(1) : 0);
  if(chart) chart.destroy();
  const colors=['#7c5cff','#00e0ff','#3de07a','#ff4d4d','#ffaa00','#ff66cc','#66ffcc'];
  const ctx=document.getElementById('chart').getContext('2d');
  chart=new Chart(ctx,{type:'bar',data:{labels:etapas.map((t,i)=>`${t} (${porcentagens[i]}%)`),datasets:[{label:'Chamados',data:valores,backgroundColor:valores.map((_,i)=>colors[i%colors.length]),borderColor:'#fff',borderWidth:2,borderRadius:8} ] },options:{responsive:true,plugins:{legend:{display:false},tooltip:{enabled:true}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}},animation:{duration:800,easing:'easeOutQuart'}}});
}

// ===== SALVAR / RESTAURAR =====
function salvarBoard(){
  const data=[];
  boardEl.querySelectorAll('.column').forEach(col=>{
    const colData={titulo:col.querySelector('h2').textContent,chamados:[]};
    col.querySelectorAll('.card').forEach(c=>{
      const imgs=[]; c.querySelectorAll('.gallery img').forEach(i=>imgs.push(i.src));
      colData.chamados.push({cliente:c.querySelector('.cliente').textContent,empresa:c.querySelector('.empresa').textContent,problema:c.querySelector('.problema').textContent,imagens:imgs});
    });
    data.push(colData);
  });
  localStorage.setItem('kanbanData',JSON.stringify(data));
  atualizarChart();
}
function restaurarBoard(){
  boardEl.innerHTML='';
  if(!boardState){ adicionarColuna('Pendente'); adicionarColuna('Em Andamento'); adicionarColuna('Concluído'); return; }
  boardState.forEach(col=>{
    const coluna=adicionarColuna(col.titulo);
    col.chamados.forEach(ch=>coluna.appendChild(criarCard(ch)));
  });
  atualizarChart();
}

// ===== FORM SUBMIT =====
document.getElementById('form-chamado').onsubmit=function(e){
  e.preventDefault();
  const cliente=document.getElementById('cliente').value;
  const empresa=document.getElementById('empresa').value;
  const problema=document.getElementById('problema').value;

  const imgs=[];
  previewContainer.querySelectorAll('img').forEach(img=>imgs.push(img.src));
  const card=criarCard({cliente,empresa,problema,imagens:imgs});
  const pendente=Array.from(boardEl.querySelectorAll('.column')).find(c=>c.querySelector('h2').textContent==='Pendente');
  pendente.appendChild(card); salvarBoard(); limparFormulario();
}

// ===== INICIALIZAÇÃO =====
restaurarBoard();