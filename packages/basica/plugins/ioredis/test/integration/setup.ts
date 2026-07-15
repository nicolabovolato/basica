import { setTimeout } from "node:timers/promises";

import { RedisContainer } from "@testcontainers/redis";
import { GenericContainer, Network, Wait } from "testcontainers";
import type { TestProject } from "vitest/node";

type ClusterNode = { host: string; port: number };

declare module "vitest" {
  export interface ProvidedContext {
    redisUrl: string;
    redisCluster: {
      nodes: ClusterNode[];
      natMap: Record<string, ClusterNode>;
    };
  }
}

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
const startRedisCluster = async () => {
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
        .start(),
    ),
  );

  const ips = containers.map((c) => c.getIpAddress(network.getName()));

  await Promise.all(
    containers.map((c, i) =>
      c.exec(["redis-cli", "config", "set", "cluster-announce-ip", ips[i]]),
    ),
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
    const { output } = await containers[0].exec([
      "redis-cli",
      "cluster",
      "info",
    ]);
    if (output.includes("cluster_state:ok")) break;
    if (Date.now() > deadline) {
      throw new Error("redis cluster did not reach a ready state in time");
    }
    await setTimeout(250);
  }

  return {
    nodes: containers.map((c) => ({
      host: c.getHost(),
      port: c.getMappedPort(6379),
    })),
    natMap: Object.fromEntries(
      containers.map((c, i) => [
        `${ips[i]}:6379`,
        { host: c.getHost(), port: c.getMappedPort(6379) },
      ]),
    ),
    stop: async () => {
      await Promise.all(containers.map((c) => c.stop()));
      await network.stop();
    },
  };
};

export default async function setup(project: TestProject) {
  const [redis, cluster] = await Promise.all([
    new RedisContainer("redis:8-alpine").start(),
    startRedisCluster(),
  ]);

  project.provide("redisUrl", redis.getConnectionUrl());
  project.provide("redisCluster", {
    nodes: cluster.nodes,
    natMap: cluster.natMap,
  });

  return async () => {
    await Promise.all([redis.stop(), cluster.stop()]);
  };
}
