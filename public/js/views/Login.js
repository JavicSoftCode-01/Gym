// public/js/views/Login.js
import { apiFetch, showToast } from '../api.js';

export function renderLogin() {
    // Escuchar submit cuando se renderice en el DOM
    setTimeout(() => {
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        
        togglePassword?.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye');
            togglePassword.classList.toggle('fa-eye-slash');
        });

        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const contact = document.getElementById('contact').value;
                const password = document.getElementById('password').value;
                
                try {
                    const data = await apiFetch('/auth/login', {
                        method: 'POST',
                        body: JSON.stringify({ contact, password })
                    });
                    
                    localStorage.setItem('gym_token', data.token);
                    showToast('Bienvenido al sistema');
                    window.location.hash = '#dashboard';
                } catch (error) {
                    // API handle error toast
                }
            });
        }
    }, 100);

    return `
        <div class="login-wrapper">
            <div class="glass-panel login-box">
                <div class="login-logo text-neon">
                    <i class="fa-solid fa-dumbbell"></i>
                    <div>GYM PRO</div>
                </div>
                
                <form id="login-form">
                    <div class="form-group">
                        <label>Usuario</label>
                        <input type="text" id="contact" class="form-control" placeholder="Ingresar usuario" required autocomplete="off">
                    </div>
                    
                    <div class="form-group">
                        <label>Contraseña</label>
                        <div style="position: relative;">
                            <input type="password" id="password" class="form-control" placeholder="••••••••" required>
                            <i class="fa-solid fa-eye" id="toggle-password" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: var(--text-secondary);"></i>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1.1rem; margin-top: 10px;">
                        INICIAR SESIÓN <i class="fa-solid fa-arrow-right"></i>
                    </button>
                    
                    <div class="text-center mt-3">
                    <br>
                        <a href="#register" style="color: var(--text-secondary); text-decoration: none; font-size: 0.9rem;">
                            ¿No tienes cuenta? Regístrate aquí
                        </a>
                    </div>
                </form>
            </div>
        </div>
    `;
}
