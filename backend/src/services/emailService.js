const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

const isEmailEnabled = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const getTransporter = () => {
  if (!isEmailEnabled()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      auth: {
        pass: env.smtpPass,
        user: env.smtpUser,
      },
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
    });
  }

  return transporter;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildAbsoluteLink = (link = "") => {
  if (!link) {
    return env.clientUrl;
  }

  if (/^https?:\/\//i.test(link)) {
    return link;
  }

  return `${env.clientUrl.replace(/\/$/, "")}/${String(link).replace(/^\//, "")}`;
};

const buildNotificationHtml = ({ link, message, title }) => {
  const absoluteLink = buildAbsoluteLink(link);

  return `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 24px;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #0f766e; color: #ffffff; padding: 18px 22px;">
          <div style="font-size: 18px; font-weight: 700;">${escapeHtml(title)}</div>
          <div style="font-size: 13px; opacity: 0.85; margin-top: 4px;">Thong bao tu Tro Plus</div>
        </div>
        <div style="padding: 22px; color: #0f172a; line-height: 1.6;">
          <p style="margin: 0 0 18px;">${escapeHtml(message)}</p>
          <a href="${escapeHtml(absoluteLink)}" style="display: inline-block; background: #0f766e; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 700;">
            Xem chi tiet
          </a>
          <p style="margin: 18px 0 0; color: #64748b; font-size: 12px;">
            Neu nut khong hoat dong, hay mo duong dan: ${escapeHtml(absoluteLink)}
          </p>
        </div>
      </div>
    </div>
  `;
};

const sendEmail = async ({ html, subject, text, to }) => {
  const mailer = getTransporter();

  if (!mailer || !to) {
    return null;
  }

  return mailer.sendMail({
    from: env.mailFrom || env.smtpUser,
    html,
    subject,
    text,
    to,
  });
};

const sendNotificationEmail = async ({ link, message, title, to }) => {
  if (!to) {
    return null;
  }

  const subject = `[Tro Plus] ${title}`;
  const absoluteLink = buildAbsoluteLink(link);

  return sendEmail({
    html: buildNotificationHtml({ link, message, title }),
    subject,
    text: `${title}\n\n${message}\n\nXem chi tiet: ${absoluteLink}`,
    to,
  });
};

module.exports = {
  buildAbsoluteLink,
  isEmailEnabled,
  sendEmail,
  sendNotificationEmail,
};
