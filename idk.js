// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    orderBy,
    where, 
    deleteDoc,
    doc, 
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWVUPnJAO6B9n-drKV3EEu8pVd8K4fgWE",
  authDomain: "medusa-script.firebaseapp.com",
  projectId: "medusa-script",
  storageBucket: "medusa-script.firebasestorage.app",
  messagingSenderId: "745425430581",
  appId: "1:745425430581:web:60ccea819d6e92953fe97c",
  measurementId: "G-CX2Z4BFXVD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const navLinks = document.getElementById('navLinks');
const toggleBtn = document.getElementById('toggleBtn');
const slider = document.getElementById('slider');
const postsContainer = document.getElementById('postsContainer');
const gameManagement = document.getElementById('gameManagement');
const userProfile = document.getElementById('userProfile');
const userMenu = document.getElementById('userMenu');
const userName = document.getElementById('userName');
const authButtons = document.getElementById('authButtons');
const loginNavBtn = document.getElementById('loginNavBtn');
const registerNavBtn = document.getElementById('registerNavBtn');
const uploadBtn = document.getElementById('uploadBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleSignIn = document.getElementById('googleSignIn');
const switchToRegister = document.getElementById('switchToRegister');
const forgotPassword = document.getElementById('forgotPassword');
const confirmPassword = document.getElementById('confirmPassword');
const logoutLink = document.getElementById('logoutLink');
const gameListContainer = document.getElementById('gameListContainer');
const addGameForm = document.getElementById('addGameForm');

// Content moderation settings
const CONTENT_MODERATION = {
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    EXPLICIT_CONTENT_KEYWORDS: ['sex', 'porn', 'adult', 'xxx', 'nsfw', 'explicit']
};

// Global variables
let currentUser = null;
let currentUserRole = 'user';
let games = [];
let currentSlide = 0;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        handleUserLoggedIn(user);
        checkUserRole(user.uid);
        loadContent();
    } else {
        currentUser = null;
        handleUserLoggedOut();
    }
});

// Handle user logged in
function handleUserLoggedIn(user) {
    authButtons.style.display = 'none';
    userProfile.style.display = 'flex';
    userName.textContent = user.email.split('@')[0];
    uploadBtn.style.display = 'block';
    
    // Show notification
    showNotification(`Welcome back, ${user.email.split('@')[0]}!`);
}

// Handle user logged out
function handleUserLoggedOut() {
    authButtons.style.display = 'flex';
    userProfile.style.display = 'none';
    uploadBtn.style.display = 'none';
    gameManagement.style.display = 'none';
    currentUserRole = 'user';
}

// Check user role
async function checkUserRole(uid) {
    try {
        const userRoleQuery = query(collection(db, "users"), where("uid", "==", uid));
        const querySnapshot = await getDocs(userRoleQuery);
        
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            currentUserRole = userData.role || 'user';
            
            // Show game management for owners
            if (currentUserRole === 'owner') {
                gameManagement.style.display = 'block';
                loadGames();
            }
        } else {
            // Create new user document if doesn't exist
            await addDoc(collection(db, "users"), {
                uid: uid,
                email: currentUser.email,
                role: 'user',
                createdAt: new Date()
            });
            currentUserRole = 'user';
        }
    } catch (error) {
        console.error("Error checking user role:", error);
    }
}

// Register user
async function registerUser(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendEmailVerification(user);
        
        // Close modal
        closeModals();
        
        // Show notification
        showNotification("Verification email sent! Please check your inbox.");
        
        return user;
    } catch (error) {
        throw error;
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Close modal
        closeModals();
        
        return user;
    } catch (error) {
        throw error;
    }
}

// Google sign in
async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Close modal
        closeModals();
        
        return user;
    } catch (error) {
        throw error;
    }
}

// Logout user
async function logoutUser() {
    try {
        await signOut(auth);
        // Show notification
        showNotification("Logged out successfully!");
    } catch (error) {
        console.error("Error logging out:", error);
    }
}

// Load content from Firebase
async function loadContent() {
    try {
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(postsQuery);
        
        // Clear container first
        postsContainer.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const postData = doc.data();
            createPostCard(postData, doc.id);
        });
    } catch (error) {
        console.error("Error loading content:", error);
    }
}

// Create post card
function createPostCard(post, id) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.innerHTML = `
        <img src="${post.imageUrl}" alt="${post.title}" class="post-image">
        <span class="post-label">${post.paid ? 'Paid' : 'Free'}</span>
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <div class="post-stats">
                <span><i class="fas fa-eye"></i> ${Math.floor(Math.random() * 20000)}+</span>
                <span><i class="fas fa-heart"></i> ${Math.floor(Math.random() * 5000)}+</span>
            </div>
            <p class="post-game">Game: ${post.gameName}</p>
            <p class="post-status">Status: ${post.status}</p>
            <button class="post-button" data-id="${id}" data-script="${encodeURIComponent(post.script)}" data-gameid="${post.gameId}">Get Script</button>
        </div>
    `;
    
    // Add click event to button
    const button = postCard.querySelector('.post-button');
    button.addEventListener('click', function() {
        const scriptData = decodeURIComponent(this.getAttribute('data-script'));
        const gameId = this.getAttribute('data-gameid');
        
        // Show modal
        document.getElementById('gameModal').style.display = 'flex';
        
        // Set up confirmation button
        document.getElementById('confirmGame').onclick = function() {
            // Copy script to clipboard
            navigator.clipboard.writeText(scriptData).then(function() {
                // Redirect to Roblox game
                window.open(`https://www.roblox.com/games/${gameId}`, '_blank');
                document.getElementById('gameModal').style.display = 'none';
            });
        };
    });
    
    postsContainer.appendChild(postCard);
}

// Upload content
async function uploadContent(formData) {
    try {
        // Validate content first
        if (!validateContent(formData)) {
            return false;
        }
        
        // Upload image first
        const imageRef = ref(storage, `images/${Date.now()}_${formData.image.name}`);
        const uploadResult = await uploadBytes(imageRef, formData.image);
        const imageUrl = await getDownloadURL(uploadResult.ref);
        
        // Add post to Firestore
        await addDoc(collection(db, "posts"), {
            title: formData.title,
            script: formData.script,
            gameId: formData.gameId,
            gameName: formData.gameName,
            paid: formData.paid === 'paid',
            status: formData.status,
            imageUrl: imageUrl,
            createdAt: new Date(),
            authorId: currentUser.uid,
            authorEmail: currentUser.email
        });
        
        // Show notification
        showNotification("Content uploaded successfully!");
        
        // Close modal and reload content
        closeModals();
        loadContent();
        
        return true;
    } catch (error) {
        console.error("Error uploading content:", error);
        showNotification("Error uploading content. Please try again.");
        return false;
    }
}

// Validate content
function validateContent(formData) {
    // Check file type
    if (!CONTENT_MODERATION.ALLOWED_IMAGE_TYPES.includes(formData.image.type)) {
        showNotification("Only JPG, JPEG, and PNG images are allowed.");
        return false;
    }
    
    // Check file size
    if (formData.image.size > CONTENT_MODERATION.MAX_FILE_SIZE) {
        showNotification("Image size should be less than 5MB.");
        return false;
    }
    
    // Check for explicit content
    const lowerCaseTitle = formData.title.toLowerCase();
    const hasExplicitContent = CONTENT_MODERATION.EXPLICIT_CONTENT_KEYWORDS.some(keyword => 
        lowerCaseTitle.includes(keyword)
    );
    
    if (hasExplicitContent) {
        showNotification("Content with explicit material is not allowed.");
        return false;
    }
    
    return true;
}

// Load games for selection
async function loadGames() {
    try {
        const gamesQuery = query(collection(db, "games"), orderBy("name"));
        const querySnapshot = await getDocs(gamesQuery);
        
        games = [];
        gameListContainer.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const gameData = doc.data();
            games.push({
                id: doc.id,
                ...gameData
            });
            
            // Create game item in list
            const gameItem = document.createElement('div');
            gameItem.className = 'game-item';
            gameItem.innerHTML = `
                <span>${gameData.name} (ID: ${gameData.gameId})</span>
                <div class="game-actions">
                    <button data-id="${doc.id}" class="edit-game"><i class="fas fa-edit"></i></button>
                    <button data-id="${doc.id}" class="delete-game"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            gameListContainer.appendChild(gameItem);
        });
        
        // Add event listeners to buttons
        const editButtons = document.querySelectorAll('.edit-game');
        const deleteButtons = document.querySelectorAll('.delete-game');
        
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const gameId = this.getAttribute('data-id');
                editGame(gameId);
            });
        });
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const gameId = this.getAttribute('data-id');
                deleteGame(gameId);
            });
        });
    } catch (error) {
        console.error("Error loading games:", error);
    }
}

// Add new game
async function addGame(name, gameId) {
    try {
        await addDoc(collection(db, "games"), {
            name: name,
            gameId: gameId,
            createdAt: new Date()
        });
        
        // Show notification
        showNotification("Game added successfully!");
        
        // Reload games
        loadGames();
        
        // Reset form
        document.getElementById('addGameForm').reset();
        
        // Switch to game list tab
        document.querySelector('[data-tab="gameList"]').click();
    } catch (error) {
        console.error("Error adding game:", error);
    }
}

// Edit game
function editGame(id) {
    const game = games.find(g => g.id === id);
    if (!game) return;
    
    // Fill form
    document.getElementById('gameName').value = game.name;
    document.getElementById('gameId').value = game.gameId;
    
    // Change button text
    const submitBtn = document.getElementById('addGameForm').querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Game';
    
    // Set editing flag
    document.getElementById('addGameForm').setAttribute('data-editing', id);
    
    // Switch to add game tab
    document.querySelector('[data-tab="addGame"]').click();
}

// Update game
async function updateGame(id, name, gameId) {
    try {
        const gameRef = doc(db, "games", id);
        await updateDoc(gameRef, {
            name: name,
            gameId: gameId
        });
        
        // Show notification
        showNotification("Game updated successfully!");
        
        // Reload games
        loadGames();
        
        // Reset form
        document.getElementById('addGameForm').reset();
        const submitBtn = document.getElementById('addGameForm').querySelector('button[type="submit"]');
        submitBtn.textContent = 'Add Game';
        document.getElementById('addGameForm').removeAttribute('data-editing');
        
        // Switch to game list tab
        document.querySelector('[data-tab="gameList"]').click();
    } catch (error) {
        console.error("Error updating game:", error);
    }
}

// Delete game
async function deleteGame(id) {
    if (confirm("Are you sure you want to delete this game?")) {
        try {
            await deleteDoc(doc(db, "games", id));
            
            // Show notification
            showNotification("Game deleted successfully!");
            
            // Reload games
            loadGames();
        } catch (error) {
            console.error("Error deleting game:", error);
        }
    }
}

// Upload modal
function createUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'modal upload-modal';
    modal.id = 'uploadModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal-title">Upload Script</h2>
            <form id="uploadForm">
                <div class="form-group">
                    <label for="scriptTitle">Script Name</label>
                    <input type="text" id="scriptTitle" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="scriptContent">Script Code (loadstring)</label>
                    <textarea id="scriptContent" class="form-input" rows="5" required></textarea>
                </div>
                <div class="form-group">
                    <label for="gameSelect">Game</label>
                    <select id="gameSelect" class="form-input" required>
                        <option value="">-- Select Game --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Script Type</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="paidStatus" value="free" checked> Free
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="paidStatus" value="paid"> Paid
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Script Status</label>
                    <div class="radio-group">
                        <label class="radio-label">
                            <input type="radio" name="keyStatus" value="No Key" checked> No Key
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="keyStatus" value="Key Required"> Key Required
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Script Image</label>
                    <div class="file-input-container" id="fileInputContainer">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Click to upload image (JPG, JPEG, PNG max 5MB)</p>
                    </div>
                    <input type="file" id="scriptImage" class="file-input" accept="image/jpeg, image/jpg, image/png" required>
                </div>
                <div class="modal-buttons">
                    <button type="submit" class="modal-button modal-confirm">Upload Script</button>
                    <button type="button" class="modal-button modal-cancel" id="cancelUpload">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const fileInputContainer = modal.querySelector('#fileInputContainer');
    const fileInput = modal.querySelector('#scriptImage');
    const uploadForm = modal.querySelector('#uploadForm');
    const cancelUpload = modal.querySelector('#cancelUpload');
    const gameSelect = modal.querySelector('#gameSelect');
    
    // File input trigger
    fileInputContainer.addEventListener('click', () => {
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileInputContainer.innerHTML = `
                <i class="fas fa-file-image"></i>
                <p>${fileName}</p>
            `;
        }
    });
    
    // Cancel upload
    cancelUpload.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Form submit
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            showNotification("Please login to upload scripts.");
            return;
        }
        
        const title = document.getElementById('scriptTitle').value;
        const script = document.getElementById('scriptContent').value;
        const gameSelectElement = document.getElementById('gameSelect');
        const selectedGame = gameSelectElement.options[gameSelectElement.selectedIndex];
        const gameId = selectedGame.getAttribute('data-gameid');
        const gameName = selectedGame.textContent;
        const paid = document.querySelector('input[name="paidStatus"]:checked').value;
        const status = document.querySelector('input[name="keyStatus"]:checked').value;
        const image = document.getElementById('scriptImage').files[0];
        
        const formData = {
            title,
            script,
            gameId,
            gameName,
            paid,
            status,
            image
        };
        
        await uploadContent(formData);
    });
    
    return modal;
}

// Notification function
function showNotification(message) {
    // Create notification if it doesn't exist
    let notification = document.querySelector('.notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Close all modals
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Initialize tabs
function initTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(tabLink => {
        tabLink.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all links and panels
            document.querySelectorAll('.tab-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Add active class to clicked link and corresponding panel
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Toggle navbar on mobile
toggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = toggleBtn.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.className = 'fas fa-chevron-up';
    } else {
        icon.className = 'fas fa-chevron-down';
    }
});

// Slider functionality
function moveSlider() {
    currentSlide = (currentSlide + 1) % 5; // Assuming 5 slides
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;
}

// Start slider movement
setInterval(moveSlider, 5000);

// User profile dropdown
userProfile.addEventListener('click', function(e) {
    e.stopPropagation();
    userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
});

// Click outside to close user menu
document.addEventListener('click', function() {
    if (userMenu) {
        userMenu.style.display = 'none';
    }
});

// Login button
loginNavBtn.addEventListener('click', function() {
    loginModal.style.display = 'flex';
});

// Register button
registerNavBtn.addEventListener('click', function() {
    registerModal.style.display = 'flex';
});

// Switch to register
switchToRegister.addEventListener('click', function(e) {
    e.preventDefault();
    loginModal.style.display = 'none';
    registerModal.style.display = 'flex';
});

// Forgot password
forgotPassword.addEventListener('click', function(e) {
    e.preventDefault();
    // Show reset password dialog or functionality
    alert("Reset password functionality will be implemented");
});

// Login form submit
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await loginUser(email, password);
    } catch (error) {
        showNotification(`Login failed: ${error.message}`);
    }
});

// Register form submit
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPasswordValue = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPasswordValue) {
        showNotification("Passwords don't match!");
        return;
    }
    
    try {
        await registerUser(email, password);
    } catch (error) {
        showNotification(`Registration failed: ${error.message}`);
    }
});

// Google sign in
googleSignIn.addEventListener('click', async function() {
    try {
        await signInWithGoogle();
    } catch (error) {
        showNotification(`Google sign in failed: ${error.message}`);
    }
});

// Logout
logoutLink.addEventListener('click', async function(e) {
    e.preventDefault();
    await logoutUser();
});

// Create upload modal
const uploadModal = createUploadModal();

// Upload button
uploadBtn.addEventListener('click', async function() {
    if (!currentUser) {
        showNotification("Please login to upload scripts.");
        loginModal.style.display = 'flex';
        return;
    }
    
    // Load games for select
    const gameSelect = document.getElementById('gameSelect');
    gameSelect.innerHTML = '<option value="">-- Select Game --</option>';
    
    try {
        const gamesQuery = query(collection(db, "games"), orderBy("name"));
        const querySnapshot = await getDocs(gamesQuery);
        
        querySnapshot.forEach((doc) => {
            const gameData = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.setAttribute('data-gameid', gameData.gameId);
            option.textContent = gameData.name;
            gameSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading games:", error);
    }
    
    uploadModal.style.display = 'flex';
});

// Add game form submit
addGameForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('gameName').value;
    const gameId = document.getElementById('gameId').value;
    
    const editingId = this.getAttribute('data-editing');
    
    if (editingId) {
        await updateGame(editingId, name, gameId);
    } else {
        await addGame(name, gameId);
    }
});

// Cancel modals buttons
document.getElementById('cancelLogin').addEventListener('click', function() {
    loginModal.style.display = 'none';
});

document.getElementById('cancelModal').addEventListener('click', function() {
    document.getElementById('gameModal').style.display = 'none';
});

document.getElementById('cancelDownload').addEventListener('click', function() {
    document.getElementById('downloadModal').style.display = 'none';
});

// Initialize app
function init() {
    initTabs();
    
    // Hide game management by default
    gameManagement.style.display = 'none';
    
    // Hide upload button by default
    uploadBtn.style.display = 'none';
}

// Run initialization
init();
