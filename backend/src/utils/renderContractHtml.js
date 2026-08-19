const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value) => {
  if (!value) return "---";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;

const renderContractHtml = ({ contract = {}, members = [] }) => {
  const representative = contract.tenant || {};
  const room = contract.room || {};
  const contractCreatedDate = new Date(contract.createdAt || Date.now());
  const signatureImage = contract.signatureImage || "";
  const signedAt = contract.signedAt ? new Date(contract.signedAt) : null;
  const lockedAt = contract.lockedAt ? new Date(contract.lockedAt) : null;

  // Company / Party A details
  const companyInfo = {
    name: "CÔNG TY TNHH QUẢN LÝ VÀ PHÁT TRIỂN BẤT ĐỘNG SẢN TRO PLUS",
    taxCode: "0109876543",
    representative: "Ông NGUYỄN TIẾN TÚ",
    position: "Giám Đốc Ban Quản Lý Hệ Thống",
    identityNumber: "001098765432 (Cấp ngày: 15/03/2021 bởi Cục Cảnh sát QLHC về Trật tự Xã hội)",
    address: "Số 123, đường 422B, xã Kim Chung, huyện Hoài Đức, Thành phố Hà Nội",
    phone: "0985 316 789 - 0912 345 678",
    email: "support@troplus.vn / banquanly@troplus.vn",
    bankAccount: "MB Bank (Ngân hàng TMCP Quân Đội) - STK: 9999 8888 9999 - Chủ TK: CÔNG TY TRO PLUS",
  };

  // SVG Red Digital Seal Stamp for Party A
  const partyAStampSvg = `
    <div class="stamp-container">
      <svg width="150" height="150" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="92" stroke="#dc2626" stroke-width="4" fill="none" stroke-dasharray="8 4" />
        <circle cx="100" cy="100" r="84" stroke="#dc2626" stroke-width="3" fill="none" />
        <path id="circlePathTop" d="M 30,100 A 70,70 0 0,1 170,100" fill="none" />
        <path id="circlePathBottom" d="M 170,100 A 70,70 0 0,1 30,100" fill="none" />
        <text fill="#dc2626" font-size="11.5" font-weight="bold" font-family="Times New Roman, serif" letter-spacing="1">
          <textPath href="#circlePathTop" startOffset="50%" text-anchor="middle">
            CÔNG TY TNHH TRO PLUS
          </textPath>
        </text>
        <text fill="#dc2626" font-size="10" font-weight="bold" font-family="Times New Roman, serif" letter-spacing="0.5">
          <textPath href="#circlePathBottom" startOffset="50%" text-anchor="middle">
            MST: 0109876543 ★ HÀ NỘI
          </textPath>
        </text>
        <polygon points="100,68 106,82 121,83 109,93 113,108 100,99 87,108 91,93 79,83 94,82" fill="#dc2626" opacity="0.85" />
        <text x="100" y="130" fill="#dc2626" font-size="13" font-weight="bold" font-family="Times New Roman, serif" text-anchor="middle">
          ĐÃ KÝ ĐIỆN TỬ
        </text>
        <text x="100" y="145" fill="#dc2626" font-size="9" font-family="Arial, sans-serif" text-anchor="middle">
          VERIFIED STAMP
        </text>
      </svg>
    </div>
  `;

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hợp Đồng Thuê Phòng Trọ ${escapeHtml(contract.contractCode)} - TRO PLUS</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
      color: #0f172a;
      font-family: "Times New Roman", Times, serif;
      font-size: 15px;
      line-height: 1.6;
    }
    .no-print-toolbar {
      position: sticky;
      top: 0;
      z-index: 999;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      font-family: Arial, sans-serif;
    }
    .no-print-toolbar .brand-title {
      font-size: 16px;
      font-weight: 700;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .no-print-toolbar button {
      border: 0;
      border-radius: 8px;
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      cursor: pointer;
      font-weight: 700;
      padding: 10px 20px;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    .no-print-toolbar button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .contract-paper {
      width: 210mm;
      min-height: 297mm;
      margin: 24px auto;
      padding: 24mm 22mm;
      background: #ffffff;
      box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
      border-radius: 4px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-justify { text-align: justify; }
    .national-header {
      text-align: center;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
    .national-header .country {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0;
      text-align: center;
      letter-spacing: 0.5px;
    }
    .national-header .motto {
      font-size: 15px;
      font-weight: bold;
      margin: 4px 0 8px 0;
      text-align: center;
    }
    .national-header .divider {
      width: 160px;
      height: 1.5px;
      background: #0f172a;
      margin: 4px auto 0 auto;
    }
    .contract-title {
      font-size: 22px;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin: 28px 0 6px 0;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .contract-code-sub {
      text-align: center;
      font-style: italic;
      font-size: 14px;
      color: #475569;
      margin-bottom: 24px;
    }
    h2.section-title {
      font-size: 15px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 20px 0 10px 0;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      color: #0f172a;
    }
    p {
      margin: 6px 0;
      text-align: justify;
    }
    .party-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }
    .party-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 6px 12px;
      font-size: 14px;
    }
    .party-label {
      font-weight: bold;
      color: #334155;
    }
    .party-val {
      color: #0f172a;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #94a3b8;
      padding: 8px 12px;
      font-size: 14px;
      text-align: left;
    }
    table.data-table th {
      background: #f1f5f9;
      font-weight: bold;
      color: #0f172a;
    }
    .clause-number {
      font-weight: bold;
      color: #0f172a;
    }
    .signatures-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .sig-col {
      text-align: center;
      position: relative;
    }
    .sig-title {
      font-size: 15px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .sig-subtitle {
      font-size: 13px;
      font-style: italic;
      color: #64748b;
      margin-bottom: 16px;
    }
    .sig-space {
      min-height: 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .signature-img {
      max-width: 200px;
      max-height: 90px;
      object-fit: contain;
    }
    .stamp-container {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      opacity: 0.88;
    }
    .legal-lock-badge {
      margin-top: 36px;
      border: 1.5px dashed #0d9488;
      background: #f0fdf4;
      border-radius: 10px;
      padding: 14px 18px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      page-break-inside: avoid;
    }
    .legal-lock-title {
      font-weight: bold;
      color: #0f766e;
      font-size: 13px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .legal-lock-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 16px;
      color: #334155;
    }
    @media print {
      body { background: #ffffff; }
      .no-print-toolbar { display: none !important; }
      .contract-paper {
        box-shadow: none;
        margin: 0;
        padding: 10mm 15mm;
        width: 100%;
        min-height: auto;
      }
    }
  </style>
</head>
<body>
  <!-- Print / Action Toolbar -->
  <div class="no-print-toolbar">
    <div class="brand-title">
      <span>📜 HỢP ĐỒNG THUÊ PHÒNG TRỌ ĐIỆN TỬ CHUẨN PHÁP LÝ</span>
    </div>
    <button onclick="window.print()">🖨️ In Hợp Đồng / Lưu Dạng PDF</button>
  </div>

  <!-- Main Paper Page -->
  <main class="contract-paper">
    <!-- National Header -->
    <div class="national-header">
      <p class="country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p class="motto">Độc lập - Tự do - Hạnh phúc</p>
      <div class="divider"></div>
    </div>

    <!-- Contract Title -->
    <h1 class="contract-title">HỢP ĐỒNG THUÊ PHÒNG TRỌ VÀ DỊCH VỤ</h1>
    <div class="contract-code-sub">
      Số hợp đồng: <strong>${escapeHtml(contract.contractCode)}</strong> • Ngày lập: ${contractCreatedDate.getDate()} tháng ${contractCreatedDate.getMonth() + 1} năm ${contractCreatedDate.getFullYear()}
    </div>

    <p class="text-justify">
      Căn cứ <em>Bộ luật Dân sự số 91/2015/QH13</em> được Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 24/11/2015;<br />
      Căn cứ nhu cầu và sự thỏa thuận tự nguyện của hai bên, hôm nay ngày ${contractCreatedDate.getDate()} tháng ${contractCreatedDate.getMonth() + 1} năm ${contractCreatedDate.getFullYear()}, chúng tôi gồm có:
    </p>

    <!-- Party A Info -->
    <h2 class="section-title">BÊN A: BÊN CHO THUÊ (BAN QUẢN LÝ / CHỦ TRỌ)</h2>
    <div class="party-box">
      <div class="party-grid">
        <span class="party-label">Tên đơn vị:</span>
        <span class="party-val"><strong>${escapeHtml(companyInfo.name)}</strong></span>

        <span class="party-label">Mã số thuế:</span>
        <span class="party-val"><strong>${escapeHtml(companyInfo.taxCode)}</strong></span>

        <span class="party-label">Người đại diện:</span>
        <span class="party-val"><strong>${escapeHtml(companyInfo.representative)}</strong> — Chức vụ: ${escapeHtml(companyInfo.position)}</span>

        <span class="party-label">Số CCCD/CMND:</span>
        <span class="party-val">${escapeHtml(companyInfo.identityNumber)}</span>

        <span class="party-label">Địa chỉ trụ sở:</span>
        <span class="party-val">${escapeHtml(companyInfo.address)}</span>

        <span class="party-label">Điện thoại liên hệ:</span>
        <span class="party-val"><strong>${escapeHtml(companyInfo.phone)}</strong></span>

        <span class="party-label">Email hỗ trợ:</span>
        <span class="party-val">${escapeHtml(companyInfo.email)}</span>

        <span class="party-label">Tài khoản nhận tiền:</span>
        <span class="party-val"><strong>${escapeHtml(companyInfo.bankAccount)}</strong></span>
      </div>
    </div>

    <!-- Party B Info -->
    <h2 class="section-title">BÊN B: BÊN THUÊ PHÒNG (KHÁCH THUÊ ĐẠI DIỆN)</h2>
    <div class="party-box">
      <div class="party-grid">
        <span class="party-label">Họ và tên:</span>
        <span class="party-val"><strong>${escapeHtml(representative.name || "---")}</strong></span>

        <span class="party-label">Số CCCD/CMND:</span>
        <span class="party-val"><strong>${escapeHtml(representative.identityNumber || "---")}</strong></span>

        <span class="party-label">Số điện thoại:</span>
        <span class="party-val"><strong>${escapeHtml(representative.phone || "---")}</strong></span>

        <span class="party-label">Email cá nhân:</span>
        <span class="party-val">${escapeHtml(representative.email || "---")}</span>

        <span class="party-label">Địa chỉ thường trú:</span>
        <span class="party-val">${escapeHtml(representative.address || "Theo thông tin căn cước công dân đã đăng ký")}</span>
      </div>
    </div>

    <!-- Members Table -->
    <h2 class="section-title">DANH SÁCH THÀNH VIÊN CÙNG CƯ TRÚ TRONG PHÒNG</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 45px; text-align: center;">STT</th>
          <th>Họ và tên thành viên</th>
          <th>Số CCCD / CMND</th>
          <th>Số điện thoại</th>
          <th>Vai trò đăng ký</th>
        </tr>
      </thead>
      <tbody>
        ${
          members && members.length
            ? members
                .map(
                  (m, idx) => `<tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${escapeHtml(m.user?.name || m.name || "---")}</strong></td>
                    <td>${escapeHtml(m.user?.identityNumber || m.identityNumber || "---")}</td>
                    <td>${escapeHtml(m.user?.phone || m.phone || "---")}</td>
                    <td>${m.roomRole === "representative" ? "👑 Đại diện phòng" : "Thành viên cư trú"}</td>
                  </tr>`
                )
                .join("")
            : `<tr><td colspan="5" style="text-align: center; color: #64748b;">Chưa ghi nhận thành viên cư trú bổ sung.</td></tr>`
        }
      </tbody>
    </table>

    <p class="text-justify">Hai bên thống nhất ký kết Hợp đồng thuê phòng trọ với các điều khoản chi tiết như sau:</p>

    <!-- Clause 1 -->
    <h2 class="section-title">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG VÀ THỜI HẠN THUÊ</h2>
    <p>
      <span class="clause-number">1.1. Thỏa thuận cho thuê:</span> Bên A đồng ý cho Bên B thuê phòng trọ số <strong>Phòng ${escapeHtml(room.roomNumber || "---")}</strong> (${escapeHtml(room.name || "Phòng trọ cao cấp")}), thuộc Tầng <strong>${escapeHtml(room.floor ?? 1)}</strong>. Diện tích sử dụng: <strong>${escapeHtml(room.area || 25)} m²</strong>.
    </p>
    <p>
      <span class="clause-number">1.2. Sức chứa quy định:</span> Phòng trọ cho phép tối đa <strong>${escapeHtml(contract.memberCount || members.length || room.capacity || 2)} người</strong> cùng cư trú. Bên B có trách nhiệm khai báo đầy đủ danh sách người ở với Ban quản lý Bên A.
    </p>
    <p>
      <span class="clause-number">1.3. Thời hạn thuê:</span> Hợp đồng có thời hạn <strong>${escapeHtml(contract.durationMonths || 12)} tháng</strong>, bắt đầu từ ngày <strong>${formatDate(contract.moveInDate || contract.startDate)}</strong> đến hết ngày <strong>${formatDate(contract.endDate)}</strong>.
    </p>

    <!-- Clause 2 -->
    <h2 class="section-title">ĐIỀU 2: GIÁ THUÊ PHÒNG, TIỀN ĐẶT CỌC VÀ BẢNG PHÍ DỊCH VỤ</h2>
    <table class="data-table">
      <thead>
        <tr>
          <th>Tên khoản phí</th>
          <th>Đơn giá thanh toán</th>
          <th>Hình thức & Chu kỳ thu</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Giá thuê phòng cố định</strong></td>
          <td><strong style="color: #0d9488;">${formatCurrency(contract.monthlyRent)} / tháng</strong></td>
          <td>Thu định kỳ từ ngày 01 đến 05 hàng tháng</td>
        </tr>
        <tr>
          <td><strong>2. Tiền đặt cọc bảo đảm</strong></td>
          <td><strong>${formatCurrency(contract.deposit)}</strong></td>
          <td>Thanh toán ngay khi ký hợp đồng (Hoàn trả khi thanh lý HĐ)</td>
        </tr>
        <tr>
          <td><strong>3. Đơn giá tiêu thụ điện</strong></td>
          <td><strong>${formatCurrency(room.electricityPrice || 3500)} / kWh</strong></td>
          <td>Tính theo chỉ số công tơ điện riêng từng phòng</td>
        </tr>
        <tr>
          <td><strong>4. Đơn giá tiêu thụ nước</strong></td>
          <td><strong>${formatCurrency(room.waterPrice || 20000)} / m³</strong></td>
          <td>Tính theo đồng hồ đo nước thực tế sử dụng</td>
        </tr>
        <tr>
          <td><strong>5. Phí dịch vụ chung (rác, wifi...)</strong></td>
          <td><strong>${formatCurrency(room.serviceFee || 0)} / tháng</strong></td>
          <td>Cố định hàng tháng theo hóa đơn tổng hợp</td>
        </tr>
      </tbody>
    </table>
    <p>
      <span class="clause-number">2.1. Phương thức thanh toán:</span> Bên B thanh toán tiền phòng và các chi phí phát sinh thông qua Chuyển khoản ngân hàng qua cổng VietQR tự động hoặc Tiền mặt cho Ban quản lý Bên A từ ngày <strong>01 đến 05 hàng tháng</strong>.
    </p>

    <!-- Clause 3 -->
    <h2 class="section-title">ĐIỀU 3: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A (BÊN CHO THUÊ)</h2>
    <p>
      <span class="clause-number">3.1. Bàn giao mặt bằng:</span> Bàn giao phòng trọ và các trang thiết bị kèm theo cho Bên B đúng thời hạn theo thỏa thuận trong tình trạng sử dụng tốt, sạch sẽ, an toàn.
    </p>
    <p>
      <span class="clause-number">3.2. Bảo trì hệ thống:</span> Đảm bảo hệ thống điện, nước, phòng cháy chữa cháy (PCCC), mạng Internet thoại vận hành ổn định. Tiến hành sửa chữa hư hỏng kết cấu hạ tầng không do lỗi người thuê.
    </p>
    <p>
      <span class="clause-number">3.3. Minh bạch hóa đơn:</span> Cung cấp hóa đơn/bảng kê tiền phòng, điện, nước minh bạch hàng tháng qua hệ thống phần mềm ứng dụng TRO PLUS.
    </p>
    <p>
      <span class="clause-number">3.4. Quyền kiểm tra:</span> Có quyền kiểm tra định kỳ tình trạng phòng trọ và công tác an toàn PCCC (báo trước cho Bên B tối thiểu 12 giờ, trừ trường hợp khẩn cấp về cháy nổ/sự cố).
    </p>

    <!-- Clause 4 -->
    <h2 class="section-title">ĐIỀU 4: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B (BÊN THUÊ PHÒNG)</h2>
    <p>
      <span class="clause-number">4.1. Sử dụng đúng mục đích:</span> Sử dụng phòng trọ đúng mục đích ở sinh hoạt gia đình/cá nhân, không kinh doanh hàng cấm, không chứa chất cháy nổ hoặc tệ nạn xã hội.
    </p>
    <p>
      <span class="clause-number">4.2. Thanh toán đúng hạn:</span> Thanh toán đầy đủ tiền thuê phòng và các khoản chi phí điện, nước, dịch vụ đúng thời hạn cam kết tại Điều 2.
    </p>
    <p>
      <span class="clause-number">4.3. Giữ gìn an ninh & Vệ sinh:</span> Tự bảo quản tài sản cá nhân, giữ gìn vệ sinh chung khu trọ, không gây ồn ào ảnh hưởng đến các phòng xung quanh sau <strong>23h00</strong>.
    </p>
    <p>
      <span class="clause-number">4.4. Không tự ý cải tạo:</span> Không được tự ý khoan đục tường, thay đổi kết cấu kiến trúc hoặc chuyển nhượng, cho người khác thuê lại phòng khi chưa có sự đồng ý bằng văn bản của Bên A.
    </p>

    <!-- Clause 5 -->
    <h2 class="section-title">ĐIỀU 5: ĐIỀU KHOẢN HOÀN CỌC VÀ CHẤM DỨT HỢP ĐỒNG</h2>
    <p>
      <span class="clause-number">5.1. Chấm dứt đúng hạn:</span> Khi hợp đồng hết hạn, nếu hai bên không tiếp tục gia hạn, Bên B bàn giao lại phòng trống sạch sẽ cho Bên A. Bên A có trách nhiệm hoàn trả <strong>100% tiền đặt cọc (${formatCurrency(contract.deposit)})</strong> cho Bên B sau khi trừ các khoản tiền điện nước/dịch vụ còn thiếu (nếu có).
    </p>
    <p>
      <span class="clause-number">5.2. Thông báo đơn phương:</span> Trường hợp một trong hai bên muốn chấm dứt hợp đồng trước thời hạn phải có nghĩa vụ thông báo bằng văn bản hoặc qua ứng dụng TRO PLUS cho bên kia trước tối thiểu <strong>30 ngày</strong>.
    </p>
    <p>
      <span class="clause-number">5.3. Mất tiền cọc khi vi phạm:</span> Nếu Bên B tự ý hủy hợp đồng trước thời hạn mà không thông báo đủ 30 ngày hoặc vi phạm nghiêm trọng nội quy PCCC/pháp luật thì Bên B sẽ bị mất toàn bộ số tiền đặt cọc.
    </p>

    <!-- Clause 6 -->
    <h2 class="section-title">ĐIỀU 6: QUY ĐỊNH AN TOÀN PHÒNG CHÁY CHỮA CHÁY (PCCC) & NỘI QUY</h2>
    <p>
      <span class="clause-number">6.1. An toàn thiết bị điện:</span> Tuyệt đối không đun nấu bằng bếp than, không để các vật liệu dễ cháy gần ổ cắm điện. Tắt toàn bộ thiết bị điện công suất lớn khi ra khỏi phòng.
    </p>
    <p>
      <span class="clause-number">6.2. Sạc xe điện:</span> Việc sạc xe máy điện, xe đạp điện phải tuân thủ đúng khu vực quy định của Ban quản lý, không kéo dây điện tùy tiện gây nguy cơ chập cháy.
    </p>
    <p>
      <span class="clause-number">6.3. Khai báo tạm trú:</span> Cung cấp đầy đủ thông tin căn cước công dân của tất cả thành viên ở cùng để Bên A làm thủ tục đăng ký tạm trú với cơ quan Công an địa phương.
    </p>

    <!-- Clause 7 -->
    <h2 class="section-title">ĐIỀU 7: ĐIỀU KHOẢN THI HÀNH VÀ GIẢI QUYẾT TRANH CHẤP</h2>
    <p>
      <span class="clause-number">7.1. Hiệu lực văn bản:</span> Hợp đồng này có hiệu lực pháp lý kể từ thời điểm hai bên thực hiện ký tên điện tử trên hệ thống TRO PLUS.
    </p>
    <p>
      <span class="clause-number">7.2. Giải quyết tranh chấp:</span> Hai bên cam kết thực hiện đúng các điều khoản đã ghi trong hợp đồng. Mọi tranh chấp phát sinh sẽ được giải quyết trước hết thông qua thương lượng hòa giải. Nếu không thương lượng được, vụ việc sẽ được đưa ra Tòa án nhân dân có thẩm quyền để giải quyết theo quy định pháp luật.
    </p>
    <p>
      <span class="clause-number">7.3. Lưu trữ bản điện tử:</span> Hợp đồng điện tử này được lưu trữ mã hóa dưới dạng dữ liệu số kèm mã xác thực SHA-256 trên máy chủ TRO PLUS, có giá trị pháp lý tương đương bản giấy theo <em>Luật Giao dịch điện tử số 51/2005/QH11</em>.
    </p>
    <p style="margin-top: 14px;">
      <em>Các điều khoản bổ sung khác:</em> ${escapeHtml(contract.terms || "Không có ghi chú bổ sung.")}
    </p>

    <!-- Signatures Section -->
    <div class="signatures-block">
      <!-- Party A Signature -->
      <div class="sig-col">
        <div class="sig-title">ĐẠI DIỆN BÊN A (BÊN CHO THUÊ)</div>
        <div class="sig-subtitle">(Ký tên, đóng dấu xác thực)</div>
        <div class="sig-space">
          ${partyAStampSvg}
          <div style="margin-top: 54px; font-weight: bold; text-transform: uppercase;">
            ${escapeHtml(companyInfo.representative)}
          </div>
          <div style="font-size: 12px; color: #475569; margin-top: 2px;">
            Đại diện Giám Đốc TRO PLUS
          </div>
        </div>
      </div>

      <!-- Party B Signature -->
      <div class="sig-col">
        <div class="sig-title">ĐẠI DIỆN BÊN B (BÊN THUÊ PHÒNG)</div>
        <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
        <div class="sig-space">
          ${
            signatureImage
              ? `<img class="signature-img" src="${escapeHtml(signatureImage)}" alt="Chữ ký điện tử Bên B" />`
              : `<div style="height: 70px; display: flex; align-items: center; color: #94a3b8; font-style: italic;">(Chưa thực hiện ký điện tử)</div>`
          }
          <div style="margin-top: 12px; font-weight: bold; text-transform: uppercase;">
            ${escapeHtml(representative.name || "---")}
          </div>
          ${
            signedAt
              ? `<div style="font-size: 11px; color: #059669; font-style: italic; margin-top: 2px;">✓ Đã ký điện tử lúc: ${escapeHtml(signedAt.toLocaleString("vi-VN"))}</div>`
              : ""
          }
        </div>
      </div>
    </div>

    <!-- SHA-256 Legal Lock Badge -->
    ${
      contract.contentHash || lockedAt
        ? `<div class="legal-lock-badge">
            <div class="legal-lock-title">
              <span>🔒 CHỨNG THỰC BẢO MẬT & NIÊM PHONG NỘI DUNG HỢP ĐỒNG (SHA-256 LOCK)</span>
            </div>
            <div class="legal-lock-grid">
              <div><strong>Mã băm SHA-256:</strong> <span style="font-family: monospace; word-break: break-all;">${escapeHtml(contract.contentHash || "N/A")}</span></div>
              <div><strong>Thời gian niêm phong:</strong> ${escapeHtml(lockedAt ? lockedAt.toLocaleString("vi-VN") : "Đang cập nhật")}</div>
              <div><strong>Phương thức xác thực:</strong> ${escapeHtml(contract.signatureMethod === "auto_generated" ? "Chữ ký tự động tên người thuê" : "Chữ ký tay điện tử Canvas")}</div>
              <div><strong>Phiên bản hợp đồng:</strong> v${escapeHtml(contract.version || 1)}.0 (Khóa chống chỉnh sửa)</div>
            </div>
          </div>`
        : ""
    }
  </main>
</body>
</html>`;
};

module.exports = renderContractHtml;
