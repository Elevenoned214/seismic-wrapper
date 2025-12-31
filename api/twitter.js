// Serverless Function - Twitter API Handler
// File: api/twitter.js

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: true, message: 'Method not allowed' });
    }
    
    const { username } = req.query;
    
    // Validation
    if (!username) {
        return res.status(400).json({
            error: true,
            message: 'Username is required'
        });
    }
    
    // Get API Key from environment
    const API_KEY = process.env.SOCIALDATA_API_KEY;
    
    if (!API_KEY) {
        console.error('❌ SOCIALDATA_API_KEY not found in environment variables!');
        return res.status(500).json({
            error: true,
            message: 'API configuration error'
        });
    }
    
    console.log(`🔍 Fetching data for @${username}...`);
    
    try {
        // ========================================
        // 1. GET USER PROFILE (untuk PFP)
        // ========================================
        console.log('📡 Step 1: Fetching user profile...');
        
        const profileResponse = await fetch(
            `https://api.socialdata.tools/twitter/user/${username}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            console.error('Profile API Error:', profileResponse.status, errorText);
            
            if (profileResponse.status === 404) {
                return res.status(404).json({
                    error: true,
                    message: `User @${username} tidak ditemukan di X!`
                });
            }
            
            throw new Error(`Profile API returned ${profileResponse.status}`);
        }
        
        const profile = await profileResponse.json();
        console.log('✅ Profile fetched successfully');
        
        // ========================================
        // 2. SEARCH TWEETS dengan KEYWORDS
        // ========================================
        console.log('📡 Step 2: Searching tweets with keywords...');
        
        // Keywords: GMIC, SEISMIC, @SeismicSys
        const keywords = [
            'GMIC',
            '#GMIC',
            '$GMIC',
            'SEISMIC',
            '#SEISMIC',
            '$SEISMIC',
            '@SeismicSys',
            'seismicsys'
        ];
        
        const keywordQuery = keywords.join(' OR ');
        const searchQuery = `from:${username} (${keywordQuery})`;
        
        console.log('🔎 Search query:', searchQuery);
        
        const searchResponse = await fetch(
            `https://api.socialdata.tools/twitter/search?` +
            `query=${encodeURIComponent(searchQuery)}&` +
            `type=Top`,  // Sort by engagement!
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!searchResponse.ok) {
            const errorText = await searchResponse.text();
            console.error('Search API Error:', searchResponse.status, errorText);
            throw new Error(`Search API returned ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        const tweets = searchData.tweets || searchData.data || [];
        
        console.log(`📊 Found ${tweets.length} tweets`);
        
        // ========================================
        // 3. VALIDATION: Minimal 1 tweet
        // ========================================
        if (tweets.length === 0) {
            console.log('⚠️ No tweets found with keywords');
            return res.status(400).json({
                error: true,
                message: 'Anda belum pernah posting tentang GMIC/SEISMIC!',
                suggestion: 'Buat minimal 1 tweet yang mention: GMIC, SEISMIC, atau @SeismicSys'
            });
        }
        
        // ========================================
        // 4. FORMAT TWEETS (Top 10)
        // ========================================
        const top10 = tweets.slice(0, 10);
        
        const formattedTweets = top10.map((tweet, index) => ({
            rank: index + 1,
            id: tweet.id_str || tweet.id,
            text: tweet.full_text || tweet.text || '',
            likes: tweet.favorite_count || 0,
            retweets: tweet.retweet_count || 0,
            replies: tweet.reply_count || 0,
            views: tweet.views_count || tweet.view_count || 0,
            created_at: tweet.created_at || tweet.tweet_created_at || '',
            media: tweet.entities?.media?.[0]?.media_url_https || 
                   tweet.extended_entities?.media?.[0]?.media_url_https ||
                   null,
            link: `https://twitter.com/${username}/status/${tweet.id_str || tweet.id}`
        }));
        
        console.log('✅ Data formatted successfully');
        
        // ========================================
        // 5. RETURN SUCCESS RESPONSE
        // ========================================
        return res.status(200).json({
            error: false,
            username: username,
            pfpUrl: profile.profile_image_url_https || profile.profile_image_url,
            totalTweets: formattedTweets.length,
            topTweets: formattedTweets,
            bestTweet: formattedTweets[0]
        });
        
    } catch (error) {
        console.error('❌ Server Error:', error.message);
        console.error('Stack:', error.stack);
        
        return res.status(500).json({
            error: true,
            message: 'Terjadi kesalahan saat mengambil data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
