import React from 'react';
import './AdminLayout.css';
import { 
  IoHomeOutline, 
  IoMusicalNotesOutline, 
  IoPersonOutline, 
  IoDiscOutline, 
  IoMicOutline, 
  IoLogOutOutline 
} from 'react-icons/io5';

function AdminLayout({ children, currentView, onNavigate, onLogout }) {
  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>Music Admin</h2>
        </div>
        
        <ul className="admin-menu">
          <li 
            className={currentView === 'dashboard' ? 'active' : ''} 
            onClick={() => onNavigate('dashboard')}
          >
            <IoHomeOutline />
            <span>Tổng quát</span>
          </li>
          
          <li 
            className={currentView === 'songs' ? 'active' : ''} 
            onClick={() => onNavigate('songs')}
          >
            <IoMusicalNotesOutline />
            <span>Quản lý Bài hát</span>
          </li>

          <li 
            className={currentView === 'albums' ? 'active' : ''} 
            onClick={() => onNavigate('albums')}
          >
            <IoDiscOutline />
            <span>Quản lý Album</span>
          </li>

          <li 
            className={currentView === 'artists' ? 'active' : ''} 
            onClick={() => onNavigate('artists')}
          >
            <IoMicOutline />
            <span>Quản lý Nghệ sĩ</span>
          </li>

          <li 
            className={currentView === 'users' ? 'active' : ''} 
            onClick={() => onNavigate('users')}
          >
            <IoPersonOutline />
            <span>Quản lý Người dùng</span>
          </li>
        </ul>

        <div className="admin-logout" onClick={onLogout}>
          <IoLogOutOutline />
          <span>Đăng xuất</span>
        </div>
      </div>

      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}

export default AdminLayout;