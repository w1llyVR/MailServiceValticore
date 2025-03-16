import { OnModuleInit } from '@nestjs/common';
import { SMTPServer } from 'smtp-server';
import * as nodemailer from 'nodemailer';
import * as dkim from 'nodemailer-dkim';
import * as fs from 'fs';

export class SmtpService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  async onModuleInit() {
    this.setupMailer();
    this.startSmtpServer();
  }

  private startSmtpServer() {
    const server = new SMTPServer({
      authOptional: true,
      onData(stream, session, callback) {
        let message = '';
        stream.on('data', (chunk) => (message += chunk));
        stream.on('end', () => {
          console.log('Received message: ', message);
          callback(null, 'Message received');
        });
      },
    });

    server.listen(process.env.SMTP_PORT || 2525, () => {
      console.log('SMTP server is running');
    });
  }

  private setupMailer() {
    this.transporter = nodemailer.createTransport({
      host: 'smtpout.secureserver.net',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.transporter.use(
      'stream',
      dkim.signer({
        domainName: 'valticore.com',
        keySelector: 'default',
        privateKey: fs.readFileSync('dkim_private.key', 'utf8'),
      }),
    );
  }

  async sendMail(
    to: string,
    cc: string[],
    subject: string,
    htmlContent: string,
    filePath: string,
    filename: string,
  ) {

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Valticore Mailer" <${process.env.FROM_EMAIL}>`,
      to,
      cc,
      subject,
      html: htmlContent,
    };

    if (filePath && filename) {
      mailOptions.attachments = [{ filename, path: filePath }];
    }
  
    await this.transporter.sendMail(mailOptions);


    console.log(`Correo enviado a ${to}${filePath ? ` con el archivo adjunto ${filename}` : ''}`);
  }
}
