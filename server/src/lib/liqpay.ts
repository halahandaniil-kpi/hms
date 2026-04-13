import crypto from 'crypto';

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
