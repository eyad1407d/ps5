import { establishPrimitive } from "./webkit.js";
import { installWindowP } from "./utils/mem.js";

const output = document.getElementById("console");

function writeLog(message, type = "log", progress = null, replace = false) {
  // توافق مع الاستعمال القديم
  if (typeof progress === "boolean") {
    replace = progress;
    progress = null;
  }

  const loadingText = document.getElementById("loadingText");

  // ==========================================
  // تحديث النص السفلي بنفس آخر سطر في الكونسول
  // ==========================================
  if (loadingText) {
    loadingText.textContent = String(message);
  }

  // ==========================================
  // إنشاء سطر الكونسول
  // ==========================================
  let line = replace ? output.lastElementChild : null;

  if (!line) {
    line = document.createElement("div");
    output.appendChild(line);
  }

  // ==========================================
  // لون السطر
  // ==========================================
  let marker = "*";

  if (type === "error") {
    marker = "-";
    line.style.color = "#ff5a5a";
  }
  else if (type === "info") {
    marker = "+";
    line.style.color = "#dcdcdc";
  }
  else if (type === "success") {
    marker = "+";
    line.style.color = "#35d07f";
  }
  else {
    line.style.color = "#dcdcdc";
  }

  // ==========================================
  // كتابة السطر
  // ==========================================
  line.textContent = `[${marker}] ${message}`;

  // ==========================================
  // الاحتفاظ بآخر 10 أسطر فقط
  // ==========================================
  while (output.children.length > 10) {
    output.removeChild(output.firstElementChild);
  }

  // النزول إلى آخر سطر
  output.scrollTop = output.scrollHeight;

  // ==========================================
  // تحديث شريط التقدم
  // ==========================================
  if (
    progress !== null &&
    typeof window.updateProgress === "function"
  ) {
    window.updateProgress(progress);
  }
}

function writeEvent(name, detail, type, progress = null) {
  writeLog(
    detail == null || detail === "" ? name : `${name}: ${detail}`,
    type || (name === "Failed" ? "error" : "log"),
    progress
  );
}

window.writeLog = writeLog;
window.jb = { mark: writeEvent };

async function getPrimitive() {
  writeLog("Starting WebKit exploit", 20);
  const primitive = installWindowP(await establishPrimitive(writeEvent));
  if (!primitive || typeof primitive.read8 !== "function")
    throw new Error("Memory primitive unavailable");

  writeLog("ARW ready", "success");
  return primitive;
}

function get_current_ip() {
  const count = Number(
    syscall(SYSCALL.netgetiflist, 0n, 10n)
  );

  if (count < 0) {
    return null;
  }

  const iface_size = 0x1e0;
  const iface_buf = malloc(iface_size * count);

  if (
    Number(
      syscall(
        SYSCALL.netgetiflist,
        iface_buf,
        BigInt(count)
      )
    ) < 0
  ) {
    return null;
  }

  for (let i = 0; i < count; i++) {
    const offset = BigInt(i * iface_size);

    // Interface name
    let iface_name = "";

    for (let j = 0; j < 16; j++) {
      const c = Number(
        read8(iface_buf + offset + BigInt(j))
      );

      if (c === 0)
        break;

      iface_name += String.fromCharCode(c);
    }

    // IPv4 address
    const ip_offset = offset + 0x28n;

    const ip1 = Number(read8(iface_buf + ip_offset));
    const ip2 = Number(read8(iface_buf + ip_offset + 1n));
    const ip3 = Number(read8(iface_buf + ip_offset + 2n));
    const ip4 = Number(read8(iface_buf + ip_offset + 3n));

    const iface_ip =
      ip1 + "." +
      ip2 + "." +
      ip3 + "." +
      ip4;

    if (
      (iface_name === "eth0" || iface_name === "wlan0") &&
      iface_ip !== "0.0.0.0" &&
      iface_ip !== "127.0.0.1"
    ) {
      return iface_ip;
    }
  }

  return null;
}

function isJailbroken() {
  writeLog("JB: checking syscall environment...", "info");

  writeLog(
    `JB: syscall = ${typeof syscall}`,
    "info"
  );

  writeLog(
    `JB: SYSCALL = ${typeof SYSCALL}`,
    "info"
  );

  writeLog(
    `JB: malloc = ${typeof malloc}`,
    "info"
  );

  writeLog(
    `JB: write8 = ${typeof write8}`,
    "info"
  );

  writeLog(
    `JB: write32 = ${typeof write32}`,
    "info"
  );

  return false;
}

function getWebKitBase() {
  const ctor = globalThis.__ps5NativeCtor;
  if (typeof ctor !== "number" || typeof OFFSET_wk_host_constructor_candidates === "undefined")
    throw new Error("WebKit base inputs are unavailable");

  for (const offset of OFFSET_wk_host_constructor_candidates) {
    const base = ctor - offset;
    if (base >= 0x800000000 && base < 0x900000000 && base % 0x4000 === 0)
      return base;
  }

  throw new Error("WebKit base not found");
}

async function run() {
  const rejection = window.firmware.rejection();
  if (rejection)
    throw new Error(rejection);

  writeLog(
    "Credits: Eyad AL-Darawi, ntfargo, ufm42, Sonic_Iso, Jordy, Dr. Yenyen, TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion",
    "info",
    5
  );

  writeLog(`Agent: ${navigator.userAgent}`, "info", 10);
  writeLog(`Firmware: ${window.fw_str}`, "info", 15);

  const primitive = await getPrimitive();

  // Get current IP
  const currentIP = get_current_ip();
  const ipElement = document.getElementById("ipValue");

  if (currentIP) {
    if (ipElement) {
      ipElement.textContent = currentIP;
    }

    writeLog(`IP: ${currentIP}`, "info", 20);
  } else {
    if (ipElement) {
      ipElement.textContent = "No Network";
    }

    writeLog("IP: No Network", "error");
  }

  writeLog(
    `WebKit base: 0x${getWebKitBase().toString(16)}`,
    "info",
    75
  );

  // Jailbreak check
  writeLog("Checking Jailbreak Status...", "info");

  const jb = isJailbroken();

  const jbStatus = document.getElementById("jbStatus");

  if (jb) {
    writeLog("Jailbreak Detected", "success", 85);

    if (jbStatus) {
      jbStatus.textContent = "Jailbreak Detected";
    }
  } else {
    writeLog("Jailbreak Not Detected", "error");

    if (jbStatus) {
      jbStatus.textContent = "Not Jailbroken";
    }

    throw new Error("Jailbreak not detected");
  }

  await import("./relapse_exploit.js");
  await main(primitive);
}

run().catch((error) =>
  writeLog(
    error instanceof Error ? error.message : String(error),
    "error"
  )
);