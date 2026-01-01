// Twitter API Handler - Using Twttr API (RapidAPI)
// Simple, reliable, good reviews

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
    
    // RapidAPI credentials
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = 'twitter241.p.rapidapi.com';
    
    if (!RAPIDAPI_KEY) {
        console.error('❌ RAPIDAPI_KEY not found!');
        return res.status(500).json({
            error: true,
            message: 'API configuration error'
        });
    }
    
    console.log(`🔍 Fetching data for @${username} via Twttr API...`);
    
    try {
        // Step 1: Get user info by screen name
        console.log('📡 Step 1: Getting user info...');
        
        const userResponse = await fetch(
            `https://${RAPIDAPI_HOST}/user?screen_name=${username}`,
            {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                }
            }
        );
        
        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('User API Error:', userResponse.status, errorText);
            
            if (userResponse.status === 404) {
                return res.status(404).json({
                    error: true,
                    message: `User @${username} tidak ditemukan di X!`
                });
            }
            
            if (userResponse.status === 429) {
                return res.status(429).json({
                    error: true,
                    message: 'Rate limit exceeded. Coba lagi nanti.'
                });
            }
            
            throw new Error(`User API returned ${userResponse.status}`);
        }
        
        const userData = await userResponse.json();
        console.log(`✅ User found: @${username}`);
        
        // Extract user ID
        const userId = userData.rest_id || userData.id_str || userData.id;
        
        if (!userId) {
            throw new Error('Could not extract user ID');
        }
        
        // Step 2: Get user tweets
        console.log('📡 Step 2: Getting user tweets...');
        
        const tweetsResponse = await fetch(
            `https://${RAPIDAPI_HOST}/user-tweets?user=${userId}&count=20`,
            {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': RAPIDAPI_HOST
                }
            }
        );
        
        if (!tweetsResponse.ok) {
            const errorText = await tweetsResponse.text();
            console.error('Tweets API Error:', tweetsResponse.status, errorText);
            
            if (tweetsResponse.status === 429) {
                return res.status(429).json({
                    error: true,
                    message: 'Rate limit exceeded. Coba lagi nanti.'
                });
            }
            
            throw new Error(`Tweets API returned ${tweetsResponse.status}`);
        }
        
        const tweetsData = await tweetsResponse.json();
        
        // Extract tweets from response
        let allTweets = [];
        
        // Try different response structures
        if (tweetsData.data) {
            allTweets = tweetsData.data;
        } else if (tweetsData.timeline) {
            allTweets = tweetsData.timeline.filter(item => item.tweet).map(item => item.tweet);
        } else if (Array.isArray(tweetsData)) {
            allTweets = tweetsData;
        }
        
        console.log(`📊 Found ${allTweets.length} total tweets`);
        
        if (allTweets.length === 0) {
            throw new Error('No tweets found');
        }
        
        // Step 3: Filter tweets about GMIC/SEISMIC
        const keywords = [
            'gmic', 
            'seismic', 
            'seismicsys',
            'seismicsysidn',
            '#gmic', 
            '#seismic',
            'seismicindonesia'
        ];
        
        const seismicTweets = allTweets.filter(tweet => {
            const text = (tweet.full_text || tweet.text || '').toLowerCase();
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
        
        // Step 4: Sort by engagement and get best tweet
        const sorted = seismicTweets.sort((a, b) => {
            const engagementA = (a.favorite_count || 0) + (a.retweet_count || 0) + (a.reply_count || 0);
            const engagementB = (b.favorite_count || 0) + (b.retweet_count || 0) + (b.reply_count || 0);
            return engagementB - engagementA;
        });
        
        const bestTweet = sorted[0];
        
        console.log('✅ Best tweet found:', {
            likes: bestTweet.favorite_count,
            retweets: bestTweet.retweet_count
        });
        
        // Step 5: Format response
        const formattedBestTweet = {
            rank: 1,
            id: bestTweet.id_str || bestTweet.id,
            text: bestTweet.full_text || bestTweet.text || '',
            likes: bestTweet.favorite_count || 0,
            retweets: bestTweet.retweet_count || 0,
            replies: bestTweet.reply_count || 0,
            views: bestTweet.views?.count || 0,
            created_at: bestTweet.created_at || '',
            media: bestTweet.entities?.media?.[0]?.media_url_https || 
                   bestTweet.extended_entities?.media?.[0]?.media_url_https || 
                   null,
            link: `https://twitter.com/${username}/status/${bestTweet.id_str || bestTweet.id}`
        };
        
        const pfpUrl = userData.legacy?.profile_image_url_https || 
                       userData.profile_image_url_https ||
                       `https://ui-avatars.com/api/?name=${username}&background=00d9ff&color=fff&size=200`;
        
        console.log('✅ Data formatted successfully - Twttr API');
        
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
            message: 'Terjadi kesalahan saat mengambil data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
