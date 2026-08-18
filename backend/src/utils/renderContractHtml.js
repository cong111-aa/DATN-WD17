const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("vi-VN");
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const renderContractHtml = ({ contract, members = [] }) => {
  const representative = contract.tenant || {};
  const room = contract.room || {};
  const contractCreatedDate = new Date(contract.createdAt || Date.now());
  const signatureImage = contract.signatureImage || "";
  const signedAt = contract.signedAt ? new Date(contract.signedAt) : null;
  const lockedAt = contract.lockedAt ? new Date(contract.lockedAt) : null;

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Hop dong ${escapeHtml(contract.contractCode)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f1f5f9; color: #111827; font-family: "Times New Roman", serif; }
    .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 12px 18px; background: #ffffff; border-bottom: 1px solid #e5e7eb; }
    button { border: 0; border-radius: 6px; background: #1677ff; color: #fff; cursor: pointer; font-family: Arial, sans-serif; font-weight: 700; padding: 9px 14px; }
    .page { width: 210mm; min-height: 297mm; margin: 18px auto; padding: 22mm; background: #ffffff; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); }
    .center { text-align: center; }
    .header-line { font-weight: 700; text-transform: uppercase; }
    h1 { font-size: 22px; margin: 24px 0 8px; text-align: center; text-transform: uppercase; }
    h2 { font-size: 16px; margin: 18px 0 8px; text-transform: uppercase; }
    p { font-size: 15px; line-height: 1.55; margin: 7px 0; }
    table { border-collapse: collapse; margin: 8px 0 12px; width: 100%; }
    th, td { border: 1px solid #111827; font-size: 14px; padding: 7px; text-align: left; vertical-align: top; }
    th { background: #f8fafc; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 42px; text-align: center; }
    .signature-title { font-weight: 700; text-transform: uppercase; }
    .signature-image { max-width: 220px; max-height: 90px; object-fit: contain; }
    .legal-proof { margin-top: 28px; border: 1px solid #94a3b8; border-radius: 6px; padding: 12px 14px; background: #f8fafc; font-family: Arial, sans-serif; }
    .legal-proof p { font-size: 12px; line-height: 1.45; margin: 5px 0; word-break: break-all; }
    .muted { color: #4b5563; font-style: italic; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .page { box-shadow: none; margin: 0; padding: 18mm; width: auto; }
    }
      .contract-info {
    margin: 18px 0 28px;
    padding: 18px 22px;
    border: 1px solid #999;
    border-radius: 6px;
    background: #fcfcfc;
}

.info-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    line-height: 1.8;
}

.info-row:last-child {
    margin-bottom: 0;
}

.label {
    width: 220px;
    font-weight: bold;
    flex-shrink: 0;
}

.value {
    flex: 1;
    border-bottom: 1px dotted #666;
    padding-bottom: 2px;
}
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">In / Luu PDF</button>
  </div>
  <main class="page">
    <div class="center">
      <p class="header-line">Cong hoa xa hoi chu nghia Viet Nam</p>
      <p class="header-line">Doc lap - Tu do - Hanh phuc</p>
      <p>-------------------------</p>
    </div>

    <h1>HỢP ĐỒNG THUÊ PHÒNG</h1>
    <p class="center">Ma hop dong: <strong>${escapeHtml(contract.contractCode)}</strong></p>
    <p>Hôm nay, ngày ${contractCreatedDate.getDate()} tháng ${contractCreatedDate.getMonth() + 1} năm ${contractCreatedDate.getFullYear()}, chúng tôi gồm:</p>

    <h2>Bên cho thuê </h2>
    <p>Chủ nhà /Đơn vị : <strong>TRO PLUS</strong></p>
    <p>Địa chỉ liên hệ : Số nhà 123, đường 422b, Hoài Đức Hà Nội</p>
    <p>Điện thoại: 0985 316 789</p>

    <h2>Bên thuê phòng</h2>
    <p>Họ và tên người đại diện: <strong>${escapeHtml(representative.name || "")}</strong></p>
    <p>Số CCCD/CMND: ${escapeHtml(representative.identityNumber || "")}</p>
    <p>Số điện thoại: ${escapeHtml(representative.phone || "")}</p>
    <p>Email: ${escapeHtml(representative.email || "")}</p>

    <h2> THÔNG TIN PHÒNG THUÊ VÀ THỜI HẠN HỢP ĐỒNG</h2>

<div class="contract-info">
  <div class="info-row">
    <span class="label">1. Phòng thuê:</span>
    <span class="value">
      ${escapeHtml(room.roomNumber || "")} - ${escapeHtml(room.name || "")}
    </span>
  </div>

  <div class="info-row">
    <span class="label">2. Tầng:</span>
    <span class="value">
      ${escapeHtml(room.floor ?? "")}
    </span>
  </div>

  <div class="info-row">
    <span class="label">3. Diện tích:</span>
    <span class="value">
      ${escapeHtml(room.area ?? 0)} m²
    </span>
  </div>

  <div class="info-row">
    <span class="label">4. Số người ở:</span>
    <span class="value">
      ${escapeHtml(contract.memberCount || members.length || 1)} người
    </span>
  </div>

  <div class="info-row">
    <span class="label">5. Ngày bắt đầu thuê:</span>
    <span class="value">
      ${formatDate(contract.moveInDate)}
    </span>
  </div>

  <div class="info-row">
    <span class="label">6. Thời hạn hợp đồng:</span>
    <span class="value">
      ${escapeHtml(contract.durationMonths)} tháng
    </span>
  </div>

  <div class="info-row">
    <span class="label">7. Ngày hết hạn:</span>
    <span class="value">
      ${formatDate(contract.endDate)}
    </span>
  </div>
</div>

    <h2>Gia thue va cac khoan phi</h2>
    <table>
      <tr><th>Gia thue hang thang</th><td>${formatCurrency(contract.monthlyRent)}</td></tr>
      <tr><th>Tien coc</th><td>${formatCurrency(contract.deposit)}</td></tr>
      <tr><th>Don gia dien</th><td>${formatCurrency(room.electricityPrice)}</td></tr>
      <tr><th>Don gia nuoc</th><td>${formatCurrency(room.waterPrice)}</td></tr>
      <tr><th>Phi dich vu</th><td>${formatCurrency(room.serviceFee)}</td></tr>
    </table>

    <h2>Danh sach thanh vien trong phong</h2>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Ho ten</th>
          <th>CCCD/CMND</th>
          <th>Dien thoai</th>
          <th>Vai tro</th>
        </tr>
      </thead>
      <tbody>
        ${members.length
      ? members
        .map(
          (member, index) => `<tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(member.user?.name || "")}</td>
            <td>${escapeHtml(member.user?.identityNumber || "")}</td>
            <td>${escapeHtml(member.user?.phone || "")}</td>
            <td>${member.roomRole === "representative" ? "Nguoi dai dien" : "Thanh vien"}</td>
          </tr>`
        )
        .join("")
      : `<tr><td colspan="5">Chua co danh sach thanh vien</td></tr>`
    }
      </tbody>
    </table>

    <h2>Dieu khoan chung</h2>
    <p>1. Ben thue co trach nhiem thanh toan tien phong va cac khoan phi dung han theo thoa thuan.</p>
    <p>2. Ben thue co trach nhiem giu gin tai san, ve sinh va an ninh trat tu trong khu tro.</p>
    <p>3. Khi cham dut hop dong, ben thue phai thong bao truoc theo thoa thuan va ban giao phong trong tinh trang hop ly.</p>
    <p>4. Cac dieu khoan bo sung: ${escapeHtml(contract.terms || "................................................................................................")}</p>

    <p>Hop dong duoc lap thanh 02 ban co gia tri nhu nhau, moi ben giu 01 ban.</p>

    <div class="signatures">
      <div>
        <p class="signature-title">Ben cho thue</p>
        <p class="muted">(Ky va ghi ro ho ten)</p>
        <br /><br /><br />
      </div>
      <div>
        <p class="signature-title">Ben thue</p>
        <p class="muted">(Ky va ghi ro ho ten)</p>
        ${signatureImage ? `<img class="signature-image" src="${escapeHtml(signatureImage)}" alt="Chu ky ben thue" />` : "<br /><br /><br />"}
        <p><strong>${escapeHtml(representative.name || "")}</strong></p>
        ${signedAt ? `<p class="muted">Da ky luc: ${escapeHtml(signedAt.toLocaleString("vi-VN"))}</p>` : ""}
      </div>
    </div>

    ${contract.contentHash || lockedAt ? `<div class="legal-proof">
      <p><strong>Thong tin khoa hop dong dien tu</strong></p>
      <p>Ma bam SHA-256: ${escapeHtml(contract.contentHash || "")}</p>
      <p>Thoi gian khoa: ${escapeHtml(lockedAt ? lockedAt.toLocaleString("vi-VN") : "")}</p>
      <p>Phuong thuc ky: ${escapeHtml(contract.signatureMethod || "")}</p>
      <p>Phien ban hop dong: ${escapeHtml(contract.version || 1)}</p>
    </div>` : ""}
  </main>
</body>
</html>`;
};

module.exports = renderContractHtml;
