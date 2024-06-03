const { ethers } = require("hardhat");

const deploy = async () => {
    const BitsmonFactory = await ethers.getContractFactory(
        "BitsmonNFT"
    );

    bitsmonContract = await BitsmonFactory.deploy();

    await bitsmonContract.waitForDeployment();

    console.log("Bitsmon deployed to:", bitsmonContract.target);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });