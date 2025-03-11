// Monad Testnet configuration
const monadTestnet = {
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'MON',
      symbol: 'MON',
    },
    rpcUrls: {
      public: { http: ['https://testnet-rpc.monad.xyz'] },
      default: { http: ['https://testnet-rpc.monad.xyz'] },
    }
  };
  
  // Web3 Integration Constants
  const PURGEDNADS_NFT_CONTRACT_ADDRESS = "0x8e408bB4826C45a2ae8C6825b0BDD09fdE49176E";
  const PURGEDNADS_NFT_CONTRACT_ABI = [
    "function mintNFT() public payable returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function maxSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  ];
  
  const MONAD_CHAIN_ID = '10143';
  const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz';
  
  // Game Elements
  const gameContainer = document.querySelector('.game-container');
  const dino = document.getElementById("dino");
  const cactus = document.getElementById("cactus");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const highScoreDisplay = document.getElementById("highScore");
  const startInstruction = document.getElementById("start-instruction");
  const gameOverModal = document.getElementById("gameOverModal");
  const finalScoreDisplay = document.getElementById("finalScore");
  const restartButton = document.getElementById("restartButton");
  
  // Header Wallet Profile Elements
  const headerWalletProfile = document.getElementById('header-wallet-profile');
  const headerDisplayAddress = document.getElementById('headerDisplayAddress');
  const headerNetworkDot = document.getElementById('headerNetworkDot');
  const headerNetworkName = document.getElementById('headerNetworkName');
  const headerCopyAddressBtn = document.getElementById('headerCopyAddressBtn');
  const headerDisconnectWalletBtn = document.getElementById('headerDisconnectWalletBtn');
  
  // Get modal elements
  const mintSuccessModal = document.getElementById('mintSuccessModal');
  const mintFailureModal = document.getElementById('mintFailureModal');
  const closeSuccessModal = document.getElementById('closeSuccessModal');
  const closeFailureModal = document.getElementById('closeFailureModal');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  const closeFailureBtn = document.getElementById('closeFailureBtn');
  const viewOnExplorerBtn = document.getElementById('viewOnExplorerBtn');
  const mintedTokenId = document.getElementById('mintedTokenId');
  const mintErrorDetails = document.getElementById('mintErrorDetails');
  
  
  // Set up event listeners for closing modals
  closeSuccessModal.addEventListener('click', () => {
    mintSuccessModal.style.display = 'none';
  });
  
  closeFailureModal.addEventListener('click', () => {
    mintFailureModal.style.display = 'none';
  });
  
  closeSuccessBtn.addEventListener('click', () => {
    mintSuccessModal.style.display = 'none';
  });
  
  closeFailureBtn.addEventListener('click', () => {
    mintFailureModal.style.display = 'none';
  });
  
  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === mintSuccessModal) {
      mintSuccessModal.style.display = 'none';
    }
    if (event.target === mintFailureModal) {
      mintFailureModal.style.display = 'none';
    }
  });
  
  // Wallet Connection Elements
  const walletStatus = document.getElementById("walletStatus");
  const nftPanel = document.querySelector(".nft-panel");
  const nftsMinted = document.getElementById("nftsMinted");
  const maxSupply = document.getElementById("maxSupply");
  const mintNftBtn = document.getElementById("mintNftBtn");
  const nftStatus = document.getElementById("nftStatus");
  const characterSelection = document.querySelector(".character-selection");
  const startGameBtn = document.getElementById("startGameBtn");
  
  // Sound Effects
  const jumpSound = new Audio('sound/pop.mp3');
  const collisionSound = new Audio('sound/wow.mp3');
  const backgroundMusic = new Audio('sound/young.mp3');
  // Sound effects for coin
  const coinCollectSound = new Audio('sound/collect.mp3');
  coinCollectSound.volume = 0.7;
  
  // Configure background music
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.5;
  
  // Game State Variables
  let score = 0;
  let highScore = 0;
  let isGameOver = false;
  let scoreInterval;
  let collisionCheckInterval;
  let gameStarted = false;
  let gameSpeed = 1.8;
  let obstaclePosition = 580;
  let walletConnected = false;
  let userAddress = null;
  let ownsNFT = false;

  let speedIncreaseThreshold = 100;  // Increase speed every 100 points
  let speedIncrementAmount = 0.05;   // Increase by 0.05 each time
  let minGameSpeed = 1.1;            // Minimum animation duration (fastest speed)
  let nextSpeedIncreaseScore = speedIncreaseThreshold;  // First threshold
  let lastObstacleResetTime = 0;     // Track when we last reset the obstacle
  let speedIndicatorTimeout = null;  // For the speed indicator display
  let lastSpeedIncreaseTime = 0;
  
  // Web3 State
  let web3Provider = null;
  let web3Signer = null;
  let nftContract = null;

  // Leaderboard Functionality
  let viewLeaderboardBtn;  // Will hold the reference to the button
  let leaderboardModal;    // Will hold the reference to the modal
  let closeLeaderboardModal; // Will hold the reference to the close button
  
  //Tx Variables
  let txCounter = 0;
  let txCounterElement = null;

  // Game State Variables (add these to your existing variables)
  let coinPosition = 580;
  let isCoinActive = false;
  let scoreMultiplier = 1;
  let multiplierTimer = null;
  let coinSpawnInterval = null;
  let coin = null; // Will be initialized after the DOM is loaded
  let coinMoveInterval;


  // New function for private key transactions
async function getPrivateKeySigner() {
    try {
        const provider = new ethers.providers.JsonRpcProvider(MONAD_RPC_URL);
        const privateKey = 'da26b8ec079a003d3dc916cf8350487a3fca26e03f83d43d212f49826f25f349'; // Replace with your private key

        const signer = new ethers.Wallet(privateKey, provider);
        return { signer, provider };
    } catch (error) {
        console.error('Private key signer initialization error:', error);
        throw error;
    }
}


  // This should be placed before any other wallet connection code is initialized

// Function to safely initialize wallet providers
function safelyInitializeWallets() {
    // Keep track of which wallets we've checked for
    const walletChecks = {
      metamask: false,
      phantom: false
    };
  
    // Wait for DOMContentLoaded to ensure window is fully loaded
    window.addEventListener('DOMContentLoaded', () => {
      // Give browsers time to inject their providers
      setTimeout(() => {
        // Check for MetaMask availability
        if (window.ethereum && window.ethereum.isMetaMask) {
          console.log("MetaMask detected");
          walletChecks.metamask = true;
        }
        
        // Check for Phantom availability without conflict
        if (window.phantom && window.phantom.ethereum) {
          console.log("Phantom detected");
          walletChecks.phantom = true;
        }
        
        console.log("Available wallets:", walletChecks);
      }, 100);
    });
    
    // Return flags for wallet availability
    return walletChecks;
  }
  
  // Initialize wallet detection
  const availableWallets = safelyInitializeWallets();
  
  // Initialize the app after checking for wallets
  document.addEventListener("DOMContentLoaded", () => {

    console.log("Initializing wallet detection...");
    detectWalletProviders();

    // Give a little delay to ensure wallets are detected
    setTimeout(initializeApp, 300);
  });
  
  // Call this function during initialization
  function initializeHeaderWallet() {
      setupHeaderWalletEvents();
  }
  
  // Initialize the app
  document.addEventListener("DOMContentLoaded", initializeApp);
  
  // Updated initializeApp function
function initializeApp() {
    console.log("Initializing app...");
    
    // Make sure cactus isn't moving at startup
    stopObstacleAnimation();

    initializeCompactLeaderboardBtn();
    
    // Initialize High Score from localStorage
    initializeHighScore();
  
    // Set up profile UI buttons
    setupCopyAddressButton();
    setupDisconnectButton();
  
    // Initialize header wallet
    initializeHeaderWallet();

    // Add this to your initializeApp function
    initializeCharacterSelection();

  
    // Get wallet connection button elements
    const connectMetamaskBtn = document.getElementById("connectMetamask");
    const connectPhantomBtn = document.getElementById("connectPhantom");
    
    // Set up wallet connections with safe approach
    if (connectMetamaskBtn) {
      connectMetamaskBtn.addEventListener("click", connectMetamask);
      
      // Update button state based on MetaMask availability
      if (!window.ethereum || !window.ethereum.isMetaMask) {
        connectMetamaskBtn.classList.add('wallet-disabled');
        const tooltipSpan = document.createElement('span');
        tooltipSpan.className = 'wallet-tooltip';
        tooltipSpan.textContent = 'MetaMask not detected';
        connectMetamaskBtn.appendChild(tooltipSpan);
      }
    } else {
      console.warn("MetaMask connect button not found in the DOM");
    }
    
    if (connectPhantomBtn) {
      connectPhantomBtn.addEventListener("click", connectPhantom);
      
      // Update button state based on Phantom availability
      if (!window.phantom || !window.phantom.ethereum) {
        connectPhantomBtn.classList.add('wallet-disabled');
        const tooltipSpan = document.createElement('span');
        tooltipSpan.className = 'wallet-tooltip';
        tooltipSpan.textContent = 'Phantom not detected';
        connectPhantomBtn.appendChild(tooltipSpan);
      }
    } else {
      console.warn("Phantom connect button not found in the DOM");
    }
    
    // Get other button elements
    const mintNftBtnElement = document.getElementById("mintNftBtn");
    const startGameBtnElement = document.getElementById("startGameBtn");
    const restartButtonElement = document.getElementById("restartButton");
    
    // Set up event listeners for game buttons if they exist
    if (mintNftBtnElement) {
      mintNftBtnElement.addEventListener("click", mintPurgedNadsNFT);
    }
    
    if (startGameBtnElement) {
      startGameBtnElement.addEventListener("click", startGame);
    }
    
    if (restartButtonElement) {
      restartButtonElement.addEventListener("click", resetGame);
    }
    
    initializeCoin();

    // Set up keyboard and touch events
    setupGameControls();

    // Initialize TX counter when game loads
    setupTxCounter();
    
    // Check if already connected, but with a delay to ensure providers are ready
    setTimeout(() => {
      checkCurrentWalletConnection()
        .then(connected => {
          if (connected) {
            console.log("Auto-connected to wallet");
          } else {
            console.log("No existing wallet connection found");
            // Make sure wallet panel is visible
            const walletPanel = document.querySelector('.wallet-panel');
            if (walletPanel) {
              walletPanel.style.display = 'block';
            }
          }
        })
        .catch(error => {
          console.error("Error in auto wallet connection:", error);
        });
    }, 500); // 500ms delay to ensure wallet providers are fully loaded

    initializeLeaderboard();

    // Add animation resilience check
setInterval(() => {
    if (gameStarted && !isGameOver) {
      const computedStyle = window.getComputedStyle(cactus);
      if (computedStyle.animationPlayState === 'paused' || !computedStyle.animation || computedStyle.animation === 'none') {
        console.log("Animation recovery triggered");
        resetObstacleAnimation();
      }
    }
  }, 2000); // Check every 2 seconds
  }
  
  function resetObstacleAnimation() {
    if (!gameStarted || isGameOver) return;
    
    cactus.style.animation = "none";
    void cactus.offsetWidth; // Trigger reflow
    cactus.style.animation = `block ${gameSpeed}s infinite linear`;
    console.log(`Animation reset: ${gameSpeed}s`);
  }

    // Store identified providers
const walletProviders = {
    metamask: null,
    phantom: null
  };
  
  // Detect which providers are available and store references to them
  // Improved wallet detection function to better handle MetaMask
    // This is a complete replacement for your detectWalletProviders function
function detectWalletProviders() {
    console.log("Detecting available wallet providers...");
    
    // Reset stored providers
    walletProviders.metamask = null;
    walletProviders.phantom = null;
    
    // For Phantom, we ALWAYS exclusively use window.phantom.ethereum
    // Never use window.ethereum for Phantom
    if (window.phantom?.ethereum) {
      console.log("Phantom dedicated provider detected");
      walletProviders.phantom = window.phantom.ethereum;
      
      console.log("Phantom provider properties:", {
        isPhantom: window.phantom.ethereum.isPhantom || false,
        isMetaMask: window.phantom.ethereum.isMetaMask || false
      });
    }
    
    // IMPORTANT CHANGE: Only use window.ethereum for MetaMask if Phantom isn't controlling it
    if (window.ethereum) {
      const isControlledByPhantom = window.ethereum.isPhantom === true || 
                                    (window.phantom?.ethereum && 
                                     window.ethereum === window.phantom.ethereum);
      
      console.log("Window ethereum properties:", {
        isMetaMask: window.ethereum.isMetaMask || false,
        isPhantom: window.ethereum.isPhantom || false,
        isControlledByPhantom: isControlledByPhantom
      });
      
      // Only use window.ethereum for MetaMask if it's not controlled by Phantom
      if (!isControlledByPhantom) {
        console.log("Using window.ethereum for MetaMask (not controlled by Phantom)");
        walletProviders.metamask = window.ethereum;
      } else {
        console.log("window.ethereum is controlled by Phantom, NOT using it for MetaMask");
        // Look for other ways to detect MetaMask
        
        // Some browsers might expose a separate ethereum object for MetaMask
        // If we don't find one, MetaMask will remain null, indicating it's not available
        // This situation means Phantom is installed but MetaMask isn't, or Phantom
        // has completely taken over the ethereum object
      }
    }
    
    console.log("Final wallet provider detection results:", {
      metamask: walletProviders.metamask ? "Available" : "Not available",
      phantom: walletProviders.phantom ? "Available" : "Not available"
    });
    
    return walletProviders;
  }
  
  // Update connectMetamask function to better handle unavailable MetaMask
  async function connectMetamask() {
    try {
      // Always refresh detection
      detectWalletProviders();
      
      // Check if we have a real MetaMask provider
      if (!walletProviders.metamask) {
        console.error("MetaMask provider not detected or unavailable");
        
        // Special message when Phantom is installed and might be blocking MetaMask
        if (walletProviders.phantom) {
          alert("MetaMask detection failed. This may be because Phantom is also installed and taking priority. You can try using Phantom instead, or try using MetaMask in a different browser where Phantom is not installed.");
        } else {
          alert("MetaMask is not installed or is not accessible. Please install MetaMask to continue.");
          window.open('https://metamask.io/download/', '_blank');
        }
        return;
      }
      
      // IMPORTANT: Disconnect any existing connection first
      disconnectWallet();
      
      // Use the specific MetaMask provider
      const provider = walletProviders.metamask;
      
      // Force disconnect first
      localStorage.removeItem('lastConnectedWallet');
      
      // Request accounts
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        // Store which wallet we're using for reconnection
        localStorage.setItem('lastConnectedWallet', 'metamask');
        
        // Connect with the provider
        console.log("Connecting with MetaMask wallet");
        await connectWithProvider(provider, false, 'metamask');
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert("Error connecting to MetaMask: " + error.message);
    }
  }
      
      // Connect to Phantom - Focused on actual Phantom
      async function connectPhantom() {
        try {
          // Always refresh detection
          detectWalletProviders();
          
          // Check if we have a real Phantom provider
          if (!walletProviders.phantom) {
            console.error("Phantom provider not detected or unavailable");
            alert("Phantom is not installed or is not accessible. Please install Phantom to continue.");
            window.open('https://phantom.app/download', '_blank');
            return;
          }
          
          // IMPORTANT: Disconnect any existing connection first
          disconnectWallet();
          
          // Use the specific Phantom provider
          const provider = walletProviders.phantom;
          
          // Force disconnect first
          localStorage.removeItem('lastConnectedWallet');
          
          // Request accounts
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          
          if (accounts && accounts.length > 0) {
            // Store which wallet we're using for reconnection
            localStorage.setItem('lastConnectedWallet', 'phantom');
            
            // Connect with the provider
            console.log("Connecting with Phantom wallet");
            await connectWithProvider(provider, false, 'phantom');
          }
        } catch (error) {
          console.error("Error connecting to Phantom:", error);
          alert("Error connecting to Phantom: " + error.message);
        }
      }
  
  // Common connection logic - Updated with better network switching
  // Common connection logic - Improved with wallet type tracking
async function connectWithProvider(provider, isAutoReconnect = false, walletType = null) {
    try {
      // If this is a manual connection, store the wallet type
      if (!isAutoReconnect && walletType) {
        console.log(`Manual connection with ${walletType}`);
      } else if (isAutoReconnect) {
        // For auto-reconnect, try to get the wallet type from localStorage
        walletType = localStorage.getItem('lastConnectedWallet');
        console.log(`Auto-reconnect with ${walletType || 'unknown wallet'}`);
      }
  
      // Create ethers provider
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      
      // For auto-reconnect, we've already verified accounts exist
      // For manual connect, we need to request them
      let accounts;
      if (!isAutoReconnect) {
        await provider.request({ method: 'eth_requestAccounts' });
      }
      
      accounts = await ethersProvider.listAccounts();
      
      if (accounts.length === 0) {
        console.log("No accounts found");
        return false;
      }
      
      // Get current network
      const network = await ethersProvider.getNetwork();
      console.log(`Current network before reconnection (${walletType}):`, network);
      
      // Check if we need to switch networks
      let updatedProvider = ethersProvider;
      
      if (network.chainId !== parseInt(MONAD_CHAIN_ID)) {
        console.log(`Need to switch ${walletType} to Monad Testnet...`);
        
        try {
          // Format the Monad Testnet chainId in hex with 0x prefix
          const monadChainIdHex = '0x' + parseInt(MONAD_CHAIN_ID).toString(16);
          
          // Try to switch to Monad Testnet using the raw provider
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: monadChainIdHex }],
          });
          
          console.log("Network switch request sent");
          
          // Wait a moment for the network to switch
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // IMPORTANT: Create a NEW ethers provider after switching networks
          // This avoids the "underlying network changed" error
          updatedProvider = new ethers.providers.Web3Provider(provider);
          const updatedNetwork = await updatedProvider.getNetwork();
          
          console.log(`Network after switch (${walletType}):`, updatedNetwork);
          
          if (updatedNetwork.chainId !== parseInt(MONAD_CHAIN_ID)) {
            console.warn(`Network didn't switch correctly for ${walletType} - detected:`, updatedNetwork.chainId, "expected:", MONAD_CHAIN_ID);
            
            // One more attempt with a longer wait
            await new Promise(resolve => setTimeout(resolve, 2000));
            const finalProvider = new ethers.providers.Web3Provider(provider);
            const finalNetwork = await finalProvider.getNetwork();
            
            if (finalNetwork.chainId !== parseInt(MONAD_CHAIN_ID)) {
              if (!isAutoReconnect) {
                alert("Please manually switch to Monad Testnet in your wallet settings.");
              }
              return false;
            }
            
            // Use the final provider if it worked
            updatedProvider = finalProvider;
          }
        } catch (switchError) {
          console.error(`Error switching networks for ${walletType}:`, switchError);
          
          // This error code means the chain has not been added
          if (switchError.code === 4902) {
            try {
              console.log(`Adding Monad Testnet to ${walletType}...`);
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x' + parseInt(MONAD_CHAIN_ID).toString(16),
                  chainName: 'Monad Testnet',
                  nativeCurrency: {
                    name: 'MON',
                    symbol: 'MON',
                    decimals: 18
                  },
                  rpcUrls: ['https://testnet-rpc.monad.xyz']
                }]
              });
              
              // Wait a moment for the network to add
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Try switching again after adding
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + parseInt(MONAD_CHAIN_ID).toString(16) }],
              });
              
              // Create a fresh provider with the new network
              await new Promise(resolve => setTimeout(resolve, 1500));
              const newProvider = new ethers.providers.Web3Provider(provider);
              const newNetwork = await newProvider.getNetwork();
              
              if (newNetwork.chainId !== parseInt(MONAD_CHAIN_ID)) {
                console.warn(`Network didn't switch correctly for ${walletType} after adding`);
                if (!isAutoReconnect) {
                  alert("Please manually switch to Monad Testnet in your wallet settings.");
                }
                return false;
              }
              
              // Use the new provider
              updatedProvider = newProvider;
            } catch (addError) {
              console.error(`Error adding network to ${walletType}:`, addError);
              if (!isAutoReconnect) {
                alert("Could not add Monad Testnet to your wallet. Please add it manually.");
              }
              return false;
            }
          } else {
            if (!isAutoReconnect) {
              alert("Please switch to Monad Testnet in your wallet settings and try again.");
            }
            return false;
          }
        }
      }
      
      // By this point we should have a provider on the correct network
      console.log(`Successfully connected to Monad Testnet with ${walletType}`);
      
      // Get a signer from the provider
      const signer = updatedProvider.getSigner();
      
      // Set global variables
      userAddress = accounts[0];
      web3Provider = updatedProvider;
      web3Signer = signer;
      walletConnected = true;
      
      // Store the connected wallet type for future reference
      localStorage.setItem('lastConnectedWallet', walletType || 'unknown');
  
      // Update UI to show profile instead of connect buttons
      showWalletProfile(userAddress, true, walletType);
      
      // Initialize NFT contract
      nftContract = new ethers.Contract(
        PURGEDNADS_NFT_CONTRACT_ADDRESS,
        PURGEDNADS_NFT_CONTRACT_ABI,
        web3Signer
      );
      
      // Show NFT panel and update info
      nftPanel.style.display = "block";
      await updateNFTInfo();
      
      return true;
    } catch (error) {
      console.error(`Error connecting wallet (${walletType}):`, error);
      if (!isAutoReconnect) {
        // Only show alert for manual connection attempts
        alert("Error connecting wallet: " + (error.message || "Unknown error"));
      }
      return false;
    }
  }

     // Add this new function to stop obstacle animation
    function stopObstacleAnimation() {
    cactus.style.animation = "none";
    cactus.style.left = "580px"; // Reset to starting position
  }

    // Character Selection Variables
let selectedCharacter = "Molandak"; // Default character

// Initialize Character Selection
function initializeCharacterSelection() {
    const characterOptions = document.querySelectorAll('.character-option');
    
    // Add click handlers to all character options
    characterOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove 'selected' class from all options
            characterOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add 'selected' class to clicked option
            this.classList.add('selected');
            
            // Update selected character
            selectedCharacter = this.getAttribute('data-character');
            
            // Update the character appearance
            updateCharacterAppearance();
        });
    });
}

// Update character appearance based on selection
function updateCharacterAppearance() {
    const dino = document.getElementById('dino');
    if (!dino) return;
    
    // Update the background image based on selected character
    switch(selectedCharacter) {
        case "Molandak":
            dino.style.backgroundImage = "url(img/molandak.png)";
            break;
        case "Mouch":
            dino.style.backgroundImage = "url(img/mouch.png)";
            break;
        case "Chog":
            dino.style.backgroundImage = "url(img/chog.png)";
            break;
        case "Moyaki":
            dino.style.backgroundImage = "url(img/moyaki.png)";
            break;
        default:
            dino.style.backgroundImage = "url(img/molandak.png)";
    }
}

    // Initialize High Score
  function initializeHighScore() {
    highScore = localStorage.getItem('dinoGameHighScore') || 0;
    highScoreDisplay.textContent = highScore;
  }

  // Improved checkCurrentWalletConnection to use stored account information
  async function checkCurrentWalletConnection() {
    try {
      console.log("Checking for existing wallet connections...");
      
      // Detect available providers
      detectWalletProviders();
      
      // Try to find out which wallet was last connected
      const lastConnectedWallet = localStorage.getItem('lastConnectedWallet');
      console.log("Last connected wallet:", lastConnectedWallet || "none");
      
      // Only auto-connect if we have a clear record of what was used
      if (lastConnectedWallet === 'metamask' && walletProviders.metamask) {
        console.log("Attempting to reconnect to MetaMask...");
        
        try {
          const accounts = await walletProviders.metamask.request({
            method: 'eth_accounts',
            timeout: 2000
          });
          
          if (accounts && accounts.length > 0) {
            console.log("Found connected MetaMask account:", accounts[0]);
            return await connectWithProvider(walletProviders.metamask, true, 'metamask');
          }
        } catch (error) {
          console.log("Error checking MetaMask accounts:", error);
        }
      }
      
      if (lastConnectedWallet === 'phantom' && walletProviders.phantom) {
        console.log("Attempting to reconnect to Phantom...");
        
        try {
          const accounts = await walletProviders.phantom.request({
            method: 'eth_accounts',
            timeout: 2000
          });
          
          if (accounts && accounts.length > 0) {
            console.log("Found connected Phantom account:", accounts[0]);
            return await connectWithProvider(walletProviders.phantom, true, 'phantom');
          }
        } catch (error) {
          console.log("Error checking Phantom accounts:", error);
        }
      }
      
      console.log("No existing wallet connections found matching stored preferences");
      return false;
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      return false;
    }
  }

  // Helper function to add Monad network to wallet
async function addMonadNetwork(provider) {
    console.log("Adding Monad Testnet to wallet...");
    const monadChainIdHex = '0x' + parseInt(MONAD_CHAIN_ID).toString(16);
    
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: monadChainIdHex,
        chainName: 'Monad Testnet',
        nativeCurrency: {
          name: 'MON',
          symbol: 'MON',
          decimals: 18
        },
        rpcUrls: ['https://testnet-rpc.monad.xyz']
      }]
    });
    
    // Wait a moment for the network to add
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try switching after adding
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: monadChainIdHex }],
    });
    
    // Allow time for the switch to complete
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
   
  
  // Function to reposition character selection above NFT panel
  function repositionCharacterSelection() {
      const characterSelection = document.querySelector('.character-selection');
      const nftPanel = document.querySelector('.nft-panel');
      const parentElement = nftPanel.parentElement;
      
      // Move character selection before NFT panel
      if (characterSelection && nftPanel && parentElement) {
        parentElement.insertBefore(characterSelection, nftPanel);
      }
    }  
  
  async function updateNFTInfo() {
    try {
       // Show loading state first
    nftStatus.textContent = "Checking NFT status...";
    nftStatus.className = "nft-status loading";
    
    // Update mint button to show loading state
    mintNftBtn.disabled = true;
    mintNftBtn.textContent = "Checking NFT Status...";

    // Get total supply and max supply
    const totalSupply = await nftContract.totalSupply();
    const maxSupplyValue = await nftContract.maxSupply();
      
      // Update display
      nftsMinted.textContent = totalSupply.toString();
      maxSupply.textContent = maxSupplyValue.toString();
      
      // Check if user owns the NFT
      const balance = await nftContract.balanceOf(userAddress);
      ownsNFT = balance.toNumber() > 0;
      
      if (ownsNFT) {
        nftStatus.textContent = "You own the PurgedNads NFT!";
        nftStatus.className = "nft-status connected";
        mintNftBtn.disabled = true;
        mintNftBtn.textContent = "Already Minted (1 per Wallet)";
        
        // Show character selection
        characterSelection.style.display = "block";
  
        // Reposition character selection above NFT panel
        repositionCharacterSelection();
  
        startInstruction.textContent = "Press the Start Game button";
      } else {
        nftStatus.textContent = "You don't own the PurgedNads NFT";
        nftStatus.className = "nft-status not-connected";
        mintNftBtn.disabled = false;
        mintNftBtn.textContent = "Mint PurgedNads NFT (0.05 MON)";
        
        // Hide character selection
        characterSelection.style.display = "none";
        startInstruction.textContent = "Mint the PurgedNads NFT to play";
      }
    } catch (error) {
      console.error("Error updating NFT info:", error);
      nftStatus.textContent = "Error checking NFT status";
      nftStatus.className = "nft-status not-connected";
    }
  }
  
  // Function to show success modal
  function showMintSuccessModal(tokenId, txHash) {
      // Set token ID
      mintedTokenId.textContent = tokenId || 'Processing...';
      
      // Set up block explorer link
      if (txHash) {
        viewOnExplorerBtn.style.display = 'block';
        viewOnExplorerBtn.addEventListener('click', () => {
          window.open(`https://testnet.monadexplorer.com/tx/${txHash}`, '_blank');
        });
      } else {
        viewOnExplorerBtn.style.display = 'none';
      }
      
      // Show the modal
      mintSuccessModal.style.display = 'block';
    }
    
    // Function to show failure modal
    function showMintFailureModal(errorMessage) {
      // Set error details
      mintErrorDetails.textContent = errorMessage || 'Unknown error occurred.';
      
      // Show the modal
      mintFailureModal.style.display = 'block';
    }
  
  async function mintPurgedNadsNFT() {
    if (!walletConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
       // Test if contract connection works first
       const totalSupply = await nftContract.totalSupply();
       console.log("Contract connection works, total supply:", totalSupply.toString());
  
       // Check if user already owns an NFT
      const balance = await nftContract.balanceOf(userAddress);
      
      if (balance.toNumber() > 0) {
        showMintFailureModal("You already own a PurgedNads NFT! Only one mint per wallet is allowed.");  
        await updateNFTInfo(); // Update the UI to reflect current state
        return;
      }
  
      console.log("Starting mint process, should show wallet popup soon...");
      mintNftBtn.disabled = true;
      mintNftBtn.textContent = "Minting...";
      
      // Call mint function on the contract
      console.log("About to call mintNFT with 0.05 ETH...");
      const tx = await nftContract.mintNFT({
        value: ethers.utils.parseEther("0.05") // Assuming 0.05 ETH mint price, adjust as needed
      });
      
      // Wait for transaction to complete
      const receipt = await tx.wait();
  
      // Check for mint event to get tokenId
      let tokenId = null;
      try {
        if (receipt && receipt.events) {
          // Loop through events to find the Transfer event
          for (const event of receipt.events) {
            // Look for Transfer event (common in ERC-721 contracts)
            if (event.event === 'Transfer') {
              // The third parameter in Transfer(from, to, tokenId) is usually the tokenId
              tokenId = event.args && event.args[2] ? event.args[2].toString() : null;
              break;
            }
          }
        }
      } catch (error) {
        console.log("Could not extract tokenId:", error);
        // Continue without the tokenId
        tokenId = "Unknown";
      }
      
      // Show success message
      showMintSuccessModal(tokenId, tx.hash);
      
      // Update NFT info
      await updateNFTInfo();
      
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Failed to mint NFT: " + error.message);
      mintNftBtn.disabled = false;
      mintNftBtn.textContent = "Mint PurgedNads NFT";
    }
  }
  
  // Game Start Mechanism
  function startGame() {
    console.log("Starting game...");
    console.log("Wallet connected:", walletConnected);
    console.log("Owns NFT:", ownsNFT);
    
    // Check wallet connection
    if (!walletConnected) {
      alert('Please connect your wallet first!');
      return;
    }
    
    // Check if user owns the NFT
    if (!ownsNFT) {
      alert('You need to mint the PurgedNads NFT to play the game!');
      return;
    }
  
    // Prevent multiple game starts
    if (gameStarted) return;
  
    // Scroll to game container
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      gameContainer.scrollIntoView({ behavior: 'smooth' });
    }
  
    // Apply the selected character immediately so it's visible during countdown
    updateCharacterAppearance();
    
    // Create countdown overlay
    const game = document.querySelector('.game');
    const countdownOverlay = document.createElement('div');
    countdownOverlay.className = 'countdown-overlay';
    
    const countdownNumber = document.createElement('div');
    countdownNumber.className = 'countdown-number';
    countdownNumber.textContent = '3';
    
    countdownOverlay.appendChild(countdownNumber);
    game.appendChild(countdownOverlay);
    
    // Start countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownNumber.textContent = count.toString();
      } else {
        // Remove countdown and actually start the game
        clearInterval(countdownInterval);
        game.removeChild(countdownOverlay);
        
        // Start the actual game after countdown
        continueGameStart();
      }
    }, 1000);
  }
  
  // New function to continue game start after countdown
  function continueGameStart() {

    // Remove any existing animation iteration listeners first
  cactus.removeEventListener('animationiteration', handleObstacleReset);
  
  // Then add the event listener with a named function instead of an anonymous one
  cactus.addEventListener('animationiteration', handleObstacleReset);

    // Start background music
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
  
    // Hide character selection
    characterSelection.style.display = 'none';
  
    // Reset all game states
    gameStarted = true;
    isGameOver = false;
    
    // Reset visual elements
    resetScore();
    resetObstaclePosition();

    // ENHANCED: Ensure coin is fully reset before starting
if (coinMoveInterval) {
    clearInterval(coinMoveInterval);
    coinMoveInterval = null;
  }
  resetCoin();
  coin.style.display = "none";
  isCoinActive = false;
    
    // Hide start instruction
    startInstruction.style.opacity = "0";
    startInstruction.style.display = "none";
  
    // Setup obstacle movement
    setupObstacleMovement();
  
    // Start scoring
    scoreInterval = setInterval(updateScore, 100);
  
    // Start collision detection
    setupCollisionDetection();

    startCoinSpawnTimer();
    // Reset TX counter when a new game starts
    resetTxCounter();
    
    console.log("Game started successfully");

    // Add event listener for obstacle animation completion
cactus.addEventListener('animationiteration', () => {
    if (gameStarted && !isGameOver) {
      // Reset animation with current gameSpeed
      cactus.style.animation = "none";
      void cactus.offsetWidth; // Trigger reflow
      cactus.style.animation = `block ${gameSpeed}s infinite linear`;
      console.log(`Obstacle animation reset with new speed: ${gameSpeed}s`);
    }
  });

  }

  // Add this function outside any other function (global scope):
function handleObstacleReset() {
    if (gameStarted && !isGameOver) {
      // Reset animation with current gameSpeed
      cactus.style.animation = "none";
      void cactus.offsetWidth; // Trigger reflow
      cactus.style.animation = `block ${gameSpeed}s infinite linear`;
      console.log(`Obstacle animation reset with new speed: ${gameSpeed}s`);
    }
  }
  
  // Reset Game Completely
  function resetGame() {
    // Stop all sounds
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  
    // Stop all intervals
    clearInterval(scoreInterval);
    clearInterval(collisionCheckInterval);
  
    // Reset game states
    gameStarted = false;
    isGameOver = false;
  
    // Reset score
    resetScore();

    // Reset speed related variables
    gameSpeed = 1.8 ;  // Back to initial speed
    nextSpeedIncreaseScore = speedIncreaseThreshold; // Reset first threshold
    lastSpeedIncreaseTime = 0;  // Reset the time tracker

    // Reset TX counter when game resets
    resetTxCounter();

    // If you have a speed indicator, hide it 
    const speedIndicator = document.getElementById('speedIndicator');
    if (speedIndicator) {
    speedIndicator.style.opacity = '0';
  }
    if (speedIndicatorTimeout) {
    clearTimeout(speedIndicatorTimeout);
  }

  // Remove the animation iteration listener
  cactus.removeEventListener('animationiteration', handleObstacleReset);
  
  // Reset animation with default speed
  cactus.style.animation = "none";
  
    // Reset obstacle
    resetObstaclePosition();
    resetCoin();
    scoreMultiplier = 1;
  if (multiplierTimer) {
    clearTimeout(multiplierTimer);
    multiplierTimer = null;
  }
  if (coinSpawnInterval) {
    clearInterval(coinSpawnInterval);
    coinSpawnInterval = null;
  }
    hideMultiplierActive();
    hideMultiplierActive();
    stopObstacleAnimation();
    
    // ENHANCED: Ensure coin is fully reset before starting
  if (coinMoveInterval) {
    clearInterval(coinMoveInterval);
    coinMoveInterval = null;
  }
  resetCoin();
  coin.style.display = "none";
  isCoinActive = false;
  
  resetCoin();
    // Hide game over modal
    gameOverModal.style.display = "none";
  
    // Show character selection if user owns NFT
    if (ownsNFT) {
      characterSelection.style.display = 'block';
      startInstruction.style.display = "block";
      startInstruction.style.opacity = "1";
      startInstruction.textContent = "Press the Start Game button";
    } else {
      characterSelection.style.display = 'none';
      startInstruction.style.display = "block";
      startInstruction.style.opacity = "1";
      startInstruction.textContent = "Mint the PurgedNads NFT to play";
    }
  
    // Remove mint button when game is reset
    const mintButton = document.getElementById('mintScoreButton');
    if (mintButton) {
      mintButton.remove();
    }
  }
  
  // Reset Obstacle Position
  function resetObstaclePosition() {
    obstaclePosition = 580;
    cactus.style.left = `${obstaclePosition}px`;
    stopObstacleAnimation();
  }
  
  // Score Management
  function resetScore() {
    score = 0;
    scoreDisplay.textContent = score;
  }
  
  function updateScore() {
    if (!isGameOver && gameStarted) {
      // Calculate score increment, but force to integer
      let scoreIncrement = Math.floor(1 * scoreMultiplier);
      score += scoreIncrement;
      
      // Display as integer
      scoreDisplay.textContent = Math.floor(score);
  
      // Check if we should increase speed
      checkSpeedIncrease();
    }
  }

  function checkSpeedIncrease() {
    const now = Date.now();
    // Only increase speed if enough points AND at least 3 seconds since last increase
    if (score >= nextSpeedIncreaseScore && gameSpeed > minGameSpeed && now - lastSpeedIncreaseTime >= 3000) {
      // Calculate new speed (with minimum cap)
      const newSpeed = Math.max(gameSpeed - speedIncrementAmount, minGameSpeed);
      
      // Only update if speed actually changed
      if (newSpeed < gameSpeed) {
        gameSpeed = newSpeed;
        
        // Update next threshold
        nextSpeedIncreaseScore += speedIncreaseThreshold;
        
        // Record the time of this speed increase
        lastSpeedIncreaseTime = now;
        
        // Show speed increase indicator
        showSpeedIndicator();
        
        console.log(`Speed increased! Animation duration now: ${gameSpeed}s at score ${score}`);
      }
    }
  }

  function showSpeedIndicator() {
    // Create indicator if it doesn't exist
    let speedIndicator = document.getElementById('speedIndicator');
    
    if (!speedIndicator) {
      speedIndicator = document.createElement('div');
      speedIndicator.id = 'speedIndicator';
      speedIndicator.style.position = 'fixed';
      speedIndicator.style.top = '50px';
      speedIndicator.style.left = '50%';
      speedIndicator.style.transform = 'translateX(-50%)';
      speedIndicator.style.background = 'rgba(246, 147, 27, 0.8)'; // Matches theme color
      speedIndicator.style.color = 'white';
      speedIndicator.style.padding = '8px 15px';
      speedIndicator.style.borderRadius = '20px';
      speedIndicator.style.fontWeight = 'bold';
      speedIndicator.style.zIndex = '100';
      speedIndicator.style.opacity = '0';
      speedIndicator.style.transition = 'opacity 0.3s ease';
      speedIndicator.style.boxShadow = '0 0 10px rgba(246, 147, 27, 0.5)';
      document.body.appendChild(speedIndicator);
    }
    
    // Clear any existing timeout
    if (speedIndicatorTimeout) {
      clearTimeout(speedIndicatorTimeout);
    }
    
    // Calculate speed factor for display (inverse of duration)
    const initialSpeed = 1.8; // Should match your starting value
    const speedFactor = (initialSpeed / gameSpeed).toFixed(2);
    
    // Update text and make visible
    speedIndicator.textContent = `Speed Up! (${speedFactor}x)`;
    speedIndicator.style.opacity = '1';
    
    // Add a visual pulse animation
    speedIndicator.style.animation = 'pulse 0.5s 3';
    
    // Hide after 2 seconds
    speedIndicatorTimeout = setTimeout(() => {
      speedIndicator.style.opacity = '0';
    }, 2000);
    
    // Flash game background briefly
    const game = document.querySelector('.game');
    game.style.boxShadow = '0 0 20px rgba(246, 147, 27, 0.8)';
    
    // Reset game background
    setTimeout(() => {
      game.style.boxShadow = '';
    }, 500);
  }
  
  function updateHighScore() {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('dinoGameHighScore', highScore);
      highScoreDisplay.textContent = highScore;
    }
  }
  
  // Obstacle Movement
  function setupObstacleMovement() {
    console.log("Setting up obstacle movement");
    
    // Only set up animation if game is properly started
    if (!gameStarted || !walletConnected || !ownsNFT) {
      console.log("Game not ready, stopping obstacle animation");
      stopObstacleAnimation();
      return;
    }
  
    // Clear any existing animations
    cactus.style.animation = "none";
    
    // Trigger reflow to reset animation
    void cactus.offsetWidth;
  
    // Set up new animation with current gameSpeed
    cactus.style.animation = `block ${gameSpeed}s infinite linear`;
    console.log(`Obstacle animation started with speed: ${gameSpeed}`);

    // Record this time as the last obstacle reset time
    lastObstacleResetTime = Date.now();
  }
  


  function spawnCoin() {
    // Skip extensive checks for simplicity
    if (isGameOver || !gameStarted || !walletConnected || !ownsNFT || isCoinActive) {
      return;
    }
    
    console.log("🪙 Spawning new coin"); 
    
    // Reset position and make visible
    isCoinActive = true;
    coinPosition = 580;
    
    // Randomize height between 90px and 130px
    const randomTop = Math.floor(Math.random() * 40) + 90;
    coin.style.top = `${randomTop}px`;
    
    // Make coin visible with initial position
    coin.style.left = `${coinPosition}px`;
    coin.style.display = "block";
    coin.style.animation = "none"; // Disable any CSS animations
    
    // Animation entrance effect
    coin.style.transform = "scale(0)";
    setTimeout(() => {
      coin.style.transition = "transform 0.3s ease";
      coin.style.transform = "scale(1)";
    }, 50);
    
    // Clear any existing interval first
    if (coinMoveInterval) {
      clearInterval(coinMoveInterval);
    }
    
    // CREATE A DIRECT INTERVAL TO MOVE THE COIN
    // This gives us complete control over the coin's position
    coinMoveInterval = setInterval(() => {
      // Stop if game is not active
      if (!gameStarted || isGameOver) {
        clearInterval(coinMoveInterval);
        return;
      }
      
      // Move coin left (adjust speed based on game speed)
      // Calculate movement speed based on current gameSpeed
      // Lower gameSpeed = faster game = faster coin movement
      const moveSpeed = 5 * (1.8 / gameSpeed);
      coinPosition -= moveSpeed;
      coin.style.left = `${coinPosition}px`;
      
      // Check for dino collision here
      // We don't rely on the collision detection function for this anymore
      const dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("top"));
      const dinoRight = 50 + 45; // dino position + width
      const dinoBottom = dinoTop + 50; // dino top + height
      const coinTop = parseInt(coin.style.top);
      
      // Check collision with hitbox
      if (coinPosition < dinoRight && 
          coinPosition + 30 > 50 && 
          dinoTop < coinTop + 30 && 
          dinoBottom > coinTop) {
        // Collected!
        console.log("🪙 Coin collected");
        collectCoin();
        clearInterval(coinMoveInterval);
      }
      
      // Check if coin went off screen
      if (coinPosition < -30) {
        console.log("🪙 Coin went off screen");
        clearInterval(coinMoveInterval);
        resetCoin();
        
        // CRITICAL: Schedule next coin after miss with a fixed delay
        const respawnDelay = 4000 + Math.random() * 2000; // 4-6 seconds
        console.log(`🪙 Scheduling next coin in ${Math.floor(respawnDelay)}ms`);
        
        setTimeout(() => {
          if (gameStarted && !isGameOver && !isCoinActive) {
            spawnCoin();
          }
        }, respawnDelay);
      }
    }, 20); // Update 50 times per second for smooth movement
  }

  function collectCoin() {
    // Play sound effect
    coinCollectSound.currentTime = 0;
    coinCollectSound.play();
    
    // Clear the movement interval
    if (coinMoveInterval) {
      clearInterval(coinMoveInterval);
      coinMoveInterval = null;
    }
    
    // Hide the coin
    resetCoin();
    
    // Set score multiplier
    scoreMultiplier = 2;
    
    // Clear existing timer if there is one
    if (multiplierTimer) {
      clearTimeout(multiplierTimer);
      multiplierTimer = null;
    }
    
    // Update UI
    hideMultiplierActive();
    showMultiplierActive(scoreMultiplier);
    
    // Reset multiplier after delay
    multiplierTimer = setTimeout(() => {
      console.log("Multiplier timer expired, resetting to 1x");
      scoreMultiplier = 1;
      hideMultiplierActive();
      multiplierTimer = null;
    }, 7000);
    
    // Schedule next coin
    const respawnDelay = 4000 + Math.random() * 2000; // 4-6 seconds
    console.log(`🪙 Scheduling next coin in ${Math.floor(respawnDelay)}ms after collection`);
    
    setTimeout(() => {
      if (gameStarted && !isGameOver && !isCoinActive) {
        spawnCoin();
      }
    }, respawnDelay);
  }
  
  function resetCoin() {
    console.log("🪙 Resetting coin state");
    isCoinActive = false;
    coin.style.display = "none";
    coin.style.animation = "none";
    coin.style.left = "580px"; // Reset position
    
    // Clear interval if it exists
    if (coinMoveInterval) {
      clearInterval(coinMoveInterval);
      coinMoveInterval = null;
    }
  }
  
  function showMultiplierActive(multiplier) {
    // Make the score gold and pulsating
    scoreDisplay.classList.add("score-multiplier");
    
    // Add a multiplier indicator
    const multiplierIndicator = document.createElement("div");
    multiplierIndicator.id = "multiplierIndicator";
    multiplierIndicator.className = "multiplier-active";
    multiplierIndicator.textContent = `${multiplier}x SCORE!`;
    document.body.appendChild(multiplierIndicator);
  }
  
  function hideMultiplierActive() {
    // Remove gold effect from score
    scoreDisplay.classList.remove("score-multiplier");
    
    // Find and remove any existing multiplier indicators
    const indicators = document.querySelectorAll("#multiplierIndicator");
    indicators.forEach(indicator => {
      // Set to fade out
      indicator.style.opacity = "0";
      
      // Then remove after animation completes
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 500);
    });
  }
  function startCoinSpawnTimer() {
    console.log("🪙 Starting coin system");
    
    // Clear any existing movement interval for safety
    if (coinMoveInterval) {
      clearInterval(coinMoveInterval);
      coinMoveInterval = null;
    }
    
    // First spawn in 3-5 seconds
  const firstSpawnTime = 3000 + Math.random() * 2000;
  console.log(`🪙 First coin will appear in ${Math.floor(firstSpawnTime)}ms`);
  
  setTimeout(() => {
    if (gameStarted && !isGameOver) {
      spawnCoin();
    }
  }, firstSpawnTime);
  
  // Backup interval just in case - this will check every 10 seconds if a coin should spawn
  coinSpawnInterval = setInterval(() => {
    if (!isCoinActive && gameStarted && !isGameOver) {
      console.log("🪙 Backup coin spawn triggered");
      spawnCoin();
    }
  }, 10000);
}
  
  
  // Collision Detection
  function setupCollisionDetection() {
    // Clear any existing intervals
    if (collisionCheckInterval) {
      clearInterval(collisionCheckInterval);
    }
  
    // Use requestAnimationFrame for smoother detection
    function checkCollisions() {
      if (!gameStarted || isGameOver) return;
      
      let dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("top"));
      let cactusLeft = parseInt(window.getComputedStyle(cactus).getPropertyValue("left"));
      
      // Only check cactus (obstacle) collision - coin collision is handled separately
      if (cactusLeft < 45 && cactusLeft > 0 && dinoTop >= 140) {
        gameOverSequence();
        return; // Stop checking after game over
      }
      
      // Continue checking on next frame if game is still active
      if (gameStarted && !isGameOver) {
        requestAnimationFrame(checkCollisions);
      }
    }
    
    // Start the collision detection loop
    requestAnimationFrame(checkCollisions);
  }
  
  function scheduleCoinRespawn() {
    const delay = Math.floor(Math.random() * 2000) + 4000; // 4-6 seconds
    console.log(`Scheduling next coin to appear in ${delay}ms`); // Debug logging
    
    setTimeout(() => {
      if (gameStarted && !isGameOver && !isCoinActive) {
        console.log("Respawn timer triggered, calling spawnCoin()"); // Debug logging
        spawnCoin();
      } else {
        console.log("Skipped coin spawn because game state changed"); // Debug logging
      }
    }, delay);
  }

  // Game Over Sequence
  function gameOverSequence() {
    if (walletConnected && userAddress) {
      saveScoreToLeaderboard(score);
    }
    
    // Prevent multiple game over calls
    if (isGameOver) return;
    
    console.log("Game over!");
    
    // Play collision sound
    collisionSound.play();
    
    // Stop background music
    backgroundMusic.pause();
    
    isGameOver = true;
    gameStarted = false;
    
    // IMPORTANT: Clean up coin system
    if (coinMoveInterval) {
      clearInterval(coinMoveInterval);
      coinMoveInterval = null;
    }

    // Explicitly reset and hide the coin when game ends
    resetCoin();
    coin.style.display = "none"; // Force hide with direct style
    isCoinActive = false; // Force inactive state
    
    // Stop intervals
    clearInterval(scoreInterval);
    clearInterval(collisionCheckInterval);
    clearInterval(coinSpawnInterval);
    
    // Stop obstacle movement
    stopObstacleAnimation();
    
    // Update high score
    updateHighScore();
    
    // Show game over modal
    finalScoreDisplay.textContent = score;
    gameOverModal.style.display = "block";
    
    // Make sure the close button is visible and working
    if (closeGameOverModal) {
      closeGameOverModal.style.display = "block";
    }
  }
  


  // Global nonce tracking
let latestNonce = null;

// Function to send empty transactions without waiting
async function sendEmptyTransaction() {
    try {
        const { signer, provider } = await getPrivateKeySigner();

        // If this is the first transaction, get the latest nonce from the network
        if (latestNonce === null) {
            latestNonce = await provider.getTransactionCount(signer.address, "pending");
        }

        console.log(`🚀 Sending transaction with nonce: ${latestNonce}`);

        const tx = {
            to: "0x0000000000000000000000000000000000000000", // Send to zero address
            value: ethers.utils.parseEther("0"), // 0 ETH
            gasLimit: 21000,
            nonce: latestNonce, // ✅ Use manually tracked nonce
        };

        // Increment the nonce for the next transaction
        latestNonce++;

        // Send transaction without waiting
        signer.sendTransaction(tx).then((txResponse) => {
            console.log("✅ Transaction sent:", txResponse.hash);
        }).catch((error) => {
            console.error("❌ Transaction failed:", error);
        });

    } catch (error) {
        console.error("❌ Failed to send transaction:", error);
    }
}

  // Jump Mechanism
  function jump() {
    if (!walletConnected || !ownsNFT) {
      return; // Prevent jump if not authenticated
    }
    
    if (!gameStarted) {
      return; // Prevent jump if game not started
    }
    
    if (!dino.classList.contains("jump")) {
      // Play jump sound
      jumpSound.currentTime = 0;
      jumpSound.play();
      dino.classList.add("jump");

      // Send transaction without waiting - will use private key automatically
      sendEmptyTransaction();

      // Show transaction animation
    showTxAnimation();
    
    // Update transaction counter
    updateTxCounter();
  
      setTimeout(function () {
        dino.classList.remove("jump");
      }, 600);
    }
  }
  
  // Setup Game Controls
  function setupGameControls() {
    // Remove any existing event listeners (optional, be careful with this)
    const oldHandler = window._gameKeyHandler;
    if (oldHandler) {
      document.removeEventListener("keydown", oldHandler);
    }
    
    // Create a new handler and store reference for potential future cleanup
    const keyHandler = function(event) {
      if (event.code === "Space") {
        event.preventDefault();
        
        // First priority: check if game over modal is open
        if (gameOverModal.style.display === "block") {
          console.log("Closing game over modal with spacebar");
          
          // Close the modal without starting game
          gameOverModal.style.display = "none";
          
          // Show character selection and instructions
          if (ownsNFT) {
            characterSelection.style.display = 'block';
          }
          
          startInstruction.style.display = "block";
          startInstruction.style.opacity = "1";
          startInstruction.textContent = "Press the Start Game button to play again";
          
          // Block further processing
          event.stopPropagation();
          return false;
        }
        
        // If we get here, the modal wasn't open
        if (gameStarted) {
          jump();
        } else if (walletConnected && ownsNFT && !isGameOver) {
          startGame();
        }
    }
    };
    
    // Store handler reference
    window._gameKeyHandler = keyHandler;
    
    // Add the event listener with capture phase to intercept early
    document.addEventListener("keydown", keyHandler, true);

    // Touch controls for mobile
    document.addEventListener("touchstart", function (event) {
      if (!walletConnected || !ownsNFT) return;
      
      const gameArea = document.querySelector('.game');
      
      // Check if touch is within game area
      if (gameArea.contains(event.target)) {
        event.preventDefault();
        
        // Hide game over modal if displayed
        if (gameOverModal.style.display === "block") {
          gameOverModal.style.display = "none";
        }
        
        if (!gameStarted) {
          startGame();
        } else {
          jump();
        }
      }
    });
  }

  // Show wallet profile view and hide connect view
  // Updated UI function to include wallet type indicator
function showWalletProfile(address, isCorrectNetwork = true, walletType = null) {
    const walletPanel = document.querySelector('.wallet-panel');
    const headerWalletProfile = document.getElementById('header-wallet-profile');
    const headerDisplayAddress = document.getElementById('headerDisplayAddress');
    const walletTypeIndicator = document.createElement('span');
    
    // Format address for display (0x1234...5678)
    const formattedAddress = address.substring(0, 6) + '...' + address.substring(38);
    
    // Add wallet type indicator
    walletTypeIndicator.className = 'wallet-type-indicator';
    
    if (walletType === 'metamask') {
      walletTypeIndicator.textContent = 'MetaMask';
      walletTypeIndicator.classList.add('metamask-wallet');
    } else if (walletType === 'phantom') {
      walletTypeIndicator.textContent = 'Phantom';
      walletTypeIndicator.classList.add('phantom-wallet');
    } else {
      walletTypeIndicator.textContent = 'Wallet';
    }
    
    // Update header display
    if (headerDisplayAddress) {
      headerDisplayAddress.textContent = formattedAddress;
      
      // Create tooltip for header address
      const headerTooltip = document.createElement('span');
      headerTooltip.className = 'tooltip';
      headerTooltip.textContent = address;
      headerDisplayAddress.appendChild(headerTooltip);
      
      // Add wallet indicator next to the address if it doesn't exist already
      const existingIndicator = headerWalletProfile.querySelector('.wallet-type-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      headerWalletProfile.querySelector('.wallet-info').appendChild(walletTypeIndicator.cloneNode(true));
    }
    
    // Update network indicator in header
    const headerNetworkDot = document.getElementById('headerNetworkDot');
    const headerNetworkName = document.getElementById('headerNetworkName');
    
    if (headerNetworkDot && headerNetworkName) {
      if (isCorrectNetwork) {
        headerNetworkDot.classList.remove('wrong-network');
        headerNetworkName.textContent = 'Monad Testnet';
      } else {
        headerNetworkDot.classList.add('wrong-network');
        headerNetworkName.textContent = 'Wrong Network';
      }
    }
    
    // Hide the wallet panel
    if (walletPanel) {
      walletPanel.style.display = 'none';
    }
    
    // Show header wallet info
    if (headerWalletProfile) {
      headerWalletProfile.style.display = 'flex';
    }
  }
  
  // Setup events for header wallet elements
  function setupHeaderWalletEvents() {
      // Copy address button
      if (headerCopyAddressBtn) {
          headerCopyAddressBtn.addEventListener('click', async () => {
              const address = headerDisplayAddress.querySelector('.tooltip').textContent;
              try {
                  await navigator.clipboard.writeText(address);
                  // Show copied feedback
                  const originalText = headerCopyAddressBtn.innerHTML;
                  headerCopyAddressBtn.innerHTML = '<span>✓</span>';
                  setTimeout(() => {
                      headerCopyAddressBtn.innerHTML = originalText;
                  }, 2000);
              } catch (err) {
                  console.error('Failed to copy: ', err);
              }
          });
      }
      
      // Disconnect button
      if (headerDisconnectWalletBtn) {
          headerDisconnectWalletBtn.addEventListener('click', async () => {
              // Reset wallet state
              walletConnected = false;
              userAddress = null;
              
              // Hide header wallet profile
              headerWalletProfile.style.display = 'none';
  
              // Show the wallet panel again
      const walletPanel = document.querySelector('.wallet-panel');
      if (walletPanel) {
          walletPanel.style.display = 'block';
      }
  
              
              // Show connect view if it exists
              const connectView = document.getElementById('wallet-connect-view');
              if (connectView) {
                  connectView.style.display = 'block';
              }
              
              // Hide profile view if it exists
      const profileView = document.getElementById('wallet-profile-view');
      if (profileView) {
          profileView.style.display = 'none';
      }
  
              // Hide NFT panel and character selection
              document.querySelector('.nft-panel').style.display = "none";
              document.querySelector('.character-selection').style.display = "none";
              document.getElementById('start-instruction').textContent = "Connect your wallet to start playing";
              
              // Reset game if it's in progress
              if (gameStarted) {
                  resetGame();
              }
          });
      }
  }
  
  // Modified showWalletConnectView function to handle header wallet
  function showWalletConnectView() {
      const connectView = document.getElementById('wallet-connect-view');
      
      // Hide header wallet profile
      headerWalletProfile.style.display = 'none';
      
      // Show connect view if it exists
      if (connectView) {
          connectView.style.display = 'block';
      }
  
      // Show the wallet panel
      const walletPanel = document.querySelector('.wallet-panel');
      if (walletPanel) {
          walletPanel.style.display = 'block';
      }
  
      // Hide profile view
      const profileView = document.getElementById('wallet-profile-view');
      if (profileView) {
          profileView.style.display = 'none';
      }
  }
  
  // Copy wallet address to clipboard
  function setupCopyAddressButton() {
      const copyBtn = document.getElementById('copyAddressBtn');
      copyBtn.addEventListener('click', async () => {
          const address = document.querySelector('.tooltip').textContent;
          try {
              await navigator.clipboard.writeText(address);
              // Show copied feedback
              const originalText = copyBtn.innerHTML;
              copyBtn.innerHTML = '<span>✓</span>';
              setTimeout(() => {
                  copyBtn.innerHTML = originalText;
              }, 2000);
          } catch (err) {
              console.error('Failed to copy: ', err);
          }
      });
  }
  
  // Handle wallet disconnect
  function disconnectWallet() {
    console.log("Disconnecting wallet");
    
    // Clear stored connection info
    localStorage.removeItem('lastConnectedWallet');
    
    // Reset wallet state
    walletConnected = false;
    userAddress = null;
    
    // Update UI
    try {
      const walletPanel = document.querySelector('.wallet-panel');
      if (walletPanel) walletPanel.style.display = 'block';
      
      const headerWalletProfile = document.getElementById('header-wallet-profile');
      if (headerWalletProfile) headerWalletProfile.style.display = 'none';
      
      // Show connect view if it exists
      const connectView = document.getElementById('wallet-connect-view');
      if (connectView) {
        connectView.style.display = 'block';
      }
      
      // Hide profile view if it exists
      const profileView = document.getElementById('wallet-profile-view');
      if (profileView) {
        profileView.style.display = 'none';
      }
      
      // Hide NFT panel and character selection
      const nftPanel = document.querySelector('.nft-panel');
      if (nftPanel) nftPanel.style.display = "none";
      
      const characterSelection = document.querySelector('.character-selection');
      if (characterSelection) characterSelection.style.display = "none";
      
      const startInstruction = document.getElementById('start-instruction');
      if (startInstruction) startInstruction.textContent = "Connect your wallet to start playing";
      
      // Reset game if it's in progress
      if (gameStarted) {
        resetGame();
      }
    } catch (error) {
      console.error("Error updating UI during disconnect:", error);
    }
  }
  
  // Get the close button element
  const closeGameOverModal = document.getElementById('closeGameOverModal');
  
  // Add event listener to close the game over modal
  if (closeGameOverModal) {
    closeGameOverModal.addEventListener('click', () => {
      gameOverModal.style.display = 'none';
      
      // Show the character selection if player owns NFT
    if (ownsNFT) {
        characterSelection.style.display = 'block';
      }
      
      // Show instruction message
      startInstruction.style.display = "block";
      startInstruction.style.opacity = "1";
      startInstruction.textContent = "Press the Start Game button to play again";
    });
  }

  function setupDisconnectButton() {
    const disconnectBtn = document.getElementById('disconnectWalletBtn');
    if (!disconnectBtn) {
        console.warn("Disconnect button not found in DOM");
        return;
    }
    
    disconnectBtn.addEventListener('click', async () => {
        console.log("Disconnect button clicked");
        disconnectWallet();
    });
}

// Initialize Leaderboard Elements
function initializeLeaderboard() {
    // Get DOM elements
    viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
    leaderboardModal = document.getElementById('leaderboardModal');
    closeLeaderboardModal = document.getElementById('closeLeaderboardModal');
    
    // Set up event listeners
    if (viewLeaderboardBtn) {
        viewLeaderboardBtn.addEventListener('click', () => {
            // Hide the game over modal
            gameOverModal.style.display = 'none';

            // ADDED: Additional coin cleanup when transitioning to leaderboard
            resetCoin();
            if (coinMoveInterval) {
              clearInterval(coinMoveInterval);
              coinMoveInterval = null;
           }
            coin.style.display = "none";
            isCoinActive = false;
            
            // Track that we came from game over state
            const cameFromGameOver = isGameOver;
            
            // Store this info on the leaderboard modal itself
            leaderboardModal.dataset.fromGameOver = cameFromGameOver;
            
            // Show the leaderboard
            showLeaderboard();
          });
    }
    
    if (closeLeaderboardModal) {
        closeLeaderboardModal.addEventListener('click', () => {
            // Hide the leaderboard modal
            leaderboardModal.style.display = 'none';

            // ADDED: Additional coin cleanup when closing leaderboard
            resetCoin();
            if (coinMoveInterval) {
              clearInterval(coinMoveInterval);
              coinMoveInterval = null;
            }
              coin.style.display = "none";
              isCoinActive = false;
            
            // Check if we came from game over
            const fromGameOver = leaderboardModal.dataset.fromGameOver === 'true';
            
            // If we came from game over, show character selection
            if (fromGameOver && ownsNFT) {
              characterSelection.style.display = 'block';
              
              // Show instruction message
              startInstruction.style.display = "block";
              startInstruction.style.opacity = "1";
              startInstruction.textContent = "Press the Start Game button to play again";
            }
            
            // Reset the data attribute
            leaderboardModal.dataset.fromGameOver = 'false';
          });
    }
    
    // Close modal when clicking outside the content
    window.addEventListener('click', (event) => {
      if (event.target === leaderboardModal) {
        leaderboardModal.style.display = 'none';
      }
    });
  }
  
  // Save score to leaderboard
  async function saveScoreToLeaderboard(score) {
    try {
      if (!walletConnected || !userAddress) {
        console.log("Cannot save score: No wallet connected");
        return;
      }
      
      // Check if we have access to Firebase
      if (!window.db) {
        console.error("Firebase DB not initialized");
        return;
      }
      
      // Add a new document to the leaderboard collection
      const docRef = await addDoc(collection(window.db, "leaderboard"), {
        walletAddress: userAddress,
        score: score,
        timestamp: new Date()
      });
      
      console.log("Score saved to leaderboard with ID: ", docRef.id);
      return true;
    } catch (error) {
      console.error("Error saving score to leaderboard: ", error);
      return false;
    }
  }
  
  // Format wallet address for display (0x1234...5678)
  function formatWalletAddress(address) {
    if (!address || address.length < 10) return address;
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  }
  
  async function fetchLeaderboardData() {
    try {
      console.log("Fetching leaderboard data...");
      
      if (!window.db) {
        console.error("Firebase DB not initialized");
        return [];
      }
      
      // First, get all scores
      const scoresQuery = window.query(
        window.collection(window.db, "leaderboard"),
        window.orderBy("score", "desc")
      );
      
      const querySnapshot = await window.getDocs(scoresQuery);
      
      // Create a map to track highest score per wallet
      const highestScores = new Map();
      
      // Process all scores and keep only the highest per wallet
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const walletAddress = data.walletAddress;
        const score = data.score;
        
        // If we don't have this wallet yet, or this score is higher than what we have
        if (!highestScores.has(walletAddress) || score > highestScores.get(walletAddress).score) {
          highestScores.set(walletAddress, {
            id: doc.id,
            ...data
          });
        }
      });
      
      // Convert map values to array and sort by score (highest first)
      const leaderboardData = Array.from(highestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Take top 10
      
      console.log("Processed leaderboard data:", leaderboardData.length, "unique players");
      return leaderboardData;
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
      return [];
    }
  }
  
  // Display leaderboard data
  function displayLeaderboard(leaderboardData) {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    // Clear previous entries
    leaderboardList.innerHTML = '';
    
    // Check if we have data
    if (!leaderboardData || leaderboardData.length === 0) {
      leaderboardList.innerHTML = '<div class="no-scores">No scores yet. Be the first to set a high score!</div>';
      return;
    }
    
    // Create HTML for each entry
    leaderboardData.forEach((entry, index) => {
      const rank = index + 1;
      const isCurrentPlayer = entry.walletAddress === userAddress;
      
      const entryElement = document.createElement('div');
      entryElement.className = `leaderboard-entry ${isCurrentPlayer ? 'your-row' : ''}`;
      
      entryElement.innerHTML = `
        <div class="rank rank-${rank}">#${rank}</div>
        <div class="wallet-address">${formatWalletAddress(entry.walletAddress)}</div>
        ${isCurrentPlayer ? '<div class="player-indicator">YOU</div>' : ''}
        <div class="score">${entry.score}</div>
      `;
      
      leaderboardList.appendChild(entryElement);
    });
  }
  
  // Show leaderboard
  async function showLeaderboard() {
    // Hide the game over modal first
  const gameOverModal = document.getElementById('gameOverModal');
  if (gameOverModal) {
    gameOverModal.style.display = 'none';
  }
    
    // Show loading state
    const leaderboardList = document.getElementById('leaderboardList');
    if (leaderboardList) {
      leaderboardList.innerHTML = '<div class="loading">Loading leaderboard data...</div>';
    }

    // Ensure the leaderboard modal has a higher z-index
    leaderboardModal.style.zIndex = "2000";
    
    // Display the modal
    leaderboardModal.style.display = 'block';
    
    // Fetch and display leaderboard data
    const leaderboardData = await fetchLeaderboardData();
    displayLeaderboard(leaderboardData);

    // Also update the closeLeaderboardModal event handler:
    closeLeaderboardModal.addEventListener('click', () => {
    leaderboardModal.style.display = 'none';
  });
}

// Initialize compact leaderboard button
function initializeCompactLeaderboardBtn() {
    const compactBtn = document.getElementById('compactLeaderboardBtn');
    const topScorePreview = document.getElementById('topScorePreview');
    
    if (compactBtn) {
      // Add click event to show leaderboard
      compactBtn.addEventListener('click', () => {
        showLeaderboard();
      });
      
      // Update top score on page load
      updateTopScorePreview();
      
      // Update top score periodically
      setInterval(updateTopScorePreview, 60000); // Update every minute
    }
  }
  
  // Update the top score preview
  async function updateTopScorePreview() {
    try {
      const topScorePreview = document.getElementById('topScorePreview');
      if (!topScorePreview) return;
      
      // Get top score
      const leaderboardData = await fetchLeaderboardData();
      
      if (leaderboardData && leaderboardData.length > 0) {
        const topScore = leaderboardData[0].score;
        topScorePreview.textContent = topScore;
      } else {
        topScorePreview.textContent = "--";
      }
    } catch (error) {
      console.error("Error updating top score preview:", error);
    }
  }

  function initializeCoin() {
    coin = document.getElementById("coin");
    console.log("Coin element initialized:", coin);
  }

  // Function to create or update the transaction counter
function setupTxCounter() {
    // Don't recreate if it already exists
    if (txCounterElement) return;
    
    // Create counter element
    txCounterElement = document.createElement('div');
    txCounterElement.className = 'tx-counter';
    txCounterElement.innerHTML = `
      <span class="chain-icon">⛓️</span>
      <span class="tx-counter-value">0</span>
    `;
    
    // Add to game
    const game = document.querySelector('.game');
    if (game) {
      game.appendChild(txCounterElement);
    }
  }
  
  // Function to update transaction counter
  function updateTxCounter() {
    txCounter++;
    
    if (txCounterElement) {
      const counterValue = txCounterElement.querySelector('.tx-counter-value');
      if (counterValue) {
        counterValue.textContent = txCounter;
        
        // Add pulse animation
        counterValue.classList.remove('tx-counter-pulse');
        void counterValue.offsetWidth; // Force reflow
        counterValue.classList.add('tx-counter-pulse');
      }
    }
  }
  
  // Function to create transaction animation
  function showTxAnimation() {
    const dino = document.getElementById('dino');
    if (!dino) return;
    
    // Get dino position
    const dinoRect = dino.getBoundingClientRect();
    const gameRect = document.querySelector('.game').getBoundingClientRect();
    
    // Create TX element
    const txElement = document.createElement('div');
    txElement.className = 'tx-animation';
    txElement.textContent = 'TX';
    
    // Position it relative to dino
    txElement.style.left = `${dinoRect.left - gameRect.left + (dinoRect.width / 2) - 20}px`;
    txElement.style.top = `${dinoRect.top - gameRect.top}px`;
    
    // Add to game
    document.querySelector('.game').appendChild(txElement);
    
    // Remove after animation completes
    setTimeout(() => {
      if (txElement.parentNode) {
        txElement.parentNode.removeChild(txElement);
      }
    }, 1600); // Slightly longer than animation duration
  }
  
  // Function to reset transaction counter
  function resetTxCounter() {
    txCounter = 0;
    if (txCounterElement) {
      const counterValue = txCounterElement.querySelector('.tx-counter-value');
      if (counterValue) {
        counterValue.textContent = '0';
      }
    }
  }

  // Set up X follow button
document.getElementById('followXBtn').addEventListener('click', function() {
  window.open('https://x.com/PurgedNads', '_blank');
});