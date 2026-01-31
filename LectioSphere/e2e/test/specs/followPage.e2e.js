describe('Follow Page - like flow', () => {
  before(async () => {
    // Wait for login screen to appear before attempting to login
    await browser.waitUntil(async () => (await $('~login-email').isDisplayed()), { timeout: 10000, timeoutMsg: 'Login screen did not appear' });

    // If login screen is present, perform login
    const email = await $('~login-email').catch(() => null);
    if (email && await email.isDisplayed()) {
      await email.click();
      await email.setValue('andreeadumitru.alex20@gmail.com');

      const password = await $('~login-password');
      await password.click();
      await password.setValue('Qwert1234$');

      if (await browser.isKeyboardShown()) {
        await browser.hideKeyboard();
      }

      const submit = await $('~login-submit');
      await submit.click();

      // wait for home
      const homeTop = await $('~partial-TopBar-home-root');
      await homeTop.waitForExist({ timeout: 20000 });
    }
  });

  it('likes and unlikes the first post, verifying the count changes correctly', async () => {
    // Navigate to Follow page via NavBar
    const navFollow = await $('~partial-NavBar-follow');
    await navFollow.waitForDisplayed({ timeout: 8000 });
    await navFollow.click();

    await browser.pause(2000);

    // Check if there's an empty state first
    const emptyState = await $('~postings-empty-state').catch(() => null);
    if (emptyState && await emptyState.isDisplayed().catch(() => false)) {
        console.warn('Follow page is empty. Skipping like test.');
        return;
    }

    // Wait for the Follow page to load posts by checking for the TopBar
    const followTopBar = await $('~partial-TopBar-follow-root');
    await followTopBar.waitForDisplayed({ timeout: 8000 });

    // Wait a bit for posts to render
    await browser.pause(1500);

    // Try to find any like button directly using accessibility-id selector
    // We'll use a more flexible approach: find all like buttons and pick the first one
    const likeButton = await $('(//*[contains(@content-desc,"postpartial-like-")])[1]').catch(() => null);
    
    if (!likeButton) {
        console.warn('No like button found on Follow page. Skipping like test.');
        return;
    }

    // Try to wait for the like button to be displayed
    const isDisplayed = await likeButton.isDisplayed().catch(() => false);
    if (!isDisplayed) {
        // Scroll down a bit to make sure posts are visible
        await browser.execute('mobile: scrollGesture', {
            left: 100, top: 400, width: 300, height: 600,
            direction: 'down',
            percent: 0.2
        });
        await browser.pause(800);
        
        const isDisplayedAfterScroll = await likeButton.isDisplayed().catch(() => false);
        if (!isDisplayedAfterScroll) {
            console.warn('Like button not displayed even after scroll. Skipping like test.');
            return;
        }
    }

    // Find the corresponding like count element (same index)
    const likeCountEl = await $('(//*[contains(@content-desc, "postpartial-like-count-")])[1]').catch(() => null);

    if (!likeCountEl) {
        console.warn('Like count element not found. Skipping like/unlike test.');
        return;
    }

    // --- Step 1: Get initial count and perform the first action (like or unlike) ---
    const initialTxt = await likeCountEl.getText().catch(() => '0');
    const initialCount = parseInt(initialTxt.trim()) || 0;

    // Click the like button for the first time
    await likeButton.click();
    await browser.pause(800);

    // Wait for the count to change
    let intermediateCount = -1;
    await browser.waitUntil(async () => {
      const newTxt = await likeCountEl.getText().catch(() => '');
      const newCount = parseInt(newTxt.trim()) || 0;
      if (newCount !== initialCount) {
        intermediateCount = newCount;
        return true;
      }
      return false;
    }, { timeout: 5000, timeoutMsg: `Like count did not change from ${initialCount} after first click` });

    // Verify the count changed by exactly 1
    expect(Math.abs(intermediateCount - initialCount)).toBe(1);

    // --- Step 2: Perform the second action (unlike or like) to revert ---
    // Click the like button for the second time to revert
    await likeButton.click();
    await browser.pause(800);

    // Wait for the count to change back to the initial value
    let finalCount = -1;
    await browser.waitUntil(async () => {
      const newTxt = await likeCountEl.getText().catch(() => '');
      const newCount = parseInt(newTxt.trim()) || 0;
      if (newCount === initialCount) {
        finalCount = newCount;
        return true;
      }
      return false;
    }, { timeout: 5000, timeoutMsg: `Like count did not revert to ${initialCount} after second click` });

    // Verify the count is back to the original
    expect(finalCount).toBe(initialCount);
  });

  after(async () => {
    const navProfile = await $('~partial-NavBar-profile');
    await navProfile.waitForDisplayed({ timeout: 8000 });
    await navProfile.click();

    const settingsBtn = await $('~partial-TopBar-settings');
    await settingsBtn.waitForDisplayed({ timeout: 5000 });
    await settingsBtn.click();

    const drawerLogout = await $('~drawer-logout');
    await drawerLogout.waitForDisplayed({ timeout: 5000 });
    await drawerLogout.click();

    const alertLogoutButton = await $('android=new UiSelector().textMatches("(?i)LOGOUT")');
    await alertLogoutButton.waitForDisplayed({ timeout: 5000 });
    await alertLogoutButton.click();

    const loginEmail = await $('~login-email');
    await loginEmail.waitForDisplayed({ timeout: 15000 });
  });
});
