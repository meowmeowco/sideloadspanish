import { AutoRouter } from 'itty-router';
import { withAuth } from './middleware/auth';
import { handleGetSync, handlePutSync } from './routes/sync';
import { handleValidate } from './routes/validate';
import { handleWebhook } from './routes/webhook';
import { handleCreateKey } from './routes/admin';
import { handleClaim } from './routes/claim';
import { handleThankYou } from './routes/pages';
import { handleRotate } from './routes/rotate';
import { handleRecover } from './routes/recover';

const router = AutoRouter();

router
  .get('/sync', withAuth, handleGetSync)
  .put('/sync', withAuth, handlePutSync)
  .post('/rotate', withAuth, handleRotate)
  .post('/recover', handleRecover)
  .get('/claim', handleClaim)
  .get('/thank-you', handleThankYou)
  .post('/validate', handleValidate)
  .post('/webhook', handleWebhook)
  .post('/admin/create-key', handleCreateKey)
  .all('*', () => new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  }));

//@ts-ignore
addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(router.fetch(event.request));
});
