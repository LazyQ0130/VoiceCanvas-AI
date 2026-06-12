export class SpeechController {
  constructor({ onResult, onStatusChange, onError }) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = Boolean(Recognition);
    this.shouldRestart = false;

    if (!this.supported) return;

    this.recognition = new Recognition();
    this.recognition.lang = "zh-CN";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onstart = () => onStatusChange("listening");
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
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
        this.shouldRestart = false;
      }
      if (event.error !== "no-speech") onError(event.error);
    };
    this.recognition.onend = () => {
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

  start() {
    if (!this.supported) return false;
    this.shouldRestart = true;
    try {
      this.recognition.start();
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (!this.supported) return;
    this.shouldRestart = false;
    this.recognition.stop();
  }
}
