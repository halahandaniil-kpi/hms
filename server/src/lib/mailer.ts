import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendResetEmail = async (email: string, link: string) => {
    try {
        await transporter.sendMail({
            from: '"Grand Reserve Hotel" <${process.env.EMAIL_USER}>',
            to: email,
            subject: 'Відновлення пароля Grand Reserve',
            html: `
				<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
					<h2>Відновлення пароля</h2>
					<p>Ви отримали цей лист, тому що ми отримали запит на скидання пароля для вашого акаунта.</p>
					<a href="${link}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Змінити пароль</a>
					<p>Це посилання дійсне лише 15 хвилин.</p>
					<p>Якщо ви не робили цього запиту, просто ігноруйте цей лист.</p>
				</div>
			`,
        });
    } catch (error) {
        throw new Error('Не вдалося надіслати лист для відновлення пароля', { cause: error });
    }
};
