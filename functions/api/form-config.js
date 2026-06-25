export async function onRequestGet(context) {
  const siteKey = context.env.TURNSTILE_SITE_KEY;
  if (!siteKey) {
    return Response.json({ message: 'Form configuration unavailable.' }, { status: 503 });
  }
  return Response.json(
    { siteKey },
    { headers: { 'Cache-Control': 'public, max-age=300' } }
  );
}
