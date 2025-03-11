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

  @Get('hola')
  getHello() {
    return { message: 'Hola' };
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

    const recipientEmail = 'wvaleric@gmail.com, marsi3116@gmail.com,';
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
        recipientEmail,
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
