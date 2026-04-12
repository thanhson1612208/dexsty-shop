 // api/sepay-webhook.js
export default async function handler(req, res) {
    // Chỉ cho phép phương thức POST từ SePay
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const data = req.body;
    const apiKey = process.env.SEPAY_API_KEY; // Lấy từ biến môi trường trên Vercel

    // 1. Kiểm tra API Key để bảo mật (Xác thực dữ liệu từ SePay)
    if (data.api_key !== apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Lấy thông tin giao dịch
    const orderId = data.transaction_content; // Nội dung chuyển khoản (Ví dụ: DH12345)
    const amount = data.amount_in;           // Số tiền khách đã chuyển
    const transactionId = data.id;           // Mã giao dịch của SePay

    console.log(`Nhận thanh toán thành công: Đơn hàng ${orderId}, Số tiền ${amount}đ`);

    // 3. Xử lý logic của bạn tại đây
    // Ví dụ: Gửi tin nhắn Telegram thông báo cho bạn, hoặc lưu vào Database (nếu có)
    
    // Trả về kết quả thành công cho SePay
    return res.status(200).json({ success: true, message: "Webhook received" });
}
