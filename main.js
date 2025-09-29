let idChamado = 0;
let idTarefa = 0;
let boardState = JSON.parse(localStorage.getItem('kanbanData')) || null;
let proximoTicketNum = JSON.parse(localStorage.getItem('proximoTicketNum')) || 1;
let proximoIdTarefa = JSON.parse(localStorage.getItem('proximoIdTarefa')) || 1;
const boardEl = document.getElementById('kanban');
let chamadosChart = null;
let tarefasChart = null;

// Modais
const modalChamado = document.getElementById('modal-chamado');
const modalTarefa = document.getElementById('modal-tarefa');
const modalEdit = document.getElementById('modal-edit');
const imageModal = document.getElementById('image-modal');
const imageModalImg = document.getElementById('image-modal-img');

// ===== MODAIS =====
function abrirModalChamado() { modalChamado.style.display = "flex"; }
function fecharModalChamado() { modalChamado.style.display = "none"; document.getElementById('form-chamado').reset(); document.getElementById('preview-container').innerHTML = ""; }
function abrirModalTarefa() { modalTarefa.style.display = "flex"; }
function fecharModalTarefa() { modalTarefa.style.display = "none"; document.getElementById('form-tarefa').reset(); document.getElementById('tarefa-preview-container').innerHTML = ""; }
function abrirModalEdicao(card) {
    document.getElementById('edit-card-id').value = card.id;
    if (card.dataset.tipo === "chamado") {
        document.getElementById('edit-cliente').value = card.querySelector('.cliente').textContent;
        document.getElementById('edit-empresa').value = card.querySelector('.empresa').textContent;
        document.getElementById('edit-problema').value = card.querySelector('.problema').textContent;
    } else {
        document.getElementById('edit-cliente').value = card.querySelector('.cliente').textContent;
        document.getElementById('edit-empresa').value = "";
        document.getElementById('edit-problema').value = card.querySelector('.problema').textContent;
    }
    const preview = document.getElementById('edit-preview-container');
    preview.innerHTML = "";
    [...card.querySelectorAll('.gallery img')].forEach(img => preview.appendChild(criarThumbPreview(img.src)));
    modalEdit.style.display = "flex";
}
function fecharModalEdicao() { modalEdit.style.display = "none"; document.getElementById('form-edit').reset(); document.getElementById('edit-preview-container').innerHTML = ""; }

// ===== IMAGENS =====
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
        reader.onload = e => previewContainer.appendChild(criarThumbPreview(e.target.result));
        reader.readAsDataURL(file);
    });
}
document.getElementById('print').addEventListener('change', e => handleFileInput(e.target, document.getElementById('preview-container')));
document.getElementById('tarefa-print').addEventListener('change', e => handleFileInput(e.target, document.getElementById('tarefa-preview-container')));
document.getElementById('edit-print').addEventListener('change', e => handleFileInput(e.target, document.getElementById('edit-preview-container')));
function exibirImagemModal(src) { imageModalImg.src = src; imageModal.style.display = 'flex'; }

// ===== CRIAR CARD =====
function criarCard({ numero, cliente, empresa, problema, imagens, comentarios = [], tipo = 'chamado' }) {
    const card = document.createElement('div');
    card.className = 'card ' + tipo;
    card.id = (tipo === 'chamado' ? 'chamado-' : 'tarefa-') + numero;
    card.dataset.tipo = tipo;
    card.draggable = true;
    card.addEventListener('dragstart', e => { e.target.classList.add('dragging'); e.dataTransfer.setData('text/plain', e.target.id); });
    card.addEventListener('dragend', e => e.target.classList.remove('dragging'));
    const ticketLabel = document.createElement('div');
    ticketLabel.className = 'ticket-label';
    ticketLabel.textContent = tipo === 'chamado' ? `Ticket #${numero}` : `ID #${numero}`;
    card.appendChild(ticketLabel);

    const clienteDiv = document.createElement('div');
    clienteDiv.className = 'cliente';
    clienteDiv.textContent = cliente;
    card.appendChild(clienteDiv);
    if (tipo === 'chamado') {
        const empresaDiv = document.createElement('div');
        empresaDiv.className = 'empresa';
        empresaDiv.textContent = empresa;
        card.appendChild(empresaDiv);
    }
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

    // ===== AÇÕES =====
    const actions = document.createElement('div');
    actions.className = 'actions';
    actions.innerHTML = `<button class="done-btn">Concluir</button><button class="edit-btn">Editar</button><button class="delete-btn">Excluir</button>`;
    actions.querySelector('.done-btn').onclick = () => {
        if (card.dataset.tipo === 'chamado') {
            const concluido = document.querySelector('.column[data-type="concluido"]');
            if (concluido) concluido.appendChild(card);
        } else {
            const realizado = document.querySelector('.column[data-type="tarefas-realizadas"]');
            if (realizado) realizado.appendChild(card);
        }
        salvarEAtualizar();
    };
    actions.querySelector('.edit-btn').onclick = () => abrirModalEdicao(card);
    actions.querySelector('.delete-btn').onclick = () => {
        if (confirm('Tem certeza que deseja excluir?')) {
            card.remove();
            salvarEAtualizar();
        }
    };
    card.appendChild(actions);

    // ===== COMENTÁRIOS =====
    const comentariosDiv = document.createElement('div');
    comentariosDiv.className = 'comentarios';
    const commentTitle = document.createElement('h4');
    commentTitle.className = 'comment-title';
    commentTitle.textContent = 'Comentários';
    comentariosDiv.appendChild(commentTitle);
    const listaComent = document.createElement('div');
    listaComent.className = 'lista-coment';
    comentarios.forEach(c => adicionarComentario(listaComent, c));

    const inputArea = document.createElement('div');
    inputArea.className = 'coment-input-area';
    const inputComent = document.createElement('input');
    inputComent.type = 'text';
    inputComent.placeholder = 'Digite um comentário';
    inputComent.className = 'input-coment';
    const btnComent = document.createElement('button');
    btnComent.textContent = 'Enviar';
    btnComent.className = 'btn-coment';
    const btnAttach = document.createElement('span');
    btnAttach.innerHTML = '📎';
    btnAttach.className = 'btn-attach-coment';
    const attachInput = document.createElement('input');
    attachInput.type = 'file';
    attachInput.accept = 'image/*';
    attachInput.multiple = true;
    attachInput.style.display = 'none';

    // Novo container para pré-visualização de arquivos
    const previewContainer = document.createElement('div');
    previewContainer.className = 'coment-preview-container';

    btnAttach.onclick = () => attachInput.click();

    // Evento para exibir pré-visualização ao selecionar arquivos
    attachInput.addEventListener('change', e => {
        previewContainer.innerHTML = '';
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = event => {
                const thumb = document.createElement('div');
                thumb.className = 'print-thumb';
                const img = document.createElement('img');
                img.src = event.target.result;
                img.onclick = () => exibirImagemModal(event.target.result);
                const btn = document.createElement('button');
                btn.innerHTML = '&times;';
                btn.onclick = () => {
                    thumb.remove();
                    if (previewContainer.children.length === 0) {
                        attachInput.value = null;
                    }
                };
                thumb.appendChild(img);
                thumb.appendChild(btn);
                previewContainer.appendChild(thumb);
            };
            reader.readAsDataURL(file);
        });
    });

    // Lógica corrigida para o botão de envio
    btnComent.onclick = () => {
        if (inputComent.value.trim() === '' && attachInput.files.length === 0) {
            return;
        }

        const files = [...attachInput.files];
        const images = [];
        let filesProcessed = 0;

        if (files.length === 0) {
            adicionarComentario(listaComent, { texto: inputComent.value, imagens: [], ts: new Date().toLocaleString() });
            inputComent.value = '';
            salvarEAtualizar();
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                images.push(e.target.result);
                filesProcessed++;
                if (filesProcessed === files.length) {
                    adicionarComentario(listaComent, { texto: inputComent.value, imagens: images, ts: new Date().toLocaleString() });
                    inputComent.value = '';
                    attachInput.value = '';
                    previewContainer.innerHTML = '';
                    salvarEAtualizar();
                }
            };
            reader.readAsDataURL(file);
        });
    };
    
    inputArea.appendChild(inputComent);
    inputArea.appendChild(btnComent);
    inputArea.appendChild(btnAttach);
    inputArea.appendChild(attachInput);
    
    comentariosDiv.appendChild(listaComent);
    comentariosDiv.appendChild(inputArea);
    comentariosDiv.appendChild(previewContainer); // Adiciona o container de preview aqui
    card.appendChild(comentariosDiv);

    return card;
}

function adicionarComentario(lista, c) {
    const div = document.createElement('div');
    div.className = 'comentario';
    if (c.texto) {
        const p = document.createElement('p');
        p.textContent = c.texto;
        div.appendChild(p);
    }
    
    // Adiciona imagens se existirem
    if (c.imagens && c.imagens.length > 0) {
        const gallery = document.createElement('div');
        gallery.className = 'gallery';
        c.imagens.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.onclick = () => exibirImagemModal(src);
            gallery.appendChild(img);
        });
        div.appendChild(gallery);
    }
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = c.ts || new Date().toLocaleString();
    div.appendChild(timestamp);

    const delBtn = document.createElement('button');
    delBtn.innerHTML = '&times;';
    delBtn.onclick = () => { div.remove(); salvarEAtualizar(); };
    div.appendChild(delBtn);
    lista.appendChild(div);
}

// ===== FORMULÁRIOS =====
document.getElementById('form-chamado').onsubmit = e => {
    e.preventDefault();
    const cliente = document.getElementById('cliente').value;
    const empresa = document.getElementById('empresa').value;
    const problema = document.getElementById('problema').value;
    const imgs = [...document.getElementById('preview-container').querySelectorAll('img')].map(i => i.src);
    const card = criarCard({ numero: proximoTicketNum++, cliente, empresa, problema, imagens: imgs, tipo: 'chamado' });
    document.querySelector('.column[data-type="chamados"]').appendChild(card);
    fecharModalChamado();
    salvarEAtualizar();
};

document.getElementById('form-tarefa').onsubmit = e => {
    e.preventDefault();
    const titulo = document.getElementById('tarefa-titulo').value;
    const desc = document.getElementById('tarefa-descricao').value;
    const imgs = [...document.getElementById('tarefa-preview-container').querySelectorAll('img')].map(i => i.src);
    const card = criarCard({ numero: proximoIdTarefa++, cliente: titulo, empresa: '', problema: desc, imagens: imgs, tipo: 'tarefa-pendente' });
    document.querySelector('.column[data-type="tarefas"]').appendChild(card);
    fecharModalTarefa();
    salvarEAtualizar();
};

document.getElementById('form-edit').onsubmit = e => {
    e.preventDefault();
    const id = document.getElementById('edit-card-id').value;
    const card = document.getElementById(id);
    card.querySelector('.cliente').textContent = document.getElementById('edit-cliente').value;
    if (card.dataset.tipo === 'chamado') card.querySelector('.empresa').textContent = document.getElementById('edit-empresa').value;
    card.querySelector('.problema').textContent = document.getElementById('edit-problema').value;
    const newImgs = [...document.getElementById('edit-preview-container').querySelectorAll('img')].map(i => i.src);
    const gallery = card.querySelector('.gallery');
    gallery.innerHTML = '';
    newImgs.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.onclick = () => exibirImagemModal(src);
        gallery.appendChild(img);
    });
    fecharModalEdicao();
    salvarEAtualizar();
};

// ===== SALVAR E CARREGAR =====
function salvarEAtualizar() {
    const data = {
        chamados: [],
        tarefas: []
    };
    document.querySelectorAll('.card').forEach(card => {
        const tipo = card.dataset.tipo;
        const ticketLabelText = card.querySelector('.ticket-label').textContent;
        const numero = ticketLabelText.includes('Ticket') ? ticketLabelText.replace('Ticket #', '') : ticketLabelText.replace('ID #', '');
        
        const obj = {
            numero: numero,
            cliente: card.querySelector('.cliente').textContent,
            empresa: card.querySelector('.empresa') ? card.querySelector('.empresa').textContent : '',
            problema: card.querySelector('.problema').textContent,
            imagens: [...card.querySelectorAll('.gallery img')].map(i => i.src),
            comentarios: [...card.querySelectorAll('.comentario')].map(c => ({
                texto: c.querySelector('p')?.textContent || '',
                imagens: [...c.querySelectorAll('.gallery img')].map(img => img.src),
                ts: c.querySelector('.timestamp').textContent
            })),
            coluna: card.closest('.column').dataset.type
        };
        if (tipo === 'chamado') {
            data.chamados.push(obj);
        } else {
            data.tarefas.push(obj);
        }
    });
    localStorage.setItem('kanbanData', JSON.stringify(data));
    localStorage.setItem('proximoTicketNum', JSON.stringify(proximoTicketNum));
    localStorage.setItem('proximoIdTarefa', JSON.stringify(proximoIdTarefa));
    renderizarGraficos();
}

// ===== FILTRO =====
function filtrarCards() {
    const val = document.getElementById('busca').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const text = (card.querySelector('.cliente').textContent + ' ' + (card.querySelector('.empresa') ? card.querySelector('.empresa').textContent : '') + ' ' + card.querySelector('.problema').textContent).toLowerCase();
        card.style.display = text.includes(val) ? 'block' : 'none';
    });
}

// ===== GRÁFICOS =====
function renderizarGraficos() {
    if (chamadosChart) {
        chamadosChart.destroy();
    }
    if (tarefasChart) {
        tarefasChart.destroy();
    }

    const chamados = document.querySelectorAll('.column[data-type="chamados"] .card.chamado');
    const emAndamento = document.querySelectorAll('.column[data-type="em-andamento"] .card.chamado');
    const concluidos = document.querySelectorAll('.column[data-type="concluido"] .card.chamado');

    const ctxChamados = document.getElementById('chamadosChart').getContext('2d');
    chamadosChart = new Chart(ctxChamados, {
        type: 'bar',
        data: {
            labels: ['Novos', 'Em Andamento', 'Concluídos'],
            datasets: [{
                label: 'Número de Chamados',
                data: [
                    chamados.length,
                    emAndamento.length,
                    concluidos.length
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        precision: 0
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });

    const tarefasPendentes = document.querySelectorAll('.column[data-type="tarefas"] .card.tarefa-pendente');
    const tarefasRealizadas = document.querySelectorAll('.column[data-type="tarefas-realizadas"] .card.tarefa-pendente');

    const ctxTarefas = document.getElementById('tarefasChart').getContext('2d');
    tarefasChart = new Chart(ctxTarefas, {
        type: 'doughnut',
        data: {
            labels: ['Tarefas Pendentes', 'Tarefas Realizadas'],
            datasets: [{
                label: 'Número de Tarefas',
                data: [
                    tarefasPendentes.length,
                    tarefasRealizadas.length
                ],
                backgroundColor: [
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

// ===== INICIALIZAÇÃO =====
function init() {
    const colNames = [{ name: 'Chamados', type: 'chamados' }, { name: 'Em andamento', type: 'em-andamento' }, { name: 'Concluído', type: 'concluido' }, { name: 'Tarefas pendentes', type: 'tarefas' }, { name: 'Tarefas realizadas', type: 'tarefas-realizadas' }];
    colNames.forEach(c => {
        if (!document.querySelector(`.column[data-type="${c.type}"]`)) {
            const div = document.createElement('div');
            div.className = 'column';
            div.dataset.type = c.type;
            div.innerHTML = `<h2>${c.name}</h2>`;
            boardEl.appendChild(div);
            div.addEventListener('dragover', e => { e.preventDefault(); div.classList.add('drag-over'); });
            div.addEventListener('dragleave', e => div.classList.remove('drag-over'));
            div.addEventListener('drop', e => {
                e.preventDefault();
                div.classList.remove('drag-over');
                const id = e.dataTransfer.getData('text/plain');
                const card = document.getElementById(id);
                if ((card.dataset.tipo === 'chamado' && (c.type === 'tarefas' || c.type === 'tarefas-realizadas')) || (card.dataset.tipo.includes('tarefa') && (c.type === 'chamados' || c.type === 'em-andamento' || c.type === 'concluido'))) {
                    return;
                }
                div.appendChild(card);
                salvarEAtualizar();
            });
        }
    });

    if (boardState) {
        boardState.chamados.forEach(ch => {
            const coluna = document.querySelector(`.column[data-type="${ch.coluna || 'chamados'}"]`);
            if (coluna) coluna.appendChild(criarCard({ ...ch, tipo: 'chamado' }));
        });
        boardState.tarefas.forEach(tr => {
            const coluna = document.querySelector(`.column[data-type="${tr.coluna || 'tarefas'}"]`);
            if (coluna) coluna.appendChild(criarCard({ ...tr, tipo: tr.tipo || 'tarefa-pendente' }));
        });
    }
    renderizarGraficos();
}

init();