// public/js/views/Plans.js
import { apiFetch, showToast } from '../api.js';

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const START_HOUR = 17;
const END_HOUR = 21;
const DAY_LABELS = {
    lunes: "Lunes",
    martes: "Martes",
    miércoles: "Miércoles",
    miercoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes"
};

const normalizeDayLabel = (value) => {
    if (!value) return null;
    const trimmed = value.toString().trim();
    const lower = trimmed.toLowerCase();
    if (DAY_LABELS[lower]) return DAY_LABELS[lower];
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
        const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
        return DAY_LABELS[weekday.toLowerCase()] || null;
    }
    return null;
};

const buildKey = (day, hour) => `${day}|${hour}`;

export async function renderPlans(container) {
    container.innerHTML = `
        <style>
            .schedule-grid-compact { width: 100%; border-collapse: collapse; margin-top: 16px; }
            .schedule-grid-compact th, .schedule-grid-compact td { border: 1px solid rgba(255,255,255,0.08); padding: 8px; vertical-align: top; }
            .schedule-grid-compact th { background: rgba(255,255,255,0.04); color: #d8d8d8; font-weight: 700; font-size: 0.9rem; }
            .schedule-grid-compact td { min-width: 120px; height: 60px; }
            .schedule-grid-compact .slot-cell { border-radius: 8px; min-height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all .15s ease; padding: 8px 4px; text-align: center; font-size: 0.8rem; }
            .schedule-grid-compact .slot-cell:hover { transform: translateY(-1px); }
            .schedule-grid-compact .slot-cell--disabled { opacity: 0.25; cursor: not-allowed; background: rgba(255,255,255,0.02); }
            .schedule-grid-compact .slot-cell--selected { background: rgba(56,189,248,0.18); box-shadow: inset 0 0 0 2px rgba(56,189,248,0.9); color: #e8f9ff; }
            .slot-label-compact { display: block; font-size: 0.75rem; color: inherit; margin-bottom: 2px; }
            .slot-check-compact { font-size: 1rem; line-height: 1; }
            .schedule-view-container { width: 100%; overflow-x: auto; }
            .schedule-view-grid { width: 100%; border-collapse: collapse; margin: 0; }
            .schedule-view-grid th, .schedule-view-grid td { border: 1px solid rgba(255,255,255,0.08); padding: 10px; vertical-align: top; }
            .schedule-view-grid th { background: rgba(255,255,255,0.06); color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.85rem; }
            .schedule-view-grid td { min-height: 72px; background: rgba(255,255,255,0.02); }
            .schedule-view-cell { border-radius: 14px; min-height: 46px; display: flex; align-items: center; justify-content: center; background: rgba(56,189,248,0.16); color: #e8f9ff; font-weight: 600; }
            .schedule-view-cell-empty { background: transparent; opacity: 0.15; }
            .modal-content.large { max-width: 900px; max-height: 85vh; overflow-y: auto; }
        </style>

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
                        <th>Calendario</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody id="plans-table">
                    <tr><td colspan="8" class="text-center">Cargando planes...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Plan Modal -->
        <div id="planModal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow large">
                <div class="modal-header">
                    <h3 id="modal-title">Registrar Plan</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="planForm">
                    <input type="hidden" id="plan-id">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
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
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 12px; color: #dcdcdc;">Calendario / Horarios Disponibles</label>
                            <div id="scheduleGridContainer" style="border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; background: rgba(0,0,0,0.3); overflow-x: auto;"></div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1">GUARDAR PLAN</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="scheduleViewModal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow" style="max-width: 760px;">
                <div class="modal-header">
                    <h3>Calendario del plan</h3>
                </div>
                <div id="scheduleViewBody" style="padding: 16px;">
                    <div id="scheduleViewList" class="schedule-view-container"></div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px; padding: 0 16px 16px;">
                    <button type="button" class="btn btn-secondary close-schedule-view">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    let allSchedules = [];
    let selectedScheduleIds = new Set();
    let planSchedulesData = [];

    const getSlotLabel = (hour) => `${hour.toString().padStart(2, '0')}:00`;
    
    const getSlotRange = (hour) => {
        const start = getSlotLabel(hour);
        const end = getSlotLabel(hour + 1);
        return `${start} - ${end}`;
    };

    const formatScheduleItem = (schedule) => {
        const day = normalizeDayLabel(schedule.date) || schedule.date;
        const hour = schedule.startTime ? parseInt(schedule.startTime.split(':')[0], 10) : '';
        return `${day} ${hour !== '' ? getSlotRange(hour) : ''}`.trim();
    };

    const openScheduleViewModal = (planId) => {
        const viewModal = document.getElementById('scheduleViewModal');
        const viewList = document.getElementById('scheduleViewList');
        const selectedIds = new Set(planSchedulesData.filter(ps => ps.planId == planId).map(ps => ps.scheduleId));
        const scheduleByDayHour = new Map(allSchedules.map(schedule => {
            const day = normalizeDayLabel(schedule.date);
            const hour = parseInt(schedule.startTime.split(':')[0], 10);
            return [`${day}|${hour}`, schedule];
        }));

        const headers = WEEKDAYS.map(day => `<th>${day}</th>`).join('');
        const rows = [];

        for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
            const cells = WEEKDAYS.map(day => {
                const schedule = scheduleByDayHour.get(`${day}|${hour}`);
                const isSelected = schedule && selectedIds.has(schedule.id);
                const content = isSelected
                    ? `<div class="schedule-view-cell">${getSlotRange(hour)}</div>`
                    : `<div class="schedule-view-cell schedule-view-cell-empty"></div>`;
                return `<td>${content}</td>`;
            }).join('');
            rows.push(`<tr>${cells}</tr>`);
        }

        viewList.innerHTML = `
            <table class="schedule-view-grid">
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows.join('')}</tbody>
            </table>
        `;

        viewModal.classList.remove('hidden');
    };

    const closeScheduleViewModal = () => {
        document.getElementById('scheduleViewModal').classList.add('hidden');
    };

    const renderScheduleGrid = () => {
        const container = document.getElementById('scheduleGridContainer');
        const scheduleMap = new Map(allSchedules.map(s => [buildKey(normalizeDayLabel(s.date) || 'Lunes', parseInt(s.startTime.split(':')[0]) || 17), s]));
        const rows = [];

        const headers = WEEKDAYS.map(day => `<th>${day}</th>`).join('');

        for (let hour = START_HOUR; hour < END_HOUR; hour += 1) {
            const cells = WEEKDAYS.map(day => {
                const key = buildKey(day, hour);
                const schedule = scheduleMap.get(key);
                const selected = selectedScheduleIds.has(schedule?.id ?? 'none');
                
                return `
                    <td>
                        <div class="slot-cell ${!schedule ? 'slot-cell--disabled' : ''} ${selected ? 'slot-cell--selected' : ''}"
                             data-schedule-id="${schedule?.id ?? ''}"
                             ${schedule ? `style="cursor: pointer;"` : ''}>
                            ${schedule ? `<span class="slot-label-compact">${getSlotRange(hour)}</span>` : ''}
                            ${selected ? '<span class="slot-check-compact">✓</span>' : ''}
                        </div>
                    </td>
                `;
            }).join('');

            rows.push(`<tr>${cells}</tr>`);
        }

        container.innerHTML = `
            <table class="schedule-grid-compact">
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows.join('')}</tbody>
            </table>
        `;

        attachScheduleGridEvents();
    };

    const attachScheduleGridEvents = () => {
        document.querySelectorAll('#scheduleGridContainer .slot-cell:not(.slot-cell--disabled)').forEach(cell => {
            cell.onclick = () => {
                const scheduleId = parseInt(cell.dataset.scheduleId);
                if (selectedScheduleIds.has(scheduleId)) {
                    selectedScheduleIds.delete(scheduleId);
                } else {
                    selectedScheduleIds.add(scheduleId);
                }
                renderScheduleGrid();
            };
        });
    };

    const loadFormData = async () => {
        try {
            const [services, schedules] = await Promise.all([
                apiFetch('/services'),
                apiFetch('/schedules')
            ]);
            
            allSchedules = schedules;
            
            const svcSelect = document.getElementById('plan-serviceId');
            svcSelect.innerHTML = '<option value="">Seleccione servicio...</option>' + 
                services.map(s => `<option value="${s.id}">${s.title}</option>`).join('');

            renderScheduleGrid();
        } catch (e) {
            console.error('Error loading form data:', e);
        }
    };

    const loadPlans = async () => {
        try {
            const [plans, services, planSchedules] = await Promise.all([
                apiFetch('/plans'),
                apiFetch('/services'),
                apiFetch('/plan-schedules')
            ]);
            planSchedulesData = planSchedules;
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
                    <td class="text-center">
                        <button class="btn btn-icon btn-secondary view-calendar" data-id="${p.id}" title="Ver calendario">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </td>
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
            `}).join('') || '<tr><td colspan="8" class="text-center text-muted">No hay planes registrados.</td></tr>';

            document.querySelectorAll('.edit-plan').forEach(btn => {
                btn.onclick = async () => {
                    const planId = btn.dataset.id;
                    const existing = planSchedulesData.filter(ps => ps.planId == planId);
                    selectedScheduleIds = new Set(existing.map(ps => ps.scheduleId));
                    renderScheduleGrid();
                    openModal(planId, btn.dataset.svc, btn.dataset.type, btn.dataset.min, btn.dataset.max, btn.dataset.price);
                };
            });
            document.querySelectorAll('.delete-plan').forEach(btn => {
                btn.onclick = () => deletePlan(btn.dataset.id);
            });
            document.querySelectorAll('.view-calendar').forEach(btn => {
                btn.onclick = () => openScheduleViewModal(btn.dataset.id);
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
        if (!id) selectedScheduleIds.clear();
        document.getElementById('modal-title').innerText = id ? 'Editar Plan' : 'Registrar Plan';
        renderScheduleGrid();
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        selectedScheduleIds.clear();
    };

    document.getElementById('add-plan-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = closeModal);
    document.querySelectorAll('.close-schedule-view').forEach(b => b.onclick = closeScheduleViewModal);

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        // Validar que se seleccionó al menos un horario
        if (selectedScheduleIds.size === 0) {
            showToast('Debes seleccionar al menos un horario para el plan.', 'error');
            return;
        }

        const id = document.getElementById('plan-id').value;
        const payload = {
            serviceId: parseInt(document.getElementById('plan-serviceId').value, 10),
            type: document.getElementById('plan-type').value,
            minAge: parseInt(document.getElementById('plan-minAge').value, 10),
            maxAge: parseInt(document.getElementById('plan-maxAge').value, 10),
            price: parseFloat(document.getElementById('plan-price').value)
        };

        try {
            let planId = id;
            if (id) {
                await apiFetch(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            } else {
                const newPlan = await apiFetch('/plans', { method: 'POST', body: JSON.stringify(payload) });
                planId = newPlan.id;
            }

            if (selectedScheduleIds.size > 0) {
                for (const sId of selectedScheduleIds) {
                    await apiFetch('/plan-schedules', { method: 'POST', body: JSON.stringify({ planId, scheduleId: sId }) });
                }
            }

            showToast(id ? 'Plan actualizado' : 'Plan y horarios guardados');
            closeModal();
            loadPlans();
        } catch(e) {
            console.error('Error saving plan:', e);
        }
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
