import { Controller, Get } from '@nestjs/common';

type HealthResponse = {
  status: 'ok';
};

type RootResponse = {
  service: 'reebi-backend';
  status: 'ok';
};

@Controller()
export class HealthController {
  @Get()
  root(): RootResponse {
    return { service: 'reebi-backend', status: 'ok' };
  }

  @Get('health')
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
