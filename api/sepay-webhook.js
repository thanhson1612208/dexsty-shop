// api/sepay-webhook.js
const admin = require('firebase-admin');

// Khởi tạo Firebase Admin (Sử dụng biến môi trường để bảo mật)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const data = req.body;
    const myApiKey = process.env.SEPAY_API_KEY;

    // 1. Kiểm tra API Key bảo mật từ SePay
    if (data.api_key !== myApiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Phân tích nội dung: "NAPTIEN USERNAME"
    const content = data.transaction_content.toUpperCase();
    const amount = parseInt(data.amount_in);

    if (content.includes('NAPTIEN')) {
        const username = content.replace('NAPTIEN', '').trim().toLowerCase();
        
        try {
            const userRef = db.collection('users').doc(username);
            
            // 3. Sử dụng Transaction để cộng tiền an toàn
            await db.runTransaction(async (t) => {
                const doc = await t.get(userRef);
                if (!doc.exists) {
                    // Nếu user chưa có trong DB, tạo mới với số dư là số tiền nạp
                    t.set(userRef, { balance: amount });
                } else {
                    const newBalance = (doc.data().balance || 0) + amount;
                    t.update(userRef, { balance: newBalance });
                }
            });

            console.log(`Đã cộng ${amount}đ cho tài khoản: ${username}`);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("Lỗi Firebase:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
    return res.status(200).json({ success: true });
}
