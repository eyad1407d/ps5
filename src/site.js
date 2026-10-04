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