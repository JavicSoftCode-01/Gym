// public/js/views/Customers.js
import { apiFetch, showToast } from '../api.js';

export async function renderCustomers(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-users"></i> Gestión de Clientes</h2>
            <button id="add-customer-btn" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> NUEVO CLIENTE
            </button>
        </div>

        <div class="glass-panel table-container">
            <table>
                <thead>
                    <tr>
                        <th>Nombre Completo</th>
                        <th>Contacto</th>
                        <th>Creado el</th>
                        <th>Actualizado el</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody id="customer-list">
                    <tr><td colspan="5" class="text-center">Cargando clientes...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Customer Modal -->
        <div id="customerModal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow">
                <div class="modal-header">
                    <h3 id="modal-title">Registrar Cliente</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="customerForm">
                    <input type="hidden" id="cust-id">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="cust-name" class="form-control" required placeholder="Nombre del cliente...">
                    </div>
                    <div class="form-group">
                        <label>Contacto / DNI</label>
                        <input type="text" id="cust-contact" class="form-control" required placeholder="Nro de teléfono o documento...">
                    </div>
                    <div class="form-group">
                        <label>Seleccionar Inscripción (Uniforme)</label>
                        <select id="cust-inscription" class="form-control">
                            <option value="">Cargando inscripciones...</option>
                        </select>
                        <small class="text-secondary" style="font-size:0.8rem">El precio se toma del catálogo de Inscripciones.</small>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1">GUARDAR</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loadCustomers = async () => {
        try {
            const [data, inscriptions] = await Promise.all([
                apiFetch('/customers'),
                apiFetch('/inscriptions')
            ]);
            const tbody = document.getElementById('customer-list');
            
            tbody.innerHTML = data.map(c => `
                <tr>
                    <td style="font-weight: 500">${c.fullName}</td>
                    <td class="text-secondary">${c.contact}</td>
                    <td class="text-secondary">${new Date(c.createdAt || c.created_at).toLocaleString()}</td>
                    <td class="text-secondary">${new Date(c.updatedAt || c.updated_at).toLocaleString()}</td>
                    <td class="text-right">
                        <button class="btn btn-icon btn-secondary edit-customer" data-id="${c.id}" data-name="${c.fullName}" data-contact="${c.contact}" data-inscription-id="${c.inscriptionId ?? ''}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-icon btn-secondary delete-customer" data-id="${c.id}" style="color: var(--danger)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="5" class="text-center text-muted">No hay clientes registrados.</td></tr>';

            const insSelect = document.getElementById('cust-inscription');
            insSelect.innerHTML =
                '<option value="">Sin inscripción</option>' +
                inscriptions.map(i => `<option value="${i.id}">${i.name} ($${i.price})</option>`).join('');

            // Events
            document.querySelectorAll('.edit-customer').forEach(btn => {
                btn.onclick = () => openModal(btn.dataset.id, btn.dataset.name, btn.dataset.contact, btn.dataset.inscriptionId);
            });
            document.querySelectorAll('.delete-customer').forEach(btn => {
                btn.onclick = () => deleteCustomer(btn.dataset.id);
            });
        } catch (e) {}
    };

    const modal = document.getElementById('customerModal');
    const form = document.getElementById('customerForm');
    
    const openModal = (id = '', name = '', contact = '', inscriptionId = '') => {
        document.getElementById('cust-id').value = id;
        document.getElementById('cust-name').value = name;
        document.getElementById('cust-contact').value = contact;
        document.getElementById('cust-inscription').value = inscriptionId || '';
        document.getElementById('modal-title').innerText = id ? 'Editar Cliente' : 'Registrar Cliente';
        modal.classList.remove('hidden');
    };

    const closeModal = () => modal.classList.add('hidden');

    document.getElementById('add-customer-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = closeModal);

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('cust-id').value;
        const fullName = document.getElementById('cust-name').value;
        const contact = document.getElementById('cust-contact').value;
        const inscriptionIdRaw = document.getElementById('cust-inscription').value;
        const inscriptionId = inscriptionIdRaw === '' ? null : parseInt(inscriptionIdRaw, 10);
        
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/customers/${id}` : '/customers';

        try {
            await apiFetch(url, { method, body: JSON.stringify({ fullName, contact, inscriptionId }) });
            showToast(id ? 'Cliente actualizado' : 'Cliente registrado');
            closeModal();
            loadCustomers();
        } catch (e) {}
    };

    const deleteCustomer = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;
        try {
            await apiFetch(`/customers/${id}`, { method: 'DELETE' });
            showToast('Cliente eliminado', 'success');
            loadCustomers();
        } catch (e) {}
    };

    loadCustomers();
}
