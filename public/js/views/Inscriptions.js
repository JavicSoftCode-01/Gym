import { apiFetch, showToast } from '../api.js';

export async function renderInscriptions(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-shirt"></i> Inscripciones (Uniformes)</h2>
            <button id="add-ins-btn" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> NUEVA INSCRIPCIÓN
            </button>
        </div>

        <div class="glass-panel table-container">
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Precio ($)</th>
                        <th>Creado</th>
                        <th>Actualizado</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody id="ins-list">
                    <tr><td colspan="5" class="text-center">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="ins-modal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow">
                <div class="modal-header">
                    <h3 id="ins-title">Registrar Inscripción</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="ins-form">
                    <input type="hidden" id="ins-id">
                    <div class="form-group">
                        <label>Nombre (Ej: Uniforme completo, Solo camiseta)</label>
                        <input type="text" id="ins-name" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Precio ($)</label>
                        <input type="number" id="ins-price" class="form-control" required step="0.01" min="0">
                    </div>
                    <div style="display:flex; gap:12px; margin-top:24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1">GUARDAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const parseDbDate = (value) => {
        if (!value) return null;
        if (typeof value !== 'string') return new Date(value);
        const normalized = value.includes(' ') && !value.includes('T')
            ? value.replace(' ', 'T') + 'Z'
            : value;
        const d = new Date(normalized);
        return isNaN(d.getTime()) ? null : d;
    };

    const modal = document.getElementById('ins-modal');
    const form = document.getElementById('ins-form');

    const openModal = (id = '', name = '', price = '') => {
        document.getElementById('ins-id').value = id;
        document.getElementById('ins-name').value = name;
        document.getElementById('ins-price').value = price;
        document.getElementById('ins-title').innerText = id ? 'Editar Inscripción' : 'Registrar Inscripción';
        modal.classList.remove('hidden');
    };
    const closeModal = () => modal.classList.add('hidden');

    document.getElementById('add-ins-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = closeModal);

    const load = async () => {
        try {
            const data = await apiFetch('/inscriptions');
            const tbody = document.getElementById('ins-list');
            tbody.innerHTML = data.map(i => `
                <tr>
                    <td style="font-weight:500">${i.name}</td>
                    <td class="text-neon" style="font-weight:bold">$${i.price}</td>
                    <td class="text-secondary" style="font-size:0.8rem">${parseDbDate(i.createdAt || i.created_at)?.toLocaleString() || '-'}</td>
                    <td class="text-secondary" style="font-size:0.8rem">${parseDbDate(i.updatedAt || i.updated_at)?.toLocaleString() || '-'}</td>
                    <td class="text-right">
                        <button class="btn btn-icon btn-secondary edit-ins" data-id="${i.id}" data-name="${i.name}" data-price="${i.price}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-icon btn-secondary del-ins" data-id="${i.id}" style="color: var(--danger)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="text-center text-muted">No hay inscripciones.</td></tr>';

            document.querySelectorAll('.edit-ins').forEach(btn => {
                btn.onclick = () => openModal(btn.dataset.id, btn.dataset.name, btn.dataset.price);
            });
            document.querySelectorAll('.del-ins').forEach(btn => {
                btn.onclick = () => del(btn.dataset.id);
            });
        } catch (e) {}
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('ins-id').value;
        const name = document.getElementById('ins-name').value;
        const price = parseFloat(document.getElementById('ins-price').value);
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/inscriptions/${id}` : '/inscriptions';
        try {
            await apiFetch(url, { method, body: JSON.stringify({ name, price }) });
            showToast(id ? 'Inscripción actualizada' : 'Inscripción registrada');
            closeModal();
            load();
        } catch (e) {}
    };

    const del = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta inscripción?')) return;
        try {
            await apiFetch(`/inscriptions/${id}`, { method: 'DELETE' });
            showToast('Inscripción eliminada', 'success');
            load();
        } catch (e) {}
    };

    load();
}

