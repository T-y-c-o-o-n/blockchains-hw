const { createPair, deploy } = require("./lib.js");
const {ethers} = require("hardhat");


(async () => {
    const [owner] = await ethers.getSigners();
    createPair(await deploy(owner, 100_000))
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
})();
