const uploadRoomImages = (req, res) => {
  const urls = (req.files || []).map((file) => `/uploads/rooms/${file.filename}`);
  res.status(201).json({ urls });
};

module.exports = { uploadRoomImages };
