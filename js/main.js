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
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = form.querySelector('.form-submit');
      var success = document.getElementById('formSuccess');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      try {
        var resp = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        if (resp.ok) {
          form.reset();
          if (success) success.style.display = 'block';
          btn.textContent = 'Message Sent!';
        } else {
          btn.textContent = 'Error — Try again';
          btn.disabled = false;
        }
      } catch (err) {
        btn.textContent = 'Error — Try again';
        btn.disabled = false;
      }
    });
  }
});
