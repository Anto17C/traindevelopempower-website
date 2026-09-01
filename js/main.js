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
    var categoryField = document.getElementById('category');
    var courseInterestField = document.getElementById('courseInterest');
    var courseOptions = document.getElementById('courseInterestOptions');
    var courseOtherField = document.getElementById('courseInterestOther');
    var crmEndpoint = 'https://crm.zoho.com/crm/WebToLeadForm';
    var courseCatalog = {
      'Leadership & Management': [
        'Leadership Excellence for Managers',
        'Coaching & Mentoring for Performance',
        'Communication & Influencing Skills',
        'Building High-Performing Teams',
        'Emotional Intelligence for Leaders'
      ],
      'Procurement & Contracts': [
        'Strategic Sourcing & Category Management',
        'Supplier Relationship Management',
        'Contract Management & Administration',
        'Procurement Best Practices & Commercial Excellence',
        'Negotiation Skills for Procurement Professionals'
      ],
      'Supply Chain & Logistics': [
        'Supply Chain Resilience & Risk Management',
        'Strategic Procurement & Vendor Management',
        'Inventory Optimization & Warehouse Management',
        'Logistics & Distribution Management Excellence',
        'Demand Planning & Supply Forecasting'
      ],
      'Operations & Productivity': [
        'Operational Excellence & Continuous Improvement',
        'Lean Principles for Business Performance',
        'Process Improvement & Performance Management',
        'Productivity Improvement Strategies',
        'Business Process Optimization'
      ],
      'Maintenance & Reliability': [
        'Maintenance Planning & Scheduling Excellence',
        'Reliability-Centered Maintenance (RCM)',
        'Root Cause Analysis & Failure Investigation',
        'Asset Management & Lifecycle Optimization',
        'Shutdown, Turnaround & Outage Management'
      ],
      'HSE & Compliance': [
        'Health, Safety & Environmental Management',
        'Risk Assessment & Hazard Identification',
        'Incident Investigation & Root Cause Analysis',
        'Compliance Management & Regulatory Requirements',
        'Building a Positive Safety Culture'
      ],
      'Security & Risk': [
        'Enterprise Risk Management',
        'Business Continuity & Crisis Management',
        'Security Risk Assessment & Mitigation',
        'Corporate Security Management',
        'Incident Investigation & Response'
      ],
      'Digital Transformation, AI & Emerging Technologies': [
        'Artificial Intelligence for Business Professionals',
        'Generative AI & Prompt Engineering for the Workplace',
        'Digital Transformation Strategy & Innovation',
        'Blockchain Technology & Business Applications',
        'Data Analytics & AI-Driven Decision Making'
      ]
    };

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

    function decodeText(value) {
      var textarea = document.createElement('textarea');
      textarea.innerHTML = value || '';
      return textarea.value.trim();
    }

    function fieldValue(formData, name) {
      return decodeText((formData.get(name) || '').toString());
    }

    function getSelectedCourses() {
      if (!courseOptions) return [];
      return Array.prototype.slice.call(courseOptions.querySelectorAll('input[type="checkbox"]:checked'))
        .map(function (input) { return decodeText(input.value); })
        .filter(Boolean);
    }

    function syncCourseInterest() {
      if (!courseInterestField) return;
      var selectedCourses = getSelectedCourses();
      var otherCourse = courseOtherField ? decodeText(courseOtherField.value) : '';
      if (otherCourse) selectedCourses.push(otherCourse);
      courseInterestField.value = selectedCourses.join('; ');
      courseInterestField.setAttribute('value', courseInterestField.value);
    }

    function renderCourseOptions() {
      if (!courseOptions || !categoryField) return;
      var category = decodeText(categoryField.value);
      var courses = courseCatalog[category] || [];
      courseOptions.innerHTML = '';

      if (!courses.length) {
        var placeholder = document.createElement('p');
        placeholder.className = 'course-interest-placeholder';
        placeholder.textContent = category === 'Other / Custom Training'
          ? 'Use the custom programme field below.'
          : 'Select a category above to choose one or more courses.';
        courseOptions.appendChild(placeholder);
        syncCourseInterest();
        return;
      }

      courses.forEach(function (course, index) {
        var id = 'courseInterestOption' + index;
        var label = document.createElement('label');
        label.className = 'course-interest-choice';
        label.setAttribute('for', id);

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.value = course;
        checkbox.addEventListener('change', syncCourseInterest);

        var text = document.createElement('span');
        text.textContent = course;

        label.appendChild(checkbox);
        label.appendChild(text);
        courseOptions.appendChild(label);
      });

      syncCourseInterest();
    }

    function buildWeb3FormsPayload(formData) {
      var firstName = fieldValue(formData, 'First Name');
      var lastName = fieldValue(formData, 'Last Name');
      var fullName = [firstName, lastName].filter(Boolean).join(' ');
      var organization = fieldValue(formData, 'Company');
      var email = fieldValue(formData, 'Email');
      var phone = fieldValue(formData, 'Phone');
      var mobile = fieldValue(formData, 'Mobile');
      var jobTitle = fieldValue(formData, 'Designation');
      var category = fieldValue(formData, 'LEADCF6');
      var courses = fieldValue(formData, 'LEADCF4');
      var participants = fieldValue(formData, 'LEADCF52');
      var deliveryMethod = fieldValue(formData, 'LEADCF7');
      var location = fieldValue(formData, 'LEADCF1');
      var timeframe = fieldValue(formData, 'LEADCF2');
      var sourcePage = fieldValue(formData, 'LEADCF3');
      var message = fieldValue(formData, 'Description');
      var subjectLead = category && category !== '-None-' ? category : 'Training';
      var subjectTail = location || organization || 'Train Develop Empower';

      var details = [
        'New training proposal request from Train Develop Empower',
        '',
        'Name: ' + (fullName || '(Not provided)'),
        'Organization: ' + (organization || '(Not provided)'),
        'Job title: ' + (jobTitle || '(Not provided)'),
        'Email: ' + (email || '(Not provided)'),
        'Phone: ' + (phone || '(Not provided)'),
        'Mobile / WhatsApp: ' + (mobile || '(Not provided)'),
        'Training category: ' + (category || '(Not selected)'),
        'Course / programme interest: ' + (courses || '(Not selected)'),
        'Estimated participants: ' + (participants || '(Not provided)'),
        'Preferred delivery method: ' + (deliveryMethod || '(Not selected)'),
        'Preferred training location: ' + (location || '(Not provided)'),
        'Preferred training date / timeframe: ' + (timeframe || '(Not provided)'),
        'Source page: ' + (sourcePage || window.location.href),
        '',
        'Training requirements:',
        message || '(No message provided)'
      ].join('\n');

      var payload = new FormData();
      payload.append('access_key', fieldValue(formData, 'access_key'));
      payload.append('subject', subjectLead + ' Proposal Request - ' + subjectTail);
      payload.append('from_name', 'Train Develop Empower Website');
      payload.append('name', fullName || organization || 'Website visitor');
      payload.append('email', email);
      payload.append('phone', phone || mobile);
      payload.append('message', details);
      payload.append('Organization', organization);
      payload.append('Job Title', jobTitle);
      payload.append('Training Category', category);
      payload.append('Course / Programme Interest', courses);
      payload.append('Estimated Participants', participants);
      payload.append('Preferred Delivery Method', deliveryMethod);
      payload.append('Preferred Training Location', location);
      payload.append('Preferred Training Date / Timeframe', timeframe);
      payload.append('Source Page', sourcePage || window.location.href);
      return payload;
    }

    setSourcePage();
    renderCourseOptions();
    if (categoryField) categoryField.addEventListener('change', renderCourseOptions);
    if (courseOtherField) courseOtherField.addEventListener('input', syncCourseInterest);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) {
        return;
      }

      var honeypot = form.querySelector('[name="aG9uZXlwb3Q"]');
      if (honeypot && honeypot.value) {
        showFormError('We could not send your request. Please try again or email us directly at iht@traindevelopempower.com.');
        return;
      }

      setSourcePage();
      syncCourseInterest();
      hideFormMessages();
      btn.textContent = 'Sending...';
      btn.disabled = true;
      var formData = new FormData(form);
      var emailData = buildWeb3FormsPayload(formData);
      var crmData = new FormData(form);
      crmData.delete('access_key');
      crmData.delete('subject');
      crmData.delete('from_name');

      var emailSubmission = fetch(form.action, {
        method: 'POST',
        body: emailData,
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (!response.ok) throw new Error('Email submission failed');
        return response.json();
      }).then(function (data) {
        if (!data.success) throw new Error(data.message || 'Email submission failed');
        return data;
      });

      var crmSubmission = fetch(crmEndpoint, {
        method: 'POST',
        body: crmData,
        mode: 'no-cors',
        cache: 'no-cache'
      }).catch(function () {
        return null;
      });

      Promise.allSettled([emailSubmission, crmSubmission])
        .then(function (results) {
          if (results[0].status !== 'fulfilled') {
            throw results[0].reason || new Error('Email submission failed');
          }

          form.reset();
          setSourcePage();
          renderCourseOptions();
          if (success) {
            success.style.display = 'block';
            success.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          btn.textContent = 'Message Sent!';
          pushEvent('proposal_form_submit', { method: 'web3forms_with_crm_record' });
        })
        .catch(function () {
          showFormError('We could not send your request. Please try again or email us directly at iht@traindevelopempower.com.');
          btn.textContent = defaultButtonText;
        })
        .finally(function () {
          window.setTimeout(function () {
            btn.disabled = false;
            btn.textContent = defaultButtonText;
          }, 1800);
        });
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
