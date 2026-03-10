module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  }
  // Using native ES modules - no Babel transform needed
  // Tests run with NODE_OPTIONS=--experimental-vm-modules
};