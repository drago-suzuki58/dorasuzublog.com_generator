const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const pkg = require("../package.json");

const REPO = process.env.CONTENT_REPO_URL || pkg.config?.themeRepo;
const BRANCH =
  process.env.CONTENT_REPO_BRANCH || pkg.config?.themeBranch || "main";
const DIR =
  process.env.CONTENT_REPO_DIR || pkg.config?.themeDir || "themes/VSC4T";

const GIT_DIR = path.join(DIR, ".git");

function run(cmd) {
  execSync(cmd, { stdio: "inherit", windowsHide: true });
}

function quote(p) {
  return `"${p}"`;
}

function clone() {
  if (fs.existsSync(DIR)) {
    if (fs.existsSync(GIT_DIR)) {
      console.log(`Already cloned: ${DIR}`);
      return;
    }
    const entries = fs.readdirSync(DIR);
    if (entries.length > 0) {
      console.error(`Directory exists and not empty: ${DIR}`);
      process.exit(1);
    }
  }
  console.log(`Cloning ${REPO} (branch: ${BRANCH}) into ${DIR} ...`);
  run(`git clone --branch ${BRANCH} ${REPO} ${quote(DIR)}`);
}

function pull() {
  if (!fs.existsSync(GIT_DIR)) {
    console.error(`Not a git repo: ${DIR}. Run clone first.`);
    process.exit(1);
  }
  console.log(`Pulling latest changes (branch: ${BRANCH}) in ${DIR} ...`);
  run(`git -C ${quote(DIR)} fetch --prune`);
  run(`git -C ${quote(DIR)} checkout ${BRANCH}`);
  run(`git -C ${quote(DIR)} pull --ff-only origin ${BRANCH}`);
}

function sync() {
  if (fs.existsSync(GIT_DIR)) {
    pull();
  } else {
    clone();
  }
}

const cmd = process.argv[2] || "sync";
if (cmd === "clone") {
  clone();
} else if (cmd === "pull") {
  pull();
} else {
  sync();
}
