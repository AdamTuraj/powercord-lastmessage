const { Plugin } = require("powercord/entities");
const { getModule, channels } = require("powercord/webpack");
const { getRawMessages } = getModule(["getRawMessages"], false);
const { getCurrentUser } = getModule(["getCurrentUser"], false);

const { ComponentDispatch } = getModule(["ComponentDispatch"], false);

const Settings = require("./Settings");

module.exports = class LastMessage extends Plugin {
  keys_pressed = [];
  key_replacements = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
    Control: "ctrl",
  };

  getTextBox() {
    // Idk why they made this super difficult
    return document.getElementsByClassName("slateTextArea-27tjG0")[0];
  }

  getLastMessage() {
    const msgs = Object.values(getRawMessages(channels.getChannelId()));

    if (!this.current_user_id) {
      this.current_user_id = getCurrentUser().id;
    }

    const last_msg = msgs.filter(
      (msg) => msg.author.id === this.current_user_id
    );

    if (last_msg.length) {
      return last_msg[0];
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
      console.log(key);
      if (this.maybeAddKey(key, keybind)) {
        console.log("1");
        if (this.keys_pressed.length === keybind.length) {
          console.log("2");
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
        .get("keybind", "Down")
        .split("+")
        .map((keybind) => keybind.toLowerCase());

      console.log(keybinds);

      if (!this.settings.get("enabled", true) || !keybinds.length) {
        return;
      }

      if (
        !this.checkIfAddKey(
          this.key_replacements[event.key]
            ? this.key_replacements[event.key]
            : event.key.toLowerCase(),
          keybinds
        )
      ) {
        console.log("Nope");
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
