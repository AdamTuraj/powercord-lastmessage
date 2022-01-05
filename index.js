const { Plugin } = require("powercord/entities");
const { getModule, channels } = require("powercord/webpack");
const { getMessages } = getModule(["getMessages"], false);
const { getCurrentUser } = getModule(["getCurrentUser"], false);

const { ComponentDispatch } = getModule(["ComponentDispatch"], false);

const Settings = require("./Settings");

module.exports = class LastMessage extends Plugin {
  keys_pressed = [];
  arrow_replacements = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
  };

  getTextBox() {
    return document.querySelector(
      "#app-mount > div.app-1q1i1E > div > div.layers-3iHuyZ.layers-3q14ss > div > div > div > div > div.chat-3bRxxu > div.content-yTz4x3 > main > form > div > div > div > div > div > div.textArea-12jD-V.textAreaSlate-1ZzRVj.slateContainer-3Qkn2x > div.markup-2BOw-j.slateTextArea-1Mkdgw.fontSize16Padding-3Wk7zP"
    );
  }

  getLastMessage() {
    const msgs = getMessages(channels.getChannelId()).toArray();

    if (!this.current_user_id) {
      this.current_user_id = getCurrentUser().id;
    }

    const last_msg = msgs.filter(
      (msg) => msg.author.id === this.current_user_id
    );

    if (last_msg.length) {
      return last_msg.pop();
    }
  }

  maybeAddKey(key, keybind) {
    if (keybind.includes(key) && !this.keys_pressed.includes(key)) {
      this.keys_pressed.push(key);
      return true;
    }
    return false;
  }

  checkIfAddKey(key, keybind) {
    if (this.keys_pressed.length !== keybind.length) {
      if (this.maybeAddKey(key, keybind)) {
        if (this.keys_pressed.length === keybind.length) {
          return true;
        }
      }
    }
    return false;
  }

  async startPlugin() {
    powercord.api.settings.registerSettings("last_message", {
      category: this.entityID,
      label: "Last Message",
      render: Settings,
    });

    document.addEventListener("keydown", (event) => {
      const keybinds = this.settings
        .get("keybind", ["down"])
        .split("+")
        .map((keybind) => keybind.toLowerCase());

      if (!this.settings.get("enabled", true) || !keybinds.length) {
        return;
      }

      if (
        !this.checkIfAddKey(
          this.arrow_replacements[event.key]
            ? this.arrow_replacements[event.key]
            : event.key.toLowerCase(),
          keybinds
        )
      ) {
        return;
      }

      this.keys_pressed = [];

      const last_msg = this.getLastMessage();

      if (document.activeElement !== this.getTextBox() || !last_msg) {
        return;
      }

      ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", {
        content: last_msg.content.trim(),
      });
    });

    document.addEventListener("keyup", (event) => {
      const index = this.keys_pressed.indexOf(event.key);

      if (index !== -1) {
        this.keys_pressed.pop(index);
      }
    });
  }

  pluginWillUnload() {
    powercord.api.settings.unregisterSettings("last_message");
  }
};
