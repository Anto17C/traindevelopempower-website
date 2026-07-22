/* Train Develop Empower — Main JS v4 */
document.addEventListener('DOMContentLoaded', function () {

  // Mobile menu
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      var isOpen = nav.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
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
    var defaultButtonText = 'Submit Training Request';
    var sourceField = form.querySelector('[name="LEADCF3"]');

    function hideFormMessages() {
      if (success) success.style.display = 'none';
      if (errorBox) {
        errorBox.textContent = '';
        errorBox.style.display = 'none';
      }
    }

    function showFormError(message) {
      if (success) success.style.display = 'none';
      if (errorBox) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    function setSourcePage() {
      if (!sourceField) return;
      sourceField.value = window.location.href;
      sourceField.setAttribute('value', window.location.href);
    }

    setSourcePage();

    form.addEventListener('submit', function (e) {
      if (!form.reportValidity()) {
        e.preventDefault();
        return;
      }

      var honeypot = form.querySelector('[name="aG9uZXlwb3Q"]');
      if (honeypot && honeypot.value) {
        e.preventDefault();
        showFormError('We could not send your request. Please try again or email us directly at iht@traindevelopempower.com.');
        return;
      }

      setSourcePage();
      hideFormMessages();
      btn.textContent = 'Sending...';
      btn.disabled = true;

      window.setTimeout(function () {
        form.reset();
        setSourcePage();
        if (success) {
          success.style.display = 'block';
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        btn.textContent = 'Message Sent!';
        // CONVERSION: Proposal form submitted
        pushEvent('proposal_form_submit', { method: 'zoho_web_to_lead' });

        window.setTimeout(function () {
          btn.disabled = false;
          btn.textContent = defaultButtonText;
        }, 1800);
      }, 900);
    });
  }

  // Back to top button
  var backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.innerHTML = '↑';
  document.body.appendChild(backToTop);

  function toggleBackToTop() {
    backToTop.classList.toggle('show', window.scrollY > 500);
  }

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  // ── CONVERSION TRACKING ──────────────────────────────────────────
  window.dataLayer = window.dataLayer || [];
  function pushEvent(eventName, params) {
    window.dataLayer.push(Object.assign({ event: eventName, page_path: window.location.pathname }, params || {}));
  }

  // WhatsApp clicks
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (el) {
    el.addEventListener('click', function () {
      pushEvent('whatsapp_click', { link_text: el.innerText.trim() || 'WhatsApp' });
    });
  });

  // Call clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
    el.addEventListener('click', function () {
      pushEvent('call_click', { phone_number: el.getAttribute('href').replace('tel:', '') });
    });
  });

  // Email clicks
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (el) {
    el.addEventListener('click', function () {
      pushEvent('email_click', { email_address: el.getAttribute('href').replace('mailto:', '') });
    });
  });

  // Brochure / outline downloads
  document.querySelectorAll('a[href$=".pdf"][download]').forEach(function (el) {
    el.addEventListener('click', function () {
      var fileName = el.getAttribute('href').split('/').pop();
      pushEvent('brochure_download', { file_name: fileName, link_text: el.innerText.trim() });
    });
  });

  // Request Proposal CTA clicks (links to contact page, not the form itself)
  document.querySelectorAll('a.btn-sidebar-gold, a.cta-pill-gold, a.nav-cta').forEach(function (el) {
    el.addEventListener('click', function () {
      pushEvent('proposal_cta_click', { link_text: el.innerText.trim(), page_path: window.location.pathname });
    });
  });

});
