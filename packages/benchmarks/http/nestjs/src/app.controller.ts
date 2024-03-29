import { Controller, Get } from "@nestjs/common";

@Controller({ path: "/" })
export class AppController {
  constructor() {}

  @Get("/")
  async route() {}
}
