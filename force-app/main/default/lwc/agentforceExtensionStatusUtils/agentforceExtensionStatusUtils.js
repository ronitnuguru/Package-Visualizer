const UNAVAILABLE_EXTENSION_STATUS = {
  state: "UNAVAILABLE",
  message:
    "Package Visualizer could not verify the Agentforce extension status. Try again later."
};

const PERMISSION_REQUIRED_EXTENSION_STATUS = {
  state: "PERMISSION_REQUIRED",
  message:
    "Package Visualizer Permission is required to verify the Agentforce extension status."
};

export function getExtensionStatusFailure(error) {
  const message = error?.body?.message || error?.message || "";
  const isStatusControllerAccessError =
    message.includes("AgentforceExtensionStatusController") &&
    /Apex class|class access/i.test(message);
  return isStatusControllerAccessError
    ? { ...PERMISSION_REQUIRED_EXTENSION_STATUS }
    : { ...UNAVAILABLE_EXTENSION_STATUS };
}
