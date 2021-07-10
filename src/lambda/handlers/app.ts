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

// メッセージに"hello"が含まれていたら実行する処理
app.message('hello', async ({ message, say }) => {
  await say({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hey there !`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Click Me',
          },
          action_id: 'button_click',
        },
      },
    ],
    text: `Hey there !`,
  });
});

// action_idが"button_click"のアクションが実行された際に実行する処理
app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
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
