// api/sepay-webhook.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const data = req.body;
    const myApiKey = process.env.SEPAY_API_KEY; // Cấu hình trong Vercel Settings

    // 1. Kiểm tra API Key để bảo mật
    if (data.api_key !== myApiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Phân tích nội dung chuyển khoản để lấy tên tài khoản
    // Nội dung có dạng: "NAPTIEN USERNAME"
    const content = data.transaction_content;
    const amount = data.amount_in;

    if (content && content.includes('NAPTIEN')) {
        const username = content.replace('NAPTIEN', '').trim();
        
        console.log(`Nạp tiền thành công cho: ${username}, Số tiền: ${amount}đ`);

        // TẠI ĐÂY: Bạn viết code để cộng tiền vào Database của bạn
        // Ví dụ: await updateBalanceInDatabase(username, amount);
        
        return res.status(200).json({ success: true, message: `Đã nạp ${amount} cho ${username}` });
    }

    return res.status(200).json({ success: true, message: "Giao dịch không hợp lệ" });
}
