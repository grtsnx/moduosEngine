import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type MailTransportOptions =
  SMTPTransport.Options | { jsonTransport: true };
