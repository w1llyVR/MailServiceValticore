import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { SmtpService } from './smtp/smtp.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly smptService: SmtpService,

  ) {}

  private recipientEmail = 'jcrevolledo@valticore.com';
  private ccEmails = ['marsi3116@gmail.com', 'jmpaucar@valticore.com', 'willy.valentin@valticore.com', 'dfvaler@valticore.com']
  
  @Get('hola')
  getHello() {
    return { message: 'Hola' };
  }

  @Post('cotizacion')
  async solicitarCotizacion(
    @Body('name') name: string,
    @Body('company') company: string,
    @Body('email') email: string,
    @Body('service') service: string,
    @Body('phone') phone: string,
  ) {
    if (!name || !company || !email || !service || !phone) {
      throw new BadRequestException('Todos los campos son requeridos.' + name + company + email + service + phone); 
    }

    const subject = 'Solicitud de Cotización';
    const message = `
      <h2>Solicitud de Cotización</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Empresa:</strong> ${company}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Servicio de interés:</strong> ${service}</p>
      <p><strong>Teléfono:</strong> ${phone}</p>
      <p>Favor de atender esta solicitud.</p>
    `;

    try {
      await this.smptService.sendMail(
        this.recipientEmail,
        this.ccEmails,
        subject,
        message,
        '',
        '',
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'No se pudo enviar el correo. ' + error.message,
      );
    }

    return { message: 'Solicitud de cotización enviada exitosamente.' };
  }

  @Post('asesor')
  async solicitarAsesor(@Body('email') email: string) {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      throw new BadRequestException('Debe proporcionar un correo válido.');
    }

    const subject = 'Se solicita un asesor – WhatsApp';
    const message = `
      <h2>Solicitud de Asesor en WhatsApp</h2>
      <p>El usuario con correo <strong>${email}</strong> está solicitando un asesor en WhatsApp.</p>
      <p>Favor de contactar lo antes posible.</p>
    `;

    var mails = this.ccEmails;
    mails.push('Angievalverdesalazar123@gmail.com')

    try {
      await this.smptService.sendMail(
        this.recipientEmail,
        mails,
        subject,
        message,
        '',
        ''
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'No se pudo enviar el correo. ' + error.message,
      );
    }

    return { message: 'Solicitud de asesor enviada exitosamente.' };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('fileCv', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('lastName') lastName: string,
    @Body('email') email: string,
    @Body('phone') phone: string,
    @Body('date') date: string,
    @Body('specialization') specialization: string,
    @Body('specializationDescription') specializationDescription: string,
  ) {
    if (
      !file ||
      !name ||
      !lastName ||
      !email ||
      !phone ||
      !date ||
      !specialization
    ) {
      throw new BadRequestException('Todos los campos son requeridos.');
    }


    const subject = 'Nuevo CV recibido';
    const message = `
      <h2>Nuevo CV recibido</h2>
      <p><strong>Nombre:</strong> ${name} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${phone}</p>
      <p><strong>Fecha de nacimiento:</strong> ${date}</p>
      <p><strong>Cargo:</strong> ${specialization}</p>
      ${specializationDescription ? `<p><strong>Descripción:</strong> ${specializationDescription}</p>` : ''}
      <p>Se adjunta el CV.</p>
    `;

    try {
      await this.smptService.sendMail(
        this.recipientEmail,
        this.ccEmails,
        subject,
        message,
        file.path,
        file.originalname,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'No se pudo enviar el correo. ' + error.message,
      );
    } finally {
      fs.unlinkSync(file.path);
    }

    return { message: 'Correo enviado exitosamente con el archivo adjunto.' };
  }
}
