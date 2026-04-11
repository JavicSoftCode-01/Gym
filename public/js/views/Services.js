// public/js/views/Services.js
import { apiFetch, showToast } from '../api.js';

export async function renderServices(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-dumbbell"></i> Gestión de Servicios</h2>
            <button id="add-svc-btn" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> NUEVO SERVICIO
            </button>
        </div>

        <div class="glass-panel table-container">
            <table>
                <thead>
                    <tr>
                        <th>Nombre del Servicio</th>
                        <th>Creado el</th>
                        <th>Actualizado el</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody id="service-list">
                    <tr><td colspan="4" class="text-center">Cargando servicios...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Modal -->
        <div id="service-modal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow">
                <div class="modal-header">
                    <h3 id="modal-title">Registrar Servicio</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="service-form">
                    <input type="hidden" id="svc-id">
                    <div class="form-group">
                        <label>Título del Servicio</label>
                        <input type="text" id="svc-title" class="form-control" required placeholder="Ej: Pesas, Yoga, Crossfit...">
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1">GUARDAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loadServices = async () => {
        try {
            const data = await apiFetch('/services');
            const tbody = document.getElementById('service-list');
            tbody.innerHTML = data.map(s => `
                <tr>
                    <td style="font-weight: 500">${s.title}</td>
                    <td class="text-secondary">${new Date(s.createdAt || s.created_at).toLocaleString()}</td>
                    <td class="text-secondary">${new Date(s.updatedAt || s.updated_at).toLocaleString()}</td>
                    <td class="text-right">
                        <button class="btn btn-icon btn-secondary edit-svc" data-id="${s.id}" data-title="${s.title}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-icon btn-secondary delete-svc" data-id="${s.id}" style="color: var(--danger)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="4" class="text-center text-muted">No hay servicios registrados.</td></tr>';

            document.querySelectorAll('.edit-svc').forEach(btn => {
                btn.onclick = () => openModal(btn.dataset.id, btn.dataset.title);
            });
            document.querySelectorAll('.delete-svc').forEach(btn => {
                btn.onclick = () => deleteSvc(btn.dataset.id);
            });
        } catch (e) {}
    };

    const modal = document.getElementById('service-modal');
    const form = document.getElementById('service-form');
    
    const openModal = (id = '', title = '') => {
        document.getElementById('svc-id').value = id;
        document.getElementById('svc-title').value = title;
        document.getElementById('modal-title').innerText = id ? 'Editar Servicio' : 'Registrar Servicio';
        modal.classList.remove('hidden');
    };

    const closeModal = () => modal.classList.add('hidden');

    document.getElementById('add-svc-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = closeModal);

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('svc-id').value;
        const title = document.getElementById('svc-title').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/services/${id}` : '/services';

        try {
            await apiFetch(url, { method, body: JSON.stringify({ title }) });
            showToast(id ? 'Servicio actualizado' : 'Servicio registrado');
            closeModal();
            loadServices();
        } catch (e) {}
    };

    const deleteSvc = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
        try {
            await apiFetch(`/services/${id}`, { method: 'DELETE' });
            showToast('Servicio eliminado', 'success');
            loadServices();
        } catch (e) {}
    };

    loadServices();
}
