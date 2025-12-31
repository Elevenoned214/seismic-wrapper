// Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('wrappedForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingSubtext = document.getElementById('loadingSubtext');
    const errorModal = document.getElementById('errorModal');
    const errorTitle = document.getElementById('errorTitle');
    const errorMessage = document.getElementById('errorMessage');
    const errorCloseBtn = document.getElementById('errorCloseBtn');

    // Extract username from X profile link
    function extractUsername(url) {
        // https://x.com/username or https://twitter.com/username
        const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/);
        return match ? match[1] : null;
    }

    // Show error modal
    function showError(title, message) {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorModal.classList.add('active');
    }

    // Close error modal
    errorCloseBtn.addEventListener('click', () => {
        errorModal.classList.remove('active');
    });

    // Close modal on outside click
    errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) {
            errorModal.classList.remove('active');
        }
    });

    // Magnitude Selection
    const magnitudeOptions = document.querySelectorAll('.magnitude-option');
    magnitudeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
    });

    // Auto-format profile link
    const profileLinkInput = document.getElementById('xProfileLink');
    profileLinkInput.addEventListener('blur', () => {
        let value = profileLinkInput.value.trim();
        // Auto-add https if missing
        if (value && !value.startsWith('http')) {
            profileLinkInput.value = 'https://' + value;
        }
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('🚀 Form submitted');
        
        // Get form data
        const profileLink = document.getElementById('xProfileLink').value;
        const username = extractUsername(profileLink);
        const discordChats = parseInt(document.getElementById('discordChats').value);
        const magnitudeInput = document.querySelector('input[name="magnitude"]:checked');
        
        console.log('Form data:', { profileLink, username, discordChats, magnitude: magnitudeInput?.value });

        // Validate
        if (!username) {
            showError(
                'Link Tidak Valid',
                'Masukkan link profil X yang valid!\n\nContoh: https://x.com/yourusername'
            );
            return;
        }
        
        if (!discordChats || discordChats < 0) {
            showError(
                'Input Tidak Valid',
                'Masukkan jumlah Discord messages yang valid!'
            );
            return;
        }
        
        if (!magnitudeInput) {
            showError(
                'Magnitude Belum Dipilih',
                'Pilih magnitude level Anda!'
            );
            return;
        }

        const magnitude = magnitudeInput.value;

        // Show loading
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        loadingOverlay.classList.add('active');
        loadingSubtext.textContent = 'Mengecek profil Anda...';

        try {
            // Call API
            console.log('📡 Calling API for username:', username);
            loadingSubtext.textContent = 'Mencari tweet terbaik Anda...';
            
            const response = await fetch(`/api/twitter?username=${encodeURIComponent(username)}`);
            const data = await response.json();
            
            console.log('API Response:', data);

            // Check error
            if (data.error) {
                console.log('❌ API returned error');
                showError(
                    data.message || 'Terjadi Kesalahan',
                    data.suggestion || 'Coba lagi nanti'
                );
                
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                loadingOverlay.classList.remove('active');
                return;
            }

            // Success!
            console.log('✅ Data berhasil diambil');
            loadingSubtext.textContent = 'Membuat wrapped Anda...';
            
            // Save to localStorage
            const wrappedData = {
                username: username,
                pfpUrl: data.pfpUrl,
                discordChats: discordChats,
                magnitude: magnitude
            };
            
            const twitterData = {
                totalTweets: data.totalTweets,
                topTweets: data.topTweets,
                bestTweet: data.bestTweet
            };
            
            localStorage.setItem('wrappedData', JSON.stringify(wrappedData));
            localStorage.setItem('twitterData', JSON.stringify(twitterData));
            
            console.log('💾 Data saved to localStorage');
            
            // Redirect to result page
            await sleep(800);
            console.log('🎬 Redirecting to result page...');
            window.location.href = 'result.html';

        } catch (error) {
            console.error('❌ Error:', error);
            showError(
                'Terjadi Kesalahan',
                'Gagal terhubung ke server. Pastikan koneksi internet Anda stabil dan coba lagi!'
            );
            
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            loadingOverlay.classList.remove('active');
        }
    });

    // Helper function
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});
