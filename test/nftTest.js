const { ethers } = require("hardhat");
const { expect } = require("chai");
const { beforeEach } = require("mocha");


describe("Bitsmon NFT Test", () => {
    let bitsmonContract;
    const baseUri = 'https://peach-electric-cow-235.mypinata.cloud/ipfs/QmaRT9uhxxWjztfcAo9sKXHry8a6xKQAdV5BxHcD5NqV6v/';

    beforeEach(async () => {
        const [creater, owner, admin, recipient, recipient2] = await ethers.getSigners();


        const BitsmonFactory = await ethers.getContractFactory(
            "BitsmonNFT"
        );

        bitsmonContract = await BitsmonFactory.deploy();
    })

    it("Should set the right owner to creator", async () => {
        const [creater, owner, admin, recipient, recipient2] = await ethers.getSigners();
        // console.log(owner)
        expect(await bitsmonContract.owner()).to.equal(creater.address);
    });

    it("should set correct owner after transfer", async () => {
        const [creater, owner, admin, recipient, recipient2] = await ethers.getSigners();
        await bitsmonContract.transferOwnership(owner.address)
        expect(await bitsmonContract.owner()).to.equal(owner.address);
    })

    it("should only owner be able to set admin", async () => {
        const [creater, owner, admin, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.connect(recipient).setAdmin(admin, true))
            .to.revertedWithCustomError(bitsmonContract, "OwnableUnauthorizedAccount");
    })

    it("should add admin to correct status and emit event = true", async () => {
        const [creater, owner, admin, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);
    })

    it("should add and remove admin2 to correct status and emit event = false", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin2, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);
    })

    it("should only admin can update User Allowence - negative", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin2).addWhitelist(recipient, 12))
            .to.revertedWith("Caller is not an admin");
    })

    it("should only admin can update User Allowence - positive with correct amount 12, 15 (+3)", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 12))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 12);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 3))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 15);
    })

    it("should only admin can update (decrease) User Allowence 10 from 12", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 12))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 12);

        await expect(bitsmonContract.connect(admin).decreaseWhitelist(recipient, 10))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 2);
    })

    it("should only admin can update (decrease) User Allowence - negative 15 from 12", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 12))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 12);

        await expect(bitsmonContract.connect(admin).decreaseWhitelist(recipient, 15))
            .to.revertedWith("Allowance to decrease exceeds current allowance");
    })

    it("should only owner update URI - negative", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2] = await ethers.getSigners();

        await expect(bitsmonContract.connect(admin).setURI(baseUri))
            .to.revertedWithCustomError(bitsmonContract, "OwnableUnauthorizedAccount");
    })

    it("should only owner update URI - positive, and verify URI with token id 1,2,4", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2] = await ethers.getSigners();

        await bitsmonContract.transferOwnership(owner.address)
        await expect(bitsmonContract.connect(owner).setURI(baseUri))
            .to.emit(bitsmonContract, "UpdateURI")
            .withArgs(baseUri);

        expect(await bitsmonContract.uri(1))
            .to.equals(`${baseUri}1.json`);

        expect(await bitsmonContract.uri(3))
            .to.equals(`${baseUri}3.json`);
    })

    it("should only user with allowence can mint, count = 1, balence allowence = 11", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2NoAllowence] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 12))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 12);

        await expect(bitsmonContract.connect(recipient).safeMint(recipient, 1))
            .to.emit(bitsmonContract, "MintBitsmon");

        expect(await bitsmonContract.getWhitelist(recipient))
            .to.equal(11);
    })

    it("should only user with enough allowence can mint, allowence = 8, count = 9 - negative", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2NoAllowence] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 8))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 8);

        await expect(bitsmonContract.connect(recipient).safeMint(recipient, 9))
            .to.revertedWith("Insufficent mint allowence")
    })

    it("should only mint smaller than 10", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2NoAllowence] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 12))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 12);

        await expect(bitsmonContract.connect(recipient).safeMint(recipient, 11))
            .to.revertedWith("Maximun 10 mint at a time")
    })

    it("should user receive correct amount of token after mint 8", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2NoAllowence] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 10))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 10);

        expect(await bitsmonContract.getWhitelist(recipient))
            .to.equal(10);

        await expect(bitsmonContract.connect(recipient).safeMint(recipient, 10))
            .to.emit(bitsmonContract, "MintBitsmon");

        const getTotal = () => {
            return new Promise((resolve, reject) => {
                const ids = [0, 1, 2, 3, 4];
                let promises = ids.map(id => new Promise((resolve, reject) => {
                    bitsmonContract.balanceOf(recipient, id)
                        .then(count => resolve(Number(count)))
                        .catch(err => reject(err));
                }))

                Promise.all(promises)
                    .then(res => resolve(res.reduce((i, n) => i + n, 0)))
                    .catch(err => reject(err));
            })
        }

        expect(await getTotal())
            .to.equal(10);
    })

    it("should user receive correct amount of token after mint 10", async () => {
        const [creater, owner, admin, admin2, recipient, recipient2NoAllowence] = await ethers.getSigners();

        await expect(bitsmonContract.setAdmin(admin, true))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin, true);

        await expect(bitsmonContract.setAdmin(admin2, false))
            .to.emit(bitsmonContract, "UpdateAdmin")
            .withArgs(admin2, false);

        await expect(bitsmonContract.connect(admin).addWhitelist(recipient, 10))
            .to.emit(bitsmonContract, "WhitelistUpdated")
            .withArgs(recipient, 10);

        expect(await bitsmonContract.getWhitelist(recipient))
            .to.equal(10);

        await expect(bitsmonContract.connect(recipient).safeMint(recipient, 10))
            .to.emit(bitsmonContract, "MintBitsmon");

        const getTotal = () => {
            return new Promise((resolve, reject) => {
                const ids = [0, 1, 2, 3, 4];
                let promises = ids.map(id => new Promise((resolve, reject) => {
                    bitsmonContract.balanceOf(recipient, id)
                        .then(count => resolve(Number(count)))
                        .catch(err => reject(err));
                }))

                Promise.all(promises)
                    .then(res => resolve(res.reduce((i, n) => i + n, 0)))
                    .catch(err => reject(err));
            })
        }

        expect(await getTotal())
            .to.equal(10);
    })
})