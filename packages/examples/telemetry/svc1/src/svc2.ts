import { ILogger } from "@basica/core/logger";

export type Config = {
  url: string;
};

export class Svc2 {
  readonly logger: ILogger;

  constructor(
    readonly config: Config,
    logger: ILogger
  ) {
    this.logger = logger.child({ name: "svc2" });
  }

  async ping() {
    const url = this.config.url + "/ping";
    this.logger.info({ url }, "sending request to svc2");

    try {
      const response = await fetch(url, { method: "POST" });
      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = await response.text();
      this.logger.info({ url, data }, "received response from svc2");
    } catch (err) {
      this.logger.error({ err, url }, "error sending request to svc2");
      throw err;
    }
  }
}
