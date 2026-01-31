import { normalize } from "node:path";
import { Command } from "@commander-js/extra-typings";
import { createHost, prettyStacks } from "../../src/index.mts";
import { readFile } from "node:fs/promises";

// UNCOMMENT IF I FIND Ctrl-C hangs again
// So I can kill from local terminal with Ctrl-c
// From https://github.com/strongloop/node-foreman/issues/118#issuecomment-475902308
// process.on("SIGINT", (signal) => {
//   log(`Signal ${signal} received, shutting down`);
//   // Just wait some amount of time before exiting. Ideally the listener would
//   // close successfully, but it seems to hang for some reason.
//   setTimeout(() => process.exit(0), 150);
// });

const program = new Command().description("Granary Programming Laguage");
program
  .command("run")
  .description("execute Granary source files")
  .option("-v, --verbose", "More information", false)
  .argument("<source...>", "Granary source file(s) to execute")
  .action(async (sources, { verbose }) => {
    const sourceFilePaths = sources.map((s) => normalize(s));
    if (verbose) console.log("Reading source files", sourceFilePaths);
    const allSources = await Promise.all(
      sourceFilePaths.map(async (s) =>
        readFile(s).then((buffer) => buffer.toString()),
      ),
    );

    const unifiedSource = allSources.join("\n");
    if (verbose) console.log("Source file contents:\n", unifiedSource);

    const host = createHost(unifiedSource);

    host.step();

    if (verbose)
      console.log("After initialization:\n", prettyStacks(host.ctx.stacks));

    if (verbose) {
      host.onStepped(() => {
        console.log("After step:\n", prettyStacks(host.ctx.stacks));
      });
    }

    host.settle();

    if (verbose) console.log("After settle:\n", prettyStacks(host.ctx.stacks));
  });
program.parse();
