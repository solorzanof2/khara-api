module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/unit/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          noEmit: true,
          sourceMap: false,
        },
      },
    ],
  },
};