# TODO

> This file outlines tasks and enhancements for the SwaggerDoc to TanStack Query Hooks Converter project.

1. [ ] **Handle HTTP Put:**

   - due to my limited resources i couldn't add the correct types for the PUT verb. make sure everything is strongly typed

1. [x] **Mutation Keys:**

   - hard-coded keys just for the sake of devtools.

1. [ ] **Support for URL Search Params:**

   - handle URL search parameters in Swagger documentation.

1. [x] **Support for Enum Types:**

   - enum types should generate literal types instead of general types like string or number.

1. [x] **Document default:**

   - the default option should be documented if present.

1. [ ] **Better Type generation:**

   - fault tolerance and robustness.

1. [ ] **Document Date Formats:**

   - dates have format property in Swagger documentation. jsdoc can be created from it.

1. [x] **Query Invalidation for Mutations:**

   - mutations should invalidate queries with the same route.

1. [x] **Strengthen Types for `swagger.json`:**

   - Improve the TypeScript types generated from Swagger.json for increased code robustness.

1. [ ] **Unit Testing:**

   - i have no idea what to do here.

Feel free to contribute, tackle, or discuss any of these tasks. Contributions and feedback are highly appreciated!
