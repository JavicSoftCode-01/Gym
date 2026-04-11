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

    let allPaymentMethods = [];
    let allPlans = [];
    let allPayments = [];
    let currentCustomerPlanId = null;
    let currentAssignment = {
        originalCustomerId: null,
        originalPlanId: null,
        hasPayments: false
    };

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

            document.getElementById('cp-pay-method').innerHTML = '<option value="">Seleccione método...</option>' + 
                methods.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

            document.querySelectorAll('.edit-cp').forEach(btn => {
                btn.onclick = () => openModal(btn.dataset.id, btn.dataset.customer, btn.dataset.plan, payments, plans);
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

    const updatePaymentConstraints = (selectedPlan, relatedPayments = []) => {
        const payAmountInput = document.getElementById('cp-pay-amount');
        const remainingLabel = document.getElementById('payment-remaining');
        const totalPaid = relatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const planPrice = selectedPlan ? parseFloat(selectedPlan.price) : 0;
        const remaining = selectedPlan ? Math.max(0, planPrice - totalPaid) : null;

        if (remaining !== null) {
            remainingLabel.textContent = `Saldo restante: $${remaining.toFixed(2)}`;
            remainingLabel.style.display = remaining > 0 ? 'block' : 'none';
            payAmountInput.max = remaining > 0 ? remaining : 0;
            payAmountInput.placeholder = remaining > 0 ? remaining.toFixed(2) : '0.00';
        } else {
            remainingLabel.style.display = 'none';
            payAmountInput.max = '';
            payAmountInput.placeholder = '0.00';
        }
    };

    const openModal = (id = '', customerId = '', planId = '', payments = [], plans = []) => {
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

        updatePaymentConstraints(selectedPlan, relatedPayments);

        document.getElementById('receipt-upload').classList.add('hidden');
        document.getElementById('cp-pay-amount').value = '';
        document.getElementById('cp-pay-method').value = '';
        form.classList.remove('has-payment');
        form.reset();
        form.querySelector('#cp-id').value = id;
        form.querySelector('#cp-customer').value = customerId || '';
        form.querySelector('#cp-plan').value = planId || '';

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

    document.getElementById('cp-plan').onchange = () => {
        const selectedPlanId = document.getElementById('cp-plan').value;
        const selectedPlan = allPlans.find(p => p.id == selectedPlanId);
        const relatedPayments = currentCustomerPlanId
            ? allPayments.filter(p => p.customerPlanId == currentCustomerPlanId || p.customer_plan_id == currentCustomerPlanId)
            : [];
        updatePaymentConstraints(selectedPlan, relatedPayments);
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('cp-id').value;
        const payload = {
            customerId: parseInt(document.getElementById('cp-customer').value, 10),
            planId: parseInt(document.getElementById('cp-plan').value, 10)
        };

        const paymentMethodId = document.getElementById('cp-pay-method').value;
        const paymentAmount = parseFloat(document.getElementById('cp-pay-amount').value);
        const hasPayment = paymentMethodId && !isNaN(paymentAmount) && paymentAmount > 0;
        const fileInput = document.getElementById('cp-pay-receipt');

        if ((paymentMethodId && !hasPayment) || (!paymentMethodId && paymentAmount > 0)) {
            showToast('Complete método y monto de pago o deje ambos vacíos.', 'error');
            return;
        }

        const selectedPlan = allPlans.find(p => p.id === payload.planId);
        const relatedPayments = id
            ? allPayments.filter(p => p.customerPlanId == id || p.customer_plan_id == id)
            : [];
        const planPrice = selectedPlan ? parseFloat(selectedPlan.price) : 0;
        const totalPaid = relatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const remaining = Math.max(0, planPrice - totalPaid);

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

