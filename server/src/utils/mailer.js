import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

/**
 * Lazily-built nodemailer transport. Created from the SMTP_* env vars when present;
 * `null` when SMTP is not configured (dev), in which case {@link sendMail} logs instead.
 */
let transport = null
if (env.SMTP_HOST) {
  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  })
}

/**
 * Sends an email via the configured SMTP transport. When SMTP is not configured
 * (no `SMTP_HOST`), the message is logged to the console instead so local development
 * works without an email provider.
 *
 * @param {object} message
 * @param {string} message.to - Recipient email address.
 * @param {string} message.subject - Email subject.
 * @param {string} message.html - HTML body.
 * @param {string} [message.text] - Optional plain-text body.
 * @returns {Promise<void>}
 */
export async function sendMail({ to, subject, html, text }) {
  if (!transport) {
    console.log(`[mailer] SMTP not configured — email not sent.\n  to: ${to}\n  subject: ${subject}\n  body: ${text || html}`)
    return
  }
  await transport.sendMail({ from: env.SMTP_FROM, to, subject, html, text })
}
