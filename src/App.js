import React, { useState } from "react";
import { ethers } from "ethers";

const FACTORY_CONTRACT_ABI = [
  "function deployEmptyContract() public returns (address)",
  "function getDeployedContracts() public view returns (address[])"
];

const NFT_CONTRACT_ADDRESS = "0xda9131c4a5bfba475426eecc03a89772caf1b462";

const NEXUS_PARAMS = {
  chainId: "0x188", // 392 in hex
  chainName: "Nexus",
  rpcUrls: ["https://rpc.nexus.xyz/http"],
  nativeCurrency: {
    name: "Nexus Token",
    symbol: "NEX",
    decimals: 18,
  },
  blockExplorerUrls: ["https://explorer.nexus.xyz"],
};

const NFT_CONTRACT_ABI = [
  "function mintNFT(address to, string memory tokenURI) public returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
  "function ownerOf(uint256 tokenId) public view returns (address)"
];

const FACTORY_CONTRACT_ADDRESS = "0xac7bf57b563ab50038444adb13c0162ac4c8feea"; // Mevcut fabrika kontratı

const LOGO_SVG = `<svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
  <!-- Neon Glow -->
  <filter id="neonGlow">
    <feGaussianBlur stdDeviation="2" result="blur"/>
    <feFlood flood-color="#78ce23" result="color"/>
    <feComposite in="color" in2="blur" operator="in"/>
    <feComposite in="SourceGraphic"/>
  </filter>
  <text x="40%" y="50%" fill="#ffffff" font-size="42" text-anchor="middle" font-family="Arial" filter="url(#neonGlow)">rollie</text>
  <text x="64%" y="50%" fill="#78ce23" font-size="42" text-anchor="middle" font-family="Arial" filter="url(#neonGlow)">.cc</text>
</svg>`;

// Pinata için API bilgileri
// const PINATA_API_KEY = '...';
// const PINATA_SECRET_KEY = '...';

// IPFS ve Pinata ile ilgili kodları kaldır
// const FIXED_TOKEN_URI = "ipfs://QmYourIPFSHash"; // Önceden yüklenmiş metadata'nın IPFS hash'i

// Yüklediğiniz metadata'nın IPFS hash'ini buraya yazın
const FIXED_TOKEN_URI = "ipfs://bafkreico2c2uj4n4uklwk2aqrhyddrfbt6jxkhzewvmjmwij5kmydnmhca"; // Buraya kopyaladığınız CID'yi yazın

// Token Factory için ABI ve adres ekleyelim
const TOKEN_FACTORY_ADDRESS = "0x0bafbc5e08c7b55902b84112ecdddf75095bc685"; // Deploy ettikten sonra buraya yazın

const TOKEN_FACTORY_ABI = [
  "function createToken(string name, string symbol, uint256 initialSupply) public returns (address)",
  "event TokenCreated(address tokenAddress, string name, string symbol)"
];

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [minting, setMinting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [tokenFactoryContract, setTokenFactoryContract] = useState(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await provider.getSigner();
        
        // Kontratları bağla
        const factoryContract = new ethers.Contract(FACTORY_CONTRACT_ADDRESS, FACTORY_CONTRACT_ABI, signer);
        const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer);
        const tokenFactoryContract = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, signer);
        
        const network = await provider.getNetwork();
        console.log("Connected to network:", network);
        
        const balance = await provider.getBalance(await signer.getAddress());
        console.log("Wallet balance:", ethers.formatEther(balance));
        
        setProvider(provider);
        setSigner(signer);
        setFactoryContract(factoryContract);
        setNftContract(nftContract);
        setTokenFactoryContract(tokenFactoryContract);
        setMessage("Wallet connected successfully!");
      } catch (error) {
        console.error("Wallet connection error:", error);
        setMessage("Failed to connect wallet.");
      }
    } else {
      alert("MetaMask is not installed!");
    }
  };

  const addNexusNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NEXUS_PARAMS],
        });
        setMessage("Nexus ağı başarıyla eklendi!");
      } catch (error) {
        console.error("Ağ ekleme hatası:", error);
        setMessage("Nexus ağı eklenirken hata oluştu.");
      }
    }
  };

  const mintNFT = async () => {
    if (!nftContract) return;
    setMinting(true);
    setMessage("Starting NFT minting process...");
    try {
      const address = await signer.getAddress();
      
      const tx = await nftContract.mintNFT(address, FIXED_TOKEN_URI, {
        gasLimit: 500000
      });
      
      setMessage("Transaction sent, waiting for confirmation...");
      console.log("Transaction:", tx);
      
      const receipt = await tx.wait();
      console.log("Receipt:", receipt);
      
      setMessage("NFT Successfully Minted! 🎉");
    } catch (error) {
      console.error("Detailed minting error:", error);
      if (error.code === 'CALL_EXCEPTION') {
        setMessage(`Minting failed: Contract call failed. Make sure you have enough NEX tokens and you're on the Nexus network.`);
      } else {
        setMessage(`Minting failed: ${error.message}`);
      }
    }
    setMinting(false);
  };

  const deployEmptyContract = async () => {
    if (!factoryContract) return;
    setDeploying(true);
    setMessage("Deploying empty contract...");
    try {
      const tx = await factoryContract.deployEmptyContract();
      await tx.wait();
      setMessage("Empty Contract Successfully Deployed!");
    } catch (error) {
      console.error(error);
      setMessage("Failed to deploy contract.");
    }
    setDeploying(false);
  };

  const createToken = async () => {
    if (!tokenFactoryContract) return;
    setCreatingToken(true);
    setMessage("Creating your token...");
    try {
      const tx = await tokenFactoryContract.createToken(
        tokenName,
        tokenSymbol,
        tokenSupply,
        { gasLimit: 3000000 }
      );
      
      setMessage("Transaction sent, waiting for confirmation...");
      const receipt = await tx.wait();
      
      // Event'i bul
      const tokenCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = tokenFactoryContract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          return parsed?.name === 'TokenCreated';
        } catch {
          return false;
        }
      });

      if (tokenCreatedEvent) {
        const parsedLog = tokenFactoryContract.interface.parseLog({
          topics: tokenCreatedEvent.topics,
          data: tokenCreatedEvent.data
        });
        setMessage(`Token created successfully! Address: ${parsedLog.args[0]}`);
      } else {
        setMessage("Token created but couldn't get the address.");
      }
    } catch (error) {
      console.error("Token creation error:", error);
      setMessage(`Failed to create token: ${error.message}`);
    }
    setCreatingToken(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#121212',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: '#1E1E1E',
        borderRadius: '15px',
        padding: '30px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}>
        <h1 style={{
          fontSize: '2.5em',
          marginBottom: '30px',
          color: '#78ce23',
          textAlign: 'center'
        }}>Nexus NFT Minter</h1>
        
        <div style={{
          background: '#2D2D2D',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '1.1em' }}>{message}</p>
        </div>

        {!signer ? (
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={connectWallet}
              style={{
                padding: '12px 24px',
                fontSize: '1.1em',
                background: '#78ce23',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: 'bold'
              }}
            >
              Connect Wallet
            </button>
            <button
              onClick={addNexusNetwork}
              style={{
                padding: '12px 24px',
                fontSize: '1.1em',
                background: '#2D2D2D',
                color: '#ffffff',
                border: '2px solid #78ce23',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Add Nexus Network
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <div style={{
              border: '2px solid #78ce23',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              background: '#2D2D2D'
            }}>
              <div dangerouslySetInnerHTML={{ __html: LOGO_SVG }} />
              <p style={{ marginTop: '10px', color: '#78ce23' }}>This logo will be minted as NFT</p>
            </div>
            
            <button
              onClick={mintNFT}
              disabled={minting}
              style={{
                padding: '12px 24px',
                fontSize: '1.1em',
                background: minting ? '#2D2D2D' : '#78ce23',
                color: minting ? '#666' : '#000000',
                border: 'none',
                borderRadius: '8px',
                cursor: minting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: 'bold',
                width: '200px'
              }}
            >
              {minting ? "Minting..." : "Mint NFT"}
            </button>
            
            <button
              onClick={deployEmptyContract}
              disabled={deploying}
              style={{
                padding: '12px 24px',
                fontSize: '1.1em',
                background: '#2D2D2D',
                color: deploying ? '#666' : '#ffffff',
                border: '2px solid #78ce23',
                borderRadius: '8px',
                cursor: deploying ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                width: '200px'
              }}
            >
              {deploying ? "Deploying..." : "Deploy Empty Contract"}
            </button>
            
            <div style={{
              border: '2px solid #78ce23',
              padding: '20px',
              borderRadius: '10px',
              marginTop: '20px',
              background: '#2D2D2D',
              width: '100%',
              maxWidth: '400px'
            }}>
              <h3 style={{ color: '#78ce23', marginBottom: '15px' }}>Create Your Token</h3>
              <input
                type="text"
                placeholder="Token Name"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  background: '#1E1E1E',
                  border: '1px solid #78ce23',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
              <input
                type="text"
                placeholder="Token Symbol"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  background: '#1E1E1E',
                  border: '1px solid #78ce23',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
              <input
                type="number"
                placeholder="Initial Supply"
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '15px',
                  background: '#1E1E1E',
                  border: '1px solid #78ce23',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
              <button
                onClick={createToken}
                disabled={creatingToken || !tokenName || !tokenSymbol || !tokenSupply}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: creatingToken ? '#2D2D2D' : '#78ce23',
                  color: creatingToken ? '#666' : '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creatingToken ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  fontWeight: 'bold'
                }}
              >
                {creatingToken ? "Creating Token..." : "Create Token"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;