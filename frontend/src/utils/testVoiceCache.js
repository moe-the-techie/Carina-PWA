// Test script to verify voice message caching functionality with individual keys
import { 
    getCachedVoiceMessage, 
    clearVoiceCache, 
    getVoiceCacheStats 
} from '../services/chatService.js';

// This is a test utility that can be used in the browser console
// or imported in a React component for testing

export const testVoiceCache = {
    // Get cache statistics
    getStats() {
        const stats = getVoiceCacheStats();
        console.log('Voice Cache Statistics:', stats);
        return stats;
    },

    // Show all cached message keys in localStorage
    listCachedMessages() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('voice_msg_')) {
                const messageId = key.replace('voice_msg_', '');
                keys.push(messageId);
            }
        }
        console.log('Cached voice message IDs:', keys);
        return keys;
    },

    // Show cache index
    showIndex() {
        try {
            const index = localStorage.getItem('voice_cache_index');
            if (index) {
                const parsedIndex = JSON.parse(index);
                console.log('Voice cache index:', parsedIndex);
                return parsedIndex;
            } else {
                console.log('No cache index found');
                return {};
            }
        } catch (error) {
            console.error('Error reading cache index:', error);
            return {};
        }
    },

    // Test individual key storage
    testIndividualKeys() {
        console.log('Testing individual key storage...');
        
        const cachedKeys = this.listCachedMessages();
        const indexData = this.showIndex();
        
        console.log(`Found ${cachedKeys.length} cached messages`);
        console.log(`Index has ${Object.keys(indexData).length} entries`);
        
        // Check for consistency
        const indexKeys = Object.keys(indexData);
        const missingInIndex = cachedKeys.filter(id => !indexKeys.includes(id));
        const missingInStorage = indexKeys.filter(id => !cachedKeys.includes(id));
        
        if (missingInIndex.length > 0) {
            console.warn('Messages in storage but not in index:', missingInIndex);
        }
        if (missingInStorage.length > 0) {
            console.warn('Messages in index but not in storage:', missingInStorage);
        }
        
        if (missingInIndex.length === 0 && missingInStorage.length === 0) {
            console.log('✅ Cache consistency check passed');
        }
    },

    // Test caching a voice message (requires a valid messageId)
    async testCache(messageId) {
        console.log(`Testing cache for message: ${messageId}`);
        
        try {
            // Check if already cached
            const isCached = this.listCachedMessages().includes(messageId);
            console.log(`Message ${isCached ? 'is' : 'is not'} currently cached`);

            console.log('Getting voice message (first attempt)...');
            const start1 = performance.now();
            await getCachedVoiceMessage(messageId);
            const time1 = performance.now() - start1;
            console.log(`First fetch took: ${time1.toFixed(2)}ms`);

            // Get it again (should come from cache if first was successful)
            console.log('Getting voice message again (should be from cache)...');
            const start2 = performance.now();
            await getCachedVoiceMessage(messageId);
            const time2 = performance.now() - start2;
            console.log(`Second fetch took: ${time2.toFixed(2)}ms`);

            console.log(`Cache speedup: ${(time1 / time2).toFixed(2)}x faster`);
            
            // Show updated stats
            this.getStats();
            this.testIndividualKeys();

        } catch (error) {
            console.error('Error testing cache:', error);
        }
    },

    // Clear the entire cache
    clearAll() {
        console.log('Clearing voice message cache...');
        clearVoiceCache();
        console.log('Cache cleared.');
        this.getStats();
        this.testIndividualKeys();
    },

    // Test cache expiry (sets a short expiry for testing)
    testExpiry() {
        console.log('Testing cache expiry mechanism...');
        
        try {
            // Get current index
            const index = this.showIndex();
            if (Object.keys(index).length === 0) {
                console.log('No cached messages to test expiry with');
                return;
            }
            
            // Pick a random message and make it expired
            const messageIds = Object.keys(index);
            const testMessageId = messageIds[0];
            const expiredTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
            
            // Update the index with expired timestamp
            const updatedIndex = { ...index };
            updatedIndex[testMessageId] = {
                ...updatedIndex[testMessageId],
                timestamp: expiredTimestamp
            };
            localStorage.setItem('voice_cache_index', JSON.stringify(updatedIndex));
            
            console.log(`Set message ${testMessageId} as expired`);
            
            // Trigger cache cleanup by checking stats
            this.getStats();
            
            // Check if expired entry was cleaned up
            const newIndex = this.showIndex();
            if (!newIndex[testMessageId]) {
                console.log('✅ Expired entry was successfully cleaned up');
            } else {
                console.log('❌ Expired entry was not cleaned up');
            }
        } catch (error) {
            console.error('Error testing expiry:', error);
        }
    },

    // Get size of individual message
    getMessageSize(messageId) {
        try {
            const messageKey = `voice_msg_${messageId}`;
            const data = localStorage.getItem(messageKey);
            if (data) {
                const size = new Blob([data]).size;
                console.log(`Message ${messageId} size: ${Math.round(size / 1024)} KB`);
                return size;
            } else {
                console.log(`Message ${messageId} not found in cache`);
                return 0;
            }
        } catch (error) {
            console.error('Error getting message size:', error);
            return 0;
        }
    }
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
    window.testVoiceCache = testVoiceCache;
}

export default testVoiceCache;