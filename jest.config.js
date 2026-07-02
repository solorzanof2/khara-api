

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './tests', // Asegúrate de apuntar a donde transpilan los tests
  testMatch: ['**/unit/**/*.test.ts'], // o cambia según tu estructura
};

