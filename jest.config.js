module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testMatch: ['**/src/test/**/*.test.js'], // Update this line to include tests in the src/test folder
  testPathIgnorePatterns: ['/node_modules/'],
};