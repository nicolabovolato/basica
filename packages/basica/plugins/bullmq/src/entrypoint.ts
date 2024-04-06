import { IEntrypoint } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { Processor, Worker, WorkerOptions } from "bullmq";

export class BullMqWorkerEntrypoint<T, R> implements IEntrypoint {
  #worker: Worker<T, R>;
  #logger: ILogger;

  constructor(
    logger: ILogger,
    name: string,
    queueName: string,
    processor: Processor<T, R>,
    options: WorkerOptions
  ) {
    this.#logger = logger.child({ name: `@basica:entrypoint:bullmq:${name}` });

    this.#worker = new Worker(queueName, processor, {
      autorun: false,
      ...options,
    });
    this.#worker.on("completed", (job) => {
      this.#logger.info({ id: job.id }, `Job ${job.id} completed`);
    });
    this.#worker.on("failed", (job, err) => {
      this.#logger.error(
        { id: job?.id, err },
        `Job ${job?.id} failed with error`
      );
    });
    this.#worker.on("error", (err) => {
      this.#logger.error(err, `Error processing job`);
    });
  }

  async start() {
    this.#worker.run();
  }

  async shutdown() {
    await this.#worker.close();
  }
}
