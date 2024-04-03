# @basica/config

Basica configuration library.

## Usage

```ts
import { configure, envProvider } from "@basica/config"
import { Type } from "@sinclair/typebox"

const config = configure(
    envProvider(),
    Type.Object({
        example: Type.Number(),  // process.env.EXAMPLE
    })
);

console.log(JSON.stringify(config))
```

`EXAMPLE=1000 tsx index.ts`

```json
{"example": 1000}
```