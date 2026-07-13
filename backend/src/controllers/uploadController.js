const uploadRoomImages = (req, res) => {
  const urls = (req.files || []).map((file) => `/uploads/rooms/${file.filename}`);
  res.status(201).json({ urls });
};

const uploadRepairRequestImages = (req, res) => {
  const urls = (req.files || []).map((file) => `/uploads/repair-requests/${file.filename}`);
  res.status(201).json({ urls });
};

module.exports = { uploadRepairRequestImages, uploadRoomImages };
