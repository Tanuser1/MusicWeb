const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Không tìm thấy token xác thực.' });
    }

    try {
        // Thay 'YOUR_SECRET_KEY' bằng khóa bí mật bạn dùng để tạo token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_SECRET_KEY'); 
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Bạn không có quyền truy cập vào tài nguyên này.' });
        }
        req.user = decoded; // Lưu thông tin user vào request để dùng ở các bước sau
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = { isAdmin };