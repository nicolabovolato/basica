// import { IHealthcheck, IShutdown } from "@basica/core";
// import { ILogger } from "@basica/core/logger";
// import { BentoCache as BentoCacheCache, bentostore } from "bentocache";
// import { BentoCachePlugin, RawBentoCacheOptions } from "bentocache/types";

// // TODO: healthcheck
// export class BentoCache<
//     KnownCaches extends Record<string, ReturnType<typeof bentostore>>,
//   >
//   extends BentoCacheCache<KnownCaches>
//   implements IShutdown
// {
//   constructor(
//     config: RawBentoCacheOptions & {
//       default: keyof KnownCaches;
//       stores: KnownCaches;
//       plugins?: BentoCachePlugin[];
//     },
//     logger: ILogger
//   ) {
//     super({
//       logger: logger,
//       ...config,
//     });
//   }

//   async shutdown() {
//     await super.disconnectAll();
//   }
// }
