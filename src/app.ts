import bodyParser from 'body-parser';
import express from 'express';
// import path from 'path';
import { configuration } from '../configuration';
import { enumerateError } from './common/ObjectUtil';
import JSON from 'circular-json';

export function asyncHandler(handler: (request, response) => Promise<any>) {
  return async (request, response, next) => {
    try {
      const responseObject = await handler(request, response);
      response.status(responseObject.code).json(responseObject.payload);
      next();
    } catch (error) {
      next(error);
    } finally {
      console.log(`Request handling complete.`);
    }
  };
}

const router = express.Router();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Health Check endpoint
router.get(
  '/status',
  asyncHandler(async () => {
    const ok = {
      code: 200,
      payload: { status: 'ok' },
    };
    return ok;
  }),
);

router.post(
  '/text-analyze',
  asyncHandler(async (request) => {
    console.log(`Got analyze request: ${JSON.stringify(request, null, 2)}`);
    const ok = {
      code: 200,
      payload: { status: 'ok' },
    };
    return ok;
  }),
);

export const expressApp = express();
expressApp.use('/', router);

// Start the local server
console.log(`Starting API...`);
try {
  const port = configuration.port;
  expressApp.listen(port, () => {
    console.log(`API Listening on port: ${port}`);
  });
} catch (error) {
  console.log(`Error caught!`);
  console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
}
