// public/js/views/CustomerPlans.js
import { apiFetch, showToast } from '../api.js';

export async function renderCustomerPlans(container) {
    container.innerHTML = `
        <style>
            .tabs-container { display: flex; gap: 8px; border-bottom: 2px solid rgba(255,255,255,0.08); margin-bottom: 24px; padding: 0 8px 16px; }
            .tab-btn { background: transparent; border: none; color: #999; padding: 8px 16px; cursor: pointer; font-weight: 600; border-bottom: 3px solid transparent; transition: all .2s ease; }
            .tab-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; }
            .tab-btn:hover { color: #fff; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .payment-history { margin: 16px 0; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 8px; max-height: 240px; overflow-y: auto; }
            .payment-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
            .payment-item:last-child { border-bottom: none; }
            .payment-amount { color: #4ade80; font-weight: 600; }
            .payment-date { color: #999; font-size: 0.85rem; }
            .cp-modal-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 18px; align-items: start; }
            .cp-schedule-panel { border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; background: rgba(255,255,255,0.03); padding: 14px; }
            .cp-schedule-panel.hidden { display: none; }
            .cp-schedule-panel h4 { margin: 0 0 10px; font-size: 1rem; color: #f8fafc; }
            .cp-schedule-list { margin: 0; padding: 0; list-style: none; }
            .cp-schedule-list li { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.08); color: #e5e7eb; }
            .cp-schedule-list li:last-child { border-bottom: none; }
            .cp-schedule-summary { margin-top: 12px; font-size: 0.92rem; color: #cbd5e1; }
            .cp-slot-button { width: 100%; text-align: left; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color: #e5e7eb; padding: 12px; border-radius: 10px; cursor: pointer; transition: all .15s ease; }
            .cp-slot-button:hover { transform: translateY(-1px); border-color: rgba(56,189,248,0.9); background: rgba(56,189,248,0.16); }
            .cp-slot-button.selected { border-color: #38bdf8; background: rgba(56,189,248,0.25); box-shadow: inset 0 0 0 1px rgba(56,189,248,0.8); }
            .cp-schedule-table td { padding: 5px; vertical-align: top; }
            @media (max-width: 820px) {
                .cp-modal-grid { grid-template-columns: 1fr; }
            }
        </style>
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
            <div class="glass-panel modal-content border-glow" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 id="cp-modal-title">Registrar suscripción</h3>
                    <button class="close-modal">&times;</button>
                </div>

                <form id="cpForm">
                    <input type="hidden" id="cp-id">
                    <div class="cp-modal-grid">
                        <div>
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
                            <small id="cp-plan-note" class="text-secondary" style="font-size:0.8rem; display:block; margin-top:-6px;">
                                Selecciona un cliente para ver los planes disponibles.
                            </small>
                            <div id="cp-hours-container" class="form-group hidden">
                                <label>Horas a Contratar</label>
                                <input type="number" id="cp-hours" class="form-control" min="1" step="1" placeholder="1">
                                <small id="cp-hours-note" class="text-secondary" style="font-size:0.78rem; display:block; margin-top:6px;">
                                    Este plan se cobra por hora. El total es precio x horas.
                                </small>
                            </div>
                            <small class="text-secondary" style="font-size:0.8rem; display:block; margin-top:-6px;">
                                El sistema asigna automáticamente la vigencia según el tipo (hora o mensual).
                            </small>
                        </div>
                        <div id="cp-schedule-panel" class="cp-schedule-panel hidden">
                            <h4>Calendario del plan</h4>
                            <div id="cp-schedule-content">
                                <p class="text-secondary">Selecciona un plan diario para ver el calendario asociado.</p>
                            </div>
                        </div>
                    </div>

                    <div id="payment-section" style="margin-top: 24px;">
                        <h4 style="margin-bottom: 16px; color: #d8d8d8;">Pago inicial (opcional)</h4>
                        <div class="form-group">
                            <label>Método de Pago</label>
                            <select id="cp-pay-method" class="form-control">
                                <option value="">Seleccione método...</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Monto a Pagar ($)</label>
                            <input type="number" id="cp-pay-amount" class="form-control" step="0.01" min="0.00" placeholder="0.00">
                        </div>

                        <div id="receipt-upload" class="form-group hidden">
                            <label>Adjuntar Comprobante (Opcional)</label>
                            <input type="file" id="cp-pay-receipt" class="form-control" accept="image/*">
                        </div>

                        <small id="payment-remaining" class="text-secondary" style="font-size:0.78rem; display:none; margin-top:-6px;"></small>
                        <small class="text-secondary" style="font-size:0.78rem; display:block; margin-top:6px;">
                            Si deja los campos de pago vacíos, la suscripción se guardará como pendiente.
                        </small>
                    </div>

                    <div id="payment-history-container" style="display: none; margin-top: 24px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Historial de pagos</label>
                        <div id="payment-history-list" class="payment-history"></div>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1" id="cp-submit-btn">ASIGNAR PLAN</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const typeEs = (t) => (t === 'daily' ? 'hora' : (t === 'monthly' ? 'mensual' : t));
    const statusEs = (s) => {
        switch ((s || '').toLowerCase()) {
            case 'pending': return 'PENDIENTE';
            case 'partial': return 'ABONADO';
            case 'paid': return 'PAGADO';
            case 'expired': return 'VENCIDO';
            default: return (s || '').toUpperCase();
        }
    };

    let allPaymentMethods = [];
    let allPlans = [];
    let allPayments = [];
    let allCustomers = [];
    let allServices = [];
    let currentCustomerPlanId = null;
    let currentAssignment = {
        originalCustomerId: null,
        originalPlanId: null,
        hasPayments: false
    };
    let currentPlanSchedules = [];
    let selectedScheduleIds = new Set();

    const loadData = async () => {
        try {
            const [subs, customers, plans, services, payments, methods] = await Promise.all([
                apiFetch('/customer-plans'),
                apiFetch('/customers'),
                apiFetch('/plans'),
                apiFetch('/services'),
                apiFetch('/payments'),
                apiFetch('/payment-methods')
            ]);

            allPaymentMethods = methods;
            allPlans = plans;
            allPayments = payments;
            allCustomers = customers;
            allServices = services;
            
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
                        <button class="btn btn-icon btn-secondary edit-cp" data-id="${s.id}" data-customer="${s.customerId || s.customer_id}" data-plan="${s.planId || s.plan_id}" data-hours="${s.hours || s.hours === 0 ? s.hours : 1}">
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

            document.getElementById('cp-pay-method').innerHTML = '<option value="">Seleccione método...</option>' + 
                methods.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

            populatePlanSelect();

            document.querySelectorAll('.edit-cp').forEach(btn => {
                btn.onclick = () => openModal(
                    btn.dataset.id,
                    btn.dataset.customer,
                    btn.dataset.plan,
                    btn.dataset.hours,
                    payments,
                    plans
                );
            });
            document.querySelectorAll('.delete-cp').forEach(btn => {
                btn.onclick = () => deleteCP(btn.dataset.id);
            });
        } catch(e) {
            console.error('Error loading data:', e);
        }
    };

    const modal = document.getElementById('cpModal');
    const form = document.getElementById('cpForm');

    const customerHasInscription = (customerId) => {
        if (!customerId) return false;
        const customer = allCustomers.find(c => c.id === parseInt(customerId, 10));
        return Boolean(customer && customer.inscriptionId);
    };

    const customerPlanFilterNote = (customerId) => {
        if (!customerId) return 'Selecciona un cliente para ver los planes disponibles.';
        return customerHasInscription(customerId)
            ? 'Cliente con inscripción: solo planes mensuales disponibles.'
            : 'Cliente sin inscripción: solo planes por hora disponibles.';
    };

    const formatPlanOption = (plan) => {
        const service = allServices.find(s => s.id === (plan.serviceId ?? plan.service_id));
        const title = service ? service.title : 'N/A';
        return `<option value="${plan.id}">${title} - ${typeEs(plan.type)} ($${plan.price})</option>`;
    };

    const populatePlanSelect = (customerId = '', currentPlanId = null) => {
        const planSelect = document.getElementById('cp-plan');
        const allowedPlans = allPlans.filter(plan => {
            if (!customerId) return true;
            if (customerHasInscription(customerId)) return plan.type === 'monthly';
            return plan.type !== 'monthly';
        });

        const currentValue = planSelect.value;
        planSelect.innerHTML = '<option value="">Seleccione plan...</option>' +
            allowedPlans.map(p => formatPlanOption(p)).join('');

        const currentPlan = currentPlanId ? allPlans.find(p => p.id == currentPlanId) : null;
        if (currentPlan && !allowedPlans.some(p => p.id == currentPlan.id)) {
            planSelect.innerHTML += formatPlanOption(currentPlan);
        }

        if (allowedPlans.some(p => p.id == currentValue) || (currentPlan && currentPlan.id == currentValue)) {
            planSelect.value = currentValue;
        } else {
            planSelect.value = '';
        }

        document.getElementById('cp-plan-note').textContent = customerPlanFilterNote(customerId);
    };

    const updatePlanDetails = (selectedPlan, relatedPayments = [], hours = 1) => {
        const hoursContainer = document.getElementById('cp-hours-container');
        const hoursInput = document.getElementById('cp-hours');
        const hoursNote = document.getElementById('cp-hours-note');

        if (selectedPlan && selectedPlan.type === 'daily') {
            hoursContainer.classList.add('hidden');
            hoursInput.value = hours.toString();
            hoursInput.min = '1';
            hoursNote.textContent = 'Este plan se cobra por hora. Selecciona el horario en el calendario para fijar las horas a pagar.';
            updatePaymentConstraints(selectedPlan, relatedPayments, selectedScheduleIds.size || 0);
        } else {
            hoursContainer.classList.add('hidden');
            hoursInput.value = '';
            updatePaymentConstraints(selectedPlan, relatedPayments, 1);
        }
    };

    const updatePaymentConstraints = (selectedPlan, relatedPayments = [], hours = 1) => {
        const payAmountInput = document.getElementById('cp-pay-amount');
        const remainingLabel = document.getElementById('payment-remaining');
        const totalPaid = relatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const planPrice = selectedPlan ? parseFloat(selectedPlan.price) : 0;
        const totalDue = selectedPlan
            ? (selectedPlan.type === 'daily' ? planPrice * hours : planPrice)
            : 0;
        const remaining = selectedPlan ? Math.max(0, totalDue - totalPaid) : null;

        if (remaining !== null) {
            remainingLabel.textContent = selectedPlan && selectedPlan.type === 'daily'
                ? `Total a pagar: $${totalDue.toFixed(2)} (${hours} hora(s) x $${planPrice.toFixed(2)})`
                : `Saldo restante: $${remaining.toFixed(2)}`;
            remainingLabel.style.display = remaining > 0 ? 'block' : 'none';
            payAmountInput.max = remaining > 0 ? remaining : 0;
            payAmountInput.placeholder = remaining > 0 ? remaining.toFixed(2) : '0.00';
        } else {
            remainingLabel.style.display = 'none';
            payAmountInput.max = '';
            payAmountInput.placeholder = '0.00';
        }
    };

    const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const SLOT_HOURS = [17, 18, 19, 20];

    const normalizeDayLabel = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString('es-ES', { weekday: 'long' });
        }
        return value.toString();
    };

    const formatScheduleEntry = (schedule) => {
        let dateLabel = schedule.date || '';
        const parsedDate = new Date(schedule.date);
        if (!isNaN(parsedDate.getTime())) {
            dateLabel = parsedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
        }
        const start = schedule.startTime || schedule.start_time || '';
        const end = schedule.endTime || schedule.end_time || '';
        return `${dateLabel} ${start} - ${end}`.trim();
    };

    const buildSlotKey = (day, hour) => `${day}|${hour}`;

    const renderPlanSchedulePanel = (schedules, hours, totalAmount) => {
        const panel = document.getElementById('cp-schedule-panel');
        const content = document.getElementById('cp-schedule-content');

        if (!schedules || schedules.length === 0) {
            panel.classList.remove('hidden');
            content.innerHTML = '<p class="text-secondary">Este plan diario no tiene calendario asignado.</p>';
            return;
        }

        const scheduleMap = new Map();
        schedules.forEach(schedule => {
            const day = normalizeDayLabel(schedule.date);
            const hour = parseInt((schedule.startTime || schedule.start_time || '').split(':')[0], 10);
            if (day && !isNaN(hour)) {
                scheduleMap.set(buildSlotKey(day, hour), schedule);
            }
        });

        const rows = SLOT_HOURS.map(hour => {
            const cells = WEEKDAYS.map(day => {
                const key = buildSlotKey(day, hour);
                const schedule = scheduleMap.get(key);
                if (!schedule) {
                    return `<td></td>`;
                }
                const selected = selectedScheduleIds.has(String(schedule.id));
                return `
                    <td>
                        <button type="button" class="cp-slot-button ${selected ? 'selected' : ''}" data-schedule-id="${schedule.id}" data-day="${day}" data-hour="${hour}">
                            <div>${day}</div>
                            <div>${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00</div>
                        </button>
                    </td>
                `;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        panel.classList.remove('hidden');
        content.innerHTML = `
            <div style="overflow-x:auto;">
                <table class="cp-schedule-table" style="width:100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            ${WEEKDAYS.map(day => `<th style="padding: 8px; text-align:left; color:#cbd5e1;">${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
            <div class="cp-schedule-summary">
                <div>Horas seleccionadas: <strong>${hours}</strong></div>
                <div>Total a pagar: <strong>$${totalAmount.toFixed(2)}</strong></div>
            </div>
        `;
    };

    const updateSelectedSlotState = (selectedPlan) => {
        const hours = selectedScheduleIds.size;
        const totalAmount = selectedPlan ? parseFloat(selectedPlan.price) * hours : 0;
        const payAmountInput = document.getElementById('cp-pay-amount');
        const remainingLabel = document.getElementById('payment-remaining');

        document.getElementById('cp-hours').value = hours.toString();
        if (selectedPlan) {
            updatePaymentConstraints(selectedPlan, [], hours);
        }

        const summary = document.querySelector('.cp-schedule-summary');
        if (summary) {
            summary.innerHTML = `
                <div>Horas seleccionadas: <strong>${hours}</strong></div>
                <div>Total a pagar: <strong>$${totalAmount.toFixed(2)}</strong></div>
            `;
        }
    };

    const updateDailyPlanSchedule = async (selectedPlan, customerId, hours = 0) => {
        if (!selectedPlan || selectedPlan.type !== 'daily' || customerHasInscription(customerId)) {
            document.getElementById('cp-schedule-panel').classList.add('hidden');
            selectedScheduleIds.clear();
            currentPlanSchedules = [];
            return;
        }

        try {
            currentPlanSchedules = await apiFetch(`/plan-schedules/${selectedPlan.id}`);
            selectedScheduleIds.clear();
            const totalAmount = parseFloat(selectedPlan.price) * hours;
            renderPlanSchedulePanel(currentPlanSchedules, hours, totalAmount);
        } catch (error) {
            document.getElementById('cp-schedule-panel').classList.add('hidden');
            currentPlanSchedules = [];
            selectedScheduleIds.clear();
        }
    };

    const openModal = (id = '', customerId = '', planId = '', hours = 1, payments = [], plans = []) => {
        currentCustomerPlanId = id;
        document.getElementById('cp-id').value = id;
        document.getElementById('cp-customer').value = customerId || '';
        document.getElementById('cp-plan').value = planId || '';
        document.getElementById('cp-modal-title').innerText = id ? 'Editar suscripción' : 'Registrar suscripción';
        document.getElementById('cp-submit-btn').innerText = id ? 'GUARDAR CAMBIOS' : 'ASIGNAR PLAN';

        const historyContainer = document.getElementById('payment-history-container');
        const historyList = document.getElementById('payment-history-list');
        const selectedPlan = plans.find(p => p.id == planId);
        const relatedPayments = payments.filter(p => p.customerPlanId == id || p.customer_plan_id == id);
        currentAssignment.originalCustomerId = customerId || null;
        currentAssignment.originalPlanId = planId || null;
        currentAssignment.hasPayments = relatedPayments.length > 0;

        populatePlanSelect(customerId, planId);

        if (id) {
            if (relatedPayments.length > 0) {
                historyContainer.style.display = 'block';
                historyList.innerHTML = relatedPayments.map(p => {
                    const date = new Date(p.paidAt || p.paid_at).toLocaleDateString();
                    return `
                        <div class="payment-item">
                            <div>
                                <div style="font-weight: 600; margin-bottom: 2px;">Pago registrado</div>
                                <div class="payment-date">${date}</div>
                            </div>
                            <div class="payment-amount">+$${p.amount}</div>
                        </div>
                    `;
                }).join('');
            } else {
                historyContainer.style.display = 'none';
                historyList.innerHTML = '';
            }
        } else {
            historyContainer.style.display = 'none';
            historyList.innerHTML = '';
        }

        document.getElementById('receipt-upload').classList.add('hidden');
        document.getElementById('cp-pay-amount').value = '';
        document.getElementById('cp-pay-method').value = '';
        form.classList.remove('has-payment');
        form.reset();
        form.querySelector('#cp-id').value = id;
        form.querySelector('#cp-customer').value = customerId || '';
        form.querySelector('#cp-plan').value = planId || '';

        updatePlanDetails(selectedPlan, relatedPayments, parseInt(hours, 10) || 1);
        updateDailyPlanSchedule(selectedPlan, customerId, parseInt(hours, 10) || 1);

        document.getElementById('cp-customer').disabled = currentAssignment.hasPayments;
        document.getElementById('cp-plan').disabled = currentAssignment.hasPayments;

        modal.classList.remove('hidden');
    };

    document.getElementById('add-cp-btn').onclick = () => openModal();
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => {
        modal.classList.add('hidden');
        form.reset();
    });

    // Toggle receipt upload based on method
    document.getElementById('cp-pay-method').onchange = (e) => {
        const methodText = e.target.options[e.target.selectedIndex]?.text.toLowerCase() || '';
        const upload = document.getElementById('receipt-upload');
        if (methodText.includes('deposito') || methodText.includes('transferencia') || methodText.includes('tarjeta')) {
            upload.classList.remove('hidden');
        } else {
            upload.classList.add('hidden');
        }
    };

    document.getElementById('cp-plan').onchange = async () => {
        const selectedPlanId = document.getElementById('cp-plan').value;
        const selectedPlan = allPlans.find(p => p.id == selectedPlanId);
        const relatedPayments = currentCustomerPlanId
            ? allPayments.filter(p => p.customerPlanId == currentCustomerPlanId || p.customer_plan_id == currentCustomerPlanId)
            : [];
        selectedScheduleIds.clear();
        updatePlanDetails(selectedPlan, relatedPayments, 0);
        await updateDailyPlanSchedule(selectedPlan, document.getElementById('cp-customer').value, 0);
    };

    document.getElementById('cp-schedule-panel').onclick = (event) => {
        const button = event.target.closest('.cp-slot-button');
        if (!button) return;
        const scheduleId = button.dataset.scheduleId;
        if (!scheduleId) return;

        if (selectedScheduleIds.has(scheduleId)) {
            selectedScheduleIds.delete(scheduleId);
            button.classList.remove('selected');
        } else {
            selectedScheduleIds.add(scheduleId);
            button.classList.add('selected');
        }

        const selectedPlanId = document.getElementById('cp-plan').value;
        const selectedPlan = allPlans.find(p => p.id == selectedPlanId);
        updateSelectedSlotState(selectedPlan);
    };

    document.getElementById('cp-customer').onchange = (e) => {
        populatePlanSelect(e.target.value);
        document.getElementById('cp-plan').value = '';
        updatePlanDetails(null);
        document.getElementById('cp-schedule-panel').classList.add('hidden');
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('cp-id').value;
        const planId = parseInt(document.getElementById('cp-plan').value, 10);
        const selectedPlan = allPlans.find(p => p.id === planId);
        const hours = selectedPlan && selectedPlan.type === 'daily'
            ? selectedScheduleIds.size
            : null;

        if (selectedPlan && selectedPlan.type === 'daily' && hours === 0) {
            showToast('Selecciona al menos una hora en el calendario del plan.', 'error');
            return;
        }

        const payload = {
            customerId: parseInt(document.getElementById('cp-customer').value, 10),
            planId
        };
        if (hours !== null) payload.hours = hours;

        const paymentMethodId = document.getElementById('cp-pay-method').value;
        const paymentAmount = parseFloat(document.getElementById('cp-pay-amount').value);
        const hasPayment = paymentMethodId && !isNaN(paymentAmount) && paymentAmount > 0;
        const fileInput = document.getElementById('cp-pay-receipt');

        if ((paymentMethodId && !hasPayment) || (!paymentMethodId && paymentAmount > 0)) {
            showToast('Complete método y monto de pago o deje ambos vacíos.', 'error');
            return;
        }

        const relatedPayments = id
            ? allPayments.filter(p => p.customerPlanId == id || p.customer_plan_id == id)
            : [];
        const planPrice = selectedPlan ? parseFloat(selectedPlan.price) : 0;
        const totalDue = selectedPlan
            ? (selectedPlan.type === 'daily' ? planPrice * hours : planPrice)
            : 0;
        const totalPaid = relatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const remaining = Math.max(0, totalDue - totalPaid);

        if (selectedPlan && selectedPlan.type === 'daily' && hasPayment && paymentAmount !== totalDue) {
            showToast(`Para planes por hora, el pago debe ser el monto completo de $${totalDue.toFixed(2)}.`, 'error');
            return;
        }

        if (hasPayment && paymentAmount > remaining) {
            showToast(`El pago no puede exceder el saldo restante de $${remaining.toFixed(2)}.`, 'error');
            return;
        }

        if (id && currentAssignment.hasPayments) {
            const changingCustomer = payload.customerId !== Number(currentAssignment.originalCustomerId);
            const changingPlan = payload.planId !== Number(currentAssignment.originalPlanId);
            if (changingCustomer || changingPlan) {
                showToast('No se puede editar una suscripción con pagos registrados.', 'error');
                return;
            }
        }

        const subscriptionSuccessMessage = id
            ? 'Suscripción actualizada correctamente'
            : 'Suscripción asignada correctamente';
        const finalSuccessMessage = hasPayment
            ? (id ? 'Suscripción actualizada y pago registrado correctamente' : 'Suscripción asignada y pago registrado correctamente')
            : subscriptionSuccessMessage;

        try {
            let customerPlanId = id;
            if (id) {
                if (!currentAssignment.hasPayments) {
                    await apiFetch(`/customer-plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
                }
            } else {
                const newSubscription = await apiFetch('/customer-plans', { method: 'POST', body: JSON.stringify(payload) });
                customerPlanId = newSubscription.id;
            }

            if (hasPayment) {
                const paymentPayload = {
                    customerPlanId: parseInt(customerPlanId, 10),
                    paymentMethodId: parseInt(paymentMethodId, 10),
                    amount: paymentAmount
                };

                const submitPayment = async (payloadWithReceipt) => {
                    await apiFetch('/payments', { method: 'POST', body: JSON.stringify(payloadWithReceipt) });
                };

                if (fileInput.files[0]) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        paymentPayload.receiptImagePath = reader.result;
                        await submitPayment(paymentPayload);
                        showToast(finalSuccessMessage, 'success');
                        modal.classList.add('hidden');
                        form.reset();
                        loadData();
                    };
                    reader.readAsDataURL(fileInput.files[0]);
                    return;
                } else {
                    await submitPayment(paymentPayload);
                }
            }

            showToast(finalSuccessMessage, 'success');
            modal.classList.add('hidden');
            form.reset();
            loadData();
        } catch(e) {
            console.error('Error saving subscription and payment:', e);
            showToast('No fue posible guardar la suscripción. Revisa los datos.', 'error');
        }
    };

    const deleteCP = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta suscripción?')) return;
        try {
            await apiFetch(`/customer-plans/${id}`, { method: 'DELETE' });
            showToast('Suscripción eliminada', 'success');
            loadData();
        } catch (e) {
            console.error('Error deleting subscription:', e);
        }
    };

    loadData();
}

