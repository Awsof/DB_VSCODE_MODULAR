(function () {
  'use strict';

  class DBLogin extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
      this.bindEvents();
    }

    render() {
      const logoSrc = window.DBSidebar && window.DBSidebar._LOGO_BASE64 ? window.DBSidebar._LOGO_BASE64 : '';
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: flex;
            position: fixed;
            inset: 0;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle at top, rgba(15,155,148,0.16), transparent 42%), rgba(244,246,248, 1);
            z-index: 999;
          }

          .login-box {
            width: min(520px, 94%);
            background: rgba(255,255,255,0.98);
            border: 1px solid rgba(15, 155, 148, 0.14);
            border-radius: 32px;
            box-shadow: 0 40px 80px rgba(0, 55, 97, 0.12);
            padding: 38px 36px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            backdrop-filter: blur(14px);
          }

          .login-header {
            display: flex;
            gap: 16px;
            align-items: center;
          }

          .login-logo {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .login-logo-img,
          .login-mark {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 14px 32px rgba(15,155,148,0.12);
          }

          .login-logo-img {
            object-fit: contain;
            background: white;
            padding: 8px;
          }

          .login-mark {
            background: linear-gradient(135deg, #0F9B94, #0a7a74);
            color: white;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.12em;
          }

          .login-brand {
            display: grid;
            gap: 6px;
          }

          .login-title {
            font-size: 24px;
            font-weight: 800;
            color: var(--navy, #003761);
          }

          .login-sub {
            font-size: 14px;
            color: var(--text2, #4a5568);
            line-height: 1.5;
          }

          .login-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .login-label {
            font-size: 12px;
            font-weight: 700;
            color: var(--text3, #8a96a8);
            text-transform: uppercase;
            letter-spacing: 0.12em;
          }

          .login-input {
            width: 100%;
            border: 1px solid var(--border, #d4dbe6);
            border-radius: 12px;
            padding: 14px 16px;
            font-size: 15px;
            color: var(--text, #1a2433);
            outline: none;
            transition: border-color .18s, box-shadow .18s;
            background: #fff;
          }

          .login-input:focus {
            border-color: var(--accent, #0F9B94);
            box-shadow: 0 0 0 4px rgba(15,155,148,0.08);
          }

          .login-btn {
            width: 100%;
            padding: 14px 16px;
            background: var(--accent, #0F9B94);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: background .18s, transform .18s;
          }

          .login-btn:hover {
            background: var(--accent2, #0a7a74);
            transform: translateY(-1px);
          }

          .login-error {
            color: var(--red, #d63031);
            font-size: 13px;
            text-align: center;
            min-height: 18px;
          }
        </style>

        <div class="login-box">
          <div class="login-header">
            <div class="login-logo">
              ${logoSrc ? `<img class="login-logo-img" src="${logoSrc}" alt="DB Lab Manager">` : `<div class="login-mark">DB</div>`}
            </div>
            <div class="login-brand">
              <div class="login-title">DB Lab Manager</div>
              <div class="login-sub">Faça login para acessar o painel de integração e implantação.</div>
            </div>
          </div>
          <div class="login-field">
            <label class="login-label" for="login-user">Login</label>
            <input type="text" class="login-input" id="login-user" placeholder="Usuário" autocomplete="username">
          </div>
          <div class="login-field">
            <label class="login-label" for="login-pass">Senha</label>
            <input type="password" class="login-input" id="login-pass" placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="login-btn" id="login-btn" type="button">Entrar</button>
          <div class="login-error" id="login-error"></div>
        </div>
      `;
    }

    bindEvents() {
      this.shadowRoot.addEventListener('click', (event) => {
        if (event.target.id === 'login-btn') {
          this.dispatchEvent(new CustomEvent('db-login-submit', { bubbles: true, composed: true }));
        }
      });

      this.shadowRoot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.dispatchEvent(new CustomEvent('db-login-submit', { bubbles: true, composed: true }));
        }
      });
    }

    getCredentials() {
      return {
        login: this.shadowRoot.getElementById('login-user').value,
        password: this.shadowRoot.getElementById('login-pass').value,
      };
    }

    setError(message) {
      this.shadowRoot.getElementById('login-error').textContent = message || '';
    }

    reset() {
      this.shadowRoot.getElementById('login-user').value = '';
      this.shadowRoot.getElementById('login-pass').value = '';
      this.setError('');
    }

    focus() {
      this.shadowRoot.getElementById('login-user').focus();
    }
  }

  customElements.define('db-login', DBLogin);
  window.DBLogin = DBLogin;
})();
