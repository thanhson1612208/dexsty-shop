javascript
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Lấy dữ liệu từ request body (amount và note từ frontend)
  const { amount, note } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!amount || !note) {
    return res.status(400).json({ error: 'Missing required fields: amount, note' });
  }

  // Lấy các biến môi trường từ Vercel (được cấu hình an toàn)
  const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
  const BANK_STK = process.env.BANK_STK;

  // Kiểm tra xem các biến môi trường đã được cấu hình chưa
  if (!SEPAY_API_KEY || !BANK_STK) {
    console.error('Missing environment variables for SePay');
    return res.status(500).json({ error: 'Server configuration error: SePay API Key or Bank STK not set.' });
  }

  try {
    // Gọi API SePay từ Serverless Function
    const sepayResponse = await fetch(`https://my.sepay.vn/api/transactions/list?account_number=${BANK_STK}&limit=10`, {
      headers: { 'Authorization': `Bearer ${SEPAY_API_KEY}` }
    });
    const sepayData = await sepayResponse.json();

    // Trả về dữ liệu từ SePay cho Frontend
    return res.status(sepayResponse.status).json(sepayData);

  } catch (e) {
    console.error('Error in sepay-proxy API:', e);
    return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi kết nối đến SePay.' });
  }
}
