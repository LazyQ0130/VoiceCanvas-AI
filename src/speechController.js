export class SpeechController {
  constructor({ onResult, onStatusChange, onError }) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = Boolean(Recognition);
    this.shouldRestart = false;
    this.startTimer = null;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    if (!this.supported) return;

    this.recognition = new Recognition();
    this.recognition.lang = "zh-CN";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => {
      this.clearStartTimer();
      onStatusChange("listening");
    };
    this.recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) {
          onResult(transcript, true);
        } else {
          interim += transcript;
        }
      }
      if (interim) onResult(interim, false);
    };
    this.recognition.onerror = (event) => {
      this.clearStartTimer();
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
        this.shouldRestart = false;
      }
      if (event.error !== "no-speech") onError(event.error);
    };
    this.recognition.onend = () => {
      this.clearStartTimer();
      if (this.shouldRestart) {
        try {
          this.recognition.start();
        } catch {
          onStatusChange("stopped");
        }
      } else {
        onStatusChange("stopped");
      }
    };
  }

  async start() {
    if (!this.supported) {
      this.onError("unsupported");
      return false;
    }

    if (!window.isSecureContext) {
      this.onError("insecure-context");
      return false;
    }

    this.onStatusChange("starting");
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        this.onError(error.name === "NotAllowedError" ? "not-allowed" : "audio-capture");
        this.onStatusChange("stopped");
        return false;
      }
    }

    this.shouldRestart = true;
    try {
      this.recognition.start();
      this.startTimer = window.setTimeout(() => {
        this.shouldRestart = false;
        this.recognition.abort();
        this.onError("start-timeout");
        this.onStatusChange("stopped");
      }, 8000);
      return true;
    } catch (error) {
      this.shouldRestart = false;
      this.onError(error.name === "InvalidStateError" ? "already-started" : "start-failed");
      this.onStatusChange("stopped");
      return false;
    }
  }

  stop() {
    if (!this.supported) return;
    this.shouldRestart = false;
    this.clearStartTimer();
    try {
      this.recognition.stop();
    } catch {
      this.onStatusChange("stopped");
    }
  }

  clearStartTimer() {
    if (!this.startTimer) return;
    window.clearTimeout(this.startTimer);
    this.startTimer = null;
  }
}
