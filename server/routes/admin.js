const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const BASE_URL = 'http://localhost:5001';

// === 1. MIDDLEWARE KIỂM TRA QUYỀN ADMIN ===
// Hợp nhất checkAdmin và isAdmin thành một logic duy nhất
const checkAdmin = (req, res, next) => {
    // Lưu ý: req.user thường được set từ middleware authenticateToken ở file server.js
    if (req.user && (req.user.role === 'admin' || req.user.VaiTro === 'admin')) {
        next();
    } else {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Chỉ dành cho Admin.' });
    }
};

// Áp dụng kiểm tra Admin cho tất cả các route bên dưới
router.use(checkAdmin);

// ==========================================
// 2. API THỐNG KÊ (DASHBOARD)
// ==========================================
router.get('/stats', async (req, res) => {
    try {
        const [songRows] = await pool.execute('SELECT COUNT(*) as count FROM baihat');
        const [albumRows] = await pool.execute('SELECT COUNT(*) as count FROM album');
        const [userRows] = await pool.execute('SELECT COUNT(*) as count FROM nguoidung');
        const [revenueRows] = await pool.execute(`
            SELECT COALESCE(SUM(TongTien), 0) as total 
            FROM hoadon 
            WHERE TrangThai = 'paid' OR TrangThai = 'completed'
        `);

        res.json({
            totalSongs: songRows[0].count,
            totalAlbums: albumRows[0].count,
            totalUsers: userRows[0].count,
            totalRevenue: parseFloat(revenueRows[0].total)
        });
    } catch (error) {
        res.status(500).json({ error: "Lỗi server khi lấy thống kê" });
    }
});

// ==========================================
// 3. API QUẢN LÝ BÀI HÁT
// ==========================================

// Lấy danh sách bài hát (Phân trang)
router.get('/songs', async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const sql = `
            SELECT b.BaiHatID as id, b.TieuDe as title, b.AnhBiaBaiHat as imageUrl,
                   b.DuongDanAudio as audioUrl,
                   GROUP_CONCAT(n.TenNgheSi SEPARATOR ', ') as artists,
                   b.LuotPhat as listenCount, b.LuotThich as likeCount,
                   b.NgayPhatHanh as releaseDate
            FROM baihat b
            LEFT JOIN baihat_nghesi bn ON b.BaiHatID = bn.BaiHatID
            LEFT JOIN nghesi n ON bn.NgheSiID = n.NgheSiID
            GROUP BY b.BaiHatID
            ORDER BY b.BaiHatID DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        const [rows] = await pool.execute(sql);

        const updatedRows = rows.map(song => ({
            ...song,
            imageUrl: song.imageUrl ? `${BASE_URL}/api/image/song/${song.imageUrl}` : null,
            audioUrl: song.audioUrl ? `${BASE_URL}/api/audio/${song.audioUrl}` : null
        }));

        const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM baihat');
        const totalSongs = countResult[0].total;

        res.json({
            data: updatedRows,
            pagination: { page, limit, totalSongs, totalPages: Math.ceil(totalSongs / limit) }
        });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách bài hát" });
    }
});

// Thêm bài hát mới
router.post('/songs', async (req, res) => {
    const { title, artist, audioUrl, imageUrl } = req.body;
    if (!title || !audioUrl) return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [songResult] = await connection.execute(
            'INSERT INTO baihat (TieuDe, DuongDanAudio, AnhBiaBaiHat, NgayPhatHanh) VALUES (?, ?, ?, NOW())',
            [title, audioUrl, imageUrl || null]
        );
        const songId = songResult.insertId;

        if (artist && artist.trim() !== '') {
            const artistName = artist.trim();
            const [artistRows] = await connection.execute('SELECT NgheSiID FROM nghesi WHERE TenNgheSi = ?', [artistName]);
            let artistId = artistRows.length > 0 ? artistRows[0].NgheSiID : (await connection.execute('INSERT INTO nghesi (TenNgheSi) VALUES (?)', [artistName]))[0].insertId;
            await connection.execute('INSERT INTO baihat_nghesi (BaiHatID, NgheSiID) VALUES (?, ?)', [songId, artistId]);
        }

        await connection.commit();
        res.json({ message: "Thêm bài hát thành công", id: songId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Sửa bài hát
router.put('/songs/:id', async (req, res) => {
    const songId = req.params.id;
    const { title, artist, audioUrl, imageUrl } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute(
            'UPDATE baihat SET TieuDe = ?, DuongDanAudio = ?, AnhBiaBaiHat = ? WHERE BaiHatID = ?',
            [title, audioUrl, imageUrl || null, songId]
        );

        await connection.execute('DELETE FROM baihat_nghesi WHERE BaiHatID = ?', [songId]);
        if (artist && artist.trim() !== '') {
            const [artistRows] = await connection.execute('SELECT NgheSiID FROM nghesi WHERE TenNgheSi = ?', [artist.trim()]);
            let artistId = artistRows.length > 0 ? artistRows[0].NgheSiID : (await connection.execute('INSERT INTO nghesi (TenNgheSi) VALUES (?)', [artist.trim()]))[0].insertId;
            await connection.execute('INSERT INTO baihat_nghesi (BaiHatID, NgheSiID) VALUES (?, ?)', [songId, artistId]);
        }

        await connection.commit();
        res.json({ message: "Cập nhật thành công" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: "Lỗi cập nhật bài hát" });
    } finally {
        connection.release();
    }
});

// Xóa bài hát
router.delete('/songs/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM baihat WHERE BaiHatID = ?', [req.params.id]);
        res.json({ message: "Đã xóa bài hát" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa" });
    }
});

// ==========================================
// 4. API QUẢN LÝ NGHỆ SĨ
// ==========================================
// Ở đây tôi triển khai trực tiếp SQL để đồng bộ với phần Bài hát. 
// Nếu bạn muốn dùng Controller, hãy import và gọi: artistController.getAllArtists

router.get('/artists', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT NgheSiID as id, TenNgheSi as name, TieuSu as bio, AnhDaiDien as avatar FROM nghesi ORDER BY TenNgheSi ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách nghệ sĩ" });
    }
});

router.post('/artists', async (req, res) => {
    const { name, bio, avatar } = req.body;
    try {
        const [result] = await pool.execute('INSERT INTO nghesi (TenNgheSi, TieuSu, AnhDaiDien) VALUES (?, ?, ?)', [name, bio, avatar]);
        res.json({ message: "Thêm nghệ sĩ thành công", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Lỗi thêm nghệ sĩ" });
    }
});

router.put('/artists/:id', async (req, res) => {
    const { name, bio, avatar } = req.body;
    try {
        await pool.execute('UPDATE nghesi SET TenNgheSi = ?, TieuSu = ?, AnhDaiDien = ? WHERE NgheSiID = ?', [name, bio, avatar, req.params.id]);
        res.json({ message: "Cập nhật nghệ sĩ thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật nghệ sĩ" });
    }
});

router.delete('/artists/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM nghesi WHERE NgheSiID = ?', [req.params.id]);
        res.json({ message: "Đã xóa nghệ sĩ" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa nghệ sĩ (Có thể nghệ sĩ đang có bài hát)" });
    }
});

// ==========================================
// 5. API QUẢN LÝ NGƯỜI DÙNG
// ==========================================

router.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT NguoiDungID as id, TenDangNhap as username, Email as email, 
                   TenHienThi as displayName, TrangThai as status, NgayThamGia as joinDate
            FROM nguoidung 
            ORDER BY NgayThamGia DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Lỗi lấy danh sách user" });
    }
});

router.put('/users/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!['active', 'banned'].includes(status)) return res.status(400).json({ error: "Trạng thái không hợp lệ" });

    try {
        await pool.execute('UPDATE nguoidung SET TrangThai = ? WHERE NguoiDungID = ?', [status, req.params.id]);
        res.json({ message: "Cập nhật trạng thái thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi cập nhật" });
    }
});

module.exports = router;