// Animation Controller - Simplified 3 Scenes
class WrappedAnimation {
    constructor() {
        this.scenes = ['scene1', 'scene2', 'scene3']; // Only 3 scenes now!
        this.currentSceneIndex = 0;
        this.sceneDuration = 3000;
        this.animationStarted = false;
        
        // Get data from localStorage
        this.wrappedData = JSON.parse(localStorage.getItem('wrappedData'));
        this.twitterData = JSON.parse(localStorage.getItem('twitterData'));
        
        if (!this.wrappedData || !this.twitterData) {
            console.error('No data found! Redirecting...');
            window.location.href = 'index.html';
            return;
        }

        console.log('📊 Loaded data:', {
            wrapped: this.wrappedData,
            twitter: this.twitterData
        });

        this.init();
    }

    init() {
        // Initialize canvases
        this.initGridCanvas();
        this.initParticleCanvas();
        
        // Set user data
        this.setUserData();
        
        // Start animation after short delay
        setTimeout(() => {
            this.startAnimation();
        }, 500);
    }

    initGridCanvas() {
        const canvas = document.getElementById('gridCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // 3D Grid Animation
        this.drawGrid = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const gridSize = 50;
            const perspective = 600;
            const centerY = canvas.height * 0.7;
            
            // Draw perspective grid
            ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
            ctx.lineWidth = 1;
            
            // Horizontal lines
            for (let i = 0; i < 20; i++) {
                const y = centerY + (i * gridSize);
                const scale = perspective / (perspective + (i * 50));
                const width = canvas.width * scale;
                const x = (canvas.width - width) / 2;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + width, y);
                ctx.stroke();
            }
            
            // Vertical lines
            for (let i = -10; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2 + (i * gridSize), centerY);
                ctx.lineTo(canvas.width / 2 + (i * gridSize * 3), canvas.height);
                ctx.stroke();
            }
            
            // Gradient fade to black at top
            const gradient = ctx.createLinearGradient(0, 0, 0, centerY);
            gradient.addColorStop(0, 'rgba(10, 10, 15, 1)');
            gradient.addColorStop(1, 'rgba(10, 10, 15, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, centerY);
        };

        // Animate grid
        this.animateGrid = () => {
            this.drawGrid();
            requestAnimationFrame(this.animateGrid);
        };
        
        this.animateGrid();

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    initParticleCanvas() {
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Particle system
        const particles = [];
        const particleCount = 50;

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.life = Math.random() * 100;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life++;

                if (this.x < 0 || this.x > canvas.width || 
                    this.y < 0 || this.y > canvas.height || 
                    this.life > 200) {
                    this.reset();
                }
            }

            draw() {
                ctx.fillStyle = `rgba(0, 217, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        // Animate particles
        this.animateParticles = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            
            requestAnimationFrame(this.animateParticles);
        };
        
        this.animateParticles();

        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    setUserData() {
        console.log('📝 Setting user data...');
        
        // Set footer user info
        const userPfp = document.getElementById('userPfp');
        const userUsername = document.getElementById('userUsername');
        
        userPfp.src = this.wrappedData.pfpUrl;
        userPfp.onerror = () => {
            console.log('⚠️ PFP failed to load, using fallback');
            userPfp.src = `https://ui-avatars.com/api/?name=${this.wrappedData.username}&background=00d9ff&color=fff&size=200`;
        };
        
        userUsername.textContent = `@${this.wrappedData.username}`;

        // Set scene 1 data
        document.getElementById('discordCount').setAttribute('data-target', this.wrappedData.discordChats);
        document.getElementById('tweetCount').setAttribute('data-target', this.twitterData.totalTweets);

        // Set scene 2 data (Best tweet) - NO MORE TOP 10!
        this.populateBestTweet();

        // Set scene 3 data (Magnitude)
        const magnitudeBadge = document.getElementById('magnitudeBadge');
        const badgeLevel = document.getElementById('badgeLevel');
        magnitudeBadge.src = `assets/badges/magnitude-${this.wrappedData.magnitude}.png`;
        badgeLevel.textContent = `MAGNITUDE ${this.wrappedData.magnitude}`;
        
        console.log('✅ User data set successfully');
    }

    populateBestTweet() {
        const tweet = this.twitterData.bestTweet;
        
        if (!tweet) {
            console.error('❌ No best tweet data!');
            return;
        }

        // Set tweet data
        document.getElementById('bestTweetAuthor').textContent = `@${this.wrappedData.username}`;
        document.getElementById('bestTweetText').textContent = tweet.text;
        
        // Format date
        if (tweet.created_at) {
            const date = new Date(tweet.created_at);
            const formatted = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            document.getElementById('bestTweetDate').textContent = formatted;
        }
        
        // Set metrics
        document.getElementById('bestLikes').textContent = this.formatNumber(tweet.likes);
        document.getElementById('bestRetweets').textContent = this.formatNumber(tweet.retweets);
        document.getElementById('bestReplies').textContent = this.formatNumber(tweet.replies);
        
        // Set views if available
        if (tweet.views && tweet.views > 0) {
            document.getElementById('bestViews').textContent = this.formatNumber(tweet.views);
            document.getElementById('bestViewsMetric').style.display = 'flex';
        }
        
        // Set media if available
        if (tweet.media) {
            const mediaContainer = document.getElementById('bestTweetMedia');
            const mediaImg = document.getElementById('bestTweetMediaImg');
            mediaImg.src = tweet.media;
            mediaContainer.style.display = 'block';
        }
        
        console.log('✅ Best tweet populated');
    }

    startAnimation() {
        if (this.animationStarted) return;
        this.animationStarted = true;

        console.log('🎬 Starting animation (3 scenes)...');

        // Scene 1: Stats (3s)
        this.showScene(0);
        this.animateCounters();

        // Scene 2: Best Content (4s)
        setTimeout(() => {
            this.showScene(1);
        }, 3000);

        // Scene 3: Magnitude (3s)
        setTimeout(() => {
            this.showScene(2);
        }, 7000);

        // Animation complete
        setTimeout(() => {
            console.log('✅ Animation complete');
        }, 10000);
    }

    showScene(index) {
        console.log(`🎞️ Showing scene ${index + 1}`);
        
        this.scenes.forEach((sceneId, i) => {
            const scene = document.getElementById(sceneId);
            if (i === index) {
                scene.classList.add('active');
                scene.classList.remove('exiting');
            } else if (i < index) {
                scene.classList.remove('active');
                scene.classList.add('exiting');
            } else {
                scene.classList.remove('active', 'exiting');
            }
        });

        this.currentSceneIndex = index;
    }

    animateCounters() {
        const counters = [
            document.getElementById('discordCount'),
            document.getElementById('tweetCount')
        ];

        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            let step = 0;

            const timer = setInterval(() => {
                step++;
                current += increment;
                
                if (step >= steps) {
                    counter.textContent = this.formatNumber(target);
                    clearInterval(timer);
                } else {
                    counter.textContent = this.formatNumber(Math.floor(current));
                }
            }, duration / steps);
        });
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize animation when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Initializing Wrapped Animation...');
    new WrappedAnimation();
});
