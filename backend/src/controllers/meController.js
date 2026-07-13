const Contract = require("../models/Contract");
const Tenant = require("../models/Tenant");
const renderContractHtml = require("../utils/renderContractHtml");

const tenantPopulate = [
  { path: "user", select: "name email phone identityNumber" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee description status images" },
];

const contractPopulate = [
  { path: "tenant", select: "name email phone identityNumber address" },
  { path: "tenantRecord", select: "moveInDate moveOutDate roomRole status" },
  { path: "room", select: "roomNumber name floor area capacity price deposit electricityPrice waterPrice serviceFee status" },
];

const toTenantResponse = (tenant) => ({
  id: tenant._id,
  roomRole: tenant.roomRole,
  moveInDate: tenant.moveInDate,
  moveOutDate: tenant.moveOutDate,
  status: tenant.status,
  note: tenant.note,
  room: tenant.room?._id || tenant.room,
  roomNumber: tenant.room?.roomNumber,
  roomName: tenant.room?.name,
  roomFloor: tenant.room?.floor,
  roomArea: tenant.room?.area,
  roomCapacity: tenant.room?.capacity,
  roomPrice: tenant.room?.price,
  roomDeposit: tenant.room?.deposit,
  roomElectricityPrice: tenant.room?.electricityPrice,
  roomWaterPrice: tenant.room?.waterPrice,
  roomServiceFee: tenant.room?.serviceFee,
  roomDescription: tenant.room?.description,
  roomStatus: tenant.room?.status,
  roomImages: tenant.room?.images || [],
});

const toContractResponse = (contract) => ({
  id: contract._id,
  contractCode: contract.contractCode,
  tenant: contract.tenant?._id || contract.tenant,
  tenantName: contract.tenant?.name,
  tenantEmail: contract.tenant?.email,
  tenantPhone: contract.tenant?.phone,
  tenantIdentityNumber: contract.tenant?.identityNumber,
  room: contract.room?._id || contract.room,
  roomNumber: contract.room?.roomNumber,
  roomName: contract.room?.name,
  roomFloor: contract.room?.floor,
  memberCount: contract.memberCount,
  monthlyRent: contract.monthlyRent,
  deposit: contract.deposit,
  moveInDate: contract.moveInDate,
  durationMonths: contract.durationMonths,
  startDate: contract.startDate,
  endDate: contract.endDate,
  terms: contract.terms,
  status: contract.status,
  createdAt: contract.createdAt,
  updatedAt: contract.updatedAt,
});

const getActiveMembers = (roomId) =>
  Tenant.find({ room: roomId, status: "active" }).populate("user", "name email phone identityNumber");

const getMyTenancies = async (req, res, next) => {
  try {
    const tenancies = await Tenant.find({ user: req.user._id })
      .populate(tenantPopulate)
      .sort({ status: 1, moveInDate: -1, createdAt: -1 });

    res.json(tenancies.map(toTenantResponse));
  } catch (error) {
    next(error);
  }
};

const getMyContracts = async (req, res, next) => {
  try {
    const contracts = await Contract.find({ tenant: req.user._id })
      .populate(contractPopulate)
      .sort({ status: 1, endDate: -1, createdAt: -1 });

    res.json(contracts.map(toContractResponse));
  } catch (error) {
    next(error);
  }
};

const getMyContractFile = async (req, res, next) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      tenant: req.user._id,
    }).populate(contractPopulate);

    if (!contract) {
      res.status(404);
      throw new Error("Contract not found");
    }

    const members = await getActiveMembers(contract.room?._id || contract.room);
    const html = renderContractHtml({ contract, members });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyContractFile,
  getMyContracts,
  getMyTenancies,
};
