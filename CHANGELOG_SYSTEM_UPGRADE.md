# CareerDNA - Tài Liệu Nâng Cấp Hệ Thống Toàn Diện
**Version**: 2.1.0  
**Ngày cập nhật**: 29/08/2026  
**Tác giả**: CareerDNA Engineering Team  

---

## 📑 Mục lục
1. [Tổng quan nâng cấp](#1-tổng-quan-nâng-cấp)
2. [Chi tiết kiến trúc & Cơ sở dữ liệu (MongoDB Atlas)](#2-chi-tiết-kiến-trúc--cơ-sở-dữ-liệu-mongodb-atlas)
3. [Hệ thống Xác thực & Bảo mật (Bcrypt + Email OTP)](#3-hệ-thống-xác-thực--bảo-mật-bcrypt--email-otp)
4. [Tích hợp Lưu trữ Đám mây Cloudflare R2 (Avatar Storage)](#4-tích-hợp-lưu-trữ-đám-mây-cloudflare-r2-avatar-storage)
5. [Đồng bộ Phiên & Giao diện Người dùng (Frontend UI/UX)](#5-đồng-bộ-phiên--giao-diện-người-dùng-frontend-uiux)
6. [Danh sách API Endpoints](#6-danh-sách-api-endpoints)
7. [Bảng tóm tắt các tệp tin đã tạo & chỉnh sửa](#7-bảng-tóm-tắt-các-tệp-tin-đã-tạo--chỉnh-sửa)
8. [Hướng dẫn cài đặt & Chạy dự án](#8-hướng-dẫn-cài-đặt--chạy-dự-án)

---

## 1. Tổng quan nâng cấp
Dự án **CareerDNA** đã được nâng cấp toàn diện từ kiến trúc phụ thuộc Firebase Client-side sang mô hình **Full-stack Node.js Express + MongoDB Atlas + Cloudflare R2 + Gmail SMTP**:
- **Khắc phục lỗi cú pháp**: Sửa toàn bộ các lỗi đỏ (Red Syntax Errors) trên các trang kiểm thử AI (`career_fit_v2.html`, `brand_test.html`).
- **Chuyển đổi Database**: Chuyển toàn bộ dữ liệu người dùng, kết quả kiểm tra Holland RIASEC, bài đánh giá ATS và tư vấn Lab sang **MongoDB Atlas** (`career`).
- **Bảo mật mật khẩu**: Mã hóa mật khẩu bằng thuật toán **Bcrypt (Salt rounds = 10)**.
- **Xác thực 2 bước (2FA OTP qua Email)**: Tích hợp gửi mã OTP 6 số bảo mật qua **Gmail SMTP** khi đăng ký tài khoản mới và khi quên mật khẩu.
- **Lưu trữ đa phương tiện**: Tích hợp **Cloudflare R2 Object Storage** để lưu trữ và phân phối ảnh đại diện (Avatar) với đường dẫn Public CDN Online siêu tốc.
- **Đồng bộ phiên mượt mà (Cross-Page Session Sync)**: Tự động nhận diện tài khoản và hiển thị Avatar/Tên người dùng trên thanh Menu của toàn bộ 6 trang HTML.

---

## 2. Chi tiết kiến trúc & Cơ sở dữ liệu (MongoDB Atlas)

### 2.1. Kết nối (`src/db/connection.js`)
- Kết nối tới MongoDB Atlas cụm Replica Set với cơ chế tự động kết nối lại (`autoReconnect`), lắng nghe các sự kiện `connected`, `error`, `disconnected`.

### 2.2. Các Collection Schemas:
1. **`users` (`src/db/models/User.js`)**:
   - `uid`, `username`, `email`, `password` (Mã hóa Bcrypt).
   - Thông tin học vấn: `name`, `displayName`, `school`, `department`, `dept`, `grade`, `studentId`, `photoURL`.
   - Kết quả phân tích: `brand_results` (Holland RIASEC, Gallup, Radar Data), `resume_data` (ATS Scores, Metrics, Action Items), `history_brand`, `history_resume`, `history_lab`.
2. **`otp_tokens` (`src/db/models/OtpToken.js`)**:
   - `email`, `code`, `type` (`register`, `forgot_password`), `pendingData`.
   - **TTL Index tự hủy**: `createdAt` tự động xóa khỏi Database sau **600 giây (10 phút)** để bảo vệ an toàn.
3. **`professors` (`src/db/models/Professor.js`)**:
   - Danh bạ giáo sư và phòng Lab chuyên môn trực thuộc các khoa CS, IM, AI của trường Đại học Tĩnh Nghi (Providence University).
4. **`audit_logs` (`src/db/models/AuditLog.js`)**:
   - Ghi nhận lịch sử thao tác hệ thống, phân tích ATS và truy vấn AI.

---

## 3. Hệ thống Xác thực & Bảo mật (Bcrypt + Email OTP)

### 3.1. Dịch vụ Email (`src/services/emailService.js`)
- Kết nối qua giao thức Gmail SMTP (`service: 'gmail'`).
- Tự động tạo mã xác thực ngẫu nhiên 6 chữ số (`crypto.randomInt`).
- Gửi email định dạng HTML chuẩn thiết kế Cyber-Brutalist Klein Blue với thông báo bảo mật rõ ràng.

### 3.2. Luồng Đăng ký Tài khoản (2 Bước):
1. **Bước 1 (Gửi yêu cầu)**: Người dùng nhập Họ tên, Username, Email, Mật khẩu, Khoa, Khóa ➔ Backend kiểm tra trùng lặp ➔ Tạo OTP và gửi email kích hoạt.
2. **Bước 2 (Xác thực OTP)**: Người dùng nhập 6 số OTP ➔ Backend xác minh ➔ Băm mật khẩu bằng Bcrypt ➔ Tạo bản ghi User chính thức trên MongoDB Atlas và tự động đăng nhập.

### 3.3. Luồng Quên & Đặt lại Mật khẩu:
1. Người dùng nhập Username hoặc Email liên kết.
2. Hệ thống gửi mã OTP xác nhận về hộp thư email.
3. Người dùng nhập mã OTP và Mật khẩu mới ➔ Hệ thống cập nhật mật khẩu mã hóa mới và kích hoạt phiên đăng nhập ngay.

---

## 4. Tích hợp Lưu trữ Đám mây Cloudflare R2 (Avatar Storage)

### 4.1. Dịch vụ R2 (`src/services/r2Service.js`)
- Kết nối qua AWS SDK v3 S3-Client tới Cloudflare R2 Bucket `career`.
- Hỗ trợ biến môi trường `R2_PUBLIC_URL="https://pub-a8ce7abf447f4dc8aaa44cce8fbaa433.r2.dev"`.
- Định dạng khóa lưu trữ: `avatars/{uid}_{timestamp}_{hash}.{ext}`.
- Gán header bộ nhớ đệm: `Cache-Control: public, max-age=31536000`.

### 4.2. Quản lý Ảnh đại diện (`profile.html` + `static/db-client.js`)
- Hộp Avatar tương tác với hiệu ứng Hover Camera Overlay.
- Xem trước ảnh ngay lập tức tại Client thông qua `FileReader API`.
- Tải ảnh lên R2 qua API `POST /api/users/:uid/avatar` (hỗ trợ tối đa 5MB, lọc định dạng ảnh JPG, PNG, WEBP, GIF).
- Tự động cập nhật ảnh thu nhỏ trên thanh điều hướng (Navbar) trên tất cả các trang web.

---

## 5. Đồng bộ Phiên & Giao diện Người dùng (Frontend UI/UX)

### 5.1. Adapter Đa năng (`static/db-client.js`)
- Cung cấp đối tượng toàn cục `window.CareerDNA_DB`.
- Hàm `refreshNavbar()` tự động chạy khi tải bất kỳ trang HTML nào để render trạng thái người dùng (Avatar ảnh / Ký tự viết tắt, Tên tài khoản, Nút Đăng xuất).
- Modal đăng nhập/đăng ký nội trang (`createAuthModal`) hiển thị rộng rãi (`max-w-2xl`), thiết kế Cyber-Brutalist đồng nhất với tông màu xanh Klein Blue.

### 5.2. Các trang HTML đã đồng bộ:
- [`profile.html`](profile.html): Nạp dữ liệu tức thì từ Local Session + Background Fetch Atlas, sửa lỗi đóng mở ngoặc Dark Mode và tích hợp Upload Avatar R2.
- [`career_fit_v2.html`](career_fit_v2.html): Khắc phục lỗi thiếu ngoặc nhọn trong hàm `renderResultUI()`.
- [`brand_test.html`](brand_test.html): Khắc phục lỗi thiếu dấu phẩy trong `renderReportView()` trước `drawRadar()`.
- [`lab_recommendation.html`](lab_recommendation.html): Tích hợp Navbar Auth Menu và lưu kết quả tư vấn Lab vào Atlas.
- [`resource_library.html`](resource_library.html): Tích hợp Navbar Auth Menu.
- [`index.html`](index.html): Tích hợp Navbar Auth Menu.

---

## 6. Danh sách API Endpoints

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Đăng nhập bằng Email/Username & Mật khẩu Bcrypt |
| `POST` | `/api/auth/register-request` | Bước 1 Đăng ký: Kiểm tra thông tin & Gửi email OTP |
| `POST` | `/api/auth/register-verify` | Bước 2 Đăng ký: Xác thực mã OTP & Tạo tài khoản |
| `POST` | `/api/auth/forgot-request` | Bước 1 Quên MK: Gửi mã OTP đặt lại mật khẩu |
| `POST` | `/api/auth/forgot-verify-reset` | Bước 2 Quên MK: Xác thực OTP & Cập nhật mật khẩu mới |
| `POST` | `/api/auth/resend-otp` | Gửi lại mã OTP qua email (giới hạn đếm ngược 60s) |
| `GET` | `/api/auth/users-list` | Lấy danh sách tài khoản phục vụ Quick Select |
| `GET` | `/api/users/:uid` | Lấy thông tin hồ sơ người dùng từ MongoDB Atlas |
| `PUT` | `/api/users/:uid/profile` | Cập nhật thông tin cá nhân (Trường, Khoa, Khóa...) |
| `POST` | `/api/users/:uid/avatar` | Tải lên file ảnh đại diện lên Cloudflare R2 |
| `GET` | `/api/r2/file/*` | Stream proxy dữ liệu file/ảnh từ Cloudflare R2 |
| `GET` | `/api/r2/status` | Kiểm tra trạng thái kết nối Cloudflare R2 Bucket |
| `GET` | `/api/db/status` | Kiểm tra trạng thái kết nối và số lượng bản ghi MongoDB |
| `POST` | `/api/users/:uid/brand` | Lưu kết quả trắc nghiệm Holland RIASEC |
| `GET` | `/api/users/:uid/brand` | Lấy kết quả trắc nghiệm Holland RIASEC mới nhất |
| `POST` | `/api/users/:uid/resume` | Lưu dữ liệu phân tích CV & Điểm ATS |
| `GET` | `/api/users/:uid/resume` | Lấy dữ liệu phân tích CV mới nhất |
| `POST` | `/api/users/:uid/lab` | Lưu kết quả tư vấn phòng Lab chuyên môn |
| `GET` | `/api/professors` | Lấy danh sách giáo sư và thông tin phòng Lab |

---

## 7. Bảng tóm tắt các tệp tin đã tạo & chỉnh sửa

| Tệp tin | Trạng thái | Nội dung thực hiện |
| :--- | :--- | :--- |
| `src/services/r2Service.js` | **Mới** | Dịch vụ Cloudflare R2 Storage (Upload & Get File qua S3 API) |
| `src/services/emailService.js` | **Mới** | Dịch vụ gửi Email OTP qua Gmail SMTP |
| `src/db/connection.js` | **Mới** | Module kết nối Mongoose tới MongoDB Atlas |
| `src/db/models/User.js` | **Mới** | Model Người dùng với bảo mật mật khẩu Bcrypt |
| `src/db/models/OtpToken.js` | **Mới** | Model Quản lý mã OTP tự hủy sau 10 phút (TTL Index) |
| `src/db/models/Professor.js` | **Mới** | Model Danh bạ Giáo sư & Lab nghiên cứu |
| `src/db/models/AuditLog.js` | **Mới** | Model Ghi log kiểm toán hệ thống |
| `src/db/models/LegacyResults.js` | **Mới** | Model tương thích ngược cho kết quả trắc nghiệm |
| `src/routes/apiRoutes.js` | **Mới** | Toàn bộ các API Route cho Auth, Profile, OTP, R2 Storage |
| `static/db-client.js` | **Mới** | Client Adapter MongoDB Atlas, Modal Auth, Đồng bộ Navbar |
| `profile.html` | **Chỉnh sửa** | Sửa lỗi Dark Mode, nạp dữ liệu tức thì, thêm Upload Avatar R2 |
| `career_fit_v2.html` | **Chỉnh sửa** | Sửa lỗi cú pháp đỏ, tích hợp Menu Auth MongoDB Atlas |
| `brand_test.html` | **Chỉnh sửa** | Sửa lỗi cú pháp đỏ, tích hợp Menu Auth MongoDB Atlas |
| `lab_recommendation.html` | **Chỉnh sửa** | Tích hợp Menu Auth MongoDB Atlas |
| `resource_library.html` | **Chỉnh sửa** | Tích hợp Menu Auth MongoDB Atlas |
| `index.html` | **Chỉnh sửa** | Tích hợp Menu Auth MongoDB Atlas |
| `src/index.js` | **Chỉnh sửa** | Khởi động MongoDB Atlas và nạp API Routes Express |
| `package.json` | **Chỉnh sửa** | Thêm `@aws-sdk/client-s3`, `multer`, `bcryptjs`, `nodemailer`, lệnh `dev` watch |

---

## 8. Hướng dẫn cài đặt & Chạy dự án

### 8.1. Cài đặt các gói phụ thuộc:
```bash
npm install
```

### 8.2. Cấu hình biến môi trường (`.env`):
Đảm bảo file `.env` đã có đầy đủ các thông tin:
```env
MONGO_URI=mongodb://hoangtho:...@ac-vsmaqqi-shard-00-00.lshgg13.mongodb.net:27017.../career?...
PORT=3001
GEMINI_API_KEY=AIzaSy...
GMAIL_SEND=lehoangtho25122004@gmail.com
GMAIL_SMTP="tpzn cqkb jpzf mdso"
R2_ENDPOINT="https://69cb1e7a43247b468f02c7dd47ceb3d8.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="a572e555e2b571acfdf3df758b7a46e9"
R2_SECRET_ACCESS_KEY="ed109886054079bdf283ae2fb9fd4d6c72739e173e2a4d063fca41e352a45259"
R2_BUCKET_NAME="career"
R2_PUBLIC_URL="https://pub-a8ce7abf447f4dc8aaa44cce8fbaa433.r2.dev"
```

### 8.3. Khởi chạy Server ở chế độ phát triển (Auto-Restart Watch Mode):
```bash
npm run dev
# hoặc
$env:PORT="3001"; node --watch src/index.js
```

### 8.4. Truy cập hệ thống:
- Trang chủ: [http://localhost:3001/index.html](http://localhost:3001/index.html)
- Hồ sơ cá nhân & Đổi Avatar: [http://localhost:3001/profile.html](http://localhost:3001/profile.html)
- AI 履歷健檢: [http://localhost:3001/career_fit_v2.html](http://localhost:3001/career_fit_v2.html)
- 品牌測驗: [http://localhost:3001/brand_test.html](http://localhost:3001/brand_test.html)
- 科系適配: [http://localhost:3001/lab_recommendation.html](http://localhost:3001/lab_recommendation.html)
- 學習資源: [http://localhost:3001/resource_library.html](http://localhost:3001/resource_library.html)
