"use strict";

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const ZULIP_BOT_EMAIL = process.env.ZULIP_BOT_EMAIL;
const ZULIP_BOT_API_KEY = process.env.ZULIP_BOT_API_KEY;
const ZULIP_REALM = process.env.ZULIP_REALM;

const zulip = require("zulip-js");
const { Webhooks } = require("@octokit/webhooks");
const {
  onGollum,
  onIssues,
  onIssueComment,
  onPullRequest,
  onPullRequestReview,
  onPullRequestReviewComment,
} = require("./messages");

const zulipConfig = {
  username: ZULIP_BOT_EMAIL,
  apiKey: ZULIP_BOT_API_KEY,
  realm: ZULIP_REALM,
};

exports.zulipGitHubEvents = async (req, res) => {
  const payload = req.body;
  const webhooks = new Webhooks({
    secret: GITHUB_WEBHOOK_SECRET,
  });

  if (!webhooks.verify(payload, req.get("x-hub-signature"))) {
    return res.sendStatus(403);
  }

  const stream = req.query.stream;
  const topic = req.query.topic;
  if (!stream) {
    return res.status(400).send("Missing `stream` parameter");
  }
  if (!topic) {
    return res.status(400).send("Missing `topic` parameter");
  }

  const maybeSend = (handler) => async ({ payload }) => {
    const content = handler(payload);
    if (!content) return;

    const client = await zulip(zulipConfig);
    return await client.messages.send({
      type: "stream",
      to: stream,
      topic: topic,
      content,
    });
  };

  webhooks.on("gollum", maybeSend(onGollum));
  webhooks.on("issues", maybeSend(onIssues));
  webhooks.on("issue_comment", maybeSend(onIssueComment));
  webhooks.on("pull_request", maybeSend(onPullRequest));
  webhooks.on("pull_request_review", maybeSend(onPullRequestReview));
  webhooks.on(
    "pull_request_review_comment",
    maybeSend(onPullRequestReviewComment)
  );
  await webhooks.receive({
    id: req.get("x-github-delivery"),
    name: req.get("x-github-event"),
    payload,
  });
  res.sendStatus(200);
};
