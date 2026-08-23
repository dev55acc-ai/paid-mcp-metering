import { createApp } from "../src/x402-server.js";

const app = createApp();

export default function handler(req, res) {
  return app(req, res);
}
