import bodyParser from 'body-parser';
import express from 'express';
import JSON from 'circular-json';
import middleware from 'aws-serverless-express/middleware';
import morgan from 'morgan';

import { configuration } from '../configuration';
import { Configuration } from '../configurationExample';
import { enumerateError, notEmpty } from './common/ObjectUtil';
import { search } from './text/Search';
import { sendSms, getFileBytes } from './twilio/Twilio';
import { TwilioMessage } from './twilio/TwilioMessage';
import { Vision } from './text/Vision';

process.on('unhandledRejection', (error) => {
  console.log(`Unhandled error ocurred`);
  console.log(`${error}`);
  console.log(`${JSON.stringify(error)}`);
  console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
});

export function asyncHandler(handler: (request, response) => Promise<any>) {
  return async (request, response, next) => {
    try {
      console.log(`Received request: ${JSON.stringify(request, null, 2)}`);
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
        console.log(`Image URL found.`);
        await handleImageWithVision(twilioMessage, configuration);
      } else {
        console.log(`No image URL found, will analyze text.`);
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
  await detectBadIngredients(twilioMessage.From, twilioMessage.Body);
}

export async function handleImageWithVision(twilioMessage: TwilioMessage, configuration: Configuration) {
  console.log(`Downloading image...`);
  const fileBytes = await getFileBytes(twilioMessage);
  const visionOcr = new Vision();
  console.log(`Analyzing image...`);
  const textInImage = await visionOcr.getText(fileBytes, configuration);

  const detectedTextMessage = `Detected Text: ${textInImage}`;
  console.log(detectedTextMessage);
  await sendSms(twilioMessage.From, detectedTextMessage, configuration);
  await detectBadIngredients(twilioMessage.From, textInImage);
}

export async function detectBadIngredients(phoneNumber: string, text: string) {
  console.log(`Searching text...`);
  const searchResults = await search(configuration.badIngredients, text);

  let formattedResult = '\nSearch Results:';
  Object.keys(searchResults).forEach((badIngredient) => {
    formattedResult = `${formattedResult}\n==${badIngredient}==`;
    const ingredientResults = searchResults[badIngredient];
    ingredientResults.forEach((match) => {
      formattedResult = `${formattedResult}\n  ${match}\n`;
    });
  });

  console.log(`Sending result...`);
  await sendSms(phoneNumber, formattedResult, configuration);
}

export const expressApp = express();
expressApp.use('/', router);
expressApp.use(morgan('common'));
