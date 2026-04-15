import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';

export const validate =
    (schema: z.ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Валідуємо дані з тіла запиту
            await schema.parseAsync(req.body);
            next();
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: 'Помилка валідації',
                    errors: error.issues.map((issue) => ({
                        field: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
            }

            res.status(500).json({ message: 'Внутрішня помилка сервера' });
        }
    };
