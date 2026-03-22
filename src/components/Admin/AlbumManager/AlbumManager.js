import React, { useState, useEffect } from 'react';
import './AlbumManager.css';

function AlbumManager() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // State cho form
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    artists: '',
    description: ''
  });

  const fetchAlbums = (page = 1) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch(`http://localhost:5001/api/admin/albums?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    })
    .then(response => {
      // Hàm xử lý URL ảnh
      const processAlbum = (album) => ({
          ...album,
          imageUrl: (album.imageUrl && (album.imageUrl.startsWith('http') || album.imageUrl.startsWith('https'))) 
              ? album.imageUrl 
              : (album.imageUrl ? `http://localhost:5001/api/image/album/${album.imageUrl}` : null)
      });

      if (response.data && Array.isArray(response.data)) {
        setAlbums(response.data.map(processAlbum));
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(response.pagination.page);
        }
      } else if (Array.isArray(response)) {
          // Fallback nếu API trả về mảng trực tiếp
          setAlbums(response.map(processAlbum));
      } else {
          setAlbums([]);
      }
    })
    .catch(err => {
        console.error("Lỗi khi tải danh sách album, sử dụng Mock Data:", err);
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlbums(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa album này?")) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:5001/api/admin/albums/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Đã xóa thành công");
        fetchAlbums(currentPage);
      })
      .catch(err => alert("Lỗi khi xóa album"));
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ title: '', imageUrl: '', artists: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (album) => {
    setIsEditing(true);
    setEditingId(album.id);
    setFormData({
      title: album.title || '',
      imageUrl: album.imageUrl || '',
      artists: album.artists || '',
      description: album.description || ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEditing ? `http://localhost:5001/api/admin/albums/${editingId}` : 'http://localhost:5001/api/admin/albums';
    const method = isEditing ? 'PUT' : 'POST';

    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.message || data.id) {
        alert(isEditing ? "Cập nhật thành công!" : "Thêm album thành công!");
        setShowModal(false);
        fetchAlbums(currentPage);
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    })
    .catch(err => alert("Lỗi kết nối server"));
  };

  if (loading && albums.length === 0) return <div style={{ padding: '20px' }}>Đang tải danh sách album...</div>;

  return (
    <div className="album-manager">
      <div className="manager-header">
        <h2>Quản Lý Album</h2>
        <button className="admin-btn btn-primary" onClick={openAddModal}>+ Thêm Album</button>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên Album</th>
              <th>Nghệ Sĩ</th>
              <th>Mô Tả</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {albums.length > 0 ? (
                albums.map(album => (
                <tr key={album.id}>
                    <td>#{album.id}</td>
                    <td><img src={album.imageUrl || 'https://placehold.co/40x40'} alt={album.title} className="album-thumb" /></td>
                    <td>{album.title}</td>
                    <td>{album.artists}</td>
                    <td className="description-cell">{album.description}</td>
                    <td>
                    <button className="admin-btn btn-edit" onClick={() => openEditModal(album)}>Sửa</button>
                    <button className="admin-btn btn-danger" onClick={() => handleDelete(album.id)}>Xóa</button>
                    </td>
                </tr>
                ))
            ) : (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>Không có dữ liệu album</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button className="admin-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>Trước</button>
            <span>Trang {currentPage} / {totalPages}</span>
            <button className="admin-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Sau</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? 'Cập Nhật Album' : 'Thêm Album Mới'}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Album (*)</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="Nhập tên album" />
              </div>
              <div className="form-group">
                <label>Nghệ Sĩ</label>
                <input type="text" name="artists" value={formData.artists} onChange={handleInputChange} placeholder="Nhập tên nghệ sĩ" />
              </div>
              <div className="form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Nhập mô tả album"></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn btn-primary">{isEditing ? 'Cập Nhật' : 'Thêm Mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlbumManager;