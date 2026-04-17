import { test, expect } from '@playwright/test';

test('Guest can login and book a room', async ({ page }) => {
    // Налаштовуємо Playwright на автоматичне підтвердження діалогових вікон (confirm)
    page.on('dialog', async (dialog) => {
        if (dialog.message().includes('скасувати')) {
            await dialog.accept();
        }
    });

    // Переходимо на логін
    await page.goto('http://localhost:5173/login');

    // Виконуємо вхід
    await page.fill('input[type="email"]', 'halahan.daniil-ip33@edu.kpi.ua');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    // ЧЕКАЄМО, поки нас редіректне на головну після успішного входу
    await page.waitForURL('http://localhost:5173/');

    // Перехід до деталей конкретного типу номера
    await page.goto('http://localhost:5173/room-types/1');

    // ЧЕКАЄМО, поки зникне напис "Завантаження" і з'явиться заголовок номера
    await page.waitForSelector('h1');

    // Вибір номера
    // Оскільки селект з'являється після завантаження API, чекаємо саме на нього
    const roomSelect = page.locator('select');
    await roomSelect.waitFor({ state: 'visible', timeout: 10000 });
    await roomSelect.selectOption({ index: 1 }); // Обираємо перший доступний номер

    // Вибір дат (заповнюємо інпут DatePicker)
    const dateInput = page.locator('.react-datepicker__input-container input');
    await dateInput.click();
    const nextButton = page.locator('.react-datepicker__navigation--next');
    const currentMonth = page.locator('.react-datepicker__current-month');

    while (!((await currentMonth.textContent()) ?? '').toLowerCase().includes('жовтень 2026')) {
        await nextButton.click();
        await page.waitForTimeout(100);
    }

    await page
        .locator('.react-datepicker__day--015:not(.react-datepicker__day--outside-month)')
        .click();
    await page
        .locator('.react-datepicker__day--020:not(.react-datepicker__day--outside-month)')
        .click();

    // Вибір оплати "При заселенні"
    await page.click('button:has-text("При заселенні")');

    // Бронювання
    const bookButton = page.locator('button[type="submit"]');
    await expect(bookButton).toBeEnabled();
    await bookButton.click();

    // Перевірка успіху (шукаємо повідомлення про заброньовано)
    // Використовуємо регулярний вираз, бо текст може бути довгим
    await expect(page.locator('text=/Заброньовано/')).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(5000);

    // Переходимо в "Мої бронювання", щоб звільнити дати для наступного тесту
    await page.goto('http://localhost:5173/bookings/my');

    // Знаходимо першу кнопку "Скасувати" (вона належить останньому бронюванню)
    const cancelBtn = page.locator('button:has-text("Скасувати")').first();
    await cancelBtn.waitFor({ state: 'visible' });
    await cancelBtn.click();
});
