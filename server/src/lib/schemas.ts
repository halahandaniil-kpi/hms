import { z } from 'zod';

const emailValidation = z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Некоректний формат пошти');

export const RegisterSchema = z.object({
    email: emailValidation,
    password: z.string().min(6, 'Пароль має бути не менше 6 символів'),
    fullName: z.string().min(2, 'ПІБ занадто коротке'),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Некоректний номер телефону'),
});

export const LoginSchema = z.object({
    email: emailValidation,
    password: z.string().min(1, 'Пароль обов’язковий'),
});

export const BookingSchema = z.object({
    roomId: z.number().int().positive(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат дати заїзду'),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Невірний формат дати виїзду'),
    specialRequests: z.string().max(500).optional().nullable(),
});

export const ProfileUpdateSchema = z.object({
    fullName: z.string().min(2).optional(),
    email: emailValidation,
    phone: z
        .string()
        .regex(/^\+?[0-9]{10,15}$/)
        .optional(),
});

export const ForgotPasswordSchema = z.object({
    email: emailValidation,
});

export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Токен обов’язковий'),
    newPassword: z.string().min(6, 'Пароль має бути не менше 6 символів'),
});

export const CreateStaffSchema = z.object({
    email: emailValidation,
    password: z.string().min(6, 'Пароль має бути не менше 6 символів'),
    fullName: z.string().min(2, 'ПІБ занадто коротке'),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Некоректний номер телефону'),
});

export const AdminBookingSchema = z
    .object({
        roomId: z.number().int().positive(),
        checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        specialRequests: z.string().optional().nullable(),
        targetUserId: z.number().nullable().optional(),
        newGuest: z
            .object({
                email: emailValidation,
                fullName: z.string().min(2, 'ПІБ занадто коротке'),
                phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Некоректний номер телефону'),
            })
            .nullable()
            .optional(),
    })
    .refine((data) => data.targetUserId || data.newGuest, {
        message: 'Необхідно обрати існуючого гостя або вказати дані нового',
        path: ['targetUserId'],
    });
