import bodyParser from 'body-parser';
import express from 'express';
// import path from 'path';
import { configuration } from '../configuration';
import { enumerateError, notEmpty } from './common/ObjectUtil';
import JSON from 'circular-json';
import { TwilioMessage } from './twilio/TwilioMessage';
import { saveFile, sendSms } from './twilio/Twilio';
import { getText } from './ocr/Ocr';
import { search } from './ocr/Search';
import middleware from 'aws-serverless-express/middleware';

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
router.use(middleware.eventContext());

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
    const twilioMessage: TwilioMessage = request.body;
    try {
      if (notEmpty(twilioMessage.MediaUrl0)) {
        await handleImage(twilioMessage);
      } else {
        await handleText(twilioMessage);
      }

    } catch (error) {
      const errorMessage = `Encountered an error, sorry =(\n ${JSON.stringify(enumerateError(error), null, 2)}`;
      console.log(errorMessage);
      await sendSms(twilioMessage.From, errorMessage, configuration);
    }
    const ok = {
      code: 200,
      payload: { status: 'ok' },
    };
    return ok;
  }),
);

export async function handleText(twilioMessage: TwilioMessage) {
  await detectBadIngredients(twilioMessage.From, twilioMessage.Body, twilioMessage.Body);
}

export async function handleImage(twilioMessage: TwilioMessage) {
  const basePath = `${__dirname}/../media`;
  console.log(`Saving file...`);
  const savePath = await saveFile(twilioMessage, basePath);
  console.log(`Running OCR...`);
  const textInImage = await getText(
    savePath,
    configuration.badEnglishIngredientsPath,
    configuration.badChineseIngredientsPath,
  );
  const detectedTextMessage = `Detected Text: ${JSON.stringify(textInImage, null, 2)}`;
  console.log(detectedTextMessage);
  await sendSms(twilioMessage.From, detectedTextMessage, configuration);
  await detectBadIngredients(twilioMessage.From, textInImage.englishText, textInImage.chineseText);
}

export async function detectBadIngredients(phoneNumber: string, englishText, chineseText) {
  console.log(`Searching text...`);
  const englishSearchPromise = search(configuration.badEnglishIngredients, englishText);
  const chineseSearchPromise = search(configuration.badChineseIngredients, chineseText);
  const searchResults =
    ["Search Results:\n"]
      .concat(await englishSearchPromise)
      .concat(await chineseSearchPromise);
  const stringResults = searchResults.join('\n\n');
  console.log(`Sending result...`);
  await sendSms(phoneNumber, stringResults, configuration);
}

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
