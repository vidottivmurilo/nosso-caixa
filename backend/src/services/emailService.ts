import nodemailer from 'nodemailer';

export class EmailService {
    private static transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    static async sendVerificationEmail(to: string, code: string) {
        try {
            const mailOptions = {
                from: `"Nosso Caixa" <${process.env.EMAIL_USER}>`,
                to,
                subject: 'Seu código de verificação - Nosso Caixa',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <h2 style="color: #10b981; text-align: center;">Bem-vindo ao Nosso Caixa!</h2>
                        <p style="color: #334155; font-size: 16px;">Falta pouco para você começar a organizar suas finanças. Use o código abaixo para ativar sua conta:</p>
                        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${code}</span>
                        </div>
                        <p style="color: #64748b; font-size: 14px; text-align: center;">Este código é válido por 15 minutos.</p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`E-mail de verificação enviado para ${to}`);
        } catch (error) {
            console.error('Erro ao enviar e-mail:', error);
            throw new Error('Falha ao enviar e-mail de verificação');
        }
    }
}
