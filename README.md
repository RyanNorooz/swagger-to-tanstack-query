# SwaggerDoc to TanStack Query Hooks Converter

![Node.js Version](https://img.shields.io/badge/Node.js-20.x-green)
![pnpm Version](https://img.shields.io/badge/pnpm-7.x-orange)
![TypeScript Version](https://img.shields.io/badge/TypeScript-5.3-blue)
![React Query Version](https://img.shields.io/badge/React%20Query-5.x-red)

_🚨 **Caution:** This project is highly unstable. It may generate incorrect types or crash unexpectedly.\
Contributions and feedback are welcome as we work towards stability. 🛠️_

A tool that converts Swagger documentation to TanStack Query (React Query) hooks, utilizing Axios for HTTP requests.

> this tool is suited for projects using React and Tanstack query

## Features

🚀 Swagger to TanStack Query Hooks: Seamlessly converts Swagger documentation into TanStack Query hooks with comprehensive TypeScript types.

- [x] **📚 Generated Types:** Reliably generate TypeScript types for API responses and DTOs, enhancing code robustness.

- [x] **💡JSDoc Descriptions and Examples:** Rich JSDoc descriptions and examples accompany the generated code, aiding developers in understanding and using the hooks effectively.

- [ ] **♻️ Query Invalidation:** Mutations invalidate queries with the same route _(coming soom)_

- [x] **🧩 Modularity:** The tool keeps things organized by creating separate files for each endpoint. These files include the hook, types, and necessary logic, making your React Query setup clean and easy to maintain.

- [x] 🎨 **Prettier Formatting**: The generated files are formatted with Prettier, ensuring consistent and clean code.

- [ ] ⚙️ **Enhanced Stability**: Reliable and standardized output, providing stability between consecutive runs. _(needs unit testing)_

## How to

1. Install dependencies:

   ```ps
   pnpm i
   ```

1. build

   ```ps
   pnpm build
   ```

1. Run

   ```ps
   pnpm start --url="https://api.com/docs-json"
   ```

   The Swagger JSON file is typically located at some endpoint like:

   - `https://api.com/docs-json`
   - `https://api.com/docs/v1/swagger.json`

## Output

The generated output will be available inside the `./out` directory.

A file will be created containing all query keys

- <details>
    <summary>tq-keys.ts</summary>

  ```ts
  // ./out/tq-keys.ts
  export const TQ_KEYS = {
    USER_FIND_ONE: 'User Find One',
    USER_FIND_ALL: 'User Find All',
    ...
  }
  ```

    </details>

Endpoints with the GET HTTP verb will get converted to Query hooks

- <details>
  <summary>Query hook</summary>

  ```ts
  // ./out/hooks/user/useUserFindOne.ts

  import { axiosClient } from '@/lib/axios'
  import { TQ_KEYS } from '@/lib/tanstack-query/tq-keys'
  import type { ApiResponseDTO } from '@/types/api.ts'
  import { useQuery } from '@tanstack/react-query'

  interface GetUserFindOneResult {
    /** @example 637952bf-7368-4085-8697-4617f60735dd */
    id: string
    /** @example active */
    status: string
  }

  export async function getUserFindOne(id: string) {
    return (await axiosClient({
      method: 'get',
      url: `/api/user/findone/${id}`,
    })) as ApiResponseDTO<GetUserFindOneResult>
  }

  /** Find One */
  export default function useUserFindOne(
    /** @example 29f09449-57b5-4e2a-8d29-ae8f87a7d60d */
    id: string
  ) {
    return useQuery({
      queryKey: [TQ_KEYS.USER_FIND_ONE],
      queryFn: () => getUserFindOne(id),
    })
  }
  ```

  </details>

Endpoints with **POST**, **PATCH**, **PUT**, **DELETE** HTTP verbs will get converted to Mutation hooks

- <details>
  <summary>Mutation hook</summary>

  ```ts
  // ./out/hooks/auth/useAuthLogin.ts

  import { axiosClient } from '@/lib/axios'
  import type { ApiResponseDTO } from '@/types/api.ts'
  import { useMutation } from '@tanstack/react-query'

  interface PostAuthLoginDTO {
    /** Username @example admin */
    username: string
    /** Password @example pass1234 */
    password: string
  }

  interface PostAuthLoginResult {
    /** Auth token @example eyJhbGciOiJIIkpXVCJ9.eyJ1c2VySWIWjUQXQoGaZqbKjGuACyaFTznSRhlvbP5b_Qp4Wk */
    token: string
  }

  export async function postAuthLogin(data: PostAuthLoginDTO) {
    return (await axiosClient({
      method: 'post',
      url: `/api/auth/login`,
      data,
    })) as ApiResponseDTO<PostAuthLoginResult>
  }

  /** Login */
  export default function useAuthLogin() {
    return useMutation({
      mutationFn: (data: PostAuthLoginDTO) => postAuthLogin(data),
    })
  }
  ```

  </details>

## Contributions

Contributions are welcome! Feel free to submit issues or pull requests.

## Acknowledgments

Special thanks to [TanStack](https://tanstack.com/) for their awesome tools, including React Query.
