import { createClient } from "@hey-api/openapi-ts";

export const $client = createClient({
  input: "../docs/swagger.json",
  output: "src/lib/api-client",
  plugins: [
    { baseUrl: "http://localhost:8082", name: "@hey-api/client-fetch" },
    "@tanstack/react-query",
  ],
});
