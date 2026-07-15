---
sidebar_position: 4
---

# Benchmarks

All benchmarks were run as Node.js v24 containerized workloads, using 4 CPU cores and 4GiB RAM.
Docker host running on Macbook M3 Pro 2023 36GB.

Find the benchmarks' code [here](https://github.com/nicolabovolato/basica/tree/master/packages/benchmarks)

## HTTP Benchmark

Requirements:

- endpoint returning 200 and no body
- request logging (using framework builtins, recommendations if not present, Basica recommendations if not present)

Benchmarks run with autocannon (100 requests, 10 pipelines, 40 seconds)

| Framework            | Startup Time (ms) | Throughput (MB/s) (p50) | Requests/s (p50) | Latency (ms) (p99) | CPU (%) (mean) | RAM (%) (mean) |
| -------------------- | ----------------: | ----------------------: | ---------------: | -----------------: | -------------: | -------------: |
| **Basica + Fastify** |                12 |                    5.61 |            47839 |                 55 |            150 |             33 |
| Fastify              |                13 |                    5.37 |            45727 |                 55 |            106 |             14 |
| NestJS               |               194 |                    1.37 |             9919 |                112 |            103 |              3 |
| NestJS + Fastify     |               217 |                    5.02 |            42783 |                 58 |            107 |             13 |

## CRUD Benchmark

Requirements:

- REST api with CRUD methods
- request logging (using framework builtins, recommendations if not present, Basica recommendations if not present)
- not found / conflict error mapping (using framework builtins, recommendations if not present, Basica recommendations if not present)
- request validation and response serialization (using framework builtins, recommendations if not present, Basica recommendations if not present)
- postgresql + migrations (using framework builtins, recommendations if not present, Basica recommendations if not present)

Benchmarks run with autocannon (100 requests, 10 pipelines, 40 seconds)

| Framework            | Startup Time (ms) | Throughput (MB/s) (p50) | Requests/s (p50) | Latency (ms) (p99) | CPU (%) (mean) | RAM (%) (mean) |
| -------------------- | ----------------: | ----------------------: | ---------------: | -----------------: | -------------: | -------------: |
| **Basica + Fastify** |               156 |                   54.22 |             2519 |                542 |            120 |              9 |
| Fastify              |                87 |                   53.50 |             2485 |                514 |            119 |              8 |
| NestJS               |               337 |                   22.47 |              841 |               2213 |            119 |             11 |
| NestJS + Fastify     |               332 |                   22.92 |              876 |               2038 |            119 |             12 |
