/* Train Develop Empower: Scheduled Public Training seat requests.
   Web3Forms only. No CRM. No personal details are sent to analytics. */
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];
  function pushEvent(name, params) {
    window.dataLayer.push(Object.assign({ event: name, page_path: window.location.pathname }, params || {}));
  }

  // CTA click tracking (works on the hub and the course page).
  document.addEventListener('click', function (e) {
    var cta = e.target.closest ? e.target.closest('[data-seat-cta]') : null;
    if (!cta) return;
    pushEvent('seat_request_cta_click', {
      session_id: cta.getAttribute('data-session') || '',
      course: cta.getAttribute('data-course') || '',
      city: cta.getAttribute('data-city') || ''
    });
  });

  var form = document.getElementById('seatRequestForm');
  if (!form) return;

  var radios = Array.prototype.slice.call(form.querySelectorAll('input[name="session"]'));
  var summary = document.getElementById('seatSelectedSummary');
  var errorBox = document.getElementById('seatFormError');
  var successBox = document.getElementById('seatFormSuccess');
  var submitBtn = document.getElementById('seatSubmit');
  var defaultLabel = submitBtn.textContent;
  var sourceField = form.querySelector('[name="Source Page"]');
  var previewBox = document.getElementById('seatFormPreview');

  // Live submissions only from the production site. Localhost and preview hosts run a dry run,
  // so previews never email the TDE inbox.
  var host = window.location.hostname;
  var isLive = host === 'traindevelopempower.com' || host === 'www.traindevelopempower.com';

  function isOpen(radio) { return radio.getAttribute('data-open') === 'true'; }
  function selected() { return radios.filter(function (r) { return r.checked; })[0] || null; }

  function updateSummary() {
    var r = selected();
    if (!r) {
      summary.textContent = 'No session selected. Please choose a session above.';
      return;
    }
    summary.textContent = 'Selected session: ' + r.getAttribute('data-city') + ', ' +
      r.getAttribute('data-dates') + ' (' + r.getAttribute('data-status') + ')';
  }

  // The Houston session moved from January to March 2027. Old links keep preselecting Houston,
  // but new inquiries always carry the current session ID.
  var LEGACY_SESSIONS = { 'ppera-hou-20270125': 'ppera-hou-20270315' };

  function selectSession(id) {
    id = LEGACY_SESSIONS[id] || id;
    var match = radios.filter(function (r) { return r.value === id && isOpen(r); })[0];
    if (!match) return false;
    match.checked = true;
    updateSummary();
    return true;
  }

  radios.forEach(function (r) {
    if (!isOpen(r)) r.disabled = true;
    r.addEventListener('change', updateSummary);
  });

  // Session buttons: select the right session and let the anchor scroll to the form.
  Array.prototype.forEach.call(document.querySelectorAll('[data-seat-cta][data-session]'), function (cta) {
    cta.addEventListener('click', function () { selectSession(cta.getAttribute('data-session')); });
  });

  // Deep link: ?session=<id>
  var fromUrl = null;
  try { fromUrl = new URLSearchParams(window.location.search).get('session'); } catch (err) { fromUrl = null; }
  if (fromUrl) selectSession(fromUrl);
  updateSummary();

  if (sourceField) sourceField.value = window.location.origin + window.location.pathname;

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.style.display = 'block';
  }
  function clearMessages() {
    if (previewBox) { previewBox.style.display = 'none'; previewBox.textContent = ''; }
    errorBox.style.display = 'none';
    errorBox.textContent = '';
    successBox.style.display = 'none';
  }

  function val(name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearMessages();

    var session = selected();
    if (!session) {
      showError('Please choose a session before sending your seat request.');
      var first = radios[0];
      if (first) first.focus();
      return;
    }
    if (!form.reportValidity()) return;

    // Honeypot
    if (form.elements.botcheck && form.elements.botcheck.checked) return;

    var seats = parseInt(val('Seats'), 10);
    var city = session.getAttribute('data-city');
    var dates = session.getAttribute('data-dates');
    var course = form.getAttribute('data-course');
    var sessionId = session.value;
    var fullName = val('Name');
    var company = val('Company');
    var email = val('Email');
    var country = val('Country');
    var message = val('Message');
    var source = val('Source Page') || window.location.href;

    var details = [
      'New public training SEAT REQUEST (not a paid booking)',
      '',
      'Course: ' + course,
      'City: ' + city,
      'Dates: ' + dates,
      'Session ID: ' + sessionId,
      'Session status at time of request: ' + session.getAttribute('data-status'),
      'Seats requested: ' + seats,
      '',
      'Name: ' + fullName,
      'Company: ' + company,
      'Work email: ' + email,
      'Country: ' + country,
      'Source page: ' + source,
      '',
      'Message:',
      message || '(No message provided)'
    ].join('\n');

    var payload = new FormData();
    payload.append('access_key', val('access_key'));
    payload.append('subject', 'Seat request: ' + city + ' ' + dates + ' - ' + seats + ' seat' + (seats === 1 ? '' : 's') + ' - ' + sessionId);
    payload.append('from_name', 'TDE Public Training Website');
    payload.append('name', fullName);
    payload.append('email', email);
    payload.append('message', details);
    payload.append('Course', course);
    payload.append('City', city);
    payload.append('Dates', dates);
    payload.append('Session ID', sessionId);
    payload.append('Seats Requested', String(seats));
    payload.append('Company', company);
    payload.append('Country', country);
    payload.append('Source Page', source);

    if (!isLive) {
      if (window.console && console.info) console.info('Preview dry run, seat request not sent:', Object.fromEntries(payload.entries()));
      if (previewBox) {
        previewBox.textContent = 'Preview mode: this seat request was validated but not sent. Live submissions work only on traindevelopempower.com.';
        previewBox.style.display = 'block';
        previewBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    fetch(form.action, { method: 'POST', body: payload, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data || !data.success) throw new Error('rejected');
        pushEvent('seat_request_submit', { session_id: sessionId, course: course, city: city, seats_requested: seats });
        var keep = sessionId;
        form.reset();
        selectSession(keep);
        if (sourceField) sourceField.value = window.location.origin + window.location.pathname;
        successBox.style.display = 'block';
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () {
        showError('We could not send your seat request. Please try again, or email iht@traindevelopempower.com with the session and number of seats.');
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = defaultLabel;
      });
  });
})();
