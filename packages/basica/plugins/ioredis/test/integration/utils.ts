import { setTimeout } from "node:timers/promises";

import { loggerFactory } from "@basica/core/logger";

import { StartedRedisContainer } from "@testcontainers/redis";
import {
  GenericContainer,
  StartedTestContainer,
  Wait,
} from "testcontainers";

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

/**
 * Starts a single-node redis cluster using the multi-arch `redis` image.
 *
 * The previous grokzen/redis-cluster image is amd64-only and its nodes
 * segfault under emulation on arm64. Here a single node claims every slot;
 * it advertises its own (container) IP so the cluster reaches `ok` state,
 * and callers translate that address to the host with a natMap.
 */
export const startRedisCluster = async () => {
  const container = await new GenericContainer("redis:7-alpine")
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
    .start();

  const ip = container.getIpAddress(container.getNetworkNames()[0]);
  await container.exec(["redis-cli", "config", "set", "cluster-announce-ip", ip]);
  await container.exec(["redis-cli", "cluster", "addslotsrange", "0", "16383"]);

  const deadline = Date.now() + 15000;
  for (;;) {
    const { output } = await container.exec(["redis-cli", "cluster", "info"]);
    if (output.includes("cluster_state:ok")) break;
    if (Date.now() > deadline) {
      throw new Error("redis cluster did not reach a ready state in time");
    }
    await setTimeout(250);
  }

  return container;
};

export const getClusterWrapper = (
  container: StartedTestContainer,
  cfg?: ClusterWrapperConfig
) => {
  const host = container.getHost();
  const port = container.getMappedPort(6379);
  const ip = container.getIpAddress(container.getNetworkNames()[0]);

  return new ClusterWrapper(
    {
      nodes: [{ host, port }],
      // The node advertises its container IP; map it back to the mapped host port.
      natMap: { [`${ip}:6379`]: { host, port } },
      timeout: 3000,
      ...cfg,
    },
    loggerFactory({ level: "silent" }),
    "test"
  );
};
