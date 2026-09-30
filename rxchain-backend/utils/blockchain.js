const crypto = require("crypto");

function calculateHash(index, timestamp, data, previousHash) {
  return crypto
    .createHash("sha256")
    .update(
      `${index}|${timestamp}|${JSON.stringify(data)}|${previousHash}`
    )
    .digest("hex");
}

function createGenesisBlock() {
  const timestamp = new Date();

  const data = {
    type: "GENESIS",
    message: "RxChain ledger initialized",
  };

  return {
    index: 0,
    timestamp,
    data,
    previousHash: "0",
    hash: calculateHash(0, timestamp, data, "0"),
  };
}

function createNextBlock(data, previousBlock) {
  const index = previousBlock ? previousBlock.index + 1 : 0;
  const previousHash = previousBlock ? previousBlock.hash : "0";
  const timestamp = new Date();

  return {
    index,
    timestamp,
    data,
    previousHash,
    hash: calculateHash(index, timestamp, data, previousHash),
  };
}

function verifyBlock(block, previousBlock) {
  if (!block) return false;

  const expectedPreviousHash = previousBlock
    ? previousBlock.hash
    : "0";

  if (block.previousHash !== expectedPreviousHash) {
    return false;
  }

  const calculatedHash = calculateHash(
    block.index,
    block.timestamp,
    block.data,
    block.previousHash
  );

  return block.hash === calculatedHash;
}

module.exports = {
  calculateHash,
  createGenesisBlock,
  createNextBlock,
  verifyBlock,
};