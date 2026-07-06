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
    .muted { color: #4b5563; font-style: italic; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .page { box-shadow: none; margin: 0; padding: 18mm; width: auto; }
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

    <h1>Hop dong thue phong tro</h1>
    <p class="center">Ma hop dong: <strong>${escapeHtml(contract.contractCode)}</strong></p>
    <p>Hom nay, ngay ${contractCreatedDate.getDate()} thang ${contractCreatedDate.getMonth() + 1} nam ${contractCreatedDate.getFullYear()}, chung toi gom:</p>

    <h2>Ben cho thue</h2>
    <p>Chu nha/Don vi quan ly: <strong>TRO PLUS</strong></p>
    <p>Dia chi lien he: ........................................................................................................</p>
    <p>Dien thoai: ...............................................................................................................</p>

    <h2>Ben thue phong</h2>
    <p>Ho va ten nguoi dai dien: <strong>${escapeHtml(representative.name || "")}</strong></p>
    <p>So CCCD/CMND: ${escapeHtml(representative.identityNumber || "")}</p>
    <p>So dien thoai: ${escapeHtml(representative.phone || "")}</p>
    <p>Email: ${escapeHtml(representative.email || "")}</p>

    <h2>Thong tin phong va thoi han</h2>
    <table>
      <tr><th>Phong</th><td>${escapeHtml(room.roomNumber || "")} - ${escapeHtml(room.name || "")}</td></tr>
      <tr><th>Tang</th><td>${escapeHtml(room.floor ?? "")}</td></tr>
      <tr><th>Dien tich</th><td>${escapeHtml(room.area ?? 0)} m2</td></tr>
      <tr><th>Tong thanh vien</th><td>${escapeHtml(contract.memberCount || members.length || 1)}</td></tr>
      <tr><th>Ngay vao o</th><td>${formatDate(contract.moveInDate)}</td></tr>
      <tr><th>Thoi han hop dong</th><td>${escapeHtml(contract.durationMonths)} thang</td></tr>
      <tr><th>Ngay het han</th><td>${formatDate(contract.endDate)}</td></tr>
    </table>

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
        ${
          members.length
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
        <br /><br /><br />
        <p><strong>${escapeHtml(representative.name || "")}</strong></p>
      </div>
    </div>
  </main>
</body>
</html>`;
};

module.exports = renderContractHtml;
