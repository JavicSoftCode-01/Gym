// public/js/views/CustomerPlans.js
import { apiFetch, showToast } from '../api.js';

export async function renderCustomerPlans(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-address-card"></i> Gestión de Suscripciones</h2>
            <button id="add-cp-btn" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> NUEVA SUSCRIPCION
            </button>
        </div>

        <div class="glass-panel table-container">
            <table>
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Plan</th>
                        <th>Desde</th>
                        <th>Hasta</th>
                        <th>Estado</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody id="cp-table">
                    <tr><td colspan="6" class="text-center">Cargando suscripciones...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- CustomerPlan Modal -->
        <div id="cpModal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow">
                <div class="modal-header">
                    <h3 id="cp-modal-title">Registrar suscripción</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="cpForm">
                    <input type="hidden" id="cp-id">
                    <div class="form-group">
                        <label>Cliente</label>
                        <select id="cp-customer" class="form-control" required>
                            <option value="">Cargando clientes...</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Plan a Adquirir</label>
                        <select id="cp-plan" class="form-control" required>
                            <option value="">Cargando planes...</option>
                        </select>
                    </div>
                    <small class="text-secondary" style="font-size:0.8rem; display:block; margin-top:-6px;">
                        El sistema asigna automáticamente la vigencia según el tipo (diario o mensual).
                    </small>
                    
                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1" id="cp-submit-btn">ASIGNAR PLAN</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const typeEs = (t) => (t === 'daily' ? 'diario' : (t === 'monthly' ? 'mensual' : t));
    const statusEs = (s) => {
        switch ((s || '').toLowerCase()) {
            case 'pending': return 'PENDIENTE';
            case 'partial': return 'ABONADO';
            case 'paid': return 'PAGADO';
            case 'expired': return 'VENCIDO';
            default: return (s || '').toUpperCase();
        }
    };

    const loadData = async () => {
        try {
            const [subs, customers, plans, services] = await Promise.all([
                apiFetch('/customer-plans'),
                apiFetch('/customers'),
                apiFetch('/plans'),
                apiFetch('/services')
            ]);
            
            const tbody = document.getElementById('cp-table');
            tbody.innerHTML = subs.map(s => {
                const customer = customers.find(c => c.id === s.customerId || c.id === s.customer_id);
                const plan = plans.find(p => p.id === s.planId || p.id === s.plan_id);
                const sId = plan ? (plan.serviceId ?? plan.service_id) : null;
                const serv = plan && sId ? services.find(x => x.id === sId) : null;
                
                const statusBadge = s.status === 'paid' ? 'badge-success' : (s.status === 'partial' ? 'badge-warning' : 'badge-danger');
                
                return `
                <tr>
                    <td style="font-weight: 500">${customer ? customer.fullName : 'N/A'}</td>
                    <td>${serv ? serv.title : 'N/A'} <small class="text-secondary">(${plan ? typeEs(plan.type) : ''})</small></td>
                    <td class="text-secondary">${new Date(s.startDate || s.start_date).toLocaleDateString()}</td>
                    <td class="text-secondary">${new Date(s.endDate || s.end_date).toLocaleDateString()}</td>
                    <td><span class="badge ${statusBadge}">${statusEs(s.status)}</span></td>
                    <td class="text-right">
                        <button class="btn btn-icon btn-secondary edit-cp" data-id="${s.id}" data-customer="${s.customerId || s.customer_id}" data-plan="${s.planId || s.plan_id}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-icon btn-secondary delete-cp" data-id="${s.id}" style="color: var(--danger)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `}).join('') || '<tr><td colspan="6" class="text-center text-muted">No hay suscripciones activas.</td></tr>';

            // Selects
            document.getElementById('cp-customer').innerHTML = '<option value="">Seleccione cliente...</option>' + 
                customers.map(c => `<option value="${c.id}">${c.fullName}</option>`).join('');
                
            document.getElementById('cp-plan').innerHTML = '<option value="">Seleccione plan...</option>' + 
                plans.map(p => {
                    const sId = p.serviceId ?? p.service_id;
                    const serv = sId ? services.find(x => x.id === sId) : null;
                    const label = serv ? serv.title : 'N/A';
                    return `<option value="${p.id}">${label} - ${typeEs(p.type)} ($${p.price})</option>`;
                }).join('');

            document.querySelectorAll('.edit-cp').forEach(btn => {
                btn.onclick = () => openModal(btn.dataset.id, btn.dataset.customer, btn.dataset.plan);
            });
            document.querySelectorAll('.delete-cp').forEach(btn => {
                btn.onclick = () => deleteCP(btn.dataset.id);
            });
        } catch(e) {}
    };

    const modal = document.getElementById('cpModal');
    const form = document.getElementById('cpForm');

    const openModal = (id = '', customerId = '', planId = '') => {
        document.getElementById('cp-id').value = id;
        document.getElementById('cp-customer').value = customerId || '';
        document.getElementById('cp-plan').value = planId || '';
        document.getElementById('cp-modal-title').innerText = id ? 'Editar suscripción' : 'Registrar suscripción';
        document.getElementById('cp-submit-btn').innerText = id ? 'GUARDAR CAMBIOS' : 'ASIGNAR PLAN';
        modal.classList.remove('hidden');
    };

    document.getElementById('add-cp-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => modal.classList.add('hidden'));

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('cp-id').value;
        const payload = {
            customerId: parseInt(document.getElementById('cp-customer').value, 10),
            planId: parseInt(document.getElementById('cp-plan').value, 10)
        };

        try {
            if (id) {
                await apiFetch(`/customer-plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
                showToast('Suscripción actualizada correctamente');
            } else {
                await apiFetch('/customer-plans', { method: 'POST', body: JSON.stringify(payload) });
                showToast('Suscripción asignada correctamente');
            }
            modal.classList.add('hidden');
            form.reset();
            loadData();
        } catch(e) {}
    };

    const deleteCP = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta suscripción?')) return;
        try {
            await apiFetch(`/customer-plans/${id}`, { method: 'DELETE' });
            showToast('Suscripción eliminada', 'success');
            loadData();
        } catch (e) {}
    };

    loadData();
}
