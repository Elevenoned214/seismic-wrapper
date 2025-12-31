// Animation Controller
class WrappedAnimation {
    constructor() {
        this.scenes = ['scene1', 'scene2', 'scene3', 'scene4'];
        this.currentSceneIndex = 0;
        this.sceneDuration = 3000; // 3 seconds per scene
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

        // Set scene 2 data (Top 10)
        this.populateTop10();

        // Set scene 3 data (Best tweet)
        this.populateBestTweet();

        // Set scene 4 data (Magnitude)
        const magnitudeBadge = document.getElementById('magnitudeBadge');
        const badgeLevel = document.getElementById('badgeLevel');
        magnitudeBadge.src = `assets/badges/magnitude-${this.wrappedData.magnitude}.png`;
        badgeLevel.textContent = `MAGNITUDE ${this.wrappedData.magnitude}`;
        
        console.log('✅ User data set successfully');
    }

    populateTop10() {
        const container = document.getElementById('top10Container');
        const title = document.getElementById('scene2Title');
        const tweets = this.twitterData.topTweets;
        
        // Update title based on count
        if (tweets.length === 1) {
            title.textContent = 'YOUR POST';
        } else if (tweets.length < 10) {
            title.textContent = `YOUR TOP ${tweets.length} POSTS`;
        } else {
            title.textContent = 'YOUR TOP 10 POSTS';
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Create tweet items
        tweets.forEach((tweet, index) => {
            const item = document.createElement('div');
            item.className = 'top-item';
            if (index < 3) item.classList.add(`rank-${index + 1}`);
            
            // Rank emoji
            const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            const rankEmoji = rankEmojis[index] || `${index + 1}️⃣`;
            
            // Truncate text
            const maxLength = 60;
            const text = tweet.text.length > maxLength 
                ? tweet.text.substring(0, maxLength) + '...' 
                : tweet.text;
            
            item.innerHTML = `
                <div class="rank-emoji">${rankEmoji}</div>
                <div class="tweet-preview">
                    <div class="tweet-text-short">${this.escapeHtml(text)}</div>
                </div>
                <div class="tweet-likes">❤️ ${this.formatNumber(tweet.likes)}</div>
            `;
            
            container.appendChild(item);
        });
    }

    populateBestTweet() {
        const best = this.twitterData.bestTweet;
        
        document.getElementById('bestTweetAuthor').textContent = `@${this.wrappedData.username}`;
        document.getElementById('bestTweetDate').textContent = this.formatDate(best.created_at);
        document.getElementById('bestTweetText').textContent = best.text;
        
        // Media
        if (best.media) {
            const mediaContainer = document.getElementById('bestTweetMedia');
            const mediaImg = document.getElementById('bestTweetMediaImg');
            mediaImg.src = best.media;
            mediaContainer.style.display = 'block';
        }
        
        // Metrics
        document.getElementById('bestLikes').textContent = this.formatNumber(best.likes);
        document.getElementById('bestRetweets').textContent = this.formatNumber(best.retweets);
        document.getElementById('bestReplies').textContent = this.formatNumber(best.replies);
        
        // Views (if available)
        if (best.views && best.views > 0) {
            document.getElementById('bestViewsMetric').style.display = 'flex';
            document.getElementById('bestViews').textContent = this.formatNumber(best.views);
        }
    }

    startAnimation() {
        if (this.animationStarted) return;
        this.animationStarted = true;

        console.log('🎬 Starting animation...');

        // Scene 1: Stats (3s)
        this.showScene(0);
        this.animateCounters();

        // Scene 2: Top 10 (3s)
        setTimeout(() => {
            this.showScene(1);
        }, 3000);

        // Scene 3: Best Content (4s)
        setTimeout(() => {
            this.showScene(2);
        }, 6000);

        // Scene 4: Magnitude (3s)
        setTimeout(() => {
            this.showScene(3);
        }, 10000);

        // Show export controls
        setTimeout(() => {
            document.getElementById('exportControls').style.opacity = '1';
            console.log('✅ Animation complete');
        }, 13000);
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

    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${date.getDate()} ${months[date.getMonth()]}`;
        } catch (e) {
            return '';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    replay() {
        console.log('🔄 Replaying animation...');
        this.currentSceneIndex = 0;
        this.animationStarted = false;
        document.getElementById('exportControls').style.opacity = '0';
        this.startAnimation();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.wrappedAnimationInstance = new WrappedAnimation();

    // Replay button
    document.getElementById('replayBtn').addEventListener('click', () => {
        window.wrappedAnimationInstance.replay();
    });

    // Share button
    document.getElementById('shareBtn').addEventListener('click', () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            const btn = document.getElementById('shareBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>✓ Copied!</span>';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Link: ' + url);
        });
    });
});
