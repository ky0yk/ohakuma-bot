import * as cdk from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export class OhakumaBotStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const appLambda = new NodejsFunction(this, 'appLambda', {
      entry: 'src/lambda/handlers/app.ts',
      handler: 'handler',
      environment: {
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN || '',
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET || '',
      },
    });

    new apigateway.LambdaRestApi(this, 'slackApi', {
      handler: appLambda,
    });

    const table = new dynamodb.Table(this, 'Table', {
      tableName: 'bearInfo',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
    });
  }
}
