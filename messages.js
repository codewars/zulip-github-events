const genUserLink = ({ login, html_url }) => `[${login}](${html_url})`;
const genIssueLink = ({ number, title, html_url }) =>
  `[Issue #${number} ${title}](${html_url})`;

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

module.exports = {
  onGollum,
  onIssues,
  onIssueComment,
};
