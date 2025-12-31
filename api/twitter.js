// FINAL Twitter API Handler - Using Correct SocialData.tools Endpoints
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
        // Step 1: Get user profile (to get user_id and pfp)
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
                    message: 'Insufficient API credits. Please check your SocialData.tools account.'
                });
            }
            
            throw new Error(`Profile API returned ${profileResponse.status}`);
        }
        
        const profile = await profileResponse.json();
        const userId = profile.id_str || profile.id.toString();
        
        console.log(`✅ Profile fetched - User ID: ${userId}`);
        
        // Step 2: Get user tweets using user_id
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
                    message: 'Insufficient API credits. Please check your SocialData.tools account.'
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
        
        // Step 4: Sort by engagement
        const sorted = seismicTweets.sort((a, b) => {
            const engagementA = (a.favorite_count || 0) + (a.retweet_count || 0) + (a.reply_count || 0);
            const engagementB = (b.favorite_count || 0) + (b.retweet_count || 0) + (b.reply_count || 0);
            return engagementB - engagementA;
        });
        
        // Step 5: Get top 10
        const top10 = sorted.slice(0, 10);
        
        // Step 6: Format tweets
        const formattedTweets = top10.map((tweet, index) => ({
            rank: index + 1,
            id: tweet.id_str || tweet.id.toString(),
            text: tweet.full_text || tweet.text || '',
            likes: tweet.favorite_count || 0,
            retweets: tweet.retweet_count || 0,
            replies: tweet.reply_count || 0,
            views: tweet.views_count || tweet.view_count || 0,
            created_at: tweet.tweet_created_at || tweet.created_at || '',
            media: tweet.entities?.media?.[0]?.media_url_https || 
                   tweet.extended_entities?.media?.[0]?.media_url_https ||
                   null,
            link: `https://twitter.com/${username}/status/${tweet.id_str || tweet.id}`
        }));
        
        console.log('✅ Data formatted successfully');
        
        // Step 7: Return success response
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
