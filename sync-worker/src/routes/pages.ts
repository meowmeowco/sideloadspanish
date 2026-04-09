// @ts-ignore — esbuild imports .html as text
import thankYouHtml from '../../public/thank-you.html';

export function handleThankYou(_request: Request): Response {
  return new Response(thankYouHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
