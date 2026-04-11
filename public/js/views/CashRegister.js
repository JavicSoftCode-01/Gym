// public/js/views/CashRegister.js
import { apiFetch, showToast } from '../api.js';

export async function renderCashRegister(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-cash-register"></i> Control de Caja Diaria</h2>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px">
            
            <!-- Expected Box -->
            <div class="glass-panel border-glow">
                <h3 class="mb-3"><i class="fa-solid fa-magnifying-glass-dollar text-neon"></i> Resumen de Pagos Hoy</h3>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                    <span class="text-secondary">Pagos en Efectivo</span>
                    <span class="text-success" style="font-size:1.2rem; font-weight:bold" id="exp-cash">$0</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
                    <span class="text-secondary">Depósitos a Cuentas</span>
                    <span class="text-success" style="font-size:1.2rem; font-weight:bold" id="exp-deposit">$0</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0;">
                    <span style="font-size:1.2rem; font-weight:900">Total Esperado</span>
                    <span class="text-neon" style="font-size:1.8rem; font-weight:900" id="exp-total">$0</span>
                </div>
            </div>

            <!-- Close Register Form -->
            <div class="glass-panel">
                <h3 class="mb-3"><i class="fa-solid fa-lock text-neon"></i> Sellar y Cerrar Caja</h3>
                <form id="cashForm">
                    <div class="form-group">
                        <label>Fecha de Cierre</label>
                        <input type="date" id="cajaDate" class="form-control" required>
                    </div>
                    
                    <div style="display:flex; gap: 16px">
                        <div class="form-group" style="flex:1">
                            <label>Efectivo Físico Contado ($)</label>
                            <input type="number" step="0.01" id="actualCash" class="form-control" required placeholder="0.00">
                        </div>
                        <div class="form-group" style="flex:1">
                            <label>Suma de Depósitos ($)</label>
                            <input type="number" step="0.01" id="actualDeposit" class="form-control" required placeholder="0.00">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 16px; margin-top: 10px;">
                        <i class="fa-solid fa-check"></i> CONFIRMAR CIERRE DIARIO
                    </button>
                    <p class="text-muted mt-2" style="font-size: 0.8rem; text-align: center;">
                        <i class="fa-solid fa-triangle-exclamation"></i> Esta acción inyecta los resultados a la ganancia histórica y no se puede deshacer.
                    </p>
                </form>
            </div>
        </div>
        
        <!-- Historial -->
        <div class="glass-panel table-container">
            <h3 class="mb-2">Histórico de Cierres (Auditoría Financiera)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Fecha Operada</th>
                        <th>Físico vs Esperado</th>
                        <th>Depósito vs Esperado</th>
                        <th>Margen Error (Diferencia)</th>
                        <th>Total Subido</th>
                        <th>G. Total Histórica</th>
                    </tr>
                </thead>
                <tbody id="cash-history">
                    <tr><td colspan="6" class="text-center">Cargando data...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    // Lógica para cargar esperado
    const loadExpected = async (date) => {
        try {
            const data = await apiFetch(`/cash-registers/expected?date=${date}`);
            document.getElementById('exp-cash').innerText = `$${data.expectedCash}`;
            document.getElementById('exp-deposit').innerText = `$${data.expectedDeposit}`;
            document.getElementById('exp-total').innerText = `$${data.totalExpected}`;
        } catch(e) {}
    };

    // Lógica para cargar historia
    const loadHistory = async () => {
        try {
            const data = await apiFetch(`/cash-registers/history`);
            const tbody = document.getElementById('cash-history');
            
            if(data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aún no hay aperturas ni cierres.</td></tr>';
                return;
            }
            
            tbody.innerHTML = data.map(r => `
                <tr>
                    <td style="font-weight: bold">${r.date}</td>
                    <td><span class="${r.actualCash < r.expectedCash ? 'text-danger' : 'text-success'}">$${r.actualCash}</span> / $${r.expectedCash}</td>
                    <td><span class="${r.actualDeposit < r.expectedDeposit ? 'text-danger' : 'text-success'}">$${r.actualDeposit}</span> / $${r.expectedDeposit}</td>
                    <td class="${r.difference < 0 ? 'text-danger' : (r.difference > 0 ? 'text-warning' : 'text-success')}" style="font-weight: 900">
                        $${r.difference}
                    </td>
                    <td class="text-neon" style="font-weight: bold">+$${r.dailyTotal}</td>
                    <td style="font-weight: bold; border-left: 2px solid var(--neon-accent); padding-left: 12px">$${r.grandTotal}</td>
                </tr>
            `).join('');
        } catch (e) {}
    };

    const datePicker = document.getElementById('cajaDate');
    const today = new Date().toISOString().split('T')[0];
    datePicker.value = today;
    
    // Cargar si cambia fecha
    datePicker.addEventListener('change', (e) => loadExpected(e.target.value));

    setTimeout(() => {
        loadExpected(today);
        loadHistory();
        
        document.getElementById('cashForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                date: document.getElementById('cajaDate').value,
                actualCash: document.getElementById('actualCash').value,
                actualDeposit: document.getElementById('actualDeposit').value
            };
            
            try {
                await apiFetch('/cash-registers/close', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast('Super! La caja ha sido cerrada y los métricas de auditoria guardadas.');
                loadExpected(payload.date);
                loadHistory();
                document.getElementById('actualCash').value = '';
                document.getElementById('actualDeposit').value = '';
            } catch (e) {}
        });
    }, 50);
}
