export class EmailService {
    private static async sendBrevoEmail(to: string, subject: string, htmlContent: string) {
        const apiKey = process.env.BREVO_API_KEY;
        const senderEmail = process.env.EMAIL_USER;

        if (!apiKey) {
            console.error('AVISO: BREVO_API_KEY não configurada no .env');
            return;
        }

        const payload = {
            sender: {
                name: "Nosso Caixa",
                email: senderEmail
            },
            to: [
                { email: to }
            ],
            subject: subject,
            htmlContent: htmlContent
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na API do Brevo:', errorText);
            throw new Error(`Falha no envio de e-mail via Brevo`);
        }
    }

    static async sendVerificationEmail(to: string, code: string) {
        try {
            const subject = 'Seu código de verificação - Nosso Caixa';
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #10b981; text-align: center;">Bem-vindo ao Nosso Caixa!</h2>
                    <p style="color: #334155; font-size: 16px;">Falta pouco para você começar a organizar suas finanças. Use o código abaixo para ativar sua conta:</p>
                    <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${code}</span>
                    </div>
                    <p style="color: #64748b; font-size: 14px; text-align: center;">Este código é válido por 15 minutos.</p>
                </div>
            `;

            await this.sendBrevoEmail(to, subject, htmlContent);
            console.log(`E-mail de verificação enviado via Brevo para ${to}`);
        } catch (error) {
            console.error('Erro ao enviar e-mail de verificação:', error);
            throw error;
        }
    }

    static async sendPasswordResetEmail(to: string, code: string) {
        try {
            const subject = 'Recuperação de Senha - Nosso Caixa';
            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #3b82f6; text-align: center;">Recuperação de Senha</h2>
                    <p style="color: #334155; font-size: 16px;">Recebemos um pedido para redefinir a sua senha. Use o código abaixo no aplicativo:</p>
                    <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${code}</span>
                    </div>
                    <p style="color: #64748b; font-size: 14px; text-align: center;">Se você não solicitou isso, pode ignorar este e-mail.</p>
                    <p style="color: #ef4444; font-size: 12px; text-align: center;">Este código expira em 15 minutos.</p>
                </div>
            `;

            await this.sendBrevoEmail(to, subject, htmlContent);
            console.log(`E-mail de recuperação enviado via Brevo para ${to}`);
        } catch (error) {
            console.error('Erro ao enviar e-mail de recuperação:', error);
            throw error;
        }
    }
}
