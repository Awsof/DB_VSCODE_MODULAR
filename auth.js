/**
 * core/auth.js — Autenticação, Sessão, RLS e ACL
 *
 * PADRÃO: Script clássico carregado via <script src="core/auth.js" defer>.
 * Depende de core/db.js (deve ser carregado antes).
 * Registra todas as funções e o estado currentUser em window.*.
 *
 * PROBLEMA DE REFERÊNCIA MUTÁVEL (bug V26):
 *  Módulos ES exportam o valor de `currentUser` no momento da importação.
 *  Como `currentUser` começa como null e é reatribuído em doLogin(), as
 *  funções importadoras recebem a referência primitiva null — nunca veem
 *  a atualização. Com script clássico, todas as funções acessam a variável
 *  via closure sobre o escopo do IIFE, resolvendo o problema.
 *  A exposição via window.currentUser também é atualizada em doLogin/doLogout.
 *
 * Dependências: window.dbGet, window.dbAdd, window.dbPut, window.setAuditHook
 *  (fornecidas por core/db.js)
 */
(function (global) {
  'use strict';

  // ── Estado de sessão ──────────────────────────────────────────────────────────
  // Variável local ao IIFE — atualizada por doLogin/doLogout.
  // Todas as funções deste módulo a acessam via closure (correto).
  // window.currentUser é sincronizado manualmente em doLogin/doLogout.
  var currentUser = null;

  // ── auditLog ──────────────────────────────────────────────────────────────────
  async function auditLog(acao, detalhe) {
    detalhe = detalhe || '';
    var entry = {
      ts:      new Date().toISOString(),
      usuario: currentUser ? currentUser.login : 'sistema',
      acao:    acao,
      detalhe: detalhe.slice(0, 300),
    };
    try { await global.dbAdd('audit_log', entry); } catch (_) { /* non-blocking */ }
  }

  // Registra o hook de auditoria em db.js para que dbAddLogged/dbPutLogged/
  // dbDeleteLogged possam chamar auditLog sem dependência circular.
  // Executado imediatamente quando auth.js é carregado.
  if (typeof global.setAuditHook === 'function') {
    global.setAuditHook(auditLog);
  }

  // ── RLS — Row-Level Security ──────────────────────────────────────────────────
  function applyDataFilter(clientes, reps) {
    if (!currentUser || currentUser.fullAccess) return clientes;
    var entityType = currentUser.entityType;
    var entityId   = currentUser.entityId;
    var entityNome = currentUser.entityNome;
    if (!entityType || !entityId) return clientes;

    if (entityType === 'representante') {
      return clientes.filter(function (c) {
        return String(c.fk_representante) === String(entityId);
      });
    }
    if (entityType === 'assessor') {
      return clientes.filter(function (c) { return c.assessor === entityNome; });
    }
    if (entityType === 'supervisor') {
      var repIds = new Set(
        (reps || []).filter(function (r) { return r.supervisor === entityNome; })
                   .map(function (r) { return String(r.id); })
      );
      return clientes.filter(function (c) { return repIds.has(String(c.fk_representante)); });
    }
    return clientes;
  }

  function rlsBanner() {
    if (!currentUser || currentUser.fullAccess || !currentUser.entityType) return '';
    var labels = { representante: 'Representante', supervisor: 'Supervisor', assessor: 'Assessor' };
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;background:rgba(15,155,148,.08);' +
      'border:1px solid rgba(15,155,148,.25);border-radius:var(--r);margin-bottom:14px;font-size:12px">' +
      '<span style="color:var(--accent2)">🔒</span>' +
      '<span style="color:var(--text2)">Visão filtrada — <strong style="color:var(--accent2)">' +
      labels[currentUser.entityType] + ': ' + (currentUser.entityNome || currentUser.entityId) +
      '</strong>. Apenas dados vinculados a esta entidade são exibidos.</span></div>';
  }

  // ── ACL ───────────────────────────────────────────────────────────────────────
  function canAccess(pageKey) {
    if (!currentUser) return false;
    if (currentUser.fullAccess) return true;
    return currentUser.permissoes[pageKey] !== false;
  }

  function canBtn(pageKey, btnKey) {
    if (!currentUser) return false;
    if (currentUser.fullAccess) return true;
    var key = pageKey + '::' + btnKey;
    return currentUser.permissoes ? currentUser.permissoes[key] !== false : true;
  }

  // ── applyNavPermissions ───────────────────────────────────────────────────────
  function applyNavPermissions() {
    if (!currentUser) return;
    if (currentUser.fullAccess) return;
    var hidden = Object.entries(currentUser.permissoes)
      .filter(function (e) { return !e[0].includes('::') && e[1] === false; })
      .map(function (e) { return e[0]; });
    var sidebarEl = document.getElementById('sidebar');
    if (sidebarEl && typeof sidebarEl.hidePages === 'function') sidebarEl.hidePages(hidden);
  }

  // ── doLogin ───────────────────────────────────────────────────────────────────
  async function doLogin(providedLogin, providedPassword) {
    var loginComp = document.getElementById('login');
    var credentials = {
      login: providedLogin || '',
      password: providedPassword || ''
    };
    if (!providedLogin && loginComp && typeof loginComp.getCredentials === 'function') {
      credentials = loginComp.getCredentials();
    } else {
      var loginUserInput = document.getElementById('login-user');
      var loginPassInput = document.getElementById('login-pass');
      credentials.login = loginUserInput ? loginUserInput.value.trim().toLowerCase() : '';
      credentials.password = loginPassInput ? loginPassInput.value : '';
    }

    var login = credentials.login.trim().toLowerCase();
    var senha = credentials.password;
    var setError = function (message) {
      if (loginComp && typeof loginComp.setError === 'function') {
        loginComp.setError(message);
      } else {
        var legacyLoginError = document.getElementById('login-error');
        if (legacyLoginError) legacyLoginError.textContent = message || '';
      }
    };

    setError('');

    if (!login || !senha) {
      setError('Preencha login e senha.');
      return false;
    }

    if (!global.dbReady && typeof global.initDB === 'function') {
      global.dbReady = global.initDB();
    }
    if (global.dbReady && typeof global.dbReady.then === 'function') {
      await global.dbReady;
    }

    try {
      var user = await global.dbGet('usuarios', login);
      if (!user || user.senha !== senha) {
        setError('Login ou senha incorretos.');
        return false;
      }

      var perfil = await global.dbGet('perfis_acesso', user.perfilId);

      // Atualiza a variável local do closure (todas as funções a veem corretamente)
      currentUser = {
        login:      user.login,
        nome:       user.nome || user.login,
        perfilId:   user.perfilId,
        perfilNome: user.perfilNome || user.perfilId,
        fullAccess: perfil ? (perfil.fullAccess || false) : (user.perfilId === 'supervisor'),
        permissoes: perfil ? (perfil.permissoes || {}) : {},
        isAdmin:    user.isAdmin || false,
        entityType: user.entityType || null,
        entityId:   user.entityId   || null,
        entityNome: user.entityNome || null,
      };

      // Sincroniza window.currentUser para o código inline que lê a referência global
      global.currentUser = currentUser;

      // Atualiza o Web Component <db-sidebar>
      var sidebarEl = document.getElementById('sidebar');
      if (sidebarEl && typeof sidebarEl.setUser === 'function') {
        sidebarEl.setUser({ nome: currentUser.nome, perfil: currentUser.perfilNome });
      }

      applyNavPermissions();

      if (loginComp) {
        loginComp.style.display = 'none';
      }
      document.getElementById('main').style.display = '';
      if (sidebarEl) sidebarEl.style.display = '';

      await auditLog('login', 'Acesso realizado pelo perfil ' + currentUser.perfilNome);

      // navigate está disponível em window (registrado por router.js)
      if (typeof global.navigate === 'function') global.navigate('dashboard');

      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao conectar ao banco de dados.');
      return false;
    }
  }

  // ── doLogout ──────────────────────────────────────────────────────────────────
  function doLogout() {
    if (currentUser) auditLog('logout', 'Sessão encerrada');
    currentUser = null;
    global.currentUser = null;

    var loginComp = document.getElementById('login');
    if (loginComp && typeof loginComp.reset === 'function') {
      loginComp.reset();
      loginComp.style.display = 'flex';
    } else {
      var loginUserInput = document.getElementById('login-user');
      if (loginUserInput) loginUserInput.value = '';
      var loginPassInput = document.getElementById('login-pass');
      if (loginPassInput) loginPassInput.value = '';
      var legacyLoginError = document.getElementById('login-error');
      if (legacyLoginError) legacyLoginError.textContent = '';
      var legacyLoginScreen = document.getElementById('login-screen');
      if (legacyLoginScreen) legacyLoginScreen.style.display = 'flex';
    }

    document.getElementById('main').style.display = 'none';

    var sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) {
      sidebarEl.style.display = 'none';
      if (typeof sidebarEl.setUser === 'function') sidebarEl.setUser({ nome: '—', perfil: '—' });
    }
  }

  // ── initDefaultAdmin ──────────────────────────────────────────────────────────
  async function initDefaultAdmin() {
    var existing = await global.dbGet('usuarios', 'admin');
    if (!existing) {
      await global.dbAdd('usuarios', {
        login:      'admin',
        nome:       'Administrador',
        senha:      'qwerty@DB',
        perfilId:   'supervisor',
        perfilNome: 'Supervisor',
        isAdmin:    true,
      });
    }
  }

  // ── Registro em window ────────────────────────────────────────────────────────
  global.currentUser          = currentUser;   // null inicial; atualizado em doLogin/doLogout
  global.auditLog             = auditLog;
  global.applyDataFilter      = applyDataFilter;
  global.rlsBanner            = rlsBanner;
  global.canAccess            = canAccess;
  global.canBtn               = canBtn;
  global.applyNavPermissions  = applyNavPermissions;
  global.doLogin              = doLogin;
  global.doLogout             = doLogout;
  global.initDefaultAdmin     = initDefaultAdmin;

}(window));
