import React, { useState, useEffect } from 'react';
import './ArtistManager.css';

function ArtistManager() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // State cho form
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    description: ''
  });

  const fetchArtists = (page = 1) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch(`http://localhost:5001/api/admin/artists?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
    })
    .then(response => {
      // Hàm xử lý dữ liệu nghệ sĩ (Map avatar -> imageUrl, bio -> description)
      const processArtist = (artist) => ({
          ...artist,
          // Ưu tiên imageUrl nếu có, nếu không dùng avatar từ DB
          imageUrl: (artist.imageUrl || artist.avatar) 
            ? ((artist.imageUrl || artist.avatar).startsWith('http') 
                ? (artist.imageUrl || artist.avatar) 
                : `http://localhost:5001/api/image/avatar/${artist.imageUrl || artist.avatar}`) 
            : null,
          description: artist.description || artist.bio // Map trường bio từ DB sang description
      });

      if (response.data && Array.isArray(response.data)) {
        setArtists(response.data.map(processArtist));
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(response.pagination.page);
        }
      } else if (Array.isArray(response)) {
        // Fallback nếu API trả về một mảng trực tiếp không có phân trang
        setArtists(response.map(processArtist));
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        setArtists([]); // Đảm bảo artists là một mảng nếu API trả về lỗi
      }
    })
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArtists(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nghệ sĩ này? Mọi bài hát và album liên quan có thể bị ảnh hưởng.")) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:5001/api/admin/artists/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        alert(data.message || "Đã xóa thành công");
        fetchArtists(currentPage);
      })
      .catch(err => alert("Lỗi khi xóa nghệ sĩ"));
    }
  };

  const openEditModal = (artist) => {
    setEditingId(artist.id);
    setFormData({
      name: artist.name || '',
      imageUrl: artist.imageUrl || '',
      description: artist.description || ''
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
    const url = `http://localhost:5001/api/admin/artists/${editingId}`;
    const method = 'PUT';

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
        alert("Cập nhật thành công!");
        setShowModal(false);
        fetchArtists(currentPage);
      } else {
        alert(data.error || "Có lỗi xảy ra");
      }
    })
    .catch(err => alert("Lỗi kết nối server"));
  };

  if (loading && artists.length === 0) return <div style={{ padding: '20px' }}>Đang tải danh sách nghệ sĩ...</div>;

  return (
    <div className="artist-manager">
      <div className="manager-header">
        <h2>Quản Lý Nghệ Sĩ</h2>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên Nghệ Sĩ</th>
              <th>Mô Tả</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {artists.length > 0 ? (
              artists.map(artist => (
                <tr key={artist.id}>
                  <td>#{artist.id}</td>
                  <td><img src={artist.imageUrl || 'https://placehold.co/50x50'} alt={artist.name} className="artist-avatar" /></td>
                  <td>{artist.name}</td>
                  <td className="description-cell">{artist.description}</td>
                  <td>
                    <button className="admin-btn btn-edit" onClick={() => openEditModal(artist)}>Sửa</button>
                    <button className="admin-btn btn-danger" onClick={() => handleDelete(artist.id)}>Xóa</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu nghệ sĩ.</td></tr>
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
              <h3>Cập Nhật Nghệ Sĩ</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tên Nghệ Sĩ (*)</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Nhập tên nghệ sĩ" />
              </div>
              <div className="form-group">
                <label>Đường dẫn ảnh</label>
                <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://example.com/image.jpg" />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Nhập mô tả ngắn về nghệ sĩ"></textarea>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn btn-primary">Cập Nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtistManager;
