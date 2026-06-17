const Building = require("../models/Building");
const Room = require("../models/Room");

const toBuildingResponse = (building) => ({
  id: building._id,
  name: building.name,
  code: building.code,
  address: building.address,
  description: building.description,
  totalFloors: building.totalFloors,
  status: building.status,
  createdAt: building.createdAt,
  updatedAt: building.updatedAt,
});

const validateBuildingPayload = ({ name, code, address, totalFloors, status }, isCreate) => {
  if (isCreate && (!name || !code || !address)) {
    throw new Error("Name, code and address are required");
  }

  if (totalFloors !== undefined && Number(totalFloors) < 1) {
    throw new Error("Total floors must be greater than or equal to 1");
  }

  if (status && !["active", "inactive"].includes(status)) {
    throw new Error("Invalid status");
  }
};

const getBuildings = async (req, res, next) => {
  try {
    const buildings = await Building.find().sort({ createdAt: -1 });
    res.json(buildings.map(toBuildingResponse));
  } catch (error) {
    next(error);
  }
};

const getBuildingById = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id);

    if (!building) {
      res.status(404);
      throw new Error("Building not found");
    }

    res.json(toBuildingResponse(building));
  } catch (error) {
    next(error);
  }
};

const createBuilding = async (req, res, next) => {
  try {
    const { name, code, address, description, totalFloors = 1, status = "active" } = req.body;

    validateBuildingPayload({ name, code, address, totalFloors, status }, true);

    const existingBuilding = await Building.findOne({ code });

    if (existingBuilding) {
      res.status(400);
      throw new Error("Building code already exists");
    }

    const building = await Building.create({
      name,
      code,
      address,
      description,
      totalFloors,
      status,
    });

    res.status(201).json(toBuildingResponse(building));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateBuilding = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id);

    if (!building) {
      res.status(404);
      throw new Error("Building not found");
    }

    const { name, code, address, description, totalFloors, status } = req.body;

    validateBuildingPayload({ name, code, address, totalFloors, status }, false);

    if (code && code !== building.code) {
      const existingBuilding = await Building.findOne({ code });

      if (existingBuilding) {
        res.status(400);
        throw new Error("Building code already exists");
      }

      building.code = code;
    }

    building.name = name ?? building.name;
    building.address = address ?? building.address;
    building.description = description ?? building.description;
    building.totalFloors = totalFloors ?? building.totalFloors;
    building.status = status ?? building.status;

    const updatedBuilding = await building.save();
    res.json(toBuildingResponse(updatedBuilding));
  } catch (error) {
    if (!res.statusCode || res.statusCode < 400) {
      res.status(400);
    }

    next(error);
  }
};

const updateBuildingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const building = await Building.findById(req.params.id);

    if (!building) {
      res.status(404);
      throw new Error("Building not found");
    }

    building.status = status;
    const updatedBuilding = await building.save();
    res.json(toBuildingResponse(updatedBuilding));
  } catch (error) {
    next(error);
  }
};

const deleteBuilding = async (req, res, next) => {
  try {
    const building = await Building.findById(req.params.id);

    if (!building) {
      res.status(404);
      throw new Error("Building not found");
    }

    const roomCount = await Room.countDocuments({ building: building._id });

    if (roomCount > 0) {
      res.status(400);
      throw new Error("Cannot delete building that has rooms");
    }

    await building.deleteOne();
    res.json({ message: "Building deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBuilding,
  deleteBuilding,
  getBuildingById,
  getBuildings,
  updateBuilding,
  updateBuildingStatus,
};
