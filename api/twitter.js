// Twitter API Handler - Using Nitter RSS Feed (FREE!)
// CommonJS format for Vercel compatibility

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: true, message: 'Method not allowed' });
    }
    
    const { username } = req.query;
    
    if (!username) {
        return res.status(400).json({
            error: true,
            message: 'Username is required'
        });
    }
    
    console.log(`🔍 Fetching data for @${username} via Nitter...`);
    
    // Nitter instances (ordered by reliability - best first)
    const nitterInstances = [
        'xcancel.com',           // 98% uptime, 587ms - BEST!
        'nitter.space',          // 96% uptime, 950ms
        'lightbrd.com',          // 96% uptime, 917ms
        'nuku.trubun.org',       // 96% uptime, 1018ms (CL)
        'nitter.poast.org',      // 86% uptime, 958ms
        'nitter.catsarch.com',   // 58% uptime, 1192ms (backup)
        'nitter.net'             // General backup
    ];
    
    try {
        let rssText = null;
        let usedInstance = null;
        
        // Try each instance until one works
        for (const instance of nitterInstances) {
            try {
                console.log(`📡 Trying instance: ${instance}`);
                
                const rssUrl = `https://${instance}/${username}/rss`;
                const response = await fetch(rssUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    signal: AbortSignal.timeout(10000) // 10s timeout
                });
                
                if (response.ok) {
                    rssText = await response.text();
                    usedInstance = instance;
                    console.log(`✅ Success with instance: ${instance}`);
                    break;
                }
            } catch (e) {
                console.log(`❌ Instance ${instance} failed:`, e.message);
                continue;
            }
        }
        
        if (!rssText) {
            throw new Error('All Nitter instances failed');
        }
        
        console.log(`✅ RSS feed fetched from ${usedInstance}`);
        
        // Parse RSS manually (simple regex parsing)
        const itemMatches = rssText.matchAll(/<item>(.*?)<\/item>/gs);
        const items = [];
        
        for (const match of itemMatches) {
            const itemContent = match[1];
            
            // Extract fields
            const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s);
            const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s);
            const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
            const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            
            items.push({
                title: titleMatch ? titleMatch[1] : '',
                description: descMatch ? descMatch[1] : '',
                link: linkMatch ? linkMatch[1] : '',
                pubDate: pubDateMatch ? pubDateMatch[1] : ''
            });
        }
        
        console.log(`📊 Found ${items.length} total tweets`);
        
        if (items.length === 0) {
            throw new Error('No tweets found in RSS feed');
        }
        
        // Filter tweets about GMIC/SEISMIC
        const keywords = ['gmic', 'seismic', '@seismicsys', 'seismicsys', '#gmic', '#seismic', '$gmic', '$seismic'];
        
        const seismicTweets = items.filter(item => {
            const text = (item.title + ' ' + item.description).toLowerCase();
            return keywords.some(keyword => text.includes(keyword));
        });
        
        console.log(`📊 Found ${seismicTweets.length} tweets about GMIC/SEISMIC`);
        
        // Validation
        if (seismicTweets.length === 0) {
            console.log('⚠️ No tweets found with keywords');
            return res.status(400).json({
                error: true,
                message: 'Anda belum pernah posting tentang GMIC/SEISMIC!',
                suggestion: 'Buat minimal 1 tweet yang mention: GMIC, SEISMIC, atau @SeismicSys'
            });
        }
        
        // Parse tweets and extract metrics
        const parsedTweets = seismicTweets.map(item => {
            const description = item.description || '';
            const link = item.link || '';
            
            // Extract tweet ID from link
            const tweetIdMatch = link.match(/status\/(\d+)/);
            const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';
            
            // Extract metrics from description
            // Nitter format: "R: X  RT: Y  L: Z" or with emojis
            const replyMatch = description.match(/(?:R:|💬)\s*(\d+)/i);
            const retweetMatch = description.match(/(?:RT:|🔁)\s*(\d+)/i);
            const likeMatch = description.match(/(?:L:|❤)\s*(\d+)/i);
            
            const replies = replyMatch ? parseInt(replyMatch[1]) : 0;
            const retweets = retweetMatch ? parseInt(retweetMatch[1]) : 0;
            const likes = likeMatch ? parseInt(likeMatch[1]) : 0;
            
            // Clean tweet text
            const cleanText = description
                .replace(/<[^>]*>/g, '')
                .replace(/(?:R:|💬)\s*\d+\s*(?:RT:|🔁)\s*\d+\s*(?:L:|❤)\s*\d+/gi, '')
                .trim();
            
            return {
                id: tweetId,
                text: cleanText || item.title,
                likes: likes,
                retweets: retweets,
                replies: replies,
                views: 0,
                created_at: item.pubDate,
                link: link,
                engagement: likes + retweets + replies
            };
        });
        
        // Sort by engagement
        const sorted = parsedTweets.sort((a, b) => b.engagement - a.engagement);
        
        // Get best tweet
        const bestTweet = sorted[0];
        
        console.log('✅ Best tweet found:', {
            likes: bestTweet.likes,
            retweets: bestTweet.retweets,
            engagement: bestTweet.engagement
        });
        
        // Format response
        const formattedBestTweet = {
            rank: 1,
            id: bestTweet.id,
            text: bestTweet.text,
            likes: bestTweet.likes,
            retweets: bestTweet.retweets,
            replies: bestTweet.replies,
            views: 0,
            created_at: bestTweet.created_at,
            media: null,
            link: bestTweet.link
        };
        
        // Construct profile picture URL
        const pfpUrl = `https://ui-avatars.com/api/?name=${username}&background=00d9ff&color=fff&size=200`;
        
        console.log('✅ Data formatted successfully - Nitter RSS');
        
        // Return success response
        return res.status(200).json({
            error: false,
            username: username,
            pfpUrl: pfpUrl,
            totalTweets: seismicTweets.length,
            bestTweet: formattedBestTweet
        });
        
    } catch (error) {
        console.error('❌ Server Error:', error.message);
        console.error('Stack:', error.stack);
        
        return res.status(500).json({
            error: true,
            message: 'Terjadi kesalahan saat mengambil data dari Nitter',
            suggestion: 'Coba lagi dalam beberapa saat',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
