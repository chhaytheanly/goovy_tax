const currentYear = new Date().getFullYear();

function getVehicleAge(productionYear) {
  const year = parseInt(productionYear, 10);
  if (isNaN(year)) return null;
  return currentYear - year;
}

function getPassengerCarTax(yearOfVehicle, cylinder) {
  const cyl = parseInt(cylinder, 10);
  const yov = yearOfVehicle;
  if (cyl <= 1500) {
    if (yov <= 5) return 150000;
    if (yov <= 10) return 100000;
    return 80000;
  }
  if (cyl <= 2000) {
    if (yov <= 5) return 200000;
    if (yov <= 10) return 150000;
    return 100000;
  }
  if (cyl <= 2900) {
    if (yov <= 5) return 600000;
    if (yov <= 10) return 400000;
    return 250000;
  }
  if (cyl <= 4000) {
    if (yov <= 5) return 1600000;
    if (yov <= 10) return 1000000;
    return 600000;
  }
  if (yov <= 5) return 2000000;
  if (yov <= 10) return 1200000;
  return 800000;
}

function getPassengerTransportTax(yearOfVehicle, seats) {
  const s = parseInt(seats, 10);
  const yov = yearOfVehicle;
  if (s <= 9) {
    if (yov <= 5) return 150000;
    if (yov <= 10) return 100000;
    return 80000;
  }
  if (s <= 15) {
    if (yov <= 5) return 200000;
    if (yov <= 10) return 150000;
    return 100000;
  }
  if (s <= 25) {
    if (yov <= 5) return 250000;
    if (yov <= 10) return 200000;
    return 150000;
  }
  if (yov <= 5) return 300000;
  if (yov <= 10) return 250000;
  return 200000;
}

function getTruckTax(weight) {
  const w = parseInt(weight, 10);
  if (w < 3000) return 200000;
  if (w <= 10000) return 500000;
  if (w <= 20000) return 1000000;
  return 2000000;
}

const MODIFY_TAX_RATES = {
  rormork4: 200000,
  rormork8: 500000,
  truck6: 1000000,
  truck10: 2000000,
};

function getModifyTax(modifyType) {
  return MODIFY_TAX_RATES[modifyType] || 0;
}

function getPowerTax(power) {
  const p = parseInt(power, 10);
  if (isNaN(p) || p < 150) return 0;
  if (p <= 250) return 200000;
  if (p <= 500) return 500000;
  return 1000000;
}

function getRiverCargoTax(weight) {
  const w = parseInt(weight, 10);
  if (w < 3000) return 50000;
  if (w <= 10000) return 100000;
  if (w <= 20000) return 200000;
  return 100000;
}

function getRiverPassengerTax(length) {
  const l = parseInt(length, 10);
  if (l <= 20) return 100000;
  if (l <= 30) return 200000;
  return 300000;
}

function getSeaCargoTax(weight) {
  const w = parseInt(weight, 10);
  if (w < 100000) return 200000;
  if (w <= 1000000) return 300000;
  if (w <= 2000000) return 750000;
  return 1200000;
}

function getSeaPassengerTax(length) {
  const l = parseInt(length, 10);
  if (l <= 20) return 100000;
  return 150000;
}

export function calculateVehicleTax(data) {
  let taxAmount = 0;
  let taxableBase = 0;
  let details = {};

  if (data.transportType === "land") {
    if (data.vehicleType === "passengerCar") {
      const yov = getVehicleAge(data.carYear);
      taxableBase = yov;
      taxAmount = getPassengerCarTax(yov, data.carCylinder);
      details = { label: "Passenger Cars", yearOfVehicle: yov, cylinder: data.carCylinder };
    } else if (data.vehicleType === "passengerTransport") {
      const yov = getVehicleAge(data.busYear);
      taxableBase = yov;
      taxAmount = getPassengerTransportTax(yov, data.busSeats);
      details = { label: "Passenger Transport Vehicles", yearOfVehicle: yov, seats: data.busSeats };
    } else if (data.vehicleType === "truck") {
      taxableBase = parseInt(data.truckWeight, 10) || 0;
      taxAmount = getTruckTax(data.truckWeight);
      details = { label: "Trucks", weight: data.truckWeight };
    } else if (data.vehicleType === "modify") {
      taxAmount = getModifyTax(data.modifyType);
      details = { label: "Modify Vehicle", modifyType: data.modifyType };
    }
  } else if (data.transportType === "water") {
    if (data.waterType === "tugs") {
      taxableBase = parseInt(data.powerHP, 10) || 0;
      taxAmount = getPowerTax(data.powerHP);
      details = { label: "Tugs & fishing Boats and speedBoats", power: data.powerHP };
    } else if (data.waterType === "river") {
      if (data.riverType === "cargo") {
        taxableBase = parseInt(data.cargoWeight, 10) || 0;
        taxAmount = getRiverCargoTax(data.cargoWeight);
        details = { label: "River Cargo Ships/Barges", weight: data.cargoWeight };
      } else {
        taxableBase = parseInt(data.boatLength, 10) || 0;
        taxAmount = getRiverPassengerTax(data.boatLength);
        details = { label: "River Passenger Boats", length: data.boatLength };
      }
    } else if (data.waterType === "sea") {
      if (data.seaType === "cargo") {
        taxableBase = parseInt(data.cargoWeight, 10) || 0;
        taxAmount = getSeaCargoTax(data.cargoWeight);
        details = { label: "Sea Cargo Ships/Barges", weight: data.cargoWeight };
      } else {
        taxableBase = parseInt(data.boatLength, 10) || 0;
        taxAmount = getSeaPassengerTax(data.boatLength);
        details = { label: "Sea Passenger Boats", length: data.boatLength };
      }
    }
  }

  return {
    taxAmount,
    taxableBase,
    total: taxAmount,
    details,
  };
}
