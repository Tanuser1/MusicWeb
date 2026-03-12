import React, { useState, useEffect } from 'react';
import './ArtistManager.css';

function ArtistManager() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dữ liệu mẫu (Mock Data)
  const MOCK_ARTISTS = [
    { id: 1, name: 'Sơn Tùng M-TP', description: 'Ca sĩ nhạc Pop hàng đầu Việt Nam', imageUrl: 'https://placehold.co/100x100?text=ST' },
    { id: 2, name: 'Đen Vâu', description: 'Rapper nổi tiếng với lời ca mộc mạc', imageUrl: 'https://placehold.co/100x100?text=Den' },
    { id: 3, name: 'Mỹ Tâm', description: 'Họa mi tóc nâu', imageUrl: 'https://placehold.co/100x100?text=MyTam' },
    { id: 4, name: 'Binz', description: 'Rapper Bad boy', imageUrl: 'https://placehold.co/100x100?text=Binz' },
    { id: 5, name: 'JustaTee', description: 'Ông hoàng Melody', imageUrl: 'https://placehold.co/100x100?text=JayTee' },
    { id: 6, name: 'Đông Nhi', description: 'Nữ ca sĩ đa tài, hoàng hậu của V-Pop', imageUrl: 'https://placehold.co/100x100?text=DongNhi' },
    { id: 7, name: 'Noo Phước Thịnh', description: 'Nam ca sĩ ballad ngọt ngào', imageUrl: 'https://placehold.co/100x100?text=Noo' },
    { id: 8, name: 'Erik', description: 'Prince of V-Pop - Ca sĩ trẻ tài năng', imageUrl: 'https://placehold.co/100x100?text=Erik' },
    { id: 9, name: 'Hương Tràm', description: 'Giọng ca vàng của The Voice', imageUrl: 'https://placehold.co/100x100?text=HuongTram' },
    { id: 10, name: 'Bích Phương', description: 'Nữ hoàng nhạc dance Việt Nam', imageUrl: 'https://placehold.co/100x100?text=BichPhuong' },
  
    { id: 11, name: 'Trịnh Thăng Bình', description: 'Ông hoàng ballad lãng mạn', imageUrl: 'https://placehold.co/100x100?text=TTB' },
    { id: 12, name: 'Tóc Tiên', description: 'Nữ ca sĩ sexy & năng động', imageUrl: 'https://placehold.co/100x100?text=TocTien' },
    { id: 13, name: 'Isaac', description: 'Thành viên 365 - Ca sĩ đa năng', imageUrl: 'https://placehold.co/100x100?text=Isaac' },
    { id: 14, name: 'Karik', description: 'Rapper & ca sĩ có chất riêng', imageUrl: 'https://placehold.co/100x100?text=Karik' },
    { id: 15, name: 'Suboi', description: 'Nữ rapper tiên phong của Việt Nam', imageUrl: 'https://placehold.co/100x100?text=Suboi' },
  
  
  ];

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
    .catch(err => {
        console.error("Lỗi khi tải danh sách nghệ sĩ, sử dụng Mock Data:", err);
        setArtists(MOCK_ARTISTS);
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

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ name: '', imageUrl: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (artist) => {
    setIsEditing(true);
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
    const url = isEditing ? `http://localhost:5001/api/admin/artists/${editingId}` : 'http://localhost:5001/api/admin/artists';
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
        alert(isEditing ? "Cập nhật thành công!" : "Thêm nghệ sĩ thành công!");
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
        <button className="admin-btn btn-primary" onClick={openAddModal}>+ Thêm Nghệ Sĩ</button>
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
              <h3>{isEditing ? 'Cập Nhật Nghệ Sĩ' : 'Thêm Nghệ Sĩ Mới'}</h3>
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
                <button type="submit" className="admin-btn btn-primary">{isEditing ? 'Cập Nhật' : 'Thêm Mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArtistManager;
