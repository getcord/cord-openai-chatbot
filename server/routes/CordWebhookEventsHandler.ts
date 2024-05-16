import type { Request as ExpressRequest, Response } from 'express';
import jsonStableStringify = require('fast-json-stable-stringify');

import {
  bots,
} from '../lib/bot';

/**
 * https://docs.cord.com/reference/events-webhook
 */
export default async function CordWebhookEventsHandler(
  req: ExpressRequest,
  res: Response,
) {
  res.status(200);
  res.send();

  console.log('--- Cord Webhook Firing ---');

  const r = new Request('http://localhost', {
    body: jsonStableStringify(req.body),
    method: req.method,
    headers: Object.entries(req.headers as Record<string, string>),
  });
  await bots.webhookReceived(r);
}
