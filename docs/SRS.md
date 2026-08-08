# SRS — VNDtracker (Ứng dụng Quản lý Chi tiêu Cá nhân)

Version: 0.2 (draft)
Ngày: 2026-08-08

> File này để bạn tự review và chỉnh sửa. Thêm feature mới thì thêm dòng `FR-x.x` mới vào đúng module, hoặc thêm module mới ở cuối mục 3. Đánh dấu `[ ]` / `[x]` để track cái nào đã chốt.

---

## 1. Giới thiệu

### 1.1 Mục đích
Ứng dụng giúp cá nhân ghi chép và theo dõi chi tiêu hàng ngày, với điểm khác biệt chính là **chụp ảnh hóa đơn và để AI tự động đọc, điền thông tin chi tiêu** thay vì phải nhập tay từng khoản.

### 1.2 Phạm vi (v1)
- Web app (PWA), mobile-first.
- Multi-user: ai cũng đăng ký dùng được, dữ liệu mỗi người tách biệt hoàn toàn (không chia sẻ/xem chéo).
- Không bao gồm (out of scope v1): xem mục 7.

### 1.3 Đối tượng sử dụng
Cá nhân muốn theo dõi chi tiêu hàng ngày, đặc biệt người ngại nhập liệu thủ công và muốn chụp bill là xong.

### 1.4 Thuật ngữ
- **Expense**: một khoản chi tiêu (thủ công hoặc từ bill).
- **Bill/Receipt**: hóa đơn giấy được chụp ảnh lại.
- **AI extraction**: quá trình AI đọc ảnh bill và trả về dữ liệu có cấu trúc.

---

## 2. Tổng quan sản phẩm

### 2.1 Công nghệ
- Backend: Node.js + Express 5 + TypeScript + MSSQL, JWT auth (tái dùng pattern từ `student-management-api`)
- Frontend: React 19 + Vite + MUI, PWA
- AI: Claude API (vision) để đọc ảnh bill

### 2.2 Ràng buộc & giả định
- Ảnh bill lưu local (ổ đĩa server) ở v1, không dùng cloud storage.
- Chi phí gọi Claude API là chi phí cá nhân → cần kiểm soát số lần gọi.
- Giao diện song ngữ Anh/Việt, **mặc định tiếng Anh** (xem mục 3.9).

---

## 3. Yêu cầu chức năng (Functional Requirements)

Mỗi mục có nhãn giai đoạn: **[MVP]** (Phase 0-1), **[AI]** (Phase 2), **[P3]** (Phase 3 - nâng cao), **[P4]** (Phase 4 - PWA polish). Bạn có thể đổi nhãn nếu muốn ưu tiên khác.

### 3.1 Tài khoản & Đăng nhập
- [ ] FR-1.1 [MVP] Đăng ký tài khoản bằng email/password
- [ ] FR-1.2 [MVP] Đăng nhập, nhận JWT token
- [ ] FR-1.3 [MVP] Đăng xuất
- [ ] FR-1.4 [MVP] Mỗi user chỉ thấy/sửa được dữ liệu của chính mình (data isolation theo `user_id`)
- [ ] FR-1.5 [P3] Đổi mật khẩu
- [ ] FR-1.6 [P3] Quên mật khẩu / reset qua email

### 3.2 Danh mục chi tiêu (Category)
- [ ] FR-2.1 [MVP] Danh mục mặc định có sẵn khi tạo tài khoản (Ăn uống, Di chuyển, Hóa đơn/điện nước, Giải trí, Mua sắm, Khác...), lưu bằng **key cố định** (vd `food`, `transport`) và hiển thị tên theo ngôn ngữ đang chọn qua file translation (không dịch tự động khi user đổi ngôn ngữ, dùng bảng dịch có sẵn)
- [ ] FR-2.2 [MVP] Người dùng tự thêm/sửa/xoá danh mục riêng — category tự tạo lưu đúng text user nhập, không tự dịch sang ngôn ngữ còn lại
- [ ] FR-2.3 [P3] Gán icon/màu cho từng danh mục

### 3.3 Ghi chi tiêu thủ công
- [ ] FR-3.1 [MVP] Thêm khoản chi (số tiền, danh mục, ngày, ghi chú)
- [ ] FR-3.2 [MVP] Sửa khoản chi
- [ ] FR-3.3 [MVP] Xoá khoản chi
- [ ] FR-3.4 [MVP] Danh sách chi tiêu, filter theo tháng / danh mục / khoảng ngày
- [ ] FR-3.5 [P3] Tìm kiếm theo ghi chú

### 3.4 Chụp bill / ảnh chuyển khoản & AI tự động ghi nhận (tính năng lõi)
- [ ] FR-4.1 [AI] Chụp ảnh / upload ảnh hóa đơn **hoặc** ảnh chụp màn hình chuyển khoản, từ trình duyệt (camera điện thoại)
- [ ] FR-4.2 [AI] Backend gửi ảnh lên Claude API (vision) để trích xuất: loại nguồn (hóa đơn/chuyển khoản), ngày, danh sách item (nếu là hóa đơn), số tiền/tổng tiền, nội dung giao dịch (nếu là chuyển khoản) — **không cần trích xuất tên cửa hàng**
- [ ] FR-4.3 [AI] Dựa vào nội dung hóa đơn hoặc nội dung chuyển khoản, AI gợi ý danh mục phù hợp; nếu không đủ tự tin để gợi ý → tự động gán vào danh mục **"Khác/Others"**
- [ ] FR-4.4 [AI] Màn hình review: hiển thị kết quả AI đọc được, cho sửa tay trước khi lưu (không auto-save thẳng)
- [ ] FR-4.5 [AI] Lưu ảnh gốc kèm expense để đối chiếu lại sau này
- [ ] FR-4.6 [AI] Xử lý khi AI đọc lỗi / không đọc được ảnh (thông báo rõ, cho chuyển sang nhập tay)
- [ ] FR-4.7 [AI] Giới hạn định dạng (jpg/png) và kích thước ảnh upload
- [ ] FR-4.8 [P3] Đọc được bill có nhiều item và tách từng item thành từng dòng chi tiêu riêng (thay vì gộp 1 tổng)

### 3.5 Dashboard & Báo cáo
- [ ] FR-5.1 [MVP] Tổng chi tiêu theo tháng hiện tại
- [ ] FR-5.2 [MVP] Biểu đồ chi tiêu theo danh mục (pie/bar chart)
- [ ] FR-5.3 [P3] So sánh chi tiêu giữa các tháng
- [ ] FR-5.4 [P3] Export dữ liệu ra CSV/Excel

### 3.6 Ngân sách (Budget)
- [ ] FR-6.1 [P3] Đặt hạn mức ngân sách theo tháng / theo danh mục
- [ ] FR-6.2 [P3] Cảnh báo khi chi tiêu gần/vượt ngân sách

### 3.7 Chia tiền nhóm (Group Split) — optional, cân nhắc có làm hay không
- [ ] FR-7.1 [Future] Tạo nhóm, mời thành viên tham gia
- [ ] FR-7.2 [Future] Ghi nhận khoản chi chung, chia đều hoặc theo tỷ lệ
- [ ] FR-7.3 [Future] Theo dõi công nợ giữa các thành viên trong nhóm

### 3.8 PWA & Trải nghiệm
- [ ] FR-8.1 [P4] Cài đặt app như native app (Add to Home Screen)
- [ ] FR-8.2 [MVP] Responsive, mobile-first
- [ ] FR-8.3 [P4] Xem lại dữ liệu đã tải khi offline

### 3.9 Đa ngôn ngữ (i18n)
- [ ] FR-9.1 [MVP] Giao diện hỗ trợ tiếng Anh và tiếng Việt, **mặc định tiếng Anh**
- [ ] FR-9.2 [MVP] Cho phép người dùng đổi ngôn ngữ trong app, lưu lựa chọn (localStorage hoặc theo profile user) để lần sau vào lại giữ nguyên
- [ ] FR-9.3 [P3] Tự động detect ngôn ngữ trình duyệt lần đầu truy cập (nếu là `vi` thì gợi ý tiếng Việt, còn lại fallback English)

---

## 4. Yêu cầu phi chức năng

- **Bảo mật**: mật khẩu hash bằng bcrypt; JWT có thời hạn; Claude API key chỉ nằm ở backend, không bao giờ lộ ra frontend; validate input bằng Joi (giống pattern hiện tại).
- **Hiệu năng**: có loading state rõ ràng khi chờ AI xử lý ảnh (vài giây); không block UI.
- **Chi phí**: log số lần gọi Claude API/tháng để tự theo dõi chi phí cá nhân.
- **Khả năng bảo trì**: TypeScript strict mode, cấu trúc code theo pattern đã dùng ở `student-management-api`.
- **Khả năng mở rộng**: schema DB thiết kế để thêm Budget/Group ở Phase 3 mà không phải sửa lại bảng `expenses` gốc.

---

## 5. Yêu cầu dữ liệu (sơ bộ, sẽ chi tiết hóa khi vẽ schema)

- **User**: id, email, password_hash, name, created_at
- **Category**: id, user_id (null nếu là default), name_key (dùng cho default, vd `food`/`transport`, tra qua file translation), name (free text, dùng cho category user tự tạo), icon, color, is_default
- **Expense**: id, user_id, category_id, amount, date, note, receipt_image_path, source (`manual` | `ai`), input_type (`bill` | `transfer` | null), created_at
- *(Phase 3)* **Budget**: id, user_id, category_id, month, limit_amount
- *(Future)* **Group**, **GroupMember**, **GroupExpense**, **GroupExpenseShare**

---

## 6. Giao diện ngoài (External Interfaces)
- **Claude API** (vision) — trích xuất dữ liệu có cấu trúc từ ảnh bill
- **MSSQL** — lưu trữ dữ liệu
- Local filesystem — lưu ảnh bill gốc

---

## 7. Ngoài phạm vi v1 (Out of scope)
- Đa tiền tệ
- Đồng bộ ngân hàng tự động (open banking)
- App mobile native (chỉ web PWA)
- Hỗ trợ thêm ngôn ngữ khác ngoài Anh/Việt
- Cloud storage cho ảnh (để sau nếu deploy public)

---

## 8. Ghi chú review

_Khu vực để bạn ghi chú/note khi review, đánh dấu feature muốn bỏ/thêm/đổi priority:_

- ~~Phần chụp bill thì ko cần tên cửa hàng, và ngoài đọc bill nên đọc được cả màn hình chuyển khoản nữa dựa vào nội dung chuyển khoản để gợi ý danh mục, ko thì tự động cho vào others~~ → đã đưa vào FR-4.1 – FR-4.3
- ~~Web nên được build theo cả tiếng Anh lẫn tiếng Việt~~ → đã đưa vào mục 3.9 (FR-9.1 – FR-9.3)
-
