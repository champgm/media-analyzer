import { Configuration } from '../../configuration';
import vision from '@google-cloud/vision';
import { enumerateError } from 'src/common/ObjectUtil';

export class Vision {
  public async getText(fileBytes: any, configuration: Configuration) {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: configuration.gcloudJsonPath,
    });
    const visionRequest = {
      image: { content: fileBytes },
      features: [{ type: vision.types.Feature.Type.TEXT_DETECTION }],
    };
    try {
      const visionResponse = await client.annotateImage(visionRequest);
      console.log(`Got vision response: ${JSON.stringify(visionResponse, null, 2)}`);
    } catch (error) {
      console.log(`An error ocurred with the Vision request: `);
      console.log(`${JSON.stringify(enumerateError(error), null, 2)}`);
    }
  }
}
