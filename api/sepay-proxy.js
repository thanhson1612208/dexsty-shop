javascript
import fetch from 'node-fetch';


export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, note } = req.body;

  if (!amount || !note) {
    return res.status(400).json({ error: 'Missing required fields: amount, note' });
  }

  const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
  const BANK_STK = process.env.BANK_STK;

  if (!SEPAY_API_KEY || !BANK_STK) {
    console.error('Missing environment variables for SePay');
    return res.status(500).json({ error: 'Server configuration error: SePay API Key or Bank STK not set.' });
  }

  try {
    // Gọi API SePay để lấy danh sách giao dịch gần đây
    const sepayResponse = await fetch(`https://my.sepay.vn/api/transactions/list?account_number=${BANK_STK}&limit=20`, {
      headers: { 
        'Authorization': `Bearer ${SEPAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!sepayResponse.ok) {
      const errorText = await sepayResponse.text();
      console.error('SePay API Error:', errorText);
      return res.status(sepayResponse.status).json({ error: 'Lỗi từ SePay API' });
    }

    const sepayData = await sepayResponse.json();
    return res.status(200).json(sepayData);

  } catch (e) {
    console.error('Error in sepay-proxy API:', e);
    return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi kết nối đến SePay.' });
  }
}
