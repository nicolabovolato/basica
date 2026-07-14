import { setTimeout } from "node:timers/promises";

import { loggerFactory } from "@basica/core/logger";

import { StartedRedisContainer } from "@testcontainers/redis";
import { GenericContainer, Network, Wait } from "testcontainers";

import { ClusterWrapper } from "src/cluster";
import { RedisWrapper } from "src/redis";
import { ClusterWrapperConfig, RedisWrapperConfig } from "src/config";

export const getRedisWrapper = (
  container: StartedRedisContainer,
  cfg?: RedisWrapperConfig
) => {
  return new RedisWrapper(
    { url: container.getConnectionUrl(), timeout: 1000, ...cfg },
    loggerFactory({ level: "silent" }),
    "test"
  );
};

const CLUSTER_MASTERS = 3;

/**
 * Starts a 3-master redis cluster using the multi-arch `redis` image.
 *
 * The previous grokzen/redis-cluster image is amd64-only and its nodes
 * segfault under emulation on arm64. Here the masters run on a shared
 * network and each advertises its own (network-internal) address, so the
 * cluster forms and CLUSTER SLOTS returns addresses that callers translate
 * to the mapped host ports with a natMap (one entry per node).
 */
export const startRedisCluster = async () => {
  const network = await new Network().start();

  const containers = await Promise.all(
    Array.from({ length: CLUSTER_MASTERS }, () =>
      new GenericContainer("redis:8-alpine")
        .withNetwork(network)
        .withExposedPorts(6379)
        .withCommand([
          "redis-server",
          "--cluster-enabled",
          "yes",
          "--cluster-node-timeout",
          "5000",
          "--appendonly",
          "no",
        ])
        .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
        .start()
    )
  );

  const ips = containers.map((c) => c.getIpAddress(network.getName()));

  await Promise.all(
    containers.map((c, i) =>
      c.exec(["redis-cli", "config", "set", "cluster-announce-ip", ips[i]])
    )
  );

  await containers[0].exec([
    "redis-cli",
    "--cluster",
    "create",
    ...ips.map((ip) => `${ip}:6379`),
    "--cluster-replicas",
    "0",
    "--cluster-yes",
  ]);

  const deadline = Date.now() + 20000;
  for (;;) {
    const { output } = await containers[0].exec(["redis-cli", "cluster", "info"]);
    if (output.includes("cluster_state:ok")) break;
    if (Date.now() > deadline) {
      throw new Error("redis cluster did not reach a ready state in time");
    }
    await setTimeout(250);
  }

  return {
    // seed nodes; ioredis discovers the full topology from any of them
    nodes: containers.map((c) => ({
      host: c.getHost(),
      port: c.getMappedPort(6379),
    })),
    // translate each node's advertised address to its mapped host port
    natMap: Object.fromEntries(
      containers.map((c, i) => [
        `${ips[i]}:6379`,
        { host: c.getHost(), port: c.getMappedPort(6379) },
      ])
    ),
    flushall: async () => {
      await Promise.all(
        containers.map((c) => c.exec(["redis-cli", "flushall"]))
      );
    },
    stop: async () => {
      await Promise.all(containers.map((c) => c.stop()));
      await network.stop();
    },
  };
};

export type RedisClusterHandle = Awaited<ReturnType<typeof startRedisCluster>>;

export const getClusterWrapper = (
  cluster: Pick<RedisClusterHandle, "nodes" | "natMap">,
  cfg?: ClusterWrapperConfig
) => {
  return new ClusterWrapper(
    {
      nodes: cluster.nodes,
      natMap: cluster.natMap,
      timeout: 3000,
      ...cfg,
    },
    loggerFactory({ level: "silent" }),
    "test"
  );
};
