export async function onRequest(context) {
  const url = new URL(context.request.url);
  let slug = url.pathname.replace(/^\/pages\/?/, "").replace(/\/$/, "");

  if (!slug || slug === "index" || slug === "index.html") {
    return Response.redirect(`${url.origin}/`, 301);
  }

  slug = slug.replace(/\.html$/i, "");
  return Response.redirect(`${url.origin}/${slug}${url.search}`, 301);
}
