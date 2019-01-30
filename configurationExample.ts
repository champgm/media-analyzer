
export interface Configuration {
  port: number;
  gcloudJsonPath: string;
  badIngredients: string[];
  twilio: {
    number: string;
    projectName: string;
    accountSid: string;
    authToken: string;
  };
}

export const configuration: Configuration = {
  gcloudJsonPath: `${__dirname}/gcloud.json`,
  badIngredients:[
    'meat',
    'parabens',
    'gluten and stuff like that',
  ],
  port: 8080,
  twilio: {
    number: '+15551235555',
    projectName: 'your project',
    accountSid: 'abc123',
    authToken: '123abc',
  },
};
