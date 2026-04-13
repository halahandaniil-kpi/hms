import crypto from 'crypto';
import axios from 'axios';

export const generateLiqPayData = (params: any) => {
    const jsonString = JSON.stringify(params);
    const data = Buffer.from(jsonString).toString('base64');

    const signatureString = process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY;
    const signature = crypto.createHash('sha1').update(signatureString).digest('base64');

    return { data, signature };
};

export const verifyLiqPaySignature = (data: string, signature: string) => {
    const expectedSignature = crypto
        .createHash('sha1')
        .update(process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY)
        .digest('base64');
    return expectedSignature === signature;
};

export const makeLiqPayRequest = async (params: any) => {
    const jsonString = JSON.stringify(params);
    const data = Buffer.from(jsonString).toString('base64');
    const signature = crypto
        .createHash('sha1')
        .update(process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY)
        .digest('base64');

    // LiqPay очікує дані у форматі application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append('data', data);
    formData.append('signature', signature);

    const response = await axios.post('https://www.liqpay.ua/api/request', formData);
    return response.data;
};
