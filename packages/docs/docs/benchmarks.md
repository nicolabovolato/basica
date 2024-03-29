---
sidebar_position: 4
---

# Benchmarks

All benchmarks were run as Node.js containerized workloads, using 4 CPU cores and 4GiB RAM.
Docker host running on Macbook M1 Pro 2021 16GB.

Find the benchmarks' code [here](https://github.com/nicolabovolato/basica/tree/master/packages/benchmarks)

## HTTP Benchmark

Requirements:

- endpoint returning 200 and no body
- request logging (using framework builtins, recommendations if not present, Basica recommendations if not present)

Benchmarks run with autocannon (100 requests, 10 pipelines, 40 seconds)

| Framework            | Startup Time (ms) | Throughput (MB/s) (p90) | Requests/s (p90) | Latency (ms) (p90) | CPU (%) (p90) | RAM (%) (p90) |
| -------------------- | ----------------: | ----------------------: | ---------------: | -----------------: | ------------: | ------------: |
| **Basica + Fastify** |                18 |                    0.58 |            39615 |                 31 |           220 |            44 |
| Fastify              |                15 |                    0.61 |            41663 |                 30 |           224 |            45 |
| NestJS               |               339 |                    0.19 |            11199 |                103 |           110 |             3 |
| NestJS + Fastify     |               370 |                    0.53 |            36319 |                 33 |           148 |            40 |

## CRUD Benchmark

Requirements:

- REST api with CRUD methods
- request logging (using framework builtins, recommendations if not present, Basica recommendations if not present)
- not found / conflict error mapping (using framework builtins, recommendations if not present,Bbasica recommendations if not present)
- request/response validation (using framework builtins, recommendations if not present, Basica recommendations if not present)
- postgresql + migrations (using framework builtins, recommendations if not present, Basica recommendations if not present)

Benchmarks run with autocannon (100 requests, 10 pipelines, 40 seconds)

| Framework            | Startup Time (ms) | Throughput (MB/s) (p90) | Requests/s (p90) | Latency (ms) (p90) | CPU (%) (p90) | RAM (%) (p90) |
| -------------------- | ----------------: | ----------------------: | ---------------: | -----------------: | ------------: | ------------: |
| **Basica + Fastify** |               183 |                    4.29 |             1594 |                677 |           129 |             5 |
| Fastify              |                96 |                    4.29 |             1600 |                700 |           126 |             5 |
| NestJS               |               844 |                    2.11 |              638 |               2669 |           126 |             8 |
| NestJS + Fastify     |               859 |                    1.88 |              581 |               2352 |           129 |            10 |
