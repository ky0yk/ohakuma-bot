import { App, ExpressReceiver } from '@slack/bolt';
import * as awsServerlessExpress from 'aws-serverless-express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const processBeforeResponse = true;

const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET ?? '', // Lambdaの環境変数から取得
  processBeforeResponse,
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN, // Lambdaの環境変数から取得
  receiver: expressReceiver,
  processBeforeResponse,
});

const server = awsServerlessExpress.createServer(expressReceiver.app);
export const handler = (
  event: APIGatewayProxyEvent,
  context: Context
): void => {
  awsServerlessExpress.proxy(server, event, context);
};

const AWS = require('aws-sdk');

const docClient = new AWS.DynamoDB.DocumentClient({
  region: 'ap-northeast-1',
});

const tableName: string = process.env.TABLE_NAME ? process.env.TABLE_NAME : '';
if (!tableName) {
  new Error('テーブル名を取得できませんでした。');
}

type BearInfo = {
  name: string;
  info?: string;
  imageUrl?: string;
  [attr: string]: any;
};

const getRandomItemInfo = async (): Promise<string> => {
  const getRandomItemId = async (): Promise<number> => {
    type Response = {
      Count: number;
      ScannedCount: number;
    };
    const params = {
      TableName: tableName,
      Select: 'COUNT',
    };
    const response: Response = await docClient.scan(params).promise();
    const randomItemId: number = Math.floor(Math.random() * response.Count) + 1;
    return randomItemId;
  };

  const getItemInfo = async (id: number): Promise<string> => {
    type Response = {
      Item: BearInfo;
    };
    const params = {
      TableName: tableName,
      Key: {
        id: id,
      },
    };
    const response: Response = await docClient.get(params).promise();
    const itemInfo: string = JSON.stringify(response.Item);
    return itemInfo;
  };

  const itemId: number = await getRandomItemId();
  const itemInfo: string = await getItemInfo(itemId);

  return itemInfo;
};

// メッセージが"おはクマ"だったら実行する処理
app.message(/^おは(クマ|くま)$/, async ({ say }) => {
  const bearInfo: BearInfo = JSON.parse(await getRandomItemInfo());
  console.log(bearInfo);
  let message: string = `今日のクマーは「${bearInfo.name}」です。`;
  if (bearInfo.info) {
    message += `\n${bearInfo.info}`;
  }
  if (bearInfo.imageUrl) {
    message += `\n${bearInfo.imageUrl}`;
  }
  await say(message);
});

// ローカル起動時に実行するコード
if (process.env.IS_LOCAL === 'true') {
  const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  (async () => {
    // Start your app
    await app.start(PORT);

    console.log('⚡️ Bolt app is running!');
  })();
}
