describe('Auth + Navigation flow', () => {
  const exists = async (selector, timeout = 5000) => {
    try {
      const el = await $(selector);
      await el.waitForDisplayed({ timeout });
      return true;
    } catch (e) {
      return false;
    }
  };

  it('performs login if needed and lands on Home', async () => {
    await browser.pause(3000); 

    const email = await $('~login-email');
    if (await email.isDisplayed()) {
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
    }

    const homeTop = await $('~partial-TopBar-home-root');
    await homeTop.waitForExist({ timeout: 20000 }); 
    await expect(homeTop).toBeDisplayed();
});

  it('opens first book from You May Like and verifies BookShow page', async () => {
    // Wait for home to be ready
    const homeTop = await $('~partial-TopBar-home-root');
    await homeTop.waitForDisplayed({ timeout: 10000 });

    // Scroll down a bit to ensure "You May Like" section is visible
    await browser.execute('mobile: scrollGesture', {
      left: 100, top: 500, width: 300, height: 800,
      direction: 'down',
      percent: 0.5
    });

    await browser.pause(1000);

    // Check if first "You May Like" book exists
    const firstBook = await $('~home-youmaylike-book-0');
    const bookExists = await firstBook.isDisplayed().catch(() => false);
    
    if (!bookExists) {
      console.log('No books in "You May Like" section — skipping test');
      return;
    }

    // Click first book
    await firstBook.click();
    await browser.pause(2000);

    // Verify BookShow page opened by checking for add-to-library button
    const bookShowAddLib = await $('~bookshow-add-library');
    await bookShowAddLib.waitForDisplayed({ timeout: 10000 });
    await expect(bookShowAddLib).toBeDisplayed();
  });

  it('scrolls to Events section, goes back, clicks first event and verifies EventPage', async () => {
    // Navigate back to home if needed
    const navHome = await $('~partial-NavBar-home');
    await navHome.click();
    await browser.pause(1500);

    // Scroll down to Events section
    await browser.execute('mobile: scrollGesture', {
      left: 100, top: 500, width: 300, height: 800,
      direction: 'down',
      percent: 1.5
    });
    await browser.pause(1000);

    // Verify Events header is visible
    const eventsHeader = await $('~home-events-header');
    await eventsHeader.waitForDisplayed({ timeout: 8000 });
    await expect(eventsHeader).toBeDisplayed();

    // Scroll back up to see first event clearly
    await browser.execute('mobile: scrollGesture', {
      left: 100, top: 500, width: 300, height: 800,
      direction: 'up',
      percent: 0.3
    });
    await browser.pause(1000);

    // Check if first event exists
    const firstEvent = await $('~home-event-0');
    const eventExists = await firstEvent.isDisplayed().catch(() => false);

    if (!eventExists) {
      console.log('No events available — skipping test');
      return;
    }

    // Click first event
    await firstEvent.click();
    await browser.pause(2000);

    // Verify EventPage opened by checking for event-title element
    const eventTitle = await $('~event-title');
    await eventTitle.waitForDisplayed({ timeout: 10000 });
    await expect(eventTitle).toBeDisplayed();
  });
});
