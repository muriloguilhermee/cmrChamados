// ===== VARIÁVEIS GLOBAIS =====
let idChamado = 0;
let boardState = JSON.parse(localStorage.getItem('kanbanData')) || null;
let proximoTicketNum = JSON.parse(localStorage.getItem('proximoTicketNum')) || 1; // --- NOVO: Contador de tickets ---
const boardEl = document.getElementById('kanban');
let chamadosChart = null;

// Modais
const modalForm = document.getElementById('modal-form');
const modalEdit = document.getElementById('modal-edit');
const imageModal = document.getElementById('image-modal');
const imageModalImg = document.getElementById('image-modal-img');

// ===== FUNÇÃO PARA SALVAR ESTADO E ATUALIZAR GRÁFICO =====
function salvarEAtualizar() {
    salvarBoard();
    atualizarGrafico();
}

// ===== FUNÇÕES DE MODAL =====
function abrirModal() { modalForm.style.display = "flex"; }
function fecharModal() {
  modalForm.style.display = "none";
  document.getElementById('form-chamado').reset();
  document.getElementById('preview-container').innerHTML = "";
}
function abrirModalEdicao(card) {
    const cardId = card.id;
    const cliente = card.querySelector('.cliente').textContent;
    const empresa = card.querySelector('.empresa').textContent;
    const problema = card.querySelector('.problema').textContent;
    const imagens = [...card.querySelectorAll('.gallery img')].map(img => img.src);
    document.getElementById('edit-card-id').value = cardId;
    document.getElementById('edit-cliente').value = cliente;
    document.getElementById('edit-empresa').value = empresa;
    document.getElementById('edit-problema').value = problema;
    const preview = document.getElementById('edit-preview-container');
    preview.innerHTML = '';
    imagens.forEach(src => {
        const thumb = criarThumbPreview(src);
        preview.appendChild(thumb);
    });
    modalEdit.style.display = "flex";
}
function fecharModalEdicao() {
    modalEdit.style.display = "none";
    document.getElementById('form-edit').reset();
    document.getElementById('edit-preview-container').innerHTML = "";
}

// ===== MANIPULAÇÃO DE IMAGENS =====
function criarThumbPreview(src) {
    const thumb = document.createElement('div');
    thumb.className = 'print-thumb';
    const img = document.createElement('img');
    img.src = src;
    img.onclick = () => exibirImagemModal(src);
    const btn = document.createElement('button');
    btn.innerHTML = '&times;';
    btn.onclick = () => thumb.remove();
    thumb.appendChild(img);
    thumb.appendChild(btn);
    return thumb;
}

function handleFileInput(fileInput, previewContainer) {
    previewContainer.innerHTML = ''; 
    Array.from(fileInput.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const thumb = criarThumbPreview(e.target.result);
            previewContainer.appendChild(thumb);
        }
        reader.readAsDataURL(file);
    });
}
document.getElementById('print').addEventListener('change', (e) => handleFileInput(e.target, document.getElementById('preview-container')));
document.getElementById('edit-print').addEventListener('change', (e) => {
    const preview = document.getElementById('edit-preview-container');
     Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = evt => {
            const thumb = criarThumbPreview(evt.target.result);
            preview.appendChild(thumb);
        }
        reader.readAsDataURL(file);
    });
});

function exibirImagemModal(src) {
    imageModalImg.src = src;
    imageModal.style.display = 'flex';
}

// ===== MANIPULAÇÃO DE CARD =====
function criarCard({ numero, cliente, empresa, problema, imagens, comentarios = [] }) {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = 'chamado-' + (idChamado++);
    card.draggable = true;
    
    card.addEventListener('dragstart', (e) => {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.id);
    });
    card.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
    });

    const ticketLabel = document.createElement('div');
    ticketLabel.className = 'ticket-label';
    ticketLabel.textContent = `Ticket #${numero}`; // --- MUDANÇA: Exibe o número do ticket ---
    card.appendChild(ticketLabel);

    // Adiciona o restante do conteúdo via append para garantir a ordem
    const clienteDiv = document.createElement('div');
    clienteDiv.className = 'cliente';
    clienteDiv.textContent = cliente;
    card.appendChild(clienteDiv);

    const empresaDiv = document.createElement('div');
    empresaDiv.className = 'empresa';
    empresaDiv.textContent = empresa;
    card.appendChild(empresaDiv);

    const problemaDiv = document.createElement('div');
    problemaDiv.className = 'problema';
    problemaDiv.textContent = problema;
    card.appendChild(problemaDiv);
    
    const gallery = document.createElement('div');
    gallery.className = 'gallery';
    (imagens || []).forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.onclick = () => exibirImagemModal(src);
        gallery.appendChild(img);
    });
    card.appendChild(gallery);
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.innerHTML = `<button class="done-btn">Concluir</button><button class="edit-btn">Editar</button><button class="delete-btn">Excluir</button>`;
    actions.querySelector('.done-btn').onclick = () => {
        const colConcluido = [...boardEl.querySelectorAll('.column')].find(c => c.querySelector('h2').textContent === 'Concluído');
        if (colConcluido) {
            colConcluido.appendChild(card);
            salvarEAtualizar();
        }
    };
    actions.querySelector('.edit-btn').onclick = () => abrirModalEdicao(card);
    actions.querySelector('.delete-btn').onclick = () => {
        if(confirm('Tem certeza que deseja excluir este chamado?')){
            card.remove();
            salvarEAtualizar();
        }
    };
    card.appendChild(actions);
    const comentariosDiv = document.createElement('div');
    comentariosDiv.className = 'comentarios';
    
    const commentTitle = document.createElement('h4');
    commentTitle.className = 'comment-title';
    commentTitle.textContent = 'Comentários';
    comentariosDiv.appendChild(commentTitle);

    const listaComent = document.createElement('div');
    listaComent.className = 'lista-coment';
    comentarios.forEach(comentData => adicionarComentario(listaComent, comentData));
    const inputArea = document.createElement('div');
    inputArea.className = 'coment-input-area';
    const inputComent = document.createElement('input');
    inputComent.type = 'text';
    inputComent.placeholder = 'Escreva um comentário...';
    inputComent.className = 'input-coment';
    const comentFileId = `coment-print-${card.id}`;
    const inputComentFile = document.createElement('input');
    inputComentFile.type = 'file';
    inputComentFile.id = comentFileId;
    inputComentFile.style.display = 'none';
    inputComentFile.accept = 'image/*';
    const attachBtn = document.createElement('label');
    attachBtn.htmlFor = comentFileId;
    attachBtn.textContent = '📎';
    attachBtn.className = 'btn-attach-coment';
    const btnComent = document.createElement('button');
    btnComent.textContent = 'Adicionar';
    btnComent.className = 'btn-coment';
    btnComent.onclick = () => {
        const txt = inputComent.value.trim();
        const file = inputComentFile.files[0];
        const timestamp = new Date().toISOString();
        if (!txt && !file) return;
        const addCommentAction = (imageData) => {
            adicionarComentario(listaComent, { text: txt, image: imageData, timestamp });
            inputComent.value = '';
            inputComentFile.value = '';
            salvarBoard();
        };
        if (file) {
            const reader = new FileReader();
            reader.onload = e => addCommentAction(e.target.result);
            reader.readAsDataURL(file);
        } else {
            addCommentAction(null);
        }
    };
    inputArea.appendChild(inputComent);
    inputArea.appendChild(inputComentFile);
    inputArea.appendChild(attachBtn);
    inputArea.appendChild(btnComent);
    comentariosDiv.appendChild(listaComent);
    comentariosDiv.appendChild(inputArea);
    card.appendChild(comentariosDiv);
    return card;
}

function adicionarComentario(lista, comentData) {
    const c = document.createElement('div');
    c.className = 'comentario';
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(comentData.timestamp).toLocaleString('pt-BR');
    c.appendChild(timestamp);
    c.appendChild(document.createTextNode(comentData.text));
    if (comentData.image) {
        const img = document.createElement('img');
        img.src = comentData.image;
        img.onclick = () => exibirImagemModal(comentData.image);
        c.appendChild(img);
    }
    const btn = document.createElement('button');
    btn.innerHTML = '&times;';
    btn.onclick = () => { c.remove(); salvarBoard(); };
    c.appendChild(btn);
    lista.appendChild(c);
}

// ===== MANIPULAÇÃO DO BOARD =====
function adicionarColuna(nome) {
    const col = document.createElement('div');
    col.className = 'column';
    col.innerHTML = `<h2>${nome}</h2>`;

    col.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        e.currentTarget.classList.add('drag-over');
    });
    col.addEventListener('dragleave', (e) => {
        e.currentTarget.classList.remove('drag-over');
    });
    col.addEventListener('drop', (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const cardId = e.dataTransfer.getData('text/plain');
        const draggedCard = document.getElementById(cardId);
        
        if (draggedCard) {
            e.currentTarget.appendChild(draggedCard);
            salvarEAtualizar();
        }
    });

    boardEl.appendChild(col);
    return col;
}

function salvarBoard() {
    const data = [];
    boardEl.querySelectorAll('.column').forEach(col => {
        const colData = { titulo: col.querySelector('h2').textContent, chamados: [] };
        col.querySelectorAll('.card').forEach(c => {
            const numeroTicket = parseInt(c.querySelector('.ticket-label').textContent.replace('Ticket #', '')); // --- NOVO: Salva o número do ticket ---
            const coments = [...c.querySelectorAll('.comentario')].map(cm => {
                const textNode = Array.from(cm.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                const timestampStr = cm.querySelector('.timestamp').textContent;
                const [date, time] = timestampStr.split(' ');
                const [day, month, year] = date.split('/');
                const isoTimestamp = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}T${time}`;
                return {
                    text: textNode ? textNode.nodeValue.trim() : '',
                    image: cm.querySelector('img')?.src || null,
                    timestamp: new Date(isoTimestamp).toISOString()
                };
            });
            colData.chamados.push({
                numero: numeroTicket,
                cliente: c.querySelector('.cliente').textContent,
                empresa: c.querySelector('.empresa').textContent,
                problema: c.querySelector('.problema').textContent,
                imagens: [...c.querySelectorAll('.gallery img')].map(i => i.src),
                comentarios: coments
            });
        });
        data.push(colData);
    });
    localStorage.setItem('kanbanData', JSON.stringify(data));
}

function restaurarBoard() {
    boardEl.innerHTML = '';
    idChamado = 0;
    if (!boardState || boardState.length === 0) {
        adicionarColuna('Pendente');
        adicionarColuna('Em Andamento');
        adicionarColuna('Concluído');
        return;
    }
    boardState.forEach(col => {
        const coluna = adicionarColuna(col.titulo);
        col.chamados.forEach(ch => {
            // Garante que cards antigos sem número recebam um
            if (!ch.numero) {
                ch.numero = proximoTicketNum;
                proximoTicketNum++;
                localStorage.setItem('proximoTicketNum', JSON.stringify(proximoTicketNum));
            }
            coluna.appendChild(criarCard(ch))
        });
    });
}

// ===== BUSCA E FILTRO =====
function filtrarChamados() {
    const termo = document.getElementById('busca').value.toLowerCase();
    document.querySelectorAll('.card').forEach(c => {
        const ticketNum = c.querySelector('.ticket-label')?.textContent.toLowerCase() || '';
        const match = c.querySelector('.cliente').textContent.toLowerCase().includes(termo) ||
                      c.querySelector('.empresa').textContent.toLowerCase().includes(termo) ||
                      c.querySelector('.problema').textContent.toLowerCase().includes(termo) ||
                      ticketNum.includes(termo);
        c.style.display = match ? 'block' : 'none';
    });
}

// ===== LÓGICA DO GRÁFICO =====
function atualizarGrafico() {
    const ctx = document.getElementById('chamadosChart').getContext('2d');
    const labels = [];
    const data = [];
    document.querySelectorAll('.column').forEach(column => {
        labels.push(column.querySelector('h2').textContent);
        data.push(column.querySelectorAll('.card').length);
    });

    if (chamadosChart) {
        chamadosChart.data.labels = labels;
        chamadosChart.data.datasets[0].data = data;
        chamadosChart.update();
    } else {
        chamadosChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chamados',
                    data: data,
                    backgroundColor: ['#7c5cff', '#00e0ff', '#3de07a', '#ffab4d', '#ff4d4d'],
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.85)',
                            font: { family: 'Inter, sans-serif' }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
}

// ===== HANDLERS DE FORMULÁRIO =====
document.getElementById('form-chamado').onsubmit = function(e) {
    e.preventDefault();
    const cliente = document.getElementById('cliente').value;
    const empresa = document.getElementById('empresa').value;
    const problema = document.getElementById('problema').value;
    const imagens = [...document.getElementById('preview-container').querySelectorAll('img')].map(img => img.src);
    
    // --- NOVO: Atribui o número do ticket e incrementa ---
    const numeroDoTicket = proximoTicketNum;
    const card = criarCard({ numero: numeroDoTicket, cliente, empresa, problema, imagens });
    
    const colPendente = [...boardEl.querySelectorAll('.column')].find(c => c.querySelector('h2').textContent === 'Pendente');
    if (colPendente) colPendente.appendChild(card);

    proximoTicketNum++;
    localStorage.setItem('proximoTicketNum', JSON.stringify(proximoTicketNum));

    salvarEAtualizar();
    fecharModal();
}

document.getElementById('form-edit').onsubmit = function(e) {
    e.preventDefault();
    const cardId = document.getElementById('edit-card-id').value;
    const card = document.getElementById(cardId);
    if (card) {
        card.querySelector('.cliente').textContent = document.getElementById('edit-cliente').value;
        card.querySelector('.empresa').textContent = document.getElementById('edit-empresa').value;
        card.querySelector('.problema').textContent = document.getElementById('edit-problema').value;
        const gallery = card.querySelector('.gallery');
        gallery.innerHTML = '';
        [...document.getElementById('edit-preview-container').querySelectorAll('img')].forEach(img => {
            const newImg = document.createElement('img');
            newImg.src = img.src;
            newImg.onclick = () => exibirImagemModal(img.src);
            gallery.appendChild(newImg);
        });
    }
    salvarEAtualizar();
    fecharModalEdicao();
}

// ===== INICIALIZAÇÃO =====
restaurarBoard();
atualizarGrafico();