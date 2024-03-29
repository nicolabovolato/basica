import { ILogger } from "@basica/core/logger";
import { Cluster } from "ioredis";
import { Wrapper } from "./wrapper";
import { ClusterWrapperConfig, getClusterConfig } from "./config";

export class ClusterWrapper extends Wrapper<Cluster> {
  constructor(props: ClusterWrapperConfig, logger: ILogger);
  constructor(props: ClusterWrapperConfig, logger: ILogger, name: string);
  constructor(options: ClusterWrapperConfig, logger: ILogger, name?: string) {
    const { nodes, config } = getClusterConfig(options);

    const ioredis = new Cluster(nodes, config);
    super(ioredis, logger, name);
  }
}
