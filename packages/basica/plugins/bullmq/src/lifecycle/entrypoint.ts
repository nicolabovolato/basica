import { IEntrypoint } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { SpanStatusCode } from "@opentelemetry/api";
import { Job, Processor, Worker, WorkerOptions } from "bullmq";
import { tracer } from "../tracer";

export type WorkerProcessor<T, R> = (
  ...args: [...Parameters<Processor<T, R>>, Worker<T, R>]
) => ReturnType<Processor<T, R>>;

export class BullMqWorkerEntrypoint<T, R> implements IEntrypoint {
  #logger: ILogger;

  #processor: WorkerProcessor<T, R>;

  #queueName: string;
  #options: WorkerOptions;
  #worker?: Worker<T, R>;

  constructor(
    logger: ILogger,
    name: string,
    queueName: string,
    processor: WorkerProcessor<T, R>,
    options: WorkerOptions,
  ) {
    this.#logger = logger.child({
      name: `@basica:entrypoint:bullmq:worker:${name}`,
    });
    this.#processor = processor;

    this.#options = options;
    this.#queueName = queueName;
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
          `Received job on queue ${queue}`,
        );

        try {
          return await this.#processor(job, token, this.#worker!);
        } catch (err) {
          this.#logger.error(
            { err, queue, jobId: job.id },
            `Error handling job on queue ${queue}`,
          );
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });

          throw err;
        } finally {
          span.end();
        }
      },
    );
  }

  #createWorker() {
    const worker = new Worker<T, R>(
      this.#queueName,
      (job, token) => this.#handle(job, token),
      { autorun: false, ...this.#options },
    );
    worker.on("completed", (job) =>
      this.#logger.info({ id: job.id }, `Job ${job.id} completed`),
    );
    worker.on("failed", (job, err) =>
      this.#logger.error(
        { id: job?.id, err },
        `Job ${job?.id} failed with error`,
      ),
    );
    worker.on("error", (err) =>
      this.#logger.error(err, `Error processing job`),
    );
    return worker;
  }

  async start() {
    this.#worker = this.#createWorker();

    this.#worker.run();
    await this.#worker.waitUntilReady();
  }

  async shutdown() {
    await this.#worker?.close();
  }
}
