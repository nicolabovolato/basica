import { IHealthcheck, IShutdown, IStartup } from "@basica/core";
import { Admin } from "kafkajs";

export const adminWrapper = (admin: Admin) => {
  let healthy = false;
  admin.on("admin.connect", () => (healthy = true));
  admin.on("admin.disconnect", () => (healthy = false));

  return {
    ...admin,
    start: async () => {
      await admin.connect();
    },
    shutdown: async () => {
      await admin.disconnect();
    },
    healthcheck: async () => {
      return {
        status: healthy ? "healthy" : "unhealthy",
      };
    },
  } satisfies Admin & IShutdown & IStartup & IHealthcheck;
};
