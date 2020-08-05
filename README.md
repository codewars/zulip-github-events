# `zulipGitHubEvents`

Simple webhook handler on Google Cloud Functions sending custom messages to Zulip for GitHub events.

The official [GitHub integration](https://zulipchat.com/integrations/doc/github) was too verbose for us.

`zulipGitHubEvents` does the following:

1. Verify the request
2. Create custom message based on the event or ignore it
3. Send the message to `stream` under `topic`

We only care about the following events:

- `gollum`
- `issues`
  - `opened`
  - `closed`
  - `edited`
  - `transferred`
  - `labeled`
  - `unlabeled`
- `issue_comment`
  - `created`
  - `edited`
  - `deleted`
- `pull_request`
  - `opened`
  - `edited`
  - `closed`
- `pull_request_review`
  - `submitted`
- `pull_request_review_comment`
  - `created`

## Deploying

Set environment variables:

- `GITHUB_WEBHOOK_SECRET`: Secret to set when creating webhook on GitHub
- `ZULIP_BOT_EMAIL`: Email of the Zulip bot
- `ZULIP_BOT_API_KEY`: API key of the Zulip bot
- `ZULIP_REALM`: Zulip URL
- `PROJECT_ID`: Google Cloud project ID

Deploy with `gcloud`:

```
gcloud functions deploy zulipGitHubEvents \
    --trigger-http \
    --allow-unauthenticated \
    --runtime nodejs10 \
    --memory 128MB \
    --set-env-vars GITHUB_WEBHOOK_SECRET=$GITHUB_WEBHOOK_SECRET,ZULIP_BOT_EMAIL=$ZULIP_BOT_EMAIL,ZULIP_BOT_API_KEY=$ZULIP_BOT_API_KEY,ZULIP_REALM=$ZULIP_REALM \
    --project $PROJECT_ID
```

Configure GitHub Webhook:

- Set `Payload URL` to `httpsTrigger.url` + `?stream=stream_name&topic=topic_name`
- Set `Content type` to `application/json`
- Set `Secret` to `$GITHUB_WEBHOOK_SECRET`
- Select events to trigger this webhook
