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

AWS.config.update({
  region: 'ap-northeast-1',
});

const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME;

const getRandomItemId = async (): Promise<number> => {
  const params = {
    TableName: tableName,
    Select: 'COUNT',
  };
  const response = await docClient.scan(params).promise();
  const randomItemId = Math.floor(Math.random() * response.Count) + 1;
  return randomItemId;
};

const getItemInfo = async (id: number): Promise<string> => {
  const params = {
    TableName: tableName,
    Key: {
      id: id,
    },
  };
  const response = await docClient.get(params).promise();
  const itemInfo = JSON.stringify(response.Item);
  return itemInfo;
};

// メッセージに"hello"が含まれていたら実行する処理
app.message('おはクマ', async ({ say }) => {
  const hoge = async () => {
    const itemId = await getRandomItemId();
    const itemInfo = await getItemInfo(itemId);
    return itemInfo;
  };
  const response = JSON.parse(await hoge()); // TODO responseをいい感じに組み立てる
  const message = `今日のクマーは「${response.name}」です。
    ${response.info}
    ${response.imageUrl}`;
  await say(message);
});

// ローカル起動時に実行するコード
if (process.env.IS_LOCAL === 'true') {
  const PORT: any = process.env.PORT || 3000;
  (async () => {
    // Start your app
    await app.start(PORT);

    console.log('⚡️ Bolt app is running!');
  })();
}
