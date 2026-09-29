import { establishPrimitive } from "./webkit.js";
import { installWindowP } from "./utils/mem.js";

const output = document.getElementById("console");

function writeLog(message, type = "log", progress = null, replace = false) {
  // توافق مع الاستعمال القديم:
  // writeLog(message, type, true/false)
  if (typeof progress === "boolean") {
    replace = progress;
    progress = null;
  }

  let line = replace ? output.lastElementChild : null;

  if (!line) {
    line = document.createElement("div");
    output.appendChild(line);
  }

  let marker = "*";
  if (type === "error") marker = "-";
  if (type === "info" || type === "success") marker = "+";

  line.textContent = `[${marker}] ${message}`;

  // الاحتفاظ بآخر 11 سطر فقط
  while (output.children.length > 11) {
    output.removeChild(output.firstElementChild);
  }

  // إبقاء العرض داخل الصندوق وآخر سطر ظاهر
  output.scrollTop = output.scrollHeight;

  // تحديث شريط التقدم السفلي إذا وصلت نسبة
  if (progress !== null && typeof window.updateProgress === "function") {
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
  writeLog("Credits: Eyad AL-Darawi, ntfargo, ufm42, Sonic_Iso, Jordy, Dr. Yenyen, TheFlow, SlidyBat, Flatz, cow, nhk, bollarz, Sleirsgoevy, EchoStretch, EarthOnion", "info", 5);
  writeLog(`Agent: ${navigator.userAgent}`, "info", 10);
  writeLog(`Firmware: ${window.fw_str}`, "info", 15);
  const primitive = await getPrimitive();
  writeLog(`WebKit base: 0x${getWebKitBase().toString(16)}`, "info", 75);

  await import("./relapse_exploit.js");
  await main(primitive);
}

run().catch((error) => writeLog(error instanceof Error ? error.message : String(error), "error"));