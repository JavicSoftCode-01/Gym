import { apiFetch, showToast } from '../api.js';

export async function renderPaymentMethods(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-credit-card"></i> Métodos de Pago</h2>
            <button id="add-pm-btn" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> NUEVO MÉTODO
            </button>
        </div>

        <div class="glass-panel table-container">
            <table>
                <thead>
                    <tr>
                        <th>Nombre del Método</th>
                        <th>Creado el</th>
                        <th>Actualizado el</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody id="pm-list">
                    <tr><td colspan="4" class="text-center">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal -->
        <div id="pm-modal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow">
                <div class="modal-header">
                    <h3 id="modal-title">Registrar Método</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="pm-form">
                    <input type="hidden" id="pm-id">
                    <div class="form-group">
                        <label>Nombre (Ej: Efectivo, Transferencia, Visa)</label>
                        <input type="text" id="pm-name" class="form-control" required placeholder="Nombre del método...">
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1">GUARDAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loadPMs = async () => {
        try {
            const data = await apiFetch('/payment-methods');
            const tbody = document.getElementById('pm-list');
            const filteredData = data.filter(pm => pm.name.toUpperCase() !== 'REEMBOLSO');
            tbody.innerHTML = filteredData.map(pm => `
                <tr>
                    <td style="font-weight: 500">${pm.name}</td>
                    <td class="text-secondary">${new Date(pm.createdAt).toLocaleString()}</td>
                    <td class="text-secondary">${new Date(pm.updatedAt).toLocaleString()}</td>
                    <td class="text-right">
                        <button class="btn btn-icon btn-secondary edit-pm" data-id="${pm.id}" data-name="${pm.name}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-icon btn-secondary delete-pm" data-id="${pm.id}" style="color: var(--danger)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="4" class="text-center text-muted">No hay métodos registrados.</td></tr>';

            // Events
            document.querySelectorAll('.edit-pm').forEach(btn => {
                btn.onclick = () => openModal(btn.dataset.id, btn.dataset.name);
            });
            document.querySelectorAll('.delete-pm').forEach(btn => {
                btn.onclick = () => deletePM(btn.dataset.id);
            });
        } catch (e) {}
    };

    const modal = document.getElementById('pm-modal');
    const form = document.getElementById('pm-form');
    
    const openModal = (id = '', name = '') => {
        document.getElementById('pm-id').value = id;
        document.getElementById('pm-name').value = name;
        document.getElementById('modal-title').innerText = id ? 'Editar Método' : 'Registrar Método';
        modal.classList.remove('hidden');
    };

    const closeModal = () => modal.classList.add('hidden');

    document.getElementById('add-pm-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = closeModal);

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('pm-id').value;
        const name = document.getElementById('pm-name').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/payment-methods/${id}` : '/payment-methods';

        try {
            await apiFetch(url, { method, body: JSON.stringify({ name }) });
            showToast(id ? 'Método actualizado' : 'Método registrado');
            closeModal();
            loadPMs();
        } catch (e) {}
    };

    const deletePM = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este método de pago?')) return;
        try {
            await apiFetch(`/payment-methods/${id}`, { method: 'DELETE' });
            showToast('Método eliminado', 'success');
            loadPMs();
        } catch (e) {}
    };

    loadPMs();
}
