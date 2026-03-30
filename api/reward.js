const admin = require('firebase-admin');

// 1. Khởi tạo Firebase
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } catch (error) {
    console.error('Lỗi cấu hình Firebase:', error);
  }
}

const db = admin.firestore();

// 2. Sử dụng module.exports thay cho export default để tránh lỗi 500
module.exports = async (req, res) => {
  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Chỉ chấp nhận phương thức POST' });
  }

  const { userId, amount } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!userId || !amount) {
    return res.status(400).json({ message: 'Thiếu thông tin userId hoặc amount' });
  }

  try {
    // 3. Tìm người nạp tiền (Người B)
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const userData = userDoc.data();
    const referrerId = userData.referred_by;

    // 4. Nếu có người mời (Người A), tiến hành trả thưởng
    if (referrerId) {
      const batch = db.batch();
      
      const bonusVND = Math.floor(amount * 0.02); // 2% VNĐ
      const availableAt = Date.now() + (120 * 60 * 60 * 1000); // 120 giờ sau
      
      // Cập nhật số dư VNĐ cho người mời ngay lập tức
      const referrerRef = db.collection('users').doc(referrerId);
      batch.update(referrerRef, {
        balance_shop: admin.firestore.FieldValue.increment(bonusVND)
      });

      // Tạo bản ghi chờ 120h cho 30 Robux
      const rewardLogRef = db.collection('referral_rewards').doc();
      batch.set(rewardLogRef, {
        referrer_id: referrerId,
        referee_id: userId,
        robux_bonus: 30,
        status: 'pending',
        available_at: availableAt,
        created_at: Date.now()
      });

      await batch.commit();
      return res.status(200).json({ success: true, message: 'Thưởng mã mời thành công' });
    }

    return res.status(200).json({ success: false, message: 'Người nạp không có mã mời' });

  } catch (error) {
    console.error('Lỗi thực thi:', error);
    return res.status(500).json({ error: 'Lỗi server', details: error.message });
  }
};
