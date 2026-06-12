export class Logger {
  constructor(container, countElement) {
    this.container = container;
    this.countElement = countElement;
    this.entries = [];
  }

  add(message, level = "success") {
    this.entries.unshift({
      message,
      level,
      time: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
    this.entries = this.entries.slice(0, 30);
    this.render();
  }

  render() {
    this.countElement.textContent = String(this.entries.length);
    this.container.innerHTML = this.entries
      .map(
        ({ message, level, time }) => `
          <article class="log-entry ${level === "error" ? "error" : ""}">
            <span class="log-icon">${level === "error" ? "×" : "✓"}</span>
            <p>${this.escape(message)}</p>
            <time>${time}</time>
          </article>
        `,
      )
      .join("");
  }

  escape(value) {
    const node = document.createElement("div");
    node.textContent = value;
    return node.innerHTML;
  }
}
