const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const search = `           foundFile.status = formattedStatus;
           foundFile.review_status = formattedStatus;
           foundFile.reviewer_comment = trimmedComment;
           foundFile.reviewed_by = reviewerName;
           foundFile.reviewed_at = nowIso;`;

const replace = `           foundFile.status = formattedStatus;
           foundFile.review_status = formattedStatus;
           foundFile.reviewer_comment = trimmedComment;
           foundFile.reviewerComment = trimmedComment;
           foundFile.reviewed_by = reviewerName;
           foundFile.reviewedBy = reviewerName;
           foundFile.reviewed_at = nowIso;
           foundFile.reviewedDate = nowIso;`;

code = code.replace(search, replace);
fs.writeFileSync('server.ts', code);
