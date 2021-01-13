module.exports = {
  onPreBuild: async ({ utils: { build, status, cache, run, git } }) => {
    await run.command("")
  },
}