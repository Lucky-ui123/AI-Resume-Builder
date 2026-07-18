import { test, expect } from '@playwright/test';

test.describe('Database Storage & Versioning Limits', () => {
  test('Verify subscription plan limits, atomic version saves, and cron pruning', async ({ request }) => {
    console.log('[Test E2E] Triggering /api/test-storage endpoint...');
    const response = await request.get('/api/test-storage');
    
    expect(response.status()).toBe(200);
    const result = await response.json();
    
    if (!result.success) {
      console.error('[Test E2E] Database integration test failed:', result.error);
    }
    
    expect(result.success).toBe(true);
  });
});
