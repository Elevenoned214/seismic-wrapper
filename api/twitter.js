// Twitter API Handler - SocialData.tools (Simplified - 1 Best Tweet Only)
export default async function handler(req, res) {
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
    
    const API_KEY = process.env.SOCIALDATA_API_KEY;
    
    if (!API_KEY) {
        console.error('❌ SOCIALDATA_API_KEY not found!');
        return res.status(500).json({
            error: true,
            message: 'API configuration error'
        });
    }
    
    console.log(`🔍 Fetching data for @${username}...`);
    
    try {
        // Step 1: Get user profile
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
            
            if (profileResponse.status === 402) {
                return res.status(402).json({
                    error: true,
                    message: 'Saldo API habis. Silakan top up di SocialData.tools'
                });
            }
            
            throw new Error(`Profile API returned ${profileResponse.status}`);
        }
        
        const profile = await profileResponse.json();
        const userId = profile.id_str || profile.id.toString();
        
        console.log(`✅ Profile fetched - User ID: ${userId}`);
        
        // Step 2: Get user tweets (only recent 20 to find best one)
        console.log('📡 Step 2: Fetching user tweets...');
        
        const tweetsResponse = await fetch(
            `https://api.socialdata.tools/twitter/user/${userId}/tweets-and-replies`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!tweetsResponse.ok) {
            const errorText = await tweetsResponse.text();
            console.error('Tweets API Error:', tweetsResponse.status, errorText);
            
            if (tweetsResponse.status === 402) {
                return res.status(402).json({
                    error: true,
                    message: 'Saldo API habis. Silakan top up di SocialData.tools'
                });
            }
            
            throw new Error(`Tweets API returned ${tweetsResponse.status}`);
        }
        
        const tweetsData = await tweetsResponse.json();
        const allTweets = tweetsData.tweets || tweetsData.data || [];
        
        console.log(`📊 Found ${allTweets.length} total tweets`);
        
        // Step 3: Filter tweets about GMIC/SEISMIC
        const keywords = ['gmic', 'seismic', '@seismicsys', 'seismicsys', '#gmic', '#seismic', '$gmic', '$seismic'];
        
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
        
        // Step 4: Find best tweet by engagement
        const bestTweet = seismicTweets.reduce((best, tweet) => {
            const currentEngagement = (tweet.favorite_count || 0) + (tweet.retweet_count || 0) + (tweet.reply_count || 0);
            const bestEngagement = (best.favorite_count || 0) + (best.retweet_count || 0) + (best.reply_count || 0);
            return currentEngagement > bestEngagement ? tweet : best;
        });
        
        console.log('✅ Best tweet found');
        
        // Step 5: Format best tweet
        const formattedBestTweet = {
            rank: 1,
            id: bestTweet.id_str || bestTweet.id.toString(),
            text: bestTweet.full_text || bestTweet.text || '',
            likes: bestTweet.favorite_count || 0,
            retweets: bestTweet.retweet_count || 0,
            replies: bestTweet.reply_count || 0,
            views: bestTweet.views_count || bestTweet.view_count || 0,
            created_at: bestTweet.tweet_created_at || bestTweet.created_at || '',
            media: bestTweet.entities?.media?.[0]?.media_url_https || 
                   bestTweet.extended_entities?.media?.[0]?.media_url_https ||
                   null,
            link: `https://twitter.com/${username}/status/${bestTweet.id_str || bestTweet.id}`
        };
        
        console.log('✅ Data formatted successfully - Best tweet only');
        
        // Step 6: Return success response
        return res.status(200).json({
            error: false,
            username: username,
            pfpUrl: profile.profile_image_url_https || profile.profile_image_url,
            totalTweets: seismicTweets.length, // Total tweets with keywords
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
}
