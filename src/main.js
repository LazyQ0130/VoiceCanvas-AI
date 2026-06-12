import { CommandExecutor } from "./commandExecutor.js";
import { CommandParser } from "./commandParser.js";
import { DrawingEngine } from "./drawingEngine.js";
import { HistoryManager } from "./historyManager.js";
import { Logger } from "./logger.js";
import { SpeechController } from "./speechController.js";

const elements = {
  canvas: document.querySelector("#drawingCanvas"),
  startButton: document.querySelector("#startButton"),
  stopButton: document.querySelector("#stopButton"),
  compatibilityMessage: document.querySelector("#compatibilityMessage"),
  rawTranscript: document.querySelector("#rawTranscript"),
  parsedCommand: document.querySelector("#parsedCommand"),
  executionResult: document.querySelector("#executionResult"),
  latencyValue: document.querySelector("#latencyValue"),
  currentColor: document.querySelector("#currentColor"),
  currentLineWidth: document.querySelector("#currentLineWidth"),
  colorChip: document.querySelector("#colorChip"),
  statusPill: document.querySelector("#statusPill"),
  heroStatusDot: document.querySelector("#heroStatusDot"),
  heroStatusText: document.querySelector("#heroStatusText"),
  listeningOverlay: document.querySelector("#listeningOverlay"),
  logList: document.querySelector("#logList"),
  logCount: document.querySelector("#logCount"),
};

const parser = new CommandParser();
const drawingEngine = new DrawingEngine(elements.canvas);
const historyManager = new HistoryManager((operations) => drawingEngine.render(operations));
const logger = new Logger(elements.logList, elements.logCount);
const executor = new CommandExecutor({
  drawingEngine,
  historyManager,
  onToolChange: updateToolState,
});

const speechController = new SpeechController({
  onResult: handleSpeechResult,
  onStatusChange: updateListeningState,
  onError: handleSpeechError,
});

initialize();

function initialize() {
  updateToolState(executor.state);
  logger.add("VoiceCanvas AI 已就绪");

  if (!speechController.supported) {
    elements.compatibilityMessage.textContent =
      "当前浏览器不支持 Web Speech API，请使用最新版 Chrome 或 Edge。";
    elements.startButton.disabled = true;
    updateStatus("不兼容");
  }

  elements.startButton.addEventListener("click", async () => {
    elements.startButton.disabled = true;
    showResult("正在请求麦克风权限，请留意浏览器地址栏提示…", true);
    const started = await speechController.start();
    if (!started && speechController.supported) {
      elements.startButton.disabled = false;
    }
  });
  elements.stopButton.addEventListener("click", () => speechController.stop());
}

function handleSpeechResult(transcript, isFinal) {
  elements.rawTranscript.textContent = transcript;
  if (!isFinal) {
    updateStatus("识别中");
    return;
  }

  const startTime = performance.now();
  const command = parser.parse(transcript);
  elements.parsedCommand.textContent = JSON.stringify(command, null, 2);

  const result = executor.execute(command);
  const latency = Math.round(performance.now() - startTime);
  elements.latencyValue.textContent = String(latency);
  showResult(result.message, result.success);
  logger.add(`“${transcript}” → ${result.message}`, result.success ? "success" : "error");
  updateStatus(result.success ? "执行完成" : "需要重试");
}

function handleSpeechError(error) {
  const messages = {
    "not-allowed": "麦克风权限被拒绝，请点击地址栏左侧图标并允许麦克风权限",
    "service-not-allowed": "浏览器语音识别服务不可用，请使用最新版 Chrome 或 Edge，并检查网络连接",
    "audio-capture": "没有检测到可用麦克风",
    network: "语音识别网络连接异常",
    unsupported: "当前浏览器不支持 Web Speech API，请使用最新版 Chrome 或 Edge",
    "insecure-context": "麦克风只能在 localhost 或 HTTPS 页面使用，请通过 http://localhost:8000 打开",
    "already-started": "语音识别已经在运行",
    "start-failed": "语音识别启动失败，请刷新页面后重试",
    "start-timeout": "语音识别服务启动超时，请检查网络连接或换用 Chrome / Edge",
  };
  const message = messages[error] ?? `语音识别发生错误：${error}`;
  showResult(message, false);
  logger.add(message, "error");
}

function updateListeningState(status) {
  const listening = status === "listening";
  const starting = status === "starting";
  elements.startButton.disabled = listening || starting;
  elements.stopButton.disabled = !listening;
  elements.heroStatusDot.classList.toggle("active", listening);
  elements.listeningOverlay.classList.toggle("visible", listening);
  elements.heroStatusText.textContent = starting
    ? "正在请求麦克风权限"
    : listening
      ? "语音控制已开启"
      : "语音控制已停止";
  updateStatus(starting ? "正在启动" : listening ? "正在聆听" : "已停止");
}

function updateToolState(state) {
  elements.currentColor.textContent = state.color;
  elements.currentLineWidth.textContent = String(state.lineWidth);
  elements.colorChip.style.background = state.color;
}

function updateStatus(status) {
  elements.statusPill.textContent = status;
}

function showResult(message, success) {
  elements.executionResult.textContent = message;
  elements.executionResult.style.color = success ? "#86efac" : "#fda4af";
}
