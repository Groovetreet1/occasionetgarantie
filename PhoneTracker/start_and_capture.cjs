const { spawn } = require("child_process");

const proc = spawn("node", ["node_modules/expo/bin/cli", "start"], {
  cwd: __dirname,
  stdio: ["pipe", "pipe", "pipe"],
});

let output = "";
let timeout = setTimeout(() => {
  console.log("--- TIMEOUT REACHED ---");
  console.log(output);
  proc.kill();
  process.exit(0);
}, 35000);

proc.stdout.on("data", (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
  if (text.includes("exp://") || text.includes("Expo Go")) {
    console.log("\n=== SCAN THIS QR CODE WITH EXPO GO ===");
    clearTimeout(timeout);
    setTimeout(() => { proc.kill(); process.exit(0); }, 5000);
  }
});

proc.stderr.on("data", (data) => {
  const text = data.toString();
  output += text;
  process.stderr.write(text);
});

proc.on("close", (code) => {
  console.log("--- FULL OUTPUT ---");
  console.log(output);
});
