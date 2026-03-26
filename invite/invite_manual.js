/**
 * invite_manual.js
 * 
 * run node invite/invite_manual.js                 # uses hard-coded emails

 *
 * Super basic manual runner for sendBranchInvite.
 *
 * Usage:
 *   node invite/invite_manual.js ./path/to/emails.csv
 *
 * CSV format:
 *   - first column is email
 *   - header row allowed (will be skipped if it contains "email")
 *
 * Safety:
 *   DRY_RUN is true by default (prints payloads only).
 *   Set DRY_RUN=false below when you're ready to actually send.
 */

import fs from 'node:fs';
import path from 'node:path';
import { sendBranchInvite } from './invite.js';

// Hard-coded branch + template vars (edit these)
const transactionalId = 'cmn638pd102pn0i2aq2ef58z3';
const branchName = 'R&W.llp properties';
const signUpLink = 'https://realestatesimplified.xyz/?branch=example';

// Safety switch
const DRY_RUN = false;

// Fallback hard-coded emails (used if no file path passed)
const hardCodedEmails = [
  'reecechefres@gmail.com',
  '0xrhyz@gmail.com',
];

function parseEmailsFromCsv(csvText) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const startIdx = lines[0].toLowerCase().includes('email') ? 1 : 0;
  const emails = [];
  for (const line of lines.slice(startIdx)) {
    const firstCol = line.split(',')[0]?.trim()?.replace(/^"|"$/g, '');
    if (firstCol) emails.push(firstCol);
  }
  return emails;
}

const mockRes = () => {
  const res = { statusCode: null, responseData: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.responseData = data; return res; };
  return res;
};

async function run() {
  const filePath = process.argv[2];
  let emails = hardCodedEmails;

  if (filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.csv') {
      console.warn(`[manual] Only CSV supported right now. Got: ${ext}. Using hard-coded emails.`);
    } else {
      const csvText = fs.readFileSync(filePath, 'utf8');
      const parsed = parseEmailsFromCsv(csvText);
      if (parsed.length > 0) emails = parsed;
    }
  }

  console.log(`[manual] emails=${emails.length} dry_run=${DRY_RUN}`);

  for (const email of emails) {
    const payload = {
      transactionalId,
      email,
      dataVariables: {
        'branch-name': branchName,
        'sign-up-lin': signUpLink,
      },
    };

    if (DRY_RUN) {
      console.log('[manual] payload', payload);
      continue;
    }

    const res = mockRes();
    await sendBranchInvite({ body: payload }, res);
    console.log('[manual] result', email, res.statusCode, res.responseData);
  }
}

run().catch((err) => {
  console.error('[manual] fatal', err.message);
  process.exit(1);
});