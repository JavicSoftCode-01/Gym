// public/js/views/Payments.js
import { apiFetch, showToast } from '../api.js';

export async function renderPayments(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-money-bill-transfer"></i> Pasarela de Pagos</h2>
            <button id="add-pay-btn" class="btn btn-primary">
                <i class="fa-solid fa-plus"></i> REGISTRAR PAGO
            </button>
        </div>

        <div class="glass-panel table-container">
            <table>
                <thead>
                    <tr>
                        <th>Suscripción (Cliente)</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Fecha de Pago</th>
                        <th class="text-right">Recibo</th>
                    </tr>
                </thead>
                <tbody id="payment-list">
                    <tr><td colspan="5" class="text-center">Cargando pagos...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Payment Modal -->
        <div id="paymentModal" class="modal-backdrop hidden">
            <div class="glass-panel modal-content border-glow">
                <div class="modal-header">
                    <h3>Registrar Cobro</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="paymentForm">
                    <div class="form-group">
                        <label>Seleccionar Suscripción Pendiente</label>
                        <select id="pay-sub" class="form-control" required>
                            <option value="">Cargando suscripciones...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Método de Pago</label>
                        <select id="pay-method" class="form-control" required>
                            <option value="">Cargando métodos...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Monto a Pagar ($)</label>
                        <input type="number" id="pay-amount" class="form-control" required step="0.01" min="0.01">
                    </div>

                    <div id="receipt-upload" class="form-group hidden">
                        <label>Adjuntar Comprobante (Opcional)</label>
                        <input type="file" id="pay-receipt" class="form-control" accept="image/*">
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px">
                        <button type="button" class="btn btn-secondary close-modal" style="flex:1">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="flex:1">CONFIRMAR PAGO</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loadData = async () => {
        try {
            const [payments, subs, customers, methods] = await Promise.all([
                apiFetch('/payments'),
                apiFetch('/customer-plans'),
                apiFetch('/customers'),
                apiFetch('/payment-methods')
            ]);

            const tbody = document.getElementById('payment-list');
            tbody.innerHTML = payments.map(p => {
                const sub = subs.find(s => s.id === p.customerPlanId || s.id === p.customer_plan_id);
                const cust = sub ? customers.find(c => c.id === sub.customerId || c.id === sub.customer_id) : null;
                const method = methods.find(m => m.id === p.paymentMethodId || m.id === p.payment_method_id);
                
                return `
                    <tr>
                        <td style="font-weight: 500">${cust ? cust.fullName : 'Cliente no disponible'}</td>
                        <td class="text-success" style="font-weight: bold">$${p.amount}</td>
                        <td><span class="badge badge-neutral">${method ? method.name : 'N/A'}</span></td>
                        <td class="text-secondary">${new Date(p.paidAt || p.paid_at).toLocaleString()}</td>
                        <td class="text-right">
                            ${p.receiptImagePath ? `<a href="${p.receiptImagePath}" target="_blank" class="btn btn-icon btn-secondary"><i class="fa-solid fa-image"></i></a>` : '-'}
                        </td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="5" class="text-center text-muted">No se han registrado pagos.</td></tr>';

            // Fill selects
            const subSelect = document.getElementById('pay-sub');
            subSelect.innerHTML = '<option value="">Seleccione suscripción...</option>' + 
                subs.filter(s => s.status !== 'paid').map(s => {
                    const c = customers.find(cust => cust.id === s.customerId || cust.id === s.customer_id);
                    return `<option value="${s.id}">${c ? c.fullName : 'Plan #' + s.id} (${s.status})</option>`;
                }).join('');

            const methodSelect = document.getElementById('pay-method');
            methodSelect.innerHTML = '<option value="">Seleccione método...</option>' + 
                methods.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

        } catch (e) {}
    };

    const modal = document.getElementById('paymentModal');
    const form = document.getElementById('paymentForm');

    document.getElementById('add-pay-btn').onclick = () => modal.classList.remove('hidden');
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => modal.classList.add('hidden'));

    // Toggle receipt upload for certain methods
    document.getElementById('pay-method').onchange = (e) => {
        const methodText = e.target.options[e.target.selectedIndex]?.text.toLowerCase() || '';
        const upload = document.getElementById('receipt-upload');
        if (methodText.includes('deposito') || methodText.includes('transferencia') || methodText.includes('tarjeta')) {
            upload.classList.remove('hidden');
        } else {
            upload.classList.add('hidden');
        }
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            customerPlanId: parseInt(document.getElementById('pay-sub').value, 10),
            paymentMethodId: parseInt(document.getElementById('pay-method').value, 10),
            amount: parseFloat(document.getElementById('pay-amount').value)
        };

        const fileInput = document.getElementById('pay-receipt');
        if (fileInput.files[0]) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                payload.receiptImagePath = reader.result; // Base64
                await submitPayment(payload);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            await submitPayment(payload);
        }
    };

    const submitPayment = async (payload) => {
        try {
            await apiFetch('/payments', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Pago procesado correctamente');
            modal.classList.add('hidden');
            form.reset();
            loadData();
        } catch (e) {}
    };

    loadData();
}
