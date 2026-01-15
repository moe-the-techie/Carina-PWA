import Ably from 'ably';

let ablyClient = null;

// Initialize Ably client
export const getAblyClient = () => {
    if (!ablyClient) {
        const apiKey = process.env.ABLY_API_KEY;
        
        if (!apiKey) {
            console.warn('ABLY_API_KEY not set in environment variables');
            return null;
        }

        ablyClient = new Ably.Rest({
            key: apiKey,
            authUrl: process.env.ABLY_AUTH_URL,
        });
    }
    
    return ablyClient;
};

// Publish a message to a channel
export const publishMessage = async (channelName, eventName, data) => {
    try {
        const client = getAblyClient();
        if (!client) {
            console.warn('Ably client not initialized, skipping message publish');
            return;
        }

        const channel = client.channels.get(channelName);
        await channel.publish(eventName, data);
        console.log(`Published message to channel: ${channelName}, event: ${eventName}`);
    } catch (error) {
        console.error('Error publishing message to Ably:', error);
    }
};

// Generate Ably token for a specific user
export const generateAblyToken = async (userId) => {
    try {
        const client = getAblyClient();
        if (!client) {
            throw new Error('Ably client not initialized');
        }

        const tokenParams = {
            clientId: userId.toString(),
            capability: {
                [`chat:${userId}`]: ['subscribe', 'presence'],
                [`chat:${userId}:messages`]: ['subscribe'],
                [`user:${userId}:announcements`]: ['subscribe'],
                [`plans:${userId}`]: ['subscribe'],
                'announcements': ['subscribe'],
            },
            ttl: 3600000, // 1 hour
        };

        const tokenRequest = await client.auth.createTokenRequest(tokenParams);
        return tokenRequest;
    } catch (error) {
        console.error('Error generating Ably token:', error);
        throw error;
    }
};

// Generate Ably token for admin users
export const generateAdminAblyToken = async (userId) => {
    try {
        const client = getAblyClient();
        if (!client) {
            throw new Error('Ably client not initialized');
        }

        const tokenParams = {
            clientId: `admin:${userId.toString()}`,
            capability: {
                'chat:*': ['subscribe', 'presence'],
                'chat:*:messages': ['subscribe'],
                'admin:chats': ['subscribe'],
                'announcements': ['subscribe', 'publish'],
                'user:*:announcements': ['publish'],
            },
            ttl: 3600000, // 1 hour
        };

        const tokenRequest = await client.auth.createTokenRequest(tokenParams);
        return tokenRequest;
    } catch (error) {
        console.error('Error generating admin Ably token:', error);
        throw error;
    }
};

export default {
    getAblyClient,
    publishMessage,
    generateAblyToken,
    generateAdminAblyToken,
};
