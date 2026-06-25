const ALLOWED_HOSTS = new Set([
  'traindevelopempower.com',
  'www.traindevelopempower.com',
  'traindevelopempower-website.pages.dev'
]);

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function field(form, name, maxLength) {
  return clean(form.get(name), maxLength);
}

export async function onRequestPost(context) {
  const request = context.request;
  const origin = request.headers.get('Origin');

  try {
    if (!origin || !ALLOWED_HOSTS.has(new URL(origin).hostname)) {
      return json({ success: false, message: 'This submission source is not allowed.' }, 403);
    }
  } catch {
    return json({ success: false, message: 'This submission source is not allowed.' }, 403);
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > 20000) {
    return json({ success: false, message: 'The request is too large.' }, 413);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, message: 'The submitted form could not be read.' }, 400);
  }

  if (field(form, 'website', 200)) {
    return json({ success: true });
  }

  const submission = {
    firstName: field(form, 'firstName', 80),
    lastName: field(form, 'lastName', 80),
    jobTitle: field(form, 'jobTitle', 120),
    organization: field(form, 'organization', 160),
    country: field(form, 'country', 100),
    email: field(form, 'email', 254),
    phone: field(form, 'phone', 40),
    category: field(form, 'category', 120),
    message: field(form, 'message', 5000)
  };

  const required = ['firstName', 'lastName', 'organization', 'country', 'email', 'message'];
  if (required.some(name => !submission[name])) {
    return json({ success: false, message: 'Please complete all required fields.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) {
    return json({ success: false, message: 'Please enter a valid email address.' }, 400);
  }

  const turnstileToken = field(form, 'cf-turnstile-response', 2048);
  if (!turnstileToken || !context.env.TURNSTILE_SECRET_KEY) {
    return json({ success: false, message: 'Please complete the verification and try again.' }, 400);
  }

  const verificationBody = new FormData();
  verificationBody.append('secret', context.env.TURNSTILE_SECRET_KEY);
  verificationBody.append('response', turnstileToken);
  verificationBody.append('remoteip', request.headers.get('CF-Connecting-IP') || '');

  let verification;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: verificationBody
    });
    verification = await response.json();
  } catch {
    return json({ success: false, message: 'Verification is temporarily unavailable. Please try again.' }, 503);
  }
  if (!verification.success || !ALLOWED_HOSTS.has(verification.hostname)) {
    return json({ success: false, message: 'Verification failed or expired. Please try again.' }, 400);
  }

  const accountId = context.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = context.env.CLOUDFLARE_EMAIL_API_TOKEN;
  if (!accountId || !apiToken) {
    console.error('Email Service environment variables are missing.');
    return json({ success: false, message: 'Email delivery is not configured yet.' }, 503);
  }

  const safe = Object.fromEntries(Object.entries(submission).map(([key, value]) => [key, escapeHtml(value)]));
  const fullName = `${submission.firstName} ${submission.lastName}`;
  const subjectOrganization = submission.organization.replace(/[\r\n]/g, ' ');
  const text = [
    'NEW TRAINING PROPOSAL REQUEST', '',
    `Name: ${fullName}`,
    `Job title: ${submission.jobTitle || 'Not provided'}`,
    `Organization: ${submission.organization}`,
    `Country: ${submission.country}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || 'Not provided'}`,
    `Training category: ${submission.category || 'Not specified'}`, '',
    'Requirements:', submission.message
  ].join('\n');

  const html = `
    <h2 style="color:#0A1628">New Training Proposal Request</h2>
    <table cellpadding="7" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      <tr><td><strong>Name</strong></td><td>${safe.firstName} ${safe.lastName}</td></tr>
      <tr><td><strong>Job title</strong></td><td>${safe.jobTitle || 'Not provided'}</td></tr>
      <tr><td><strong>Organization</strong></td><td>${safe.organization}</td></tr>
      <tr><td><strong>Country</strong></td><td>${safe.country}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${safe.email}">${safe.email}</a></td></tr>
      <tr><td><strong>Phone</strong></td><td>${safe.phone || 'Not provided'}</td></tr>
      <tr><td><strong>Category</strong></td><td>${safe.category || 'Not specified'}</td></tr>
    </table>
    <h3 style="color:#0A1628">Training Requirements</h3>
    <p style="white-space:pre-wrap;font-family:Arial,sans-serif">${safe.message}</p>`;

  let emailResponse;
  try {
    emailResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/email/sending/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: 'iht@traindevelopempower.com',
          from: 'website@traindevelopempower.com',
          subject: `Training Proposal Request — ${subjectOrganization}`,
          html,
          text
        })
      }
    );
  } catch (error) {
    console.error('Email request failed.', error);
    return json({ success: false, message: 'We could not send your request. Please try again shortly.' }, 502);
  }

  if (!emailResponse.ok) {
    console.error('Email Service rejected the request.', emailResponse.status, await emailResponse.text());
    return json({ success: false, message: 'We could not send your request. Please email us directly.' }, 502);
  }

  return json({ success: true, message: 'Your training request has been sent.' });
}
