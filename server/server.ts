import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import * as cors from 'cors';

import InitializeCordChatbotHandler from './routes/InitializeChatbotHandler';
import SendFirstMessageHandler from './routes/SendFirstMessageHandler';
import CordWebhookEventsHandler from './routes/CordWebhookEventsHandler';
import { checkEnvVars } from './scripts/lib/env';

dotenv.config();

export const PORT = parseInt(process.env.PORT as string, 10);
export const HOST = process.env.HOST as string;
export const CORD_WEBHOOK_PATH = process.env.CORD_WEBHOOK_PATH as string;

checkEnvVars()
  .then(() => {
    const app = express();

    app.use(express.json({ limit: '100kb' }));
    app.use(cors());
    app.use(express.static('public'));

    // Sets the response headers to routes below
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.set('Content-Type', 'application/json');
      next();
    });

    app.get('/', (_, res) => {
      res.status(418);
      res.send('Im a teapot');
    });

    // Returns the clientAuthToken to set this on the Cord provider on the client side
    app.post('/initialize-chatbot', InitializeCordChatbotHandler);

    app.post('/send-first-message', SendFirstMessageHandler);

    // Generic route for samples applications, this can be changed via the
    // console.cord.com for non-sample applications
    app.post('/cord-webhook', CordWebhookEventsHandler);

    app.listen(PORT, () => {
      console.log(
        '--- Server started ---' +
          '\n' +
          `Cord AI Chatbot App listening on ${HOST}:${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.log('--- Server did not start ---' + '\n' + error.message);
    process.exit();
  });
