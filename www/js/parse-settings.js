function parseCurrentSettings(rawdata) {
  const data = rawdata.replace("\r", "").trim();

  const lines = data.split("\r\n");
  console.log(lines);

  this.sim = lines
    .find(
      (line) => line.includes("QUIMSLOT: 1") || line.includes("QUIMSLOT: 2")
    )
    .split(":")[1]
    .replace(/\s/g, "");

  try {
    const apnTest = lines
      .find((line) => line.includes("+CGCONTRDP: "))
      .match(/\+CGCONTRDP: (\d+),(\d+),"([a-zA-Z0-9_\-.]+)",/); // cid, bearer_id, apn
    this.apnID = apnTest[1];
    this.apnName = apnTest[3];
  } catch (error) {
    console.log(error);

    this.apnID = 1;
    this.apnName = "-- Failed fetching APN --";
  }

  this.cellLock4GStatus = lines
    .find((line) => line.includes('+QNWLOCK: "common/4g"'))
    .split(",")[1]
    .replace(/\"/g, "");

  this.cellLock5GStatus = lines
    .find((line) => line.includes('+QNWLOCK: "common/5g"'))
    .split(",")[1]
    .replace(/\"/g, "");

  this.prefNetwork = lines
    .find((line) => line.includes('+QNWPREFCFG: "mode_pref"'))
    .split(",")[1]
    .replace(/\"/g, "");

  this.nrModeControlStatus = lines
    .find((line) => line.includes('+QNWPREFCFG: "nr5g_disable_mode"'))
    .split(",")[1]
    .replace(/\"/g, "");

  this.apnIP = lines
    .find((line) => line.includes(`+CGDCONT: ${apnID}`))
    .split(",")[1]
    .replace(/\"/g, "");

  try {
    const PCCbands = lines
      .find((line) => line.includes('+QCAINFO: "PCC"'))
      .split(",")[3]
      .replace(/\"/g, "");
    
    try {
      const SCCbands = lines
        .filter((line) => line.includes('+QCAINFO: "SCC"'))
        .map((line) => line.split(",")[3].replace(/\"/g, ""))
        .join(", ");
      this.bands = `${PCCbands}` + (SCCbands.length ? `, ${SCCbands}` : '');
    } catch (error) {
      this.bands = PCCbands;
    }
  } catch (error) {
    console.log(error);

    this.bands = "Failed fetching bands";
  }

  if (this.cellLock4GStatus == 1 && this.cellLock5GStatus == 1) {
    this.cellLockStatus = "Locked to 4G and 5G";
  } else if (this.cellLock4GStatus == 1) {
    this.cellLockStatus = "Locked to 4G";
  } else if (this.cellLock5GStatus == 1) {
    this.cellLockStatus = "Locked to 5G";
  } else {
    this.cellLockStatus = "Not Locked";
  }

  if (this.prefNetwork == "AUTO") {
    this.prefNetwork = "WCDMA & LTE & 5G";
  } else if (this.prefNetwork == "LTE") {
    this.prefNetwork = "LTE only";
  } else if (this.prefNetwork == "LTE:NR5G") {
    this.prefNetwork = "LTE & 5G";
  } else if (this.prefNetwork == "5G") {
    this.prefNetwork = "5G only";
  }

  if (this.nrModeControlStatus == 0) {
    this.nrModeControlStatus = "Enable Both";
  } else if (this.nrModeControlStatus == 1) {
    this.nrModeControlStatus = "Disable NR5G-SA";
  } else if (this.nrModeControlStatus == 2) {
    this.nrModeControlStatus = "Disable NR5G-NSA";
  }

  return {
    sim: sim,
    apnID: apnID,
    apnName: apnName,
    apnIP: apnIP,
    cellLockStatus: cellLockStatus,
    prefNetwork: prefNetwork,
    nrModeControl: nrModeControlStatus,
    bands: bands,
  };
}
