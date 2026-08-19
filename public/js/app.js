// public/js/app.js
import { renderLogin } from './views/Login.js';
import { renderRegister } from './views/Register.js';
import { renderDashboard } from './views/Dashboard.js';
import { renderCustomers } from './views/Customers.js';
import { renderCashRegister } from './views/CashRegister.js';
import { renderPayments } from './views/Payments.js';
import { renderServices } from './views/Services.js';
import { renderPlans } from './views/Plans.js';
import { renderSchedules } from './views/Schedules.js';
import { renderCustomerPlans } from './views/CustomerPlans.js';
import { renderPaymentMethods } from './views/PaymentMethods.js';
import { renderInscriptions } from './views/Inscriptions.js';
import { renderPOS } from './views/POS.js';
import { renderProducts } from './views/Products.js';
import { renderSuppliers } from './views/Suppliers.js';
import { renderDiscounts } from './views/Discounts.js';

const app = document.getElementById('app');

function getLayout() {
    return `
        <div class="layout">
            <aside class="sidebar">
                <div class="sidebar-brand">
                    <span class="text-neon">GYM</span> PRO
                </div>
                <nav class="sidebar-nav">
                    <a href="#pos" class="nav-item" style="color: var(--success); font-weight: 700;"><i class="fa-solid fa-cart-shopping"></i> Punto de Venta</a>
                    <a href="#dashboard" class="nav-item"><i class="fa-solid fa-chart-line"></i> Dashboard</a>
                    <a href="#products" class="nav-item"><i class="fa-solid fa-bottle-water"></i> Productos & Stock</a>
                    <a href="#suppliers" class="nav-item"><i class="fa-solid fa-truck-field"></i> Proveedores</a>
                    <a href="#discounts" class="nav-item"><i class="fa-solid fa-tags"></i> Promociones</a>
                    <a href="#customers" class="nav-item"><i class="fa-solid fa-users"></i> Clientes</a>
                    <a href="#customer-plans" class="nav-item"><i class="fa-solid fa-address-card"></i> Suscripciones</a>
                    <a href="#services" class="nav-item"><i class="fa-solid fa-dumbbell"></i> Servicios</a>
                    <a href="#plans" class="nav-item"><i class="fa-solid fa-layer-group"></i> Planes</a>
                    <a href="#schedules" class="nav-item"><i class="fa-solid fa-calendar-days"></i> Horarios</a>
                    <a href="#inscriptions" class="nav-item"><i class="fa-solid fa-shirt"></i> Inscripciones</a>
                    <a href="#payment-methods" class="nav-item"><i class="fa-solid fa-credit-card"></i> Métodos de Pago</a>
                    <a href="#cash" class="nav-item"><i class="fa-solid fa-cash-register"></i> Arqueo de Caja</a>
                    <a href="#logout" class="nav-item mt-2" style="color:var(--danger)"><i class="fa-solid fa-sign-out-alt"></i> Salir</a>
                </nav>
            </aside>
            <main class="main-content" id="router-view"></main>
        </div>
    `;
}

async function router() {
    const hash = window.location.hash || '#pos';
    const token = localStorage.getItem('gym_token');

    // Protect routes
    if (!token && hash !== '#login' && hash !== '#register') {
        window.location.hash = '#login';
        return;
    }

    if (hash === '#logout') {
        localStorage.removeItem('gym_token');
        window.location.hash = '#login';
        return;
    }

    // Render layout if not in login or register
    if (hash === '#login') {
        app.innerHTML = renderLogin();
    } else if (hash === '#register') {
        app.innerHTML = renderRegister();
    } else {
        if (!document.querySelector('.layout')) {
            app.innerHTML = getLayout();
        }
        
        const viewContainer = document.getElementById('router-view');
        
        // Highlight active nav
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.getAttribute('href') === hash) el.classList.add('active');
        });

        // Route mapping
        switch(hash) {
            case '#pos': await renderPOS(viewContainer); break;
            case '#products': await renderProducts(viewContainer); break;
            case '#suppliers': await renderSuppliers(viewContainer); break;
            case '#discounts': await renderDiscounts(viewContainer); break;
            case '#dashboard': await renderDashboard(viewContainer); break;
            case '#customers': await renderCustomers(viewContainer); break;
            case '#schedules': await renderSchedules(viewContainer); break;
            case '#payment-methods': await renderPaymentMethods(viewContainer); break;
            case '#inscriptions': await renderInscriptions(viewContainer); break;
            case '#services': await renderServices(viewContainer); break;
            case '#plans': await renderPlans(viewContainer); break;
            case '#customer-plans': await renderCustomerPlans(viewContainer); break;
            case '#cash': await renderCashRegister(viewContainer); break;
            case '#cash-register': await renderCashRegister(viewContainer); break;
            case '#payments': await renderPayments(viewContainer); break;
            default: await renderPOS(viewContainer); break;
        }
    }
}

// Listen to URL changes
window.addEventListener('hashchange', router);

// Listen to custom navigate events (e.g. from POS locked screen)
window.addEventListener('navigate', (e) => {
    window.location.hash = `#${e.detail}`;
});

// Init
window.addEventListener('DOMContentLoaded', router);
