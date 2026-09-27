// Custom no-op sign hook for electron-builder to bypass winCodeSign symlink issues on Windows
exports.default = async function(configuration) {
  return true;
};
