const db = require('../db'); // Import kết nối DB của bạn

// GET /api/admin/artists - Lấy danh sách nghệ sĩ (có phân trang)
exports.getAllArtists = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        // Query để lấy dữ liệu phân trang
        const [artists] = await db.query(
            'SELECT NgheSiID as id, TenNgheSi as name, AnhDaiDien as imageUrl, TieuSu as description FROM nghesi LIMIT ? OFFSET ?',
            [limit, offset]
        );

        // Query để đếm tổng số nghệ sĩ
        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM nghesi');

        res.json({
            data: artists,
            pagination: {
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách nghệ sĩ:", error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// POST /api/admin/artists - Tạo nghệ sĩ mới
exports.createArtist = async (req, res) => {
    const { name, imageUrl, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Tên nghệ sĩ là bắt buộc.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO nghesi (TenNgheSi, AnhDaiDien, TieuSu) VALUES (?, ?, ?)',
            [name, imageUrl, description]
        );
        res.status(201).json({ id: result.insertId, message: 'Thêm nghệ sĩ thành công!' });
    } catch (error) {
        console.error("Lỗi khi tạo nghệ sĩ:", error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// PUT /api/admin/artists/:id - Cập nhật nghệ sĩ
exports.updateArtist = async (req, res) => {
    const { id } = req.params;
    const { name, imageUrl, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Tên nghệ sĩ là bắt buộc.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE nghesi SET TenNgheSi = ?, AnhDaiDien = ?, TieuSu = ? WHERE NgheSiID = ?',
            [name, imageUrl, description, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ để cập nhật.' });
        }

        res.json({ message: 'Cập nhật nghệ sĩ thành công!' });
    } catch (error) {
        console.error("Lỗi khi cập nhật nghệ sĩ:", error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// DELETE /api/admin/artists/:id - Xóa nghệ sĩ
exports.deleteArtist = async (req, res) => {
    const { id } = req.params;

    try {
        // Lưu ý: Cần xử lý các bảng liên quan (baihat_nghesi, album_nghesi) trước khi xóa.
        // Cách đơn giản nhất là thiết lập ON DELETE CASCADE trong CSDL.
        // Nếu không, bạn phải xóa các bản ghi liên quan ở đây trước.
        // Ví dụ: await db.query('DELETE FROM baihat_nghesi WHERE NgheSiID = ?', [id]);

        const [result] = await db.query(
            'DELETE FROM nghesi WHERE NgheSiID = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ để xóa.' });
        }

        res.json({ message: 'Xóa nghệ sĩ thành công!' });
    } catch (error) {
        console.error("Lỗi khi xóa nghệ sĩ:", error);
        // Bắt lỗi khóa ngoại nếu có
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Không thể xóa nghệ sĩ vì vẫn còn bài hát hoặc album liên quan.' });
        }
        res.status(500).json({ error: 'Lỗi server' });
    }
};