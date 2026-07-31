# @basica/platform-node

The Node "runner" for a basica app.

## Usage

```ts
import { run } from "@basica/platform-node";
import { AppBuilder } from "@basica/core";

const app = AppBuilder.registerDependencies().build();

run(app);
```