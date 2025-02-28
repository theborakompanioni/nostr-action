import type { Config } from 'jest';

export default async (): Promise<Config> => {
  return {
    testMatch: [ 
      "**/__integration_tests__/**/*.[jt]s?(x)", 
      "**/?(*.)+(ispec|itest).[jt]s?(x)"
    ]
  }
}
