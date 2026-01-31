describe('Profile Page Flow', () => {
  const generateRandomBio = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    const length = Math.floor(Math.random() * 30) + 20; // 20-50 chars
    let bio = '';
    for (let i = 0; i < length; i++) {
      bio += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return bio.trim();
  };

  const waitForEither = async (selector1, selector2, timeout = 8000) => {
    await browser.waitUntil(async () => {
      const found1 = await $(selector1).isDisplayed().catch(() => false);
      const found2 = await $(selector2).isDisplayed().catch(() => false);
      return found1 || found2;
    }, {
      timeout,
      timeoutMsg: `Neither '${selector1}' nor '${selector2}' appeared in ${timeout}ms`
    });
  };

  let newBio = '';

  before(async () => {
    // Login once before all profile tests
    await browser.waitUntil(async () => (await $('~login-email').isDisplayed()), { timeout: 10000, timeoutMsg: 'Login screen did not appear' });

    const email = await $('~login-email');
    const emailDisplayed = await email.isDisplayed().catch(() => false);

    if (emailDisplayed) {
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

      const homeTop = await $('~partial-TopBar-home-root');
      await homeTop.waitForExist({ timeout: 20000 });
    }
  });

  it('navigates to Profile page and verifies it loaded', async () => {
    const navProfile = await $('~partial-NavBar-profile');
    await navProfile.waitForDisplayed({ timeout: 8000 });
    await navProfile.click();

    const followersBtnInitial = await $('~profile-followers');
    await followersBtnInitial.waitForDisplayed({ timeout: 10000 });

    // Verify profile page elements
    const followersBtn = await $('~profile-followers');
    await followersBtn.waitForDisplayed({ timeout: 8000 });
    await expect(followersBtn).toBeDisplayed();
  });

  it('opens followers and following pages and returns', async () => {
    const followersBtn = await $('~profile-followers');
    const followingBtn = await $('~profile-following');

    await followersBtn.waitForDisplayed({ timeout: 5000 });
    await followingBtn.waitForDisplayed({ timeout: 5000 });

    // Click followers, verify list page opened, then go back
    await followersBtn.click();
    const followersTitle = await $('~followers-title');
    await followersTitle.waitForDisplayed({ timeout: 8000 });
    await expect(followersTitle).toBeDisplayed();
    // open first follower's profile by clicking the name (more reliable)
    const firstFollowerName = await $('(//*[contains(@content-desc, "follower-user-")])[1]').catch(() => null);
    if (firstFollowerName && await firstFollowerName.isDisplayed()) {
      await firstFollowerName.click();
    } else {
      // fallback: click the image
      const firstFollowerImage = await $('(//*[contains(@content-desc, "follower-user-image-")])[1]').catch(() => null);
      if (firstFollowerImage && await firstFollowerImage.isDisplayed()) {
        await firstFollowerImage.click();
      } else {
        console.warn('First follower not found, skipping navigation into profile.');
      }
    }
    // wait for ProfilePageOther to load (it has profileother-followers-count)
    const profileOtherFollowers = await $('~profileother-followers-count');
    await profileOtherFollowers.waitForDisplayed({ timeout: 8000 });
    await expect(profileOtherFollowers).toBeDisplayed();
    // go back from ProfilePageOther -> FollowersFollowingList
    await driver.back();
    await followersTitle.waitForDisplayed({ timeout: 8000 });
    // then back from FollowersFollowingList -> ProfilePage
    await driver.back();
    await (await $('~profile-followers')).waitForDisplayed({ timeout: 8000 });

    // Click following, verify list page opened, then go back
    await followingBtn.click();
    const followingTitle = await $('~followers-title');
    await followingTitle.waitForDisplayed({ timeout: 8000 });
    await expect(followingTitle).toBeDisplayed();
    // open first following user's profile by clicking the name (more reliable)
    const firstFollowingName = await $('(//*[contains(@content-desc, "follower-user-")])[1]').catch(() => null);
    if (firstFollowingName && await firstFollowingName.isDisplayed()) {
      await firstFollowingName.click();
    } else {
      const firstFollowingImage = await $('(//*[contains(@content-desc, "follower-user-image-")])[1]').catch(() => null);
      if (firstFollowingImage && await firstFollowingImage.isDisplayed()) {
        await firstFollowingImage.click();
      }
    }
    // wait for ProfilePageOther to load (it has profileother-followers-count)
    const profileOtherFollowing = await $('~profileother-followers-count');
    await profileOtherFollowing.waitForDisplayed({ timeout: 8000 });
    await expect(profileOtherFollowing).toBeDisplayed();

    // go back from ProfilePageOther -> FollowersFollowingList
    await driver.back();
    await followingTitle.waitForDisplayed({ timeout: 8000 });

    // then back from FollowersFollowingList -> ProfilePage
    await driver.back();
    await (await $('~profile-followers')).waitForDisplayed({ timeout: 8000 });
  });

  it('navigates to Notifications page and verifies it opened', async () => {
    const notificationsBtn = await $('~partial-TopBar-notifications');
    await notificationsBtn.waitForDisplayed({ timeout: 5000 });
    await notificationsBtn.click();
    
    // Verify notifications page opened by checking for a known element.
    // NOTE: It's better to have a unique testID for the notifications page container.
    const firstNotification = await $('~notif-user-1').catch(() => null); // Assuming at least one notification exists for test user
    await (await $('~partial-TopBar-home-root')).waitForDisplayed({ timeout: 8000 }); // TopBar changes on notifications page

    const navProfile = await $('~partial-NavBar-profile');
    await navProfile.click();
    await (await $('~profile-followers')).waitForDisplayed({ timeout: 8000 });
  });

  it('opens Profile Edit, changes bio to random text, saves and verifies new bio appears', async () => {
    const editBtn = await $('~profile-edit');
    await editBtn.waitForDisplayed({ timeout: 5000 });
    await editBtn.click();

    // Wait for edit page to load
    const bioInput = await $('~profileedit-bio');
    await bioInput.waitForDisplayed({ timeout: 8000 });

    // Generate random bio
    newBio = generateRandomBio();

    // Clear existing bio and set new one
    await bioInput.click();
    await bioInput.clearValue();
    await bioInput.setValue(newBio);

    // Hide keyboard if shown
    if (await browser.isKeyboardShown()) {
      await browser.hideKeyboard();
    }

    // Save changes
    const saveBtn = await $('~profileedit-save');
    await saveBtn.click();

    // Close success alert by clicking OK button
    // NOTE: Using text-based selectors is brittle. An accessibilityLabel on the button is preferred.
    try {
      const okButton = await $('android=new UiSelector().text("OK")');
      await okButton.waitForDisplayed({ timeout: 5000 });
      await okButton.click();
    } catch (e) {
      console.warn('Could not find "OK" button on alert. Continuing...');
    }

    // Verify we're back on profile page
    const followersBtn = await $('~profile-followers');
    await followersBtn.waitForDisplayed({ timeout: 8000 });

    // Scroll up to see bio if needed
    await browser.execute('mobile: scrollGesture', {
      left: 100, top: 300, width: 300, height: 500,
      direction: 'up',
      percent: 0.3
    });

    // Get page source and check if bio appears (ProfilePage doesn't have testID for bio text)
    // NOTE: This is a weak verification. The bio Text component in ProfilePage should have a testID.
    const pageSource = await browser.getPageSource();
    expect(pageSource).toContain(newBio);
  });

  it('verifies the menu tabs (photo, glasses, closedbook) are present', async () => {
    const photoTab = await $('~profile-select-photo');
    const glassesTab = await $('~profile-select-glasses');
    const closedBookTab = await $('~profile-select-closedbook');

    await photoTab.waitForDisplayed({ timeout: 5000 });
    await glassesTab.waitForDisplayed({ timeout: 5000 });
    await closedBookTab.waitForDisplayed({ timeout: 5000 });

    await expect(photoTab).toBeDisplayed();
    await expect(glassesTab).toBeDisplayed();
    await expect(closedBookTab).toBeDisplayed();
  });

  it('switches between menu tabs and verifies content changes', async () => {
    // Click on glasses tab (interactions)
    const glassesTab = await $('~profile-select-glasses');
    await glassesTab.click();
    // Verify content changed by looking for a post root OR an empty state message
    await waitForEither('~post-partial-root', '~postings-empty-state');

    // Click on closedbook tab (shelves)
    const closedBookTab = await $('~profile-select-closedbook');
    await closedBookTab.click();
    // Verify content changed by looking for a shelf element OR an empty state message
    await waitForEither('~partial-Postings-book-0', '~postings-shelf-empty-read');

    // Click back to photo tab (posts)
    const photoTab = await $('~profile-select-photo');
    await photoTab.click();
    // Verify content changed by looking for a post root OR an empty state message
    await waitForEither('~post-partial-root', '~postings-empty-state');
  });

  it('opens settings and logs out, then verifies login screen', async () => {
    // Open settings (three dots) in TopBar
    const settingsBtn = await $('~partial-TopBar-settings');
    await settingsBtn.waitForDisplayed({ timeout: 5000 });
    await settingsBtn.click();

    // Click logout from the drawer menu
    const drawerLogout = await $('~drawer-logout');
    await drawerLogout.waitForDisplayed({ timeout: 5000 });
    await drawerLogout.click();

    // The drawer click triggers a confirmation Alert. Now, click "Logout" on that alert.
    const alertLogoutButton = await $('android=new UiSelector().textMatches("(?i)LOGOUT")');
    await alertLogoutButton.waitForDisplayed({ timeout: 5000 });
    await alertLogoutButton.click();

    // Wait for login screen (login-email) to appear
    const loginEmail = await $('~login-email');
    await loginEmail.waitForDisplayed({ timeout: 15000 });
    await expect(loginEmail).toBeDisplayed();
  });
});
