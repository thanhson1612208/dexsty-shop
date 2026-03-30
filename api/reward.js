const admin = require('firebase-admin');

// 1. Cấu hình kết nối Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Chỉ cho phép phương thức POST để bảo mật
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Chỉ chấp nhận phương thức POST' });
  }

  const { userId, amount } = req.body;

  try {
    // 2. Tìm xem người nạp tiền (userId) có được ai mời không
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const userData = userDoc.data();
    const referrerId = userData.referred_by;

    // 3. Nếu có người mời (Người A), tiến hành trả thưởng
    if (referrerId) {
      const batch = db.batch();
      
      // Tính 2% hoa hồng VNĐ
      const bonusVND = Math.floor(amount * 0.02);
      
      // Cập nhật số dư VNĐ cho người mời ngay lập tức
      const referrerRef = db.collection('users').doc(referrerId);
      batch.update(referrerRef, {
        balance_shop: admin.firestore.FieldValue.increment(bonusVND)
      });

      // 4. Tạo bản ghi chờ 120h cho 30 Robux
      // Tính thời gian: Hiện tại + 5 ngày (120 giờ)
      const availableAt = Date.now() + (120 * 60 * 60 * 1000);
      
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
      return res.status(200).json({ success: true, message: 'Đã xử lý thưởng mã mời' });
    }

    return res.status(200).json({ success: true, message: 'Không có mã mời để xử lý' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Lỗi server hệ thống' });
  }
}
