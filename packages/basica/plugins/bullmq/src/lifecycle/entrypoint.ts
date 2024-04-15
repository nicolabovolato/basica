import { IEntrypoint } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { Job, Processor, Worker, WorkerOptions } from "bullmq";
import { tracer } from "../tracer";
import { SpanStatusCode } from "@opentelemetry/api";

export class BullMqWorkerEntrypoint<T, R> implements IEntrypoint {
  #worker: Worker<T, R>;
  #logger: ILogger;
  #processor: Processor<T, R>;

  constructor(
    logger: ILogger,
    name: string,
    queueName: string,
    processor: Processor<T, R>,
    options: WorkerOptions
  ) {
    this.#logger = logger.child({ name: `@basica:entrypoint:bullmq:${name}` });
    this.#processor = processor;

    this.#worker = new Worker(
      queueName,
      async (job, token) => await this.#handle(job, token),
      {
        autorun: false,
        ...options,
      }
    );
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

  async #handle(job: Job<T, R>, token?: string) {
    const queue = job.queueName;
    return await tracer.startActiveSpan(
      `handle:${queue}`,
      {
        attributes: {
          "job.id": job.id,
        },
      },
      async (span) => {
        this.#logger.info(
          { queue, jobId: job.id },
          `Received job on queue ${queue}`
        );

        try {
          return await this.#processor(job, token);
        } catch (err) {
          this.#logger.error(
            { err, queue, jobId: job.id },
            `Error handling job on queue ${queue}`
          );
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });

          throw err;
        } finally {
          span.end();
        }
      }
    );
  }

  async start() {
    this.#worker.run();
  }

  async shutdown() {
    await this.#worker.close();
  }
}
