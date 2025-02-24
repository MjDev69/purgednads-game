// Web3 Integration Constants

const NFT_CONTRACT_ADDRESS = "0xBA315E8Ca2C499b337a9F66c12e7a501A5ab3B61";
const NFT_CONTRACT_ABI = [
    "function mintScore(uint256 score) public payable returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function getScore(uint256 tokenId) view returns (uint256)",
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
const characterOptions = document.querySelectorAll('.character-option');
const characterSelection = document.querySelector('.character-selection');

// Sound Effects
const jumpSound = new Audio('sound/pop.mp3');
const collisionSound = new Audio('sound/wow.mp3');
const backgroundMusic = new Audio('sound/young.mp3');

// Game Configuration
let selectedCharacter = null;
const characterImages = {
    'KingLoui': 'img/KingLoui.png',
    'Gvan': 'img/gvan.png',
    'Mike': 'img/mike.png',
    'Molandak': 'img/molandak.png',
    'Mouch': 'img/mouch.png',
    'Chog': 'img/chog.png',
    'Moyaki': 'img/moyaki.png'
};

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
let gameSpeed = 1.3;
let obstaclePosition = 580;

// Web3 Functions
// Function to ensure ethers is loaded
function waitForEthers() {
    return new Promise((resolve, reject) => {
        if (typeof window.ethers !== 'undefined') {
            resolve(window.ethers);
        } else {
            // Check every 100ms for up to 5 seconds
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (typeof window.ethers !== 'undefined') {
                    clearInterval(interval);
                    resolve(window.ethers);
                } else if (attempts >= 50) { // 5 seconds (50 * 100ms)
                    clearInterval(interval);
                    reject(new Error('Failed to load ethers.js'));
                }
            }, 100);
        }
    });
}

// Improved Web3 initialization
async function initializeWeb3() {
    try {
        // Basic ethers check
        if (typeof window.ethers === 'undefined') {
            console.error('Ethers library not found. Attempting to use global ethers object.');
            if (typeof ethers === 'undefined') {
                throw new Error('Ethers library is not loaded. Please refresh the page.');
            }
        }

        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
        }

        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });

        if (!accounts || accounts.length === 0) {
            throw new Error('Please connect your MetaMask account');
        }

        // Create Web3 provider
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== parseInt(MONAD_CHAIN_ID)) {
            await switchToMonadNetwork();
        }

        return { provider, signer };
    } catch (error) {
        console.error('Web3 initialization error:', error);
        throw error;
    }
}

// New function for private key transactions
async function getPrivateKeySigner() {
    try {
        const provider = new ethers.providers.JsonRpcProvider(MONAD_RPC_URL);
        const privateKey = 'PRIVATE_KEY'; // Replace with your private key

        const signer = new ethers.Wallet(privateKey, provider);
        return { signer, provider };
    } catch (error) {
        console.error('Private key signer initialization error:', error);
        throw error;
    }
}

// Improved network switching function
async function switchToMonadNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${parseInt(MONAD_CHAIN_ID).toString(16)}` }],
        });
    } catch (error) {
        if (error.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: `0x${parseInt(MONAD_CHAIN_ID).toString(16)}`,
                        chainName: 'Monad Devnet',
                        nativeCurrency: {
                            name: 'DMON',
                            symbol: 'DMON',
                            decimals: 18,
                        },
                        rpcUrls: [MONAD_RPC_URL],
                        blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
                    }],
                });
            } catch (addError) {
                throw new Error(`Failed to add Monad network: ${addError.message}`);
            }
        } else {
            throw new Error(`Failed to switch to Monad network: ${error.message}`);
        }
    }
}

// Improved mint function with better error handling
async function mintScore(score) {
    const mintButton = document.getElementById('mintScoreButton');
    if (mintButton) {
        mintButton.disabled = true;
        mintButton.textContent = 'Minting...';
    }

    try {
        const web3Data = await initializeWeb3();
        
        if (mintButton) {
            mintButton.textContent = 'Minting...';
        }

        const contract = new ethers.Contract(
            NFT_CONTRACT_ADDRESS,
            NFT_CONTRACT_ABI,
            web3Data.signer
        );
        
        const tx = await contract.mintScore(score);
        await tx.wait();

        // Show the success modal
        showMintSuccessModal(score);

        console.log(`NFT minted! Transaction: ${tx.hash}`);
        return tx;

    } catch (error) {
        console.error('Minting error:', error);
        alert(`Failed to mint score: ${error.message}`);
    } finally {
        if (mintButton) {
            mintButton.disabled = false;
            mintButton.textContent = 'Mint Your Score';
        }
    }
}

// Separate function to handle showing the success modal
function showMintSuccessModal(score) {
    const mintSuccessModal = document.getElementById('mintSuccessModal');
    const scoreSpan = mintSuccessModal.querySelector('.minted-score');
    
    // Update score
    if (scoreSpan) {
        scoreSpan.textContent = score;
    }
    
    // Show the modal
    mintSuccessModal.style.display = 'block';

    // Add close handler for the close button
    const closeButton = mintSuccessModal.querySelector('.close-button');
    closeButton.onclick = () => {
        mintSuccessModal.style.display = 'none';
    };

    // Create X (Twitter) share button content with SVG
    const shareButton = mintSuccessModal.querySelector('.share-twitter-button');
    shareButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
        Share on X
    `;

    // Add Twitter share handler with updated text
    shareButton.onclick = () => {
        const tweetText = `I've just Minted my @PurgedNads NFT on Devnet, @JohnWRichKid purged me with a score of ${score}! 🎮✨ Play now and mint yours at https://purgednads.vercel.app`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(tweetUrl, '_blank');
    };
    
    // Close on click outside
    mintSuccessModal.onclick = (event) => {
        if (event.target === mintSuccessModal) {
            mintSuccessModal.style.display = 'none';
        }
    };
    
    // Add escape key handler
    const escapeListener = (event) => {
        if (event.key === 'Escape') {
            mintSuccessModal.style.display = 'none';
            document.removeEventListener('keydown', escapeListener);
        }
    };
    document.addEventListener('keydown', escapeListener);
}

// Also update the CSS to ensure the modal appears on top
const styles = `
.modal {
    display: none;
    position: fixed;
    z-index: 99999; /* Very high z-index */
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
}

.mint-success {
    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
    color: white;
    border: 2px solid #4a90e2;
    animation: modalPopIn 0.5s ease-out;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    min-width: 300px;
    box-shadow: 0 0 20px rgba(74, 144, 226, 0.3);
}
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Add event listener for ESC key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        const mintSuccessModal = document.getElementById('mintSuccessModal');
        if (mintSuccessModal.style.display === "block") {
            mintSuccessModal.style.display = "none";
        }
    }
});

// Character Selection
function setupCharacterSelection() {
    characterOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove previous selection
            characterOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Select current character
            this.classList.add('selected');
            selectedCharacter = this.dataset.character;
            
            // Update dino image
            dino.style.backgroundImage = `url(${characterImages[selectedCharacter]})`;
        });
    });
}

// Initialize High Score
function initializeHighScore() {
    highScore = localStorage.getItem('dinoGameHighScore') || 0;
    highScoreDisplay.textContent = highScore;
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
    if (!dino.classList.contains("jump")) {
        // Play jump sound
        jumpSound.currentTime = 0;
        jumpSound.play();
        dino.classList.add("jump");

        // Send transaction without waiting - will use private key automatically
        sendEmptyTransaction();

        setTimeout(function () {
            dino.classList.remove("jump");
        }, 300);
    }
}

// Game Start Mechanism
function startGame() {
    // Check if character is selected
    if (!selectedCharacter) {
        alert('Please select a character before starting the game!');
        return;
    }

    // Prevent multiple game starts
    if (gameStarted) return;

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
    
    // Hide start instruction
    startInstruction.style.opacity = "0";
    startInstruction.style.display = "none";

    // Setup obstacle movement
    setupObstacleMovement();

    // Start scoring
    scoreInterval = setInterval(updateScore, 100);

    // Start collision detection
    setupCollisionDetection();
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

    // Reset obstacle
    resetObstaclePosition();
    cactus.style.animation = "none";

    // Show character selection
    characterSelection.style.display = 'block';

    // Show start instruction
    startInstruction.style.display = "block";
    startInstruction.style.opacity = "1";

    // Remove mint button when game is reset
    const mintButton = document.getElementById('mintScoreButton');
    if (mintButton) {
        mintButton.remove();
    }
}

// Event Listeners
document.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
        event.preventDefault();

        // Hide game over modal if it's displayed
        if (gameOverModal.style.display === "block") {
            gameOverModal.style.display = "none";
        }

        if (!gameStarted) {
            startGame();
        }
        jump();
    }
});

// Restart button with strict handling
restartButton.addEventListener("click", function(event) {
    event.stopPropagation();
    
    // Hide modal
    gameOverModal.style.display = "none";
    
    // Complete reset
    resetGame();
});

// Initialize on page load
initializeHighScore();
setupCharacterSelection();
resetGame();

// Reset Obstacle Position
function resetObstaclePosition() {
    obstaclePosition = 580;
    cactus.style.left = `${obstaclePosition}px`;
}

// Score Management
function resetScore() {
    score = 0;
    scoreDisplay.textContent = score;
}

function updateScore() {
    if (!isGameOver && gameStarted) {
        score++;
        scoreDisplay.textContent = score;
    }
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
    // Clear any existing animations
    cactus.style.animation = "none";
    
    // Trigger reflow to reset animation
    void cactus.offsetWidth;

    // Set up new animation
    cactus.style.animation = `block ${gameSpeed}s infinite linear`;
}

// Collision Detection
function setupCollisionDetection() {
    // Clear any existing intervals
    if (collisionCheckInterval) {
        clearInterval(collisionCheckInterval);
    }

    // New collision detection
    collisionCheckInterval = setInterval(() => {
        let dinoTop = parseInt(window.getComputedStyle(dino).getPropertyValue("top"));
        let cactusLeft = parseInt(
            window.getComputedStyle(cactus).getPropertyValue("left")
        );

        // Precise collision check
        if (cactusLeft < 50 && cactusLeft > 0 && dinoTop >= 140) {
            gameOverSequence();
        }
    }, 10);
}

// Game Over Sequence
function gameOverSequence() {
    // Prevent multiple game over calls
    if (isGameOver) return;

    // Play collision sound
    collisionSound.play();

    // Stop background music
    backgroundMusic.pause();

    isGameOver = true;
    gameStarted = false;

    // Stop intervals
    clearInterval(scoreInterval);
    clearInterval(collisionCheckInterval);

    // Stop obstacle movement
    cactus.style.animation = "none";

    // Update high score
    updateHighScore();

    // Show game over modal
    finalScoreDisplay.textContent = score;
    gameOverModal.style.display = "block";

    // Restore start instruction and character selection
    characterSelection.style.display = 'block';
    startInstruction.style.display = "block";
    startInstruction.style.opacity = "1";
    startInstruction.textContent = "Press SpaceBar to Start";

        // Check if mint button already exists
        let existingMintButton = document.getElementById('mintScoreButton');
    
        // Only create new mint button if it doesn't exist
        if (!existingMintButton) {
            const mintButton = document.createElement('button');
            mintButton.id = 'mintScoreButton';
            mintButton.textContent = 'Mint Your Score';
            mintButton.style.marginRight = '10px';
            
            mintButton.onclick = async () => {
                try {
                    await mintScore(score);
                } catch (error) {
                    console.error('Failed to mint score:', error);
                }
            };
    
            // Insert mint button before restart button
            restartButton.parentNode.insertBefore(mintButton, restartButton);
        } else {
            // Update existing mint button's onclick handler with new score
            existingMintButton.onclick = async () => {
                try {
                    await mintScore(score);
                } catch (error) {
                    console.error('Failed to mint score:', error);
                }
            };
        }
    }    

// Update existing scripts.js

// Add touch support for mobile
document.addEventListener("touchstart", function (event) {
    const gameArea = document.querySelector('.game');
    const characterSelection = document.querySelector('.character-selection');

      // Modify start instruction for mobile
      const startInstruction = document.getElementById("start-instruction");
      if (startInstruction && window.innerWidth <= 600) {
          startInstruction.textContent = "Touch to Start Game";
      }

    // Check if touch is within game area
    if (gameArea.contains(event.target)) {
        event.preventDefault();
        if (!gameStarted) {
            startGame();
        }
        jump();
    }

    // Allow normal scrolling in character selection
    if (!characterSelection.contains(event.target)) {
        event.preventDefault();
    }
});

// Prevent default touch scrolling in game area
const gameElement = document.querySelector('.game');
gameElement.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// Remove touch prevention that blocks scrolling
document.addEventListener("touchstart", function (event) {
    // Only prevent default and handle game interactions if touch is in game area
    const gameArea = document.querySelector('.game');
    if (gameArea.contains(event.target)) {
        event.preventDefault();

        if (gameOverModal.style.display === "block") {
            gameOverModal.style.display = "none";
        }

        if (!gameStarted) {
            startGame();
        }
        jump();
    }
});
