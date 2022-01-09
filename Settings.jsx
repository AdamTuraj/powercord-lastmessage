const { React } = require("powercord/webpack");
const {
  SwitchItem,
  KeybindRecorder,
} = require("powercord/components/settings");

module.exports = ({ getSetting, updateSetting, toggleSetting }) => (
  <div>
    <SwitchItem
      note={"Toggle this plugin on and off."}
      value={getSetting("enabled", true)}
      onChange={() => toggleSetting("enabled")}
    >
      Enable
    </SwitchItem>
    <KeybindRecorder
      note="The keybind to insert your last message."
      value={getSetting("keybind", "Down")}
      required={true}
      onChange={(val) => updateSetting("keybind", val)}
    >
      Keys to insert the last message
    </KeybindRecorder>
  </div>
);
