const sha256 = require("hash.js/lib/hash/sha/256");

while (true) {
  var proof = Math.random().toString(36).substring(2);
  var transaction =
    "e1a9d421c985612fb3930b4d8b40f000afc66b5e996ed4b33391c5a400a5355207418eecdbf553ad";
  var proofHash = sha256().update(proof).digest("hex");
  var transactionHash = sha256().update(transaction).digest("hex");
  var arrayCharTxHash = Array.from(transactionHash.toUpperCase());
  var intTxHash = arrayCharTxHash.filter(e => {
    if (parseInt(e) == e) {
      return e;
    }
  });
  var sumOfTxHash = intTxHash.reduce((a, b) => parseInt(a) + parseInt(b), 0);

  var arrayCharProofHash = Array.from(proofHash.toUpperCase());
  var intProofHash = arrayCharProofHash.filter(e => {
    if (parseInt(e) == e) {
      return e;
    }
  });
  var sumOfProofHash = intProofHash.reduce(
    (a, b) => parseInt(a) + parseInt(b),
    0
  );
  console.log("tx" + sumOfTxHash);
  console.log("proof" + sumOfProofHash);
  let difficulty = 1.3;
  if (sumOfProofHash < sumOfTxHash/difficulty) {
    console.log("found block");
    console.log("proof is "+proof);
    return true;
  }
}
