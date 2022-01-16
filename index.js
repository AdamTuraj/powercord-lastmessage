const { Plugin } = require("powercord/entities");
const { getModule, channels } = require("powercord/webpack");
const { getMessages } = getModule(["getRawMessages"], false);
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

  special_keys = {
    ctrl: (e) => {
      return e.ctrlKey;
    },
    meta: (e) => {
      return e.metaKey;
    },
    alt: (e) => {
      return e.altKey;
    },
    shift: (e) => {
      return e.shiftKey;
    },
  };

  getTextBox() {
    // Idk why they made this super difficult
    return document.getElementsByClassName("slateTextArea-27tjG0").pop();
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

  isSpecialKey(key) {
    return !!this.special_keys[key];
  }

  specialKeysPressed(keybind, e) {
    let special_keys_pressed = 0;
    Object.keys(this.special_keys).forEach((key) => {
      if (this.special_keys[key](e)) {
        if (!keybind.includes(key)) {
          special_keys_pressed += 6942069;
        } else {
          special_keys_pressed += 1;
        }
      }
    });

    return special_keys_pressed;
  }

  maybeAddKey(key, keybind) {
    if (this.isSpecialKey(key)) {
      return true;
    }

    if (keybind.includes(key) && !this.keys_pressed.includes(key)) {
      this.keys_pressed.push(key);
      return true;
    }
    return false;
  }

  checkIfAddKey(key, keybind, e) {
    if (
      this.keys_pressed.length + this.specialKeysPressed(keybind, e) !==
      keybind.length
    ) {
      if (this.maybeAddKey(key, keybind)) {
        if (
          this.keys_pressed.length + this.specialKeysPressed(keybind, e) ===
          keybind.length
        ) {
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

      if (!this.settings.get("enabled", true) || !keybinds.length) {
        return;
      }

      if (
        !this.checkIfAddKey(
          this.key_replacements[event.key]
            ? this.key_replacements[event.key]
            : event.key.toLowerCase(),
          keybinds,
          event
        )
      ) {
        return;
      }

      this.keys_pressed = [];

      const last_msg = this.getLastMessage();

      const placeholder =
        document.getElementsByClassName("placeholder-1_mJY1")[0];

      console.log(document.activeElement);

      if (
        document.activeElement !== this.getTextBox() ||
        !last_msg ||
        !placeholder
      ) {
        return;
      }

      ComponentDispatch.dispatchToLastSubscribed("INSERT_TEXT", {
        content: last_msg.content.trim(),
      });
    });

    document.addEventListener("keyup", (event) => {
      const index = this.keys_pressed.indexOf(
        this.key_replacements[event.key]
          ? this.key_replacements[event.key]
          : event.key.toLowerCase()
      );

      if (index !== -1) {
        this.keys_pressed.pop(index);
      }
    });
  }

  pluginWillUnload() {
    powercord.api.settings.unregisterSettings("last_message");
  }
};
