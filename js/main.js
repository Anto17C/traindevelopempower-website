/* Train Develop Empower — Main JS v3 */
document.addEventListener('DOMContentLoaded', function () {

  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }

  // Course search + filter
  var searchInput = document.getElementById('courseSearch');
  var filterBtns = document.querySelectorAll('.filter-btn');
  var rows = document.querySelectorAll('.course-row');

  if (rows.length) {
    var activeFilter = 'all';

    function applyFilter() {
      var q = searchInput ? searchInput.value.toLowerCase().trim() : '';
      rows.forEach(function (row) {
        var matchQ = !q ||
          (row.dataset.code || '').toLowerCase().includes(q) ||
          (row.dataset.title || '').toLowerCase().includes(q) ||
          (row.dataset.cat || '').toLowerCase().includes(q) ||
          (row.dataset.desc || '').toLowerCase().includes(q);
        var matchF = activeFilter === 'all' ||
          (row.dataset.cat || '').toLowerCase().replace(/[^a-z]/g,'').includes(activeFilter);
        row.classList.toggle('hidden-row', !(matchQ && matchF));
      });
    }

    if (searchInput) searchInput.addEventListener('input', applyFilter);

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        applyFilter();
      });
    });
  }

  // Contact form
  var form = document.getElementById('proposalForm');
  if (form) {
    var btn = form.querySelector('.form-submit');
    var success = document.getElementById('formSuccess');
    var errorBox = document.getElementById('formError');
    var turnstileId = null;
    var defaultButtonText = 'Submit Training Request';

    function showFormError(message) {
      if (success) success.style.display = 'none';
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
      }
    }

    function resetTurnstile() {
      if (window.turnstile && turnstileId !== null) window.turnstile.reset(turnstileId);
    }

    fetch('/api/form-config', { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('Form configuration unavailable');
        return response.json();
      })
      .then(function (config) {
        if (!config.siteKey) throw new Error('Form configuration unavailable');
        if (!window.turnstile) throw new Error('Verification service unavailable');
        window.turnstile.ready(function () {
          turnstileId = window.turnstile.render('#turnstileWidget', {
            sitekey: config.siteKey,
            theme: 'light',
            callback: function () { btn.disabled = false; },
            'expired-callback': function () { btn.disabled = true; },
            'error-callback': function () {
              btn.disabled = true;
              showFormError('Verification could not load. Please refresh the page or email us directly.');
            }
          });
        });
      })
      .catch(function () {
        showFormError('The online form is temporarily unavailable. Please email iht@traindevelopempower.com.');
      });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (success) success.style.display = 'none';
      if (errorBox) errorBox.style.display = 'none';
      btn.textContent = 'Sending...';
      btn.disabled = true;
      try {
        var resp = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        var result = await resp.json().catch(function () { return {}; });
        if (resp.ok && result.success) {
          form.reset();
          if (success) success.style.display = 'block';
          btn.textContent = 'Message Sent!';
          resetTurnstile();
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          showFormError(result.message || 'We could not send your request. Please try again or email us directly.');
          btn.textContent = defaultButtonText;
          resetTurnstile();
        }
      } catch (err) {
        showFormError('We could not connect to the form service. Please try again or email us directly.');
        btn.textContent = defaultButtonText;
        resetTurnstile();
      }
    });
  }
});
