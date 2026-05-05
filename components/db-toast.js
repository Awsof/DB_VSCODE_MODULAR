/**
 * components/db-toast.js — Web Component para notificações toast
 * 
 * Encapsula a lógica de exibição de mensagens temporárias.
 * Substitui a função toast() de core/utils.js.
 * 
 * API pública:
 *   - show(msg, type, duration) — exibe um toast
 *   - tipo: 'success' (verde), 'error' (vermelho), 'info' (azul)
 *   - duration: tempo em ms (padrão 4000)
 * 
 * Exemplo de uso:
 *   document.getElementById('toast').show('Operação concluída!', 'success');
 */
(function () {
  'use strict';

  class DBToast extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.render();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --accent: var(--accent, #0f9b94);
            --red: var(--red, #d32f2f);
            --navy3: var(--navy3, #004d7a);
            --bg2: var(--bg2, #f5f5f5);
            --border: var(--border, #e0e0e0);
            --text: var(--text, #1a1a1a);
            --r: var(--r, 4px);
          }

          :host {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
          }

          .toast-item {
            background: var(--bg2);
            border: 1px solid var(--border);
            border-radius: var(--r);
            padding: 12px 16px;
            font-size: 13px;
            color: var(--text);
            min-width: 240px;
            box-shadow: 0 8px 32px rgba(0, 55, 97, 0.15);
            animation: slideIn 0.2s ease;
            pointer-events: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          }

          .toast-item.success {
            border-left: 3px solid var(--accent);
          }

          .toast-item.error {
            border-left: 3px solid var(--red);
          }

          .toast-item.info {
            border-left: 3px solid var(--navy3);
          }

          @keyframes slideIn {
            from {
              transform: translateX(40px);
              opacity: 0;
            }
            to {
              transform: none;
              opacity: 1;
            }
          }
        </style>

        <slot></slot>
      `;
    }

    /**
     * Exibe um toast com a mensagem, tipo e duração especificados
     * @param {string} msg - Mensagem a exibir
     * @param {string} type - Tipo: 'success' (verde), 'error' (vermelho), 'info' (azul)
     * @param {number} duration - Duração em ms (padrão 4000)
     */
    show(msg, type, duration) {
      type = type || 'info';
      duration = duration || 4000;

      // Criar elemento do toast
      var el = document.createElement('div');
      el.className = 'toast-item ' + type;
      el.textContent = msg;

      // Adicionar ao shadow DOM
      this.shadowRoot.appendChild(el);

      // Remover após a duração especificada
      setTimeout(function () {
        if (el && el.parentNode) {
          el.remove();
        }
      }, duration);
    }
  }

  // Registrar o Web Component
  customElements.define('db-toast', DBToast);

  // COMPATIBILIDADE: Registrar função global toast() que delega ao componente
  // Isto permite que código existente continue usando window.toast()
  window.toast = function (msg, type, duration) {
    var toastComponent = document.getElementById('toast');
    if (toastComponent && typeof toastComponent.show === 'function') {
      toastComponent.show(msg, type, duration);
    }
  };
})();
