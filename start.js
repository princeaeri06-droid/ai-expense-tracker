const { exec } = require("child_process");

function run(cmd, name) {
  console.log(`\n=== Starting ${name} ===`);
  const p = exec(cmd);
  p.stdout.on("data", data => console.log(`[${name}] ${data}`));
  p.stderr.on("data", data => console.log(`[${name} ERROR] ${data}`));
}

run("cd ai && uvicorn categorize:app --reload --port 8000", "AI");
run("cd server && npm run dev", "Backend");
run("cd client && npm run dev", "Frontend");
