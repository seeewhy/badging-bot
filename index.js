const { App, createNodeMiddleware } = require("octokit");
require("dotenv").config();
const SmeeClient = require("smee-client");
const {
  welcome,
  assignChecklist,
  getResults,
  help,
  endReview,
} = require("./src/index");

// instantiate Github App
const app = new App({
  appId: process.env.appId,
  privateKey: process.env.privateKey,
  oauth: {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
  },
  webhooks: { secret: process.env.webhookSecret },
});

// bot algorithm
app.webhooks.on("issues.opened", async ({ octokit, payload }) => {
  welcome(octokit, payload);
});

app.webhooks.on("issues.assigned", async ({ octokit, payload }) => {
  assignChecklist(octokit, payload);
});

app.webhooks.on("issue_comment.created", async ({ octokit, payload }) => {
  if (payload.comment.body.includes("/result")) {
    getResults(octokit, payload);
  }

  if (payload.comment.body.includes("/end")) {
    endReview(octokit, payload);
  }

  if (payload.comment.body.includes("/help")) {
    help(octokit, payload);
  }
});

// create local server to receive webhooks
require("http")
  .createServer(createNodeMiddleware(app))
  .listen(process.env.PORT, () =>
    console.info(`App listening on PORT:${process.env.PORT}`)
  );
module.exports = app;

//connect local server to network client in development
const smee = new SmeeClient({
  source: process.env.webhookURL,
  target: `http://localhost:${process.env.PORT}/api/github/webhooks`,
  logger: console,
});
smee.start();
