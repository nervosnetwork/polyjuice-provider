const path = require("path");
require("dotenv").config({ path: "../.test.env" });

const fs = require("fs");

const js_folder = "./web/static/js"

if (!fs.existsSync(js_folder)){
  fs.mkdirSync(js_folder);
}

const filePath = path.resolve(__dirname, `${js_folder}/config.js`);
const content = `
const SimpleConfig = {
	WEB3_JSON_RPC: "${process.env.WEB3_JSON_RPC}",
	ROLLUP_TYPE_HASH : "${process.env.ROLLUP_TYPE_HASH}",
	ETH_ACCOUNT_LOCK_CODE_HASH: "${process.env.ETH_ACCOUNT_LOCK_CODE_HASH}",
	EXAMPLE_CONTRACT_ADDRESS: "${process.env.EXAMPLE_CONTRACT_ADDRESS}"
}
`;

fs.writeFile(filePath, content, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  //file written successfully
  console.log("generated config for example.");
});
