# Cấu Trúc Component Frontend (React.js)

Tài liệu này mô tả chi tiết chức năng, cấu trúc thư mục và luồng hoạt động của các component giao diện trong dự án MusicWeb.

## 1. Thành Phần Cốt Lõi (Root)
- **`App.js`**: Component gốc của toàn bộ ứng dụng. Đóng vai trò là trung tâm quản lý:
  - **Routing**: Định tuyến các URL (ví dụ `/admin`, `/album/:id`).
  - **Global State**: Nơi lưu trữ trạng thái âm nhạc toàn cục (Bài hát đang phát là bài nào, đang play hay pause) để nhạc không bị ngắt khi người dùng chuyển trang.
- **`App.css`**: File định nghĩa các phong cách CSS chung (Global styles), chứa các biến màu chủ đạo và reset CSS.

## 2. Thành Phần Bố Cục Chỉnh (Layout)
- **`Header/`**: Thanh điều hướng nằm ở trên cùng màn hình. Thường chứa ô tìm kiếm (Search), logo trang web, và cụm nút tương tác người dùng (Đăng nhập, Đăng ký, hiển thị Avatar người dùng).
- **`PlayerControls/`**: Thanh điều khiển âm nhạc (Audio Player) được ghim cố định ở cạnh dưới màn hình. Chức năng chính bao gồm: Nút Play/Pause, Next, Prev, thanh tiến trình (progress bar), chỉnh âm lượng. Component này trực tiếp dùng thẻ `<audio>` của HTML5 kết hợp với state từ `App.js`.

## 3. Thành Phần Quản Trị Dành Cho Admin (`src/components/Admin/`)
Khu vực này được bảo vệ bởi Route đặc biệt, chỉ người có vai trò (Role) `admin` mới được truy cập.
- **`Dashboard/`**: Giao diện tổng quan cho quản trị viên. Trình bày các thẻ số liệu thống kê (Tổng số user, bài hát, doanh thu) và các biểu đồ trực quan (dùng `react-chartjs-2`).
- **`SongManager.js`**: Bảng dữ liệu quản lý tất cả bài hát. Tích hợp tính năng phân trang, nút Thêm/Sửa/Xóa. Sử dụng Modal (hộp thoại nổi) để nhập thông tin `title`, `audioUrl`, `imageUrl` và gán `albumId`.
- **`ArtistManager.js`**: Bảng quản lý Nghệ sĩ. Hiển thị thông tin ID, Ảnh đại diện, Mô tả. Hỗ trợ thao tác cập nhật (Sửa) thông tin và xóa nghệ sĩ.
- *(Các module khác như `AlbumManager`, `UserManager`)*: Phục vụ tương ứng việc kiểm soát dữ liệu Album và cấm/mở khóa người dùng.

## 4. Thành Phần Tương Tác Của Người Dùng
- **`Login/`**: Modal chứa form Đăng nhập và Đăng ký. Sau khi submit, component này gọi API `/api/login` (hoặc register) xuống Backend. Nếu thành công, nó sẽ lưu `Token` và thông tin người dùng vào `localStorage` của trình duyệt.
- **`VIPUpgrade/`**: Giao diện mua gói cước Premium. Hiển thị bảng giá các gói VIP, xử lý luồng thanh toán gọi xuống API `/api/payment/process` để nâng cấp quyền "Không quảng cáo".
- **`AlbumDetail/`**: Trang chi tiết khi nhấp vào một Album. Gọi API để lấy ảnh bìa Album và xuất ra danh sách bài hát thuộc album đó. Khi người dùng click vào một bài hát trong danh sách, thông tin sẽ được gửi lên `App.js` để phát nhạc.
- **`PlaylistLibrary/`** & **`PlaylistDetail/`**: Quản lý danh sách các playlist cá nhân của người dùng và hiển thị chi tiết các bài hát bên trong một playlist cụ thể.
- **`FavoritesLibrary/`**: Giao diện hiển thị danh sách các bài hát mà người dùng đã thả tim (lưu vào bảng `baihatyeuthich`).
- **`ListenHistory/`**: Hiển thị danh sách các bài hát người dùng đã nghe gần đây, dựa trên dữ liệu lịch sử được ghi nhận mỗi khi bài hát phát qua giây thứ 30.
- **`UserProfile/`**: Trang thông tin cá nhân của người dùng, cho phép xem thông tin tài khoản và (có thể) chỉnh sửa profile.

## 5. Các Component Phụ Trợ & Giao Dịch
- **`Sidebar/`**: Thanh menu điều hướng bên trái màn hình. Trứa các link chuyển trang (Trang chủ, Album, Playlist, Yêu thích, Lịch sử).
- **`MainContent/`**: Khu vực nội dung hiển thị mặc định khi ở trang chủ (chứa bảng xếp hạng, gợi ý bài hát mới).
- **`PlaylistQueue/`**: Bảng danh sách chờ phát nhạc (Queue). Cho biết bài hát nào đang phát và danh sách các bài tiếp theo.
- **`AlbumLibrary/`**: Trang tổng hợp, hiển thị tất cả các Album âm nhạc có trên hệ thống để người dùng lướt chọn.
- **`AdWeb/`**: Component hiển thị banner quảng cáo. Thường được thiết lập ẩn đi nếu `App.js` xác định người dùng đang có gói VIP active.

### 5.1 Giao Dịch (Payments & Invoices)
- **`PaymentPage/`**: Giao diện xử lý việc thanh toán sau khi người dùng chọn mua một gói VIP.
- **`InvoiceHistory/`** & **`InvoiceDetail/`**: Hiển thị lịch sử các giao dịch đã mua (hóa đơn) và chi tiết các gói cước trong hóa đơn đó.

### 5.2 Các Modals Khác
- **`SongActionModal/`**: Hộp thoại tùy chọn mở ra khi nhấn vào biểu tượng "3 chấm" trên một bài hát (chứa các tính năng: Thêm vào Playlist, Yêu thích,...).
- **`AddToPlaylistModal/`**: Hộp thoại hiển thị danh sách các Playlist hiện có của người dùng để họ chọn và lưu bài hát đang nghe vào đó.

## 6. Tóm Tắt Luồng Dữ Liệu (Data Flow) Chuẩn
Hầu hết các component bên trong dự án giao tiếp với Backend thông qua nguyên tắc sau:

1. **Gọi API (Fetch/Axios)**: Component sử dụng hook `useEffect()` để thực hiện request HTTP tới `http://localhost:5001/api/...` ngay khi trang vừa tải (Component mount).
2. **Gắn Token**: Nếu API cần xác thực, `localStorage.getItem('token')` sẽ được nhúng vào cấu hình Header `Authorization: Bearer <token>`.
3. **Cập nhật State**: Dữ liệu nhận về được bóc tách từ JSON và đưa vào state cục bộ thông qua hook `useState()`.
4. **Hiển thị (Render)**: Giao diện React tự động vẽ lại (re-render) DOM dựa trên dữ liệu vừa nằm trong mảng state.