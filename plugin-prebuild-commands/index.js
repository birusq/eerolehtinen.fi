module.exports = {
  onPreBuild: async ({ utils: { build, status, cache, run, git } }) => {
    await run.command("npm i --save react@npm:@preact/compat react-dom@npm:@preact/compat")
  },
}