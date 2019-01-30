import awsServerlessExpress from 'aws-serverless-express';
import { expressApp } from './app';

const server = awsServerlessExpress.createServer(expressApp);
export function handler(event, context, callback) {
  console.log(`Index handler invoked.`);
  awsServerlessExpress.proxy(server, event, context);
  console.log(`Index handler ended.`);
}

