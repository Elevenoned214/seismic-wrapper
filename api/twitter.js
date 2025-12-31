// Twitter API Handler - Using FREE Official Twitter API v2
// Get your FREE Bearer Token at: https://developer.twitter.com/

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
    
    // Twitter API v2 Bearer Token (FREE!)
    const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
    
    if (!BEARER_TOKEN) {
        console.error('❌ TWITTER_BEARER_TOKEN not found!');
        return res.status(500).json({
            error: true,
            message: 'API configuration error'
        });
    }
    
    console.log(`🔍 Fetching data for @${username}...`);
    
    try {
        // Step 1: Get user by username
        console.log('📡 Step 1: Getting user info...');
        
        const userResponse = await fetch(
            `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`,
            {
                headers: {
                    'Authorization': `Bearer ${BEARER_TOKEN}`
                }
            }
        );
        
        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            console.error('User API Error:', errorData);
            
            if (userResponse.status === 404) {
                return res.status(404).json({
                    error: true,
                    message: `User @${username} tidak ditemukan di X!`
                });
            }
            
            throw new Error(`User API returned ${userResponse.status}`);
        }
        
        const userData = await userResponse.json();
        const user = userData.data;
        const userId = user.id;
        
        console.log(`✅ User found - ID: ${userId}`);
        
        // Step 2: Get user tweets
        console.log('📡 Step 2: Getting user tweets...');
        
        const tweetsResponse = await fetch(
            `https://api.twitter.com/2/users/${userId}/tweets?` +
            `max_results=100&` +
            `tweet.fields=created_at,public_metrics,entities,attachments&` +
            `expansions=attachments.media_keys&` +
            `media.fields=url,preview_image_url`,
            {
                headers: {
                    'Authorization': `Bearer ${BEARER_TOKEN}`
                }
            }
        );
        
        if (!tweetsResponse.ok) {
            const errorData = await tweetsResponse.json();
            console.error('Tweets API Error:', errorData);
            throw new Error(`Tweets API returned ${tweetsResponse.status}`);
        }
        
        const tweetsData = await tweetsResponse.json();
        const allTweets = tweetsData.data || [];
        const mediaIncludes = tweetsData.includes?.media || [];
        
        console.log(`📊 Found ${allTweets.length} total tweets`);
        
        // Step 3: Filter tweets about GMIC/SEISMIC
        const keywords = ['gmic', 'seismic', '@seismicsys', 'seismicsys', '#gmic', '#seismic', '$gmic', '$seismic'];
        
        const seismicTweets = allTweets.filter(tweet => {
            const text = (tweet.text || '').toLowerCase();
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
            const metricsA = a.public_metrics || {};
            const metricsB = b.public_metrics || {};
            
            const engagementA = (metricsA.like_count || 0) + (metricsA.retweet_count || 0) + (metricsA.reply_count || 0);
            const engagementB = (metricsB.like_count || 0) + (metricsB.retweet_count || 0) + (metricsB.reply_count || 0);
            
            return engagementB - engagementA;
        });
        
        // Step 5: Get top 10
        const top10 = sorted.slice(0, 10);
        
        // Step 6: Format tweets
        const formattedTweets = top10.map((tweet, index) => {
            const metrics = tweet.public_metrics || {};
            
            // Get media URL if exists
            let mediaUrl = null;
            if (tweet.attachments?.media_keys) {
                const mediaKey = tweet.attachments.media_keys[0];
                const media = mediaIncludes.find(m => m.media_key === mediaKey);
                mediaUrl = media?.url || media?.preview_image_url || null;
            }
            
            return {
                rank: index + 1,
                id: tweet.id,
                text: tweet.text || '',
                likes: metrics.like_count || 0,
                retweets: metrics.retweet_count || 0,
                replies: metrics.reply_count || 0,
                views: metrics.impression_count || 0,
                created_at: tweet.created_at || '',
                media: mediaUrl,
                link: `https://twitter.com/${username}/status/${tweet.id}`
            };
        });
        
        console.log('✅ Data formatted successfully');
        
        // Step 7: Return success response
        return res.status(200).json({
            error: false,
            username: username,
            pfpUrl: user.profile_image_url || `https://ui-avatars.com/api/?name=${username}&background=00d9ff&color=fff&size=200`,
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
