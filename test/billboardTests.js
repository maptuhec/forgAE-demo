/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
const Ae = require('@aeternity/aepp-sdk').Universal;

const config = {
  host: "http://localhost:3001/",
  internalHost: "http://localhost:3001/internal/",
  gas: 20000000,
  ttl: 55
}

describe('Billborad Tests', () => {

  let owner;
  let _billboardPrice = 100
  let _newPrice = 200
  let _lowerPrice = 50
  let _billboardSlogan = "AEPP Summit"
  let contractSource;
  let deployedContractBefore;
  let compiledContractBefore;

  before(async () => {
    const ownerKeyPair = wallets[0];
    const notOwnerKeyPair = wallets[1];
    owner = await Ae({
      url: config.host,
      internalUrl: config.internalHost,
      keypair: ownerKeyPair,
      nativeMode: true,
      networkId: 'ae_devnet'
    });

    notOwner = await Ae({
      url: config.host,
      internalUrl: config.internalHost,
      keypair: notOwnerKeyPair,
      nativeMode: true,
      networkId: 'ae_devnet'
    });

    contractSource = utils.readFileRelative('./contracts/Billboard.aes', "utf-8"); // Read the aes file

  })

  beforeEach(async () => {
    compiledContractBefore = await owner.contractCompile(contractSource, {
      gas: config.gas
    })

    deployedContractBefore = await compiledContractBefore.deploy({
      initState: `(${_billboardPrice})`,
      options: {
        ttl: config.ttl,
        gas: config.gas
      },
      abi: "sophia"
    });
  })

  it('Deploying Billboard Smart Contract', async () => {

    const compiledContract = await owner.contractCompile(contractSource, { // Compile it
      gas: config.gas
    })

    const deployPromise = compiledContract.deploy({ // Deploy it
      initState: `(${_billboardPrice})`,
      options: {
        ttl: config.ttl,
        gas: config.gas
      }
    });



    assert.isFulfilled(deployPromise, 'Could not deploy the Billboard Smart Contract KYP'); // Check it is deployed

  })

  it("should set the proper price for billboard", async () => {

    const getPricePromise = await deployedContractBefore.call('getBillboardPrice', {
      options: {
        ttl: config.ttl,
        gas: config.gas
      },
      abi: "sophia"
    });
    let getPricePromiseResult = await getPricePromise;
    let getPriceResult = await getPricePromiseResult.decode("int")
    assert.equal(getPriceResult.value, _billboardPrice, "The price of the billboard is wrong")

  })

  it("should buy billboard", async () => {

    const buyBillboardPromise = await notOwner.contractCall(compiledContractBefore.bytecode, 'sophia', deployedContractBefore.address, "buyBillboard", {
      args: `("${_billboardSlogan}")`,
      options: {
        ttl: config.ttl,
        gas: config.gas,
        amount: _newPrice
      },
      abi: "sophia",
    })

    const getPricePromise = await deployedContractBefore.call('getBillboardPrice', {
      options: {
        ttl: config.ttl,
        gas: config.gas
      },
      abi: "sophia"
    });
    let getPricePromiseResult = await getPricePromise;
    let getPriceResult = await getPricePromiseResult.decode("int")
    assert.equal(getPriceResult.value, _newPrice, "The price of the billboard is wrong")

  })

  it("should throw if the price is not higer", async () => {
    const buyBillboardPromise = notOwner.contractCall(compiledContractBefore.bytecode, 'sophia', deployedContractBefore.address, "buyBillboard", {
      args: `("${_billboardSlogan}")`,
      options: {
        ttl: config.ttl,
        gas: config.gas,
        amount: _lowerPrice
      },
      abi: "sophia",
    })

    await assert.isRejected(buyBillboardPromise, '_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJlRoZSBwcmljZSBtdXN0IGhpZ2hlciB0aGFuIHRoZSBjdXJyZW50AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACcBBYP')
  })

})