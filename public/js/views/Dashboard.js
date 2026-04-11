// public/js/views/Dashboard.js
import { apiFetch } from '../api.js';

export async function renderDashboard(container) {
    container.innerHTML = `
        <div class="top-bar">
            <h2><i class="fa-solid fa-chart-line"></i> Dashboard</h2>
            <div class="header-actions">
                <button class="btn btn-primary" onclick="window.location.hash='#cash'">
                    <i class="fa-solid fa-cash-register"></i> IR A CAJA
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 32px">
            
            <div class="glass-card">
                <div class="text-secondary mb-1">Clientes Registrados</div>
                <h3 class="text-neon" style="font-size: 2.5rem" id="metrics-customers">--</h3>
            </div>
            
            <div class="glass-card">
                <div class="text-secondary mb-1">Ingreso Diario Esperado</div>
                <h3 class="text-success" style="font-size: 2.5rem" id="metrics-expected">$--</h3>
            </div>
            
            <div class="glass-card">
                <div class="text-secondary mb-1">Pagos Recientes hoy</div>
                <h3 style="font-size: 2.5rem" id="metrics-payments">--</h3>
            </div>

        </div>
        
        <div class="glass-panel text-center" style="padding: 60px">
            <h2 class="mb-2 text-muted"><i class="fa-solid fa-dumbbell fa-2x"></i></h2>
            <h3 class="text-muted">¡Es hora de entrenar las finanzas y la gestión!</h3>
            <p class="text-secondary mt-2">Usa la barra lateral para navegar a los módulos de Clientes, Pagos o Caja.</p>
        </div>
    `;

    // Cargar datos asíncronos para el dashboard
    try {
        const [customers, caja] = await Promise.all([
            apiFetch('/customers'),
            apiFetch('/cash-registers/expected')
        ]);
        
        document.getElementById('metrics-customers').innerText = customers.length || 0;
        document.getElementById('metrics-expected').innerText = `$${caja.totalExpected || 0}`;
        // Para # pagos idealmente tendríamos un stat, dejemos un mock dinámico para pagos
        // Podríamos iterar pagos o simplemente ocultarlo
        document.getElementById('metrics-payments').innerText = "Activo";
    } catch(e) {
        // Silenced for dashboard
    }
}
