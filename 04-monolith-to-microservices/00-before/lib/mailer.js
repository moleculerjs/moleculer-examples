// lib/mailer.js — pretend to send email.
exports.send = (to, subject) => console.log(`  [mailer] → ${to}: ${subject}`);
