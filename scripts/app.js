async function main() {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask to use this dApp.');
    return;
  }

  document.getElementById('connectButton').addEventListener('click', onConnectClick);
}

window.addEventListener('DOMContentLoaded', main);

async function connectToMetamask() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  return accounts[0];
}

async function changeNetwork() {
  const network = await window.ethereum.request({ method: 'net_version' });

  if (network !== '5' && network !== '1') {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x5' }],
      });
    } catch (error) {
      if (error.code === 4902) {
        alert('Please switch to the Ethereum Goerli Testnet or Ethereum Mainnet in your MetaMask settings.');
      }
    }
  }
}

const CONTRACT_ADDRESS = '0xfEC732A3FC01D5dBbe28B296963B8eFaf21E9B8b';
const maxVikings = 10000;

async function _setupWeb3ConnectionMint(contractAddress, abi) {
  const web3 = new Web3(window.ethereum);
  const contract = new web3.eth.Contract(abi, contractAddress);
  return { web3, contract };
}

function updateTotalSupply(contract, callback) {
  contract.methods.totalSupply().call().then((result) => {
    document.getElementById("supply").innerText = result + " / 10000";
    callback && callback(result);
  }).catch((error) => {
    console.error("Error in updateTotalSupply:", error);
  });
}

async function updatePrice(web3, contract, userAddress) {
  const priceInWei = await contract.methods.publicPrice().call({ from: userAddress });
  const priceInEth = web3.utils.fromWei(priceInWei, 'ether');
  document.getElementById('rangeValue').textContent = `Price: ${priceInEth} ETH`;
}

async function mintNFT(contract, userAddress, mintAmount) {
  const price = await contract.methods.publicPrice().call({ from: userAddress });
  const value = BigInt(price) * BigInt(mintAmount);

  await contract.methods.mintVikings(mintAmount).send({
    from: userAddress,
    value: value.toString(),
  });

  alert('Minting successful! Your NFT will be revealed soon.');
}

async function onConnectClick() {
  const userAddress = await connectToMetamask();
  if (!userAddress) return;

  await changeNetwork();

  const { web3, contract } = await _setupWeb3ConnectionMint(CONTRACT_ADDRESS, contractABI);

  updateTotalSupply(contract, () => {
    // Callback-funktionen kommer att köras när updateTotalSupply är klar.
  });

  await updatePrice(web3, contract, userAddress);

  document.getElementById('connectButton').textContent = 'CONNECTED';
  document.getElementById('connectButton').disabled = true;

  document.getElementById('mintBtn').addEventListener('click', async () => {
    const mintAmount = parseInt(document.getElementById('rangeValue').textContent);
    await mintNFT(contract, userAddress, mintAmount);
  });
}
