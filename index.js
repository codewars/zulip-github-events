"use strict";

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const ZULIP_BOT_EMAIL = process.env.ZULIP_BOT_EMAIL;
const ZULIP_BOT_API_KEY = process.env.ZULIP_BOT_API_KEY;
const ZULIP_REALM = process.env.ZULIP_REALM;

const zulip = require("zulip-js");
const { Webhooks } = require("@octokit/webhooks");

const zulipConfig = {
  username: ZULIP_BOT_EMAIL,
  apiKey: ZULIP_BOT_API_KEY,
  realm: ZULIP_REALM,
};

const wikiEvent = ({ sender, pages }) => {
  return [
    `[${sender.login}](${sender.html_url}):`,
    ...pages.map((p) => `* ${p.action} [${p.title}](${p.html_url})`),
  ].join("\n");
};

const issuesEvent = ({ action, sender, issue, label }) => {
  const user = `[${sender.login}](${sender.html_url})`;
  const title = `Issue #${issue.number} ${issue.title}`;
  const issueLink = `[${title}](${issue.html_url})`;

  switch (action) {
    case "opened":
    case "closed":
    case "edited":
    case "transferred":
      return `${user} ${action} ${issueLink}`;
    case "labeled":
      return `${user} added \`${label.name}\` label to ${issueLink}`;
    case "unlabeled":
      return `${user} removed \`${label.name}\` label from ${issueLink}`;
    default:
      return "";
  }
};

const issueCommentEvent = ({ action, sender, comment, issue }) => {
  const user = `[${sender.login}](${sender.html_url})`;
  const issueTitle = `Issue #${issue.number} ${issue.title}`;
  const issueLink = `[${issueTitle}](${issue.html_url})`;

  switch (action) {
    case "created":
      return `${user} [commented](${comment.html_url}) on ${issueLink}`;
    case "edited":
      return `${user} edited a [comment](${comment.html_url}) on ${issueLink}`;
    case "deleted":
      return `${user} deleted a comment on ${issueLink}`;
    default:
      return "";
  }
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

  const maybeSend = async (content) => {
    if (!content) return;

    const client = await zulip(zulipConfig);
    return await client.messages.send({
      type: "stream",
      to: stream,
      topic: topic,
      content,
    });
  };

  webhooks.on("gollum", ({ payload }) => maybeSend(wikiEvent(payload)));
  webhooks.on("issues", ({ payload }) => maybeSend(issuesEvent(payload)));
  webhooks.on("issue_comment", ({ payload }) =>
    maybeSend(issueCommentEvent(payload))
  );
  await webhooks.receive({
    id: req.get("x-github-delivery"),
    name: req.get("x-github-event"),
    payload,
  });
  res.sendStatus(200);
};
