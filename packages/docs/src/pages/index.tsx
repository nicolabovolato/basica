import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import CodeBlock from "@theme/CodeBlock";
import Link from "@docusaurus/Link";

import styles from "./index.module.css";
import { Icon } from "../components/icon";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx("hero", styles.heroBanner, styles.gradientBg)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg margin-right--sm"
            to="/docs/getting-started"
          >
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg margin-left--sm"
            to="https://github.com/nicolabovolato/basica"
          >
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  children: string | JSX.Element;
  icon: JSX.Element;
}) {
  return (
    <div className={clsx("card", styles.center, styles.gradientBg)}>
      <div className="card__header">{icon}</div>
      <div className="card__body">
        <Heading
          as="h4"
          className={clsx("padding-bottom--md", styles.uppercase)}
        >
          {title}
        </Heading>
        {children}
      </div>
      <div className="card__footer"></div>
    </div>
  );
}

const npm = `npm install @basica/core @basica/config @basica/fastify`;
const code = `import { IocContainer } from "@basica/core/ioc";
import { loggerFactory } from "@basica/core/logger";
import { AppBuilder } from "@basica/core";
import { configure, envProvider } from "@basica/config";

import { lifecyclePlugin } from "@basica/fastify";

import { Type } from "@sinclair/typebox";

// Validate configuration
const config = configure(envProvider(), Type.Object({
  logger: loggerConfigSchema
}));

// Dependency injection
const container = new IocContainer()
  .addSingleton("logger", () => loggerFactory(config.logger))
  .addSingleton("svc", (s) => ({
    hello: () => {
      s.logger.info("svc called!");
      return "hello world";
    },
    healthcheck: () => ({ status: "healthy" }),
  }));

const app = new AppBuilder(container)
  // Lifecycle management
  .configureLifecycle((b, c) => b
    .addHealthcheck("svc", (c) => c.svc)   // Healthchecks
    // Plugins
    .with(lifecyclePlugin, (b) => b
      .addFastifyEntrypoint("http", (f) => f
        .mapHealthchecks({ path: "/health" })
        .configureApp((app) => {
          app
            .useOpenapi()
            .fastify.get("/", () => c.svc.hello());
          }
        )
      )
    )
  ).build();

app.run();
`;

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | ${siteConfig.tagline}`}
      description="Basica is a foundational library to bootstrap performant services"
    >
      <HomepageHeader />
      <main>
        <section className="container padding-top--lg">
          <Heading as="h2" className={styles.center}>
            Core Features
          </Heading>
          <div className={clsx(styles.grid, "padding-top--md")}>
            <Card
              title={"Application lifecycle management"}
              icon={<Icon name="traffic" />}
            >
              Handle application startup and shutdown automatically
            </Card>
            <Card
              title={"Configuration validation"}
              icon={<Icon name="gear" />}
            >
              Add a Typebox schema and validate your configuration before the
              app starts
            </Card>
            <Card title={"Plugin system"} icon={<Icon name="package" />}>
              Seamless integration with your favorite library
            </Card>
            <Card title={"Healthchecks"} icon={<Icon name="heartbeat" />}>
              Check on a glance if your service up and running
            </Card>
            <Card title={"Structured logging"} icon={<Icon name="brackets" />}>
              Fast, structured logging provided by Pino
            </Card>
            <Card title={"Graceful shutdown"} icon={<Icon name="hourglass" />}>
              Stop serving clients and perform cleanups before exiting
            </Card>
            <Card title={"Dependency injection"} icon={<Icon name="funnel" />}>
              Declaratively define dependencies: no magic, no boilerplate
            </Card>
            <Card title={"Highly configurable"} icon={<Icon name="faders" />}>
              Sensible and excessively customizable defaults
            </Card>
            <Card title={"Observability ready"} icon={<Icon name="gauge" />}>
              Powered by OpenTelemetry
            </Card>
          </div>
        </section>
        <section className="container padding-top--lg">
          <Heading as="h2">Why?</Heading>
          <span>
            Building software, especially microservices, often requires to
            choose between a framework or a DIY approach, but both approaches
            have their flaws:
            <ul>
              <li>
                Frameworks lift work from the developer, at the cost of
                flexibility, hidden magic and performance.
              </li>
              <li>
                Mixing and matching libraries, while as flexible as you can make
                it, is very hard to maintain. Especially if you have to manage
                multiple services.
              </li>
            </ul>
          </span>
          <span>
            Basica comes to the rescue! Basica is a foundational library to
            boostrap performant applications, which provides opinonated, but
            configurable defaults at the cost of minimal overhead. This results
            in a cohesive experience across projects, focusing development
            effort on what really matters, products.
          </span>
        </section>
        <section className="container padding-top--lg">
          <Heading as="h2">Quickstart</Heading>
          <CodeBlock>{npm}</CodeBlock>
          <CodeBlock language="ts" title="index.ts" showLineNumbers>
            {code}
          </CodeBlock>
        </section>
        <section className="container padding-top--lg">
          <Heading as="h2">Acknowledgments</Heading>
          <span>
            Special thanks to the following open source projects, from which
            Basica takes inspiration:
            <ul>
              <li>
                <Link to="https://kysely.dev/">Kysely</Link>
              </li>
              <li>
                <Link to="https://github.com/sinclairzx81/typebox">
                  Typebox
                </Link>
              </li>
              <li>
                <Link to="https://dotnet.microsoft.com/en-us/apps/aspnet">
                  ASP.NET
                </Link>
              </li>
              <li>
                <Link to="https://getpino.io">Pino</Link>
              </li>
              <li>
                <Link to="https://fastify.dev">Fastify</Link>
              </li>
            </ul>
          </span>
        </section>
      </main>
    </Layout>
  );
}
