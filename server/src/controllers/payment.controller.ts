import { Response, Request } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as PaymentService from '../services/payment.service.js';
import { generateLiqPayData, verifyLiqPaySignature, makeLiqPayRequest } from '../lib/liqpay.js';
import prisma from '../lib/prisma.js';

export const pay = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId, paymentMethod, transactionId } = req.body;

        if (!bookingId || !paymentMethod) {
            return res.status(400).json({ message: 'Відсутні обов’язкові дані для оплати' });
        }

        const payment = await PaymentService.processPayment(
            Number(bookingId),
            paymentMethod,
            transactionId,
        );

        res.status(201).json({
            message:
                paymentMethod === 'CASH'
                    ? 'Обрано оплату готівкою. Очікується оплата на ресепшині.'
                    : 'Запит на онлайн-оплату створено. Очікуйте перенаправлення...',
            payment,
        });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const confirmCash = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;
        const payment = await PaymentService.confirmCashPayment(Number(paymentId));

        res.json({ message: 'Оплату готівкою підтверджено', payment });
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const refund = async (req: AuthRequest, res: Response) => {
    try {
        const { paymentId } = req.params;

        const payment = await prisma.payment.findUnique({
            where: { id: Number(paymentId) },
        });

        if (!payment) return res.status(404).json({ message: 'Платіж не знайдено' });
        if (payment.status !== 'COMPLETED')
            return res.status(400).json({ message: 'Можна повернути тільки успішну оплату' });

        // Для готівки просто міняємо статус у базі, LiqPay не потрібен
        if (payment.paymentMethod === 'CASH') {
            await PaymentService.refundPayment(Number(paymentId));
            return res.json({ message: 'Статус готівкового платежу змінено на Повернено' });
        }

        // Формуємо запит на повернення до LiqPay
        const refundParams = {
            public_key: process.env.LIQPAY_PUBLIC_KEY,
            version: '3',
            action: 'refund',
            amount: payment.amount.toString(),
            payment_id: payment.transactionId,
        };

        const liqpayResponse = await makeLiqPayRequest(refundParams);

        // Для sandbox
        // liqpayResponse.err_description === 'Невірний статус платежу'
        if (
            liqpayResponse.status === 'success' ||
            liqpayResponse.err_description === 'Невірний статус платежу'
        ) {
            await PaymentService.refundPayment(Number(paymentId));
            res.json({ message: 'Кошти успішно повернуті через LiqPay', details: liqpayResponse });
        } else {
            res.status(400).json({
                message: 'LiqPay відхилив запит на повернення',
                reason: liqpayResponse.err_description,
            });
        }
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getLiqPayParams = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId } = req.body;
        const booking = await prisma.booking.findUnique({
            where: { id: Number(bookingId) },
            include: {
                room: { include: { roomType: true } },
                payment: true,
            },
        });

        if (!booking) return res.status(404).json({ message: 'Бронювання не знайдено' });

        if (booking.payment && booking.payment.paymentMethod !== 'CARD') {
            await prisma.payment.update({
                where: { id: booking.payment.id },
                data: { paymentMethod: 'CARD' },
            });
        }

        const params = {
            public_key: process.env.LIQPAY_PUBLIC_KEY,
            version: '3',
            action: 'pay',
            amount: booking.totalPrice.toString(),
            currency: 'UAH',
            description: `Оплата проживання: номер №${booking.room.roomNumber}`,
            order_id: `booking_${booking.id}_${Date.now()}`, // Унікальний ID для LiqPay
            result_url: `${process.env.CLIENT_URL}/bookings/my`, // Куди повернути юзера
            server_url: `${process.env.BASE_URL}/api/payments/callback`, // Куди слати звіт
            sandbox: 1, // 1 - для тестів, 0 - для реальних грошей
        };

        const { data, signature } = generateLiqPayData(params);
        res.json({ data, signature });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const liqpayCallback = async (req: Request, res: Response) => {
    const { data, signature } = req.body;

    if (!data || !signature) {
        return res.status(400).send('No data');
    }

    if (!verifyLiqPaySignature(data, signature)) {
        return res.status(400).send('Invalid signature');
    }

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
    const bookingId = parseInt(decodedData.order_id.split('_')[1]);

    if (decodedData.status === 'success' || decodedData.status === 'sandbox') {
        await PaymentService.updatePaymentStatus(
            bookingId,
            'COMPLETED',
            decodedData.transaction_id.toString(),
        );
    } else {
        await PaymentService.updatePaymentStatus(
            bookingId,
            'FAILED',
            decodedData.transaction_id.toString(),
        );
    }

    res.status(200).send('OK');
};
