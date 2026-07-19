import { defineConfig } from "orval"

export default defineConfig({
  noshi: {
    input: "api/openapi.json",
    output: {
      target: "src/api/generated.ts",
      client: "react-query",
      httpClient: "fetch",
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: "./src/api/custom-fetch.ts",
          name: "customFetch",
        },
        operations: {
          create_user: {
            mutation: true,
          },
        },
      },
      prettier: true,
    },
  },
})
