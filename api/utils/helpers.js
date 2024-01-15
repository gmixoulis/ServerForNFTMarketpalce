const fs = require("fs");
const ethers = require("ethers");

// Define a function to replace addresses in the JSON list
function replaceAddressesInFile() {
  const filePath = "../data/meta511.json";
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    try {
      const jsonData = JSON.parse(data);

      for (const item of jsonData["Full Name"]) {
        item.address = ethers.utils.getAddress(item.address);
      }

      for (const item of jsonData["ENS Wallets"]) {
        item.address = ethers.utils.getAddress(item.address);
        try {
          item["Wallet Address that the NFT was minted"] =
            ethers.utils.getAddress(
              item?.["Wallet Address that the NFT was minted"]
            );
        } catch (err) {}
      }

      // Write the modified JSON data back to the file
      fs.writeFile(
        filePath,
        JSON.stringify(jsonData, null, 2),
        "utf8",
        (err) => {
          if (err) {
            console.error("Error writing to the file:", err);
          } else {
            console.log("Modified JSON data has been saved to", filePath);
          }
        }
      );
    } catch (err) {
      console.error("Error parsing JSON data:", err);
    }
  });
}

function replaceAddressesInFileCSV(filePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    try {
      const jsonData = JSON.parse(data);

      if (Array.isArray(jsonData.address)) {
        jsonData.address = jsonData.address.map((address) =>
          ethers.utils.getAddress(address)
        );
      }

      // Write the modified JSON data back to the file
      fs.writeFile(
        filePath,
        JSON.stringify(jsonData, null, 2),
        "utf8",
        (err) => {
          if (err) {
            console.error("Error writing to the file:", err);
          } else {
            console.log("Modified JSON data has been saved to", filePath);
          }
        }
      );
    } catch (err) {
      console.error("Error parsing JSON data:", err);
    }
  });
}
function findNonIdenticalObjects(secondJSON, firstJSON) {
    const obj1 = JSON.parse(firstJSON);
    const obj2 = JSON.parse(secondJSON);
  
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      console.log('Invalid JSON input.');
      return;
    }
  
    // Function to compare two objects recursively
    function areObjectsEqual(obj1, obj2) {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
  
      if (keys1.length !== keys2.length) {
        return false;
      }
  
      for (const key of keys1) {
        const val1 = obj1[key];
        const val2 = obj2[key];
  
        if (typeof val1 === 'object' && typeof val2 === 'object') {
          if (!areObjectsEqual(val1, val2)) {
            return false;
          }
        } else if (val1 !== val2) {
          return false;
        }
      }
  
      return true;
    }
  
    // Function to find non-identical objects
    function findNonIdentical(obj1, obj2, currentPath = '') {
      const keys1 = Object.keys(obj1);
  
      for (const key of keys1) {
        const val1 = obj1[key];
        const val2 = obj2[key];
  
        if (typeof val1 === 'object' && typeof val2 === 'object') {
          findNonIdentical(val1, val2, `${currentPath}.${key}`);
        } else if (val1 !== val2) {
          console.log(`Difference found at ${currentPath}.${key}:`);
          console.log(`  JSON 1: ${val1}`);
          console.log(`  JSON 2: ${val2}`);
        }
      }
    }
  
    // Compare the objects
    if (areObjectsEqual(obj1, obj2)) {
      console.log('Both JSONs are identical.');
    } else {
      console.log('JSONs have differences:');
      findNonIdentical(obj1, obj2);
    }
  }

  const getEtherumContractProvider = () => {
    const contract= require("../data/certificate-contract.json");
    const RPC = "https://mainnet.infura.io/v3/38194ef7ad9f4a149630daf5ab9e7747";
    const provider = new ethers.providers.JsonRpcProvider(RPC);
  
    const icoContract = new ethers.Contract(contract.address, contract.abi, provider);
  
    return icoContract;
  }

module.exports = {
  replaceAddressesInFile,
  replaceAddressesInFileCSV,
  findNonIdenticalObjects,
  getEtherumContractProvider
};
