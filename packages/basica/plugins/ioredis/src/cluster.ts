import { ILogger } from "@basica/core/logger";
import { Cluster } from "ioredis";
import { Wrapper } from "./wrapper";
import { ClusterWrapperConfig, getClusterConfig } from "./config";

/** Redis cluster mode wrapper */
export class ClusterWrapper extends Wrapper<Cluster> {
  /**
   * @param options redis cluster {@link ClusterWrapperConfig config}
   * @param logger {@link ILogger}
   * @param name unique name
   * @example
   * const wrapper = new ClusterWrapper(
   *  { nodes: [{ host: "127.0.0.1", port: "6379" }], timeout: 5000 },
   *  logger
   * )
   * @example
   * const wrapper = new ClusterWrapper(
   *  { nodes: [{ host: "127.0.0.1", port: "6379" }], timeout: 5000 },
   *  logger,
   *  "cache"
   * )
   */
  constructor(props: ClusterWrapperConfig, logger: ILogger);
  constructor(props: ClusterWrapperConfig, logger: ILogger, name: string);
  constructor(options: ClusterWrapperConfig, logger: ILogger, name?: string) {
    const { nodes, config } = getClusterConfig(options);

    const ioredis = new Cluster(nodes, config);
    super(ioredis, logger, name);
  }
}
