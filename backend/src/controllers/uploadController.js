const uploadRoomImages = (req, res) => {
  const urls = (req.files || []).map((file) => `/uploads/rooms/${file.filename}`);
  res.status(201).json({ urls });
};

const uploadRepairRequestImages = (req, res) => {
  const urls = (req.files || []).map((file) => `/uploads/repair-requests/${file.filename}`);
  res.status(201).json({ urls });
};

const uploadPaymentProofImages = (req, res) => {
  const urls = (req.files || []).map((file) => `/uploads/payment-proofs/${file.filename}`);
  res.status(201).json({ urls });
};

const uploadIdentityImages = (req, res) => {
  const urls = (req.files || []).map((file) => `/uploads/identity/${file.filename}`);
  res.status(201).json({ urls });
};

const uploadAvatarImage = (req, res) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    return res.status(400).json({ message: "Vui lòng chọn ảnh đại diện" });
  }
  const url = `/uploads/avatars/${file.filename}`;
  res.status(201).json({ url, urls: [url] });
};

module.exports = { uploadAvatarImage, uploadIdentityImages, uploadPaymentProofImages, uploadRepairRequestImages, uploadRoomImages };
