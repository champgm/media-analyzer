import { TwilioMessage } from './TwilioMessage';
import v4 from 'uuid/v4';
import requestPromise from 'request-promise-native';
import JSON from 'circular-json';
import { enumerateError } from '../common/ObjectUtil';
import fs from 'fs';
import Twilio from 'twilio';
import { Configuration } from 'configuration';

export async function saveFile(twilioMessage: TwilioMessage, basePath: string) {
  const mediaUrl: string = twilioMessage.MediaUrl0;

  let fileBytes;
  try {
    fileBytes = await downloadFile(mediaUrl);
  } catch (error) {
    console.log(`Error ocurred while downloading file: ${JSON.stringify(error)}`);
    console.log(`Trimmed error: ${JSON.stringify(enumerateError(error))}`);
  }

  const mediaType: string = twilioMessage.MediaContentType0;
  const extension = mediaType.split('/')[1];
  const fileName = v4();
  const savePath = `${basePath}/${fileName}.${extension}`;

  fs.writeFileSync(savePath, fileBytes);
  console.log(`File saved to '${savePath}'`);
  return savePath;
}

async function downloadFile(url: string) {
  const options = {
    url,
    encoding: null,
    resolveWithFullResponse: true,
  };
  const response = await requestPromise.get(options);
  return response.body;
}

export async function sendSms(number: string, message: string, configuration: Configuration) {
  const twilioClient = Twilio(configuration.twilio.accountSid, configuration.twilio.authToken);
  try {
    console.log(`Sending SMS to ${number}...`);
    await twilioClient.messages.create({
      body: message,
      to: number,
      from: configuration.twilio.number,
    });
  } catch (error) {
    console.log(`Error ocurred while sending Twilio SMS`);
    console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
  }
}
