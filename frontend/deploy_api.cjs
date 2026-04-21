const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
    user: "if0_41212127",
    password: "jamesdickson34",
    host: "ftpupload.net",
    port: 21,
    localRoot: __dirname + "/api",
    remoteRoot: "/htdocs/api",
    include: ["*", "**/*"],
    exclude: [],
    deleteRemote: false,
    forcePasv: true,
    timeout: 60000
};

console.log("🚀 Starting API deployment to InfinityFree...");

ftpDeploy
    .deploy(config)
    .then(() => console.log("✅ API Deployed Successfully!"))
    .catch((err) => {
        console.log("❌ Deployment Error:", err);
        process.exit(1);
    });
