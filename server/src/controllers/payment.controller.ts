import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as PaymentService from '../services/payment.service.js';

export const pay = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId, paymentMethod, transactionId } = req.body;

        if (!bookingId || !paymentMethod) {
            return res.status(400).json({ message: 'Відсутні обов’язкові дані для оплати' });
        }

        if (paymentMethod !== 'CASH' && !transactionId) {
            return res.status(400).json({ message: 'Для онлайн-оплати необхідний ID транзакції' });
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
                    : 'Оплата успішна, бронювання підтверджено',
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
        const payment = await PaymentService.refundPayment(Number(paymentId));
        res.json(payment);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};
