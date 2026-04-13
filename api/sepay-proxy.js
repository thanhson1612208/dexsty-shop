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

  // Log để debug trên Vercel Dashboard (không lộ key)
  console.log('Request received:', { amount, note });

  const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
  const BANK_STK = process.env.BANK_STK;

  if (!SEPAY_API_KEY || !BANK_STK) {
    console.error('Missing environment variables: SEPAY_API_KEY or BANK_STK');
    return res.status(500).json({ 
        error: 'Chưa cấu hình biến môi trường SEPAY_API_KEY hoặc BANK_STK trên Vercel.' 
    });
  }

  try {
    // Gọi API SePay
    const response = await fetch(`https://my.sepay.vn/api/transactions/list?account_number=${BANK_STK}&limit=20`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${SEPAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const sepayData = await response.json();

    if (!response.ok) {
      console.error('SePay API Error:', sepayData);
      return res.status(response.status).json({ 
          error: 'Lỗi từ hệ thống SePay', 
          details: sepayData 
      });
    }

    return res.status(200).json(sepayData);

  } catch (e) {
    console.error('Proxy Error:', e.message);
    return res.status(500).json({ 
        error: 'Lỗi kết nối Serverless Function', 
        message: e.message 
    });
  }
}
