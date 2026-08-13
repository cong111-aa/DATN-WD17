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

module.exports = { uploadIdentityImages, uploadPaymentProofImages, uploadRepairRequestImages, uploadRoomImages };
