import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getStatus() {
    return {
      service: "novus-field-control-backend",
      status: "ok",
      purpose: "Central tenant registry and resolver for Novus Field SaaS.",
      timestamp: new Date().toISOString(),
    };
  }
}
