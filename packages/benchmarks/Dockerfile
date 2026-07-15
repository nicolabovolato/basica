FROM node:24-alpine AS base
# non-interactive: pnpm 10 otherwise prompts before purging node_modules
# (the --prod install below), which aborts in a no-TTY docker build
ENV CI=true
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PATH:$PNPM_HOME
RUN npm i -g pnpm@10.x.x
RUN apk add --no-cache libc6-compat
RUN pnpm i -g turbo

WORKDIR /app
ARG WORKSPACE_NAME
ARG WORKSPACE_PATH

FROM base AS pruned
COPY . .
RUN turbo prune --scope ${WORKSPACE_NAME} --docker

FROM base AS builder
COPY --from=pruned /app/out/json ./
COPY --from=pruned /app/out/pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY turbo.json turbo.json
COPY --from=pruned /app/out/full .
RUN pnpm run build --filter=${WORKSPACE_NAME}

FROM base AS installer-prod
COPY --from=builder /app ./
# "...": include the package AND its (workspace) dependencies, so their
# prod deps (e.g. @basica/core's close-with-grace) are linked too
RUN pnpm install --no-frozen-lockfile --prod --filter=${WORKSPACE_NAME}...

FROM base AS prod
COPY --from=installer-prod /app ./
WORKDIR /app/${WORKSPACE_PATH}

ENV NODE_ENV=production
CMD ["pnpm", "start"]