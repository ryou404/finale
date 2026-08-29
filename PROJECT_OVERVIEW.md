# 🚀 CAREERDNA // TỔNG QUAN HỆ THỐNG & KIẾN TRÚC TOÀN DIỆN
> **Providence University (靜宜大學) AI Career Exploration & Multi-Agent Resume Optimization Platform**  
> *Hệ thống Định hướng Nghề nghiệp, Trắc nghiệm Holland RIASEC và Tối ưu hóa CV theo chuẩn Golden Triangle ATS với Kiến trúc Multi-Agent AI.*

---

## 📑 MỤC LỤC
1. [Giới thiệu Dự án](#1-giới-thiệu-dự-án)
2. [Kiến trúc Tổng thể Hệ thống (Architecture Diagram)](#2-kiến-trúc-tổng-thể-hệ-thống)
3. [Các Chức Năng Chính (Core Modules & Pages)](#3-các-chức-năng-chính)
4. [Hệ Thống Multi-Agent AI (5-Agent Pipeline)](#4-hệ-thống-multi-agent-ai)
5. [Cơ Sở Dữ Liệu MongoDB Atlas (Database Schemas)](#5-cơ-sở-dữ-liệu-mongodb-atlas)
6. [Hệ Thống Xác Thực & Lưu Trữ Đám Mây](#6-hệ-thống-xác-thực--lưu-trữ-đám-mây)
7. [Danh Sách Routing & API Endpoints](#7-danh-sách-routing--api-endpoints)
8. [Công Nghệ Sử Dụng (Tech Stack)](#8-công-nghệ-sử-dụng)
9. [Hướng Dẫn Cài Đặt & Vận Hành](#9-hướng-dẫn-cài-đặt--vận-hành)

---

## 1. Giới thiệu Dự án

**CareerDNA** là nền tảng định hướng nghề nghiệp và tối ưu hóa hồ sơ năng lực ứng dụng trí tuệ nhân tạo (AI) được thiết kế chuyên biệt cho sinh viên các khối ngành Công nghệ thông tin (CNTT/Khoa học máy tính - **CS**, Hệ thống thông tin quản lý - **IM**, Trí tuệ nhân tạo - **AI**) tại Đại học Tĩnh Nghi (Providence University - 靜宜大學).

### 🎯 Mục tiêu cốt lõi:
- **Định vị Thương hiệu Cá nhân**: Khám phá thiên hướng nghề nghiệp qua mô hình trắc nghiệm đa chiều **Holland RIASEC** kết hợp **Gallup Strengths**.
- **AI Đánh giá Hồ sơ (ATS Audit)**: Chấm điểm CV theo tiêu chuẩn **Golden Triangle ATS** (Độ tương thích kinh nghiệm, Mật độ kỹ năng cứng, Khả năng định lượng kết quả với công thức Google XYZ & Micro-Star).
- **Cầu nối Học thuật - Doanh nghiệp (Academic Gap Filler)**: Đối chiếu lỗ hổng kỹ năng của sinh viên với lộ trình học tập thực tế, các môn học chuyên ngành và phòng Lab nghiên cứu tại Đại học Tĩnh Nghi.
- **Bảo mật & Tốc độ cao**: Sử dụng MongoDB Atlas Replica Set, mã hóa mật khẩu Bcrypt, xác thực 2 bước qua Gmail OTP và lưu trữ Avatar đa phương tiện trên Cloudflare R2 CDN.

---

## 2. Kiến trúc Tổng thể Hệ thống

```
+---------------------------------------------------------------------------------------+
|                                    FRONTEND LAYER                                     |
|  [index.html]   [career_fit_v2.html]   [brand_test.html]   [lab_recommendation.html]  |
|  [profile.html] [resource_library.html]                                               |
|  Universal Adapter: static/db-client.js (Session Persistence & Auth Modal)            |
+-------------------------------------------+-------------------------------------------+
                                            | REST API / JSON
                                            v
+---------------------------------------------------------------------------------------+
|                                BACKEND EXPRESS SERVER                                 |
|                                     (Port 3001)                                       |
|  +---------------------------------------------------------------------------------+  |
|  | API Routing Layer (src/routes/apiRoutes.js)                                      |  |
|  | - Auth & OTP Routes    - User Profile Routes    - R2 Avatar Streamer            |  |
|  | - Brand Results Routes - ATS Audit Routes       - Lab & Professor Directory      |  |
|  +---------------------------------------------------------------------------------+  |
|  | Business Logic & Multi-Agent Orchestration Layer                                |  |
|  | - MasterOrchestrator   - DeterministicEngine    - Google Gemini 2.5 Flash Engine|  |
|  | - Email Service (SMTP) - Cloudflare R2 Service  - Mongoose ODM Layer            |  |
|  +---------------------------------------------------------------------------------+  |
+-------------------+-------------------------------+-------------------+---------------+
                    |                               |                   |
                    v                               v                   v
     +------------------------------+ +--------------------+ +--------------------+
     |        MONGODB ATLAS         | |   CLOUDFLARE R2    | |     GMAIL SMTP     |
     | Database: "career"           | | Bucket: "career"   | | lehoangtho25122004 |
     | - users (Profiles, CV, Brand)| | CDN: *.r2.dev      | | 6-digit Auto-OTP   |
     | - otp_tokens (TTL 10 mins)   | | Avatars Storage    | | Branded HTML Emails|
     | - professors (Lab Directory) | +--------------------+ +--------------------+
     | - audit_logs                 |
     +------------------------------+
```

---

## 3. Các Chức Năng Chính (Core Modules & Pages)

### 3.1. Trang Chủ Cyber-Brutalist ([`index.html`](file:///j:/ThoBeo/finale/index.html))
- **Tổng quan & Điều hướng**: Giới thiệu hệ sinh thái CareerDNA, HUD Telemetry thời gian thực.
- **Thanh Menu Toàn Cục**: Tự động nhận diện tài khoản, hiển thị Avatar/Tên đăng nhập và nút Đăng xuất trực tiếp.

### 3.2. AI 履歷健檢 - Khám Sức Khỏe CV & Golden Triangle ATS ([`career_fit_v2.html`](file:///j:/ThoBeo/finale/career_fit_v2.html))
- **Lựa chọn Vị trí Ứng tuyển**: Frontend, Backend, AI Engineer, Data Analyst, Cloud DevOps, Product Manager...
- **Nhập dữ liệu linh hoạt**: Chọn môn học đã tích lũy tại ĐH Tĩnh Nghi, dự án thực tế, chứng chỉ hoặc tải lên bản nháp CV.
- **Chấm điểm ATS thời gian thực (0 - 100 điểm)**:
  - *Experience Match*: Độ khớp giữa kinh nghiệm và yêu cầu công việc.
  - *Hard Skills Density*: Mật độ từ khóa công nghệ và kỹ năng cốt lõi.
  - *Impact Quantifiability*: Tỷ lệ định lượng kết quả theo công thức **Google XYZ Formula** (`Accomplished [X] as measured by [Y], by doing [Z]`).
- **Gợi ý Hành động Tức thì**: Danh sách các việc cần bổ sung để cải thiện điểm số và đề xuất môn học còn thiếu tại trường.

### 3.3. 品牌測驗 - Định Vị Thương Hiệu & Trắc Nghiệm Holland RIASEC ([`brand_test.html`](file:///j:/ThoBeo/finale/brand_test.html))
- **Trắc nghiệm đa chiều**: Bộ câu hỏi tình huống mô phỏng môi trường làm việc thực tế.
- **Biểu đồ Radar Radar Chart**: Phân tích 6 nhóm tính cách nghề nghiệp RIASEC:
  - **R** (Realistic - Thực tế) | **I** (Investigative - Nghiên cứu) | **A** (Artistic - Nghệ thuật)
  - **S** (Social - Xã hội) | **E** (Enterprising - Quản lý) | **C** (Conventional - Quy củ)
- **Tích hợp Gallup Strengths**: Đưa ra Top 3 thế mạnh vượt trội và lộ trình hành động 30 - 60 - 90 ngày.
- **Đồng bộ Cloud Atlas**: Tự động lưu trữ lịch sử trắc nghiệm vào cơ sở dữ liệu `career.users`.

### 3.4. 科系適配 - Định Hướng Chuyên Ngành & Lab Nghiên Cứu ([`lab_recommendation.html`](file:///j:/ThoBeo/finale/lab_recommendation.html))
- **Chẩn đoán Phù hợp Khoa**: Đánh giá mức độ tương thích giữa tính cách học thuật và 3 khoa chính: **CS (Khoa học máy tính)**, **IM (Hệ thống thông tin)**, **AI (Trí tuệ nhân tạo)**.
- **Danh Bạ Phòng Lab & Giáo Sư Hướng Dẫn**: Kết nối dữ liệu thực tế từ collection `professors`, hiển thị hướng nghiên cứu, email liên hệ, văn phòng và các dự án trọng điểm.

### 3.5. 個人檔案 - Cài Đặt Hồ Sơ & Đổi Avatar R2 ([`profile.html`](file:///j:/ThoBeo/finale/profile.html))
- **Zero-Latency Data Rendering**: Tự động điền tức thì thông tin học vấn (Trường, Khoa, Khóa, Email, Username).
- **Tải lên & Quản lý Avatar qua Cloudflare R2**:
  - Hộp Avatar với giao diện Cyber-Brutalist tương tác.
  - Xem trước ảnh tức thì (Instant Preview) trước khi lưu.
  - Đẩy ảnh trực tiếp lên **Cloudflare R2** và lấy link phân phối Public CDN siêu tốc (`https://pub-a8ce7abf447f4dc8aaa44cce8fbaa433.r2.dev/avatars/...`).
- **Tùy chỉnh Giao diện**: Hỗ trợ chuyển đổi chế độ **Dark Mode (Cyber-HUD)** và **Light Mode**.

### 3.6. 學習資源 - Thư Viện Tài Nguyên Công Nghệ ([`resource_library.html`](file:///j:/ThoBeo/finale/resource_library.html))
- Lộ trình Roadmap kỹ thuật chi tiết dành cho lập trình viên.
- Tổng hợp tài liệu chuẩn, chứng chỉ quốc tế và các bài thực hành chuyên sâu.

---

## 4. Hệ Thống Multi-Agent AI (5-Agent Pipeline)

Hệ thống sử dụng mô hình ngôn ngữ **Google Gemini 2.5 Flash** với tham số `temperature: 0.2` (khóa cứng <= 0.3) để đảm bảo tính ổn định và tính tất định (Deterministic Output).

```
                 [ User Input / CV Draft / Courses ]
                                  |
                                  v
                   +-----------------------------+
                   |     1. ProfileAgent         |  Trích xuất thông tin cá nhân, khoa,
                   +--------------+--------------+  năm học & mục tiêu nghề nghiệp.
                                  |
                                  v
                   +-----------------------------+
                   |  2. AcademicGapFillerAgent  |  Đối chiếu kỹ năng với môn học &
                   +--------------+--------------+  chương trình đào tạo ĐH Tĩnh Nghi.
                                  |
                                  v
                   +-----------------------------+
                   |    3. ResumeBuilderAgent    |  Tái cấu trúc nội dung CV theo chuẩn
                   +--------------+--------------+  Google XYZ & Micro-Star (STAR-L).
                                  |
                                  v
                   +-----------------------------+
                   |     4. AtsAuditorAgent      |  Chấm điểm Golden Triangle ATS &
                   +--------------+--------------+  tạo danh sách Action Items.
                                  |
                                  v
                   +-----------------------------+
                   |   5. MasterOrchestrator     |  Tổng hợp kết quả cuối cùng và
                   +-----------------------------+  đồng bộ vào MongoDB Atlas.
```

---

## 5. Cơ Sở Dữ Liệu MongoDB Atlas (Database Schemas)

Kết nối tới cơ sở dữ liệu **`career`** trên MongoDB Atlas:

### 5.1. Collection `users` ([`User.js`](file:///j:/ThoBeo/finale/src/db/models/User.js))
```javascript
{
  uid: String,              // ID duy nhất (ví dụ: usr_mtdwl1imqyi7)
  username: String,         // Tên đăng nhập
  password: String,         // Mật khẩu mã hóa Bcrypt (Salt rounds = 10)
  email: String,            // Email xác thực
  name: String,             // Họ và tên / Biệt danh
  displayName: String,
  photoURL: String,         // Link ảnh đại diện lưu trên Cloudflare R2
  school: String,           // Trường (mặc định: 靜宜大學)
  department: String,       // Khoa (CS / IM / AI)
  grade: String,            // Năm học (大一 / 大二 / 大三 / 大四 / 碩士)
  skills: [String],         // Danh sách kỹ năng
  brand_results: {          // Kết quả trắc nghiệm Holland RIASEC
    latest: {
      topHollandCode: String,
      fitScore: Number,
      radarData: Array,
      date: Date
    }
  },
  resume_data: {            // Dữ liệu phân tích CV & Điểm ATS
    latest: {
      scores: { overall: Number, hardSkills: Number, impact: Number, experience: Number },
      actionItems: Array,
      targetRole: String,
      formattedResumeMarkdown: String,
      updatedAt: Date
    }
  },
  settings: { darkMode: Boolean },
  createdAt: Date,
  updatedAt: Date
}
```

### 5.2. Collection `otp_tokens` ([`OtpToken.js`](file:///j:/ThoBeo/finale/src/db/models/OtpToken.js))
- Quản lý mã OTP xác thực email khi Đăng ký và Quên mật khẩu.
- Có **TTL Index (Time-To-Live)** tự động tiêu hủy token sau **600 giây (10 phút)**.

### 5.3. Collection `professors` ([`Professor.js`](file:///j:/ThoBeo/finale/src/db/models/Professor.js))
- Lưu thông tin các Giáo sư, chức danh, khoa phụ trách, tên phòng Lab, hướng nghiên cứu, phòng làm việc và email.

### 5.4. Collection `audit_logs` ([`AuditLog.js`](file:///j:/ThoBeo/finale/src/db/models/AuditLog.js))
- Ghi nhận lịch sử kiểm toán ATS và các thay đổi dữ liệu quan trọng.

---

## 6. Hệ Thống Xác Thực & Lưu Trữ Đám Mây

### 6.1. Xác thực 2 Bước (2FA Email OTP) & Mã Hóa Mật Khẩu
- **Bcrypt Password Hashing**: Mật khẩu của người dùng được mã hóa một chiều an toàn trước khi lưu vào MongoDB Atlas.
- **Gmail SMTP OTP Verification**:
  - Gửi mã OTP 6 số ngẫu nhiên qua email `lehoangtho25122004@gmail.com`.
  - Mẫu email HTML chuyên nghiệp, hiển thị rõ ràng mã xác nhận và thời hạn hiệu lực.
  - Tích hợp cả luồng **Đăng ký tài khoản mới** và **Quên/Đặt lại mật khẩu**.

### 6.2. Lưu Trữ Đa Phương Tiện Cloudflare R2
- **Dịch vụ S3-Compatible**: Tương thích hoàn toàn với AWS S3 SDK v3 (`@aws-sdk/client-s3`).
- **Phân phối CDN công khai**: Cung cấp đường dẫn ảnh online trực tiếp dạng `https://pub-a8ce7abf447f4dc8aaa44cce8fbaa433.r2.dev/avatars/...`.
- **Cơ chế Proxy Streamer Fallback**: Hỗ trợ endpoint `/api/r2/file/*` cho phép stream ảnh trực tiếp trong trường hợp môi trường nội bộ.

---

## 7. Danh Sách Routing & API Endpoints

### 7.1. Web Pages Routes
| Tuyến đường (URL) | File mã nguồn | Mô tả chức năng |
| :--- | :--- | :--- |
| `GET /` hoặc `GET /index.html` | [`index.html`](file:///j:/ThoBeo/finale/index.html) | Trang chủ & Cổng thông tin CareerDNA |
| `GET /career_fit_v2.html` | [`career_fit_v2.html`](file:///j:/ThoBeo/finale/career_fit_v2.html) | AI Khám sức khỏe CV & Golden Triangle ATS |
| `GET /brand_test.html` | [`brand_test.html`](file:///j:/ThoBeo/finale/brand_test.html) | Trắc nghiệm Holland RIASEC & Gallup |
| `GET /lab_recommendation.html` | [`lab_recommendation.html`](file:///j:/ThoBeo/finale/lab_recommendation.html) | Tư vấn khoa & Danh bạ phòng Lab ĐH Tĩnh Nghi |
| `GET /profile.html` | [`profile.html`](file:///j:/ThoBeo/finale/profile.html) | Quản lý hồ sơ cá nhân & Đổi Avatar R2 |
| `GET /resource_library.html` | [`resource_library.html`](file:///j:/ThoBeo/finale/resource_library.html) | Thư viện tài nguyên & Lộ trình học tập |

### 7.2. Authentication & OTP APIs
| Phương thức | Endpoint | Body Tham số | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `{ identifier, password }` | Đăng nhập bằng Email/Username & Mật khẩu Bcrypt |
| `POST` | `/api/auth/register-request` | `{ name, username, email, password, dept, grade }` | Bước 1 Đăng ký: Gửi mã OTP xác thực qua Email |
| `POST` | `/api/auth/register-verify` | `{ email, code }` | Bước 2 Đăng ký: Xác minh OTP & Kích hoạt User |
| `POST` | `/api/auth/forgot-request` | `{ identifier }` | Bước 1 Quên MK: Gửi mã OTP đặt lại mật khẩu |
| `POST` | `/api/auth/forgot-verify-reset` | `{ email, code, newPassword }` | Bước 2 Quên MK: Xác thực OTP & Cập nhật MK mới |
| `POST` | `/api/auth/resend-otp` | `{ email, type }` | Gửi lại mã OTP qua email (Cooldown 60s) |
| `GET` | `/api/auth/users-list` | *None* | Danh sách tài khoản phục vụ chuyển đổi nhanh |

### 7.3. User Profile & Cloudflare R2 APIs
| Phương thức | Endpoint | Body Tham số | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/:uid` | *None* | Lấy thông tin chi tiết người dùng từ MongoDB Atlas |
| `POST` | `/api/users/sync` | `{ uid, ...userData }` | Đồng bộ toàn bộ dữ liệu người dùng |
| `PUT` | `/api/users/:uid/profile`| `{ school, dept, grade, name, settings }` | Cập nhật thông tin cơ bản |
| `POST` | `/api/users/:uid/avatar` | `multipart/form-data (avatar file)` | Tải ảnh đại diện lên Cloudflare R2 & Cập nhật User |
| `GET` | `/api/r2/file/*` | *Key path* | Stream proxy dữ liệu file/ảnh từ Cloudflare R2 |
| `GET` | `/api/r2/status` | *None* | Kiểm tra kết nối Cloudflare R2 Bucket |

### 7.4. Career, Brand & Academic APIs
| Phương thức | Endpoint | Body Tham số | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/:uid/brand` | `{ brandResult }` | Lưu kết quả trắc nghiệm Holland RIASEC |
| `GET` | `/api/users/:uid/brand` | *None* | Lấy kết quả Holland RIASEC gần nhất |
| `POST` | `/api/users/:uid/resume`| `{ resumeData }` | Lưu kết quả phân tích CV & Điểm ATS |
| `GET` | `/api/users/:uid/resume`| *None* | Lấy dữ liệu phân tích CV gần nhất |
| `POST` | `/api/users/:uid/lab` | `{ labData }` | Lưu kết quả tư vấn phòng Lab |
| `GET` | `/api/professors` | `?dept=CS` *(tùy chọn)* | Lấy danh bạ Giáo sư và phòng Lab nghiên cứu |
| `GET` | `/api/db/status` | *None* | Kiểm tra sức khỏe kết nối MongoDB Atlas |

---

## 8. Công Nghệ Sử Dụng (Tech Stack)

### 🔹 Backend:
- **Node.js (v20+) & Express.js (v4.21)**: REST API Engine & Static File Server.
- **MongoDB Atlas & Mongoose (v9.9)**: Cơ sở dữ liệu Cloud NoSQL với Replica Set và TTL Index.
- **Bcrypt.js**: Mã hóa mật khẩu bảo mật cao.
- **Nodemailer**: Gửi email OTP xác thực tài khoản qua Gmail SMTP.
- **@aws-sdk/client-s3 & Multer**: Quản lý upload và phân phối file trên Cloudflare R2.
- **Google Gemini 2.5 Flash AI API**: Trực tiếp điều phối 5-Agent Career Optimization Pipeline.

### 🔹 Frontend:
- **HTML5 Semantic & Vanilla JavaScript (ES6+)**: Tối ưu hiệu năng, không tải thư viện thừa.
- **Tailwind CSS (CDN)**: Hệ thống Cyber-Brutalist Design System với màu chủ đạo **Klein Blue (`#002fa7`)**.
- **FontAwesome 6.5**: Hệ thống icon kỹ thuật và chỉ báo trạng thái.
- **Google Fonts**: Phông chữ hình học hiện đại **Syne, Space Grotesk, JetBrains Mono, Inter**.
- **Chart.js / Canvas**: Vẽ biểu đồ Radar phân tích tính cách Holland RIASEC.

---

## 9. Hướng Dẫn Cài Đặt & Vận Hành

### 9.1. Yêu cầu môi trường:
- Node.js >= 18.x hoặc 20.x
- npm >= 9.x
- Kết nối Internet tới MongoDB Atlas và Cloudflare R2

### 9.2. Cài đặt các thư viện:
```bash
npm install
```

### 9.3. Cấu hình biến môi trường (`.env`):
Tạo file [`.env`](file:///j:/ThoBeo/finale/.env) ở thư mục gốc của dự án:
```env
MONGO_URI=mongodb://hoangtho:...@ac-vsmaqqi-shard-00-00.lshgg13.mongodb.net:27017.../career?ssl=true&replicaSet=atlas-npcmga-shard-0&authSource=admin&appName=Cluster0
GEMINI_API_KEY=AIzaSyAYVwtFzL9qYzqg8NPykLHukIBc-roziFU
PORT=3001

GMAIL_SEND=lehoangtho25122004@gmail.com
GMAIL_SMTP="tpzn cqkb jpzf mdso"

R2_ENDPOINT="https://69cb1e7a43247b468f02c7dd47ceb3d8.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="a572e555e2b571acfdf3df758b7a46e9"
R2_SECRET_ACCESS_KEY="ed109886054079bdf283ae2fb9fd4d6c72739e173e2a4d063fca41e352a45259"
R2_BUCKET_NAME="career"
R2_PUBLIC_URL="https://pub-a8ce7abf447f4dc8aaa44cce8fbaa433.r2.dev"
```

### 9.4. Khởi chạy Server:
```bash
# Chạy ở chế độ phát triển (Tự động khởi động lại khi sửa code)
npm run dev

# Hoặc khởi chạy thông thường
npm start
```

### 9.5. Địa chỉ truy cập ứng dụng:
- 🌐 **Trang chủ**: [http://localhost:3001/index.html](http://localhost:3001/index.html)
- 👤 **Hồ sơ cá nhân & Đổi Avatar**: [http://localhost:3001/profile.html](http://localhost:3001/profile.html)
- 📝 **AI 履歷健檢 (ATS Resume Audit)**: [http://localhost:3001/career_fit_v2.html](http://localhost:3001/career_fit_v2.html)
- 🧭 **品牌測驗 (Holland RIASEC)**: [http://localhost:3001/brand_test.html](http://localhost:3001/brand_test.html)
- 🔬 **科系適配 (Lab Navigator)**: [http://localhost:3001/lab_recommendation.html](http://localhost:3001/lab_recommendation.html)
- 📚 **學習資源 (Resource Archive)**: [http://localhost:3001/resource_library.html](http://localhost:3001/resource_library.html)

---
*© 2026 Providence University (靜宜大學) // CareerDNA Engine. All rights reserved.*
