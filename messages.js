const genUserLink = ({ login, html_url }) => `[${login}](${html_url})`;
const genLinkWithPrefix = (prefix) => ({ number, title, html_url }) =>
  `[${prefix} #${number} ${title}](${html_url})`;
const genIssueLink = genLinkWithPrefix("Issue");
const genPRLink = genLinkWithPrefix("PR");

const onGollum = ({ sender, pages }) => {
  return [
    `${genUserLink(sender)}:`,
    ...pages.map((p) => `* ${p.action} [${p.title}](${p.html_url})`),
  ].join("\n");
};

const onIssues = ({ action, sender, issue, label }) => {
  const user = genUserLink(sender);
  const issueLink = genIssueLink(issue);

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

const onIssueComment = ({ action, sender, comment, issue }) => {
  const user = genUserLink(sender);
  const issueLink = genIssueLink(issue);

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

const onPullRequest = ({ action, pull_request, sender }) => {
  const user = genUserLink(sender);
  const prLink = genPRLink(pull_request);

  if (action === "closed" && pull_request.merged) action = "merged";
  switch (action) {
    case "opened":
    case "edited":
    case "closed":
    case "merged":
      return `${user} ${action} ${prLink}`;
    default:
      return "";
  }
};

module.exports = {
  onGollum,
  onIssues,
  onIssueComment,
  onPullRequest,
};
