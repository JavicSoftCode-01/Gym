// public/js/views/Plans.js
import { apiFetch, showToast } from '../api.js';

export async function renderPlans(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-tags"></i> Gestión de Planes</h2>
            <button id="add-plan-btn" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> NUEVO PLAN
            </button>
        </div>

        <div class="glass-panel table-container">
            <table>
                <thead>
                    <tr>
                        <th>Servicio</th>
                        <th>Tipo</th>
                        <th>Rango de Edad</th>
                        <th>Precio</th>
                        <th>Creado el</th>
                        <th>Actualizado el</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody id="plans-table">
                    <tr><td colspan="7" class="text-center">Cargando planes...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Plan Modal -->
        <div id="planModal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow">
                <div class="modal-header">
                    <h3 id="modal-title">Registrar Plan</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="planForm">
                    <input type="hidden" id="plan-id">
                    <div class="form-group">
                        <label>Servicio Asociado</label>
                        <select id="plan-serviceId" class="form-control" required>
                            <option value="">Cargando servicios...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tipo de Plan</label>
                        <select id="plan-type" class="form-control" required>
                            <option value="daily">Diario (Pago completo)</option>
                            <option value="monthly">Mensual (Permite abonos)</option>
                        </select>
                    </div>
                    <div class="form-group" style="display: flex; gap: 10px;">
                        <div style="flex: 1;">
                            <label>Edad Mínima</label>
                            <input type="number" id="plan-minAge" class="form-control" required min="1">
                        </div>
                        <div style="flex: 1;">
                            <label>Edad Máxima</label>
                            <input type="number" id="plan-maxAge" class="form-control" required min="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Precio de Venta ($)</label>
                        <input type="number" id="plan-price" class="form-control" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Calendario / Horarios Disponibles</label>
                        <select id="plan-schedules" class="form-control" multiple style="height: 100px;">
                            <option value="">Cargando horarios...</option>
                        </select>
                        <small class="text-secondary" style="font-size: 0.8rem">Usa Ctrl/Cmd + Clic para seleccionar varios.</small>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1">GUARDAR PLAN</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loadFormData = async () => {
        try {
            const [services, schedules] = await Promise.all([
                apiFetch('/services'),
                apiFetch('/schedules')
            ]);
            
            const svcSelect = document.getElementById('plan-serviceId');
            svcSelect.innerHTML = '<option value="">Seleccione servicio...</option>' + 
                services.map(s => `<option value="${s.id}">${s.title}</option>`).join('');

            const schSelect = document.getElementById('plan-schedules');
            schSelect.innerHTML = schedules.map(s => {
                const dateOnly = s.date.includes('T') ? s.date.split('T')[0] : s.date;
                const start = new Date(s.startTime || s.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                return `<option value="${s.id}">${dateOnly} | ${start}</option>`;
            }).join('') || '<option value="">Sin horarios disponibles</option>';
        } catch (e) {}
    };

    const loadPlans = async () => {
        try {
            const [plans, services] = await Promise.all([
                apiFetch('/plans'),
                apiFetch('/services')
            ]);
            const tbody = document.getElementById('plans-table');
            
            tbody.innerHTML = plans.map(p => {
                const sId = p.serviceId || p.service_id;
                const service = services.find(s => s.id === sId);
                const typeName = p.type === 'daily' ? 'Diario' : 'Mensual';
                const badgeClass = p.type === 'daily' ? 'badge-neutral' : 'badge-success';
                
                return `
                <tr>
                    <td style="font-weight: 500">${service ? service.title : 'N/A'}</td>
                    <td><span class="badge ${badgeClass}">${typeName}</span></td>
                    <td class="text-secondary">${p.min_age || p.minAge} - ${p.max_age || p.maxAge} años</td>
                    <td class="text-neon" style="font-weight: bold">$${p.price}</td>
                    <td class="text-secondary" style="font-size: 0.8rem">${new Date(p.createdAt || p.created_at).toLocaleString()}</td>
                    <td class="text-secondary" style="font-size: 0.8rem">${new Date(p.updatedAt || p.updated_at).toLocaleString()}</td>
                    <td class="text-right">
                        <button class="btn btn-icon btn-secondary edit-plan" 
                            data-id="${p.id}" 
                            data-svc="${sId}" 
                            data-type="${p.type}" 
                            data-min="${p.min_age || p.minAge}" 
                            data-max="${p.max_age || p.maxAge}" 
                            data-price="${p.price}">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn btn-icon btn-secondary delete-plan" data-id="${p.id}" style="color: var(--danger)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `}).join('') || '<tr><td colspan="7" class="text-center text-muted">No hay planes registrados.</td></tr>';

            document.querySelectorAll('.edit-plan').forEach(btn => {
                btn.onclick = () => openModal(btn.dataset.id, btn.dataset.svc, btn.dataset.type, btn.dataset.min, btn.dataset.max, btn.dataset.price);
            });
            document.querySelectorAll('.delete-plan').forEach(btn => {
                btn.onclick = () => deletePlan(btn.dataset.id);
            });
        } catch (e) {}
    };

    const modal = document.getElementById('planModal');
    const form = document.getElementById('planForm');

    const openModal = (id = '', svc = '', type = 'monthly', min = '', max = '', price = '') => {
        document.getElementById('plan-id').value = id;
        document.getElementById('plan-serviceId').value = svc;
        document.getElementById('plan-type').value = type;
        document.getElementById('plan-minAge').value = min;
        document.getElementById('plan-maxAge').value = max;
        document.getElementById('plan-price').value = price;
        document.getElementById('modal-title').innerText = id ? 'Editar Plan' : 'Registrar Plan';
        modal.classList.remove('hidden');
    };

    const closeModal = () => modal.classList.add('hidden');

    document.getElementById('add-plan-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = closeModal);

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('plan-id').value;
        const payload = {
            serviceId: parseInt(document.getElementById('plan-serviceId').value, 10),
            type: document.getElementById('plan-type').value,
            minAge: parseInt(document.getElementById('plan-minAge').value, 10),
            maxAge: parseInt(document.getElementById('plan-maxAge').value, 10),
            price: parseFloat(document.getElementById('plan-price').value)
        };

        const selectedSchedules = Array.from(document.getElementById('plan-schedules').selectedOptions).map(opt => parseInt(opt.value, 10));

        try {
            let planId = id;
            if (id) {
                await apiFetch(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                const newPlan = await apiFetch('/plans', { method: 'POST', body: JSON.stringify(payload) });
                planId = newPlan.id;
            }

            // Sync schedules (Batch link for new/edited plans)
            if (selectedSchedules.length > 0) {
                for (const sId of selectedSchedules) {
                    await apiFetch('/plan-schedules', { method: 'POST', body: JSON.stringify({ planId, scheduleId: sId }) });
                }
            }

            showToast(id ? 'Plan actualizado' : 'Plan y horarios guardados');
            closeModal();
            loadPlans();
        } catch(e) { }
    };

    const deletePlan = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este plan?')) return;
        try {
            await apiFetch(`/plans/${id}`, { method: 'DELETE' });
            showToast('Plan eliminado', 'success');
            loadPlans();
        } catch (e) {}
    };

    loadFormData();
    loadPlans();
}
