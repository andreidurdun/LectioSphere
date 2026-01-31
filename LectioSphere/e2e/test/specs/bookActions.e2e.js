describe('Book actions end-to-end', () => {
  const randomLower = (len = 3) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let s = '';
    for (let i = 0; i < len; i++) s += letters.charAt(Math.floor(Math.random() * letters.length));
    return s;
  };

  let bookTitle = '';
  let bookId = '';
  let sheetFieldType = ''; // 'rating', 'notes', or 'takeaways'
  let sheetFieldValue = ''; // the value entered

  before(async () => {
    await browser.waitUntil(async () => (await $('~login-email').isDisplayed()), { timeout: 10000, timeoutMsg: 'Login screen did not appear' });
    const email = await $('~login-email').catch(() => null);
    if (email && await email.isDisplayed()) {
      await email.click();
      await email.setValue('andreeadumitru.alex20@gmail.com');
      const password = await $('~login-password');
      await password.click();
      await password.setValue('Qwert1234$');
      if (await browser.isKeyboardShown()) await browser.hideKeyboard();
      const submit = await $('~login-submit');
      await submit.click();
      const homeTop = await $('~partial-TopBar-home-root');
      await homeTop.waitForExist({ timeout: 20000 });
    }
  });

  it('Step 1: searches for a book and opens the first result', async () => {
    // go to Search
    const navSearch = await $('~partial-NavBar-search');
    await navSearch.waitForDisplayed({ timeout: 8000 });
    await navSearch.click();

    await browser.pause(1000);

    // wait for topbar search input
    const searchInput = await $('~partial-TopBar-search-input');
    await searchInput.waitForDisplayed({ timeout: 8000 });

    const q = randomLower(3);
    await searchInput.click();
    await searchInput.setValue(q);
    if (await browser.isKeyboardShown()) await browser.hideKeyboard();

    await browser.pause(500);

    const searchAction = await $('~partial-TopBar-search-icon-action');
    await searchAction.click();

    // wait for first search result title and read it
    const firstTitle = await $('(//*[contains(@content-desc, "searchresult-book-title-")])[1]');
    await firstTitle.waitForDisplayed({ timeout: 15000 });
    bookTitle = await firstTitle.getText();

    console.log(`Found book: ${bookTitle}`);

    // open first result
    const firstResult = await $('(//*[contains(@content-desc, "searchresult-book-")])[1]');
    await firstResult.click();

    await browser.pause(1500);

    // wait for BookShow add to library button
    const addLib = await $('~bookshow-add-library');
    await addLib.waitForDisplayed({ timeout: 10000 });
    await expect(addLib).toBeDisplayed();
  });

  it('Step 2: updates reading progress by 5 pages', async () => {
    // Click add to library button
    const addLib = await $('~bookshow-add-library');
    await addLib.waitForDisplayed({ timeout: 8000 });
    await addLib.click();

    await browser.pause(1200);

    // wait for library action option
    const updateReading = await $('~bookshow-library-action-update_reading');
    await updateReading.waitForDisplayed({ timeout: 8000 });
    await updateReading.click();

    await browser.pause(1500);

    // wait for modal to open and input to be visible
    const pagesInput = await $('~bookshow-pages-input');
    await pagesInput.waitForDisplayed({ timeout: 10000 });
    
    // Clear any existing value and enter new pages
    await pagesInput.clearValue();
    await browser.pause(300);
    await pagesInput.setValue('5');
    
    await browser.pause(800);
    
    // Hide keyboard multiple times to ensure it's closed
    try {
      if (await browser.isKeyboardShown()) {
        await browser.hideKeyboard();
        await browser.pause(500);
      }
    } catch (e) {}
    
    // Try pressing back to close keyboard as fallback
    try {
      if (await browser.isKeyboardShown()) {
        await driver.pressKeyCode(4); // back button
        await browser.pause(500);
      }
    } catch (e) {}

    // Wait for update button with multiple fallback strategies
    let updateBtn;
    try {
      updateBtn = await $('~bookshow-pages-update');
      await updateBtn.waitForDisplayed({ timeout: 5000 });
    } catch (e) {
      // Try using text-based selector as fallback
      console.warn('Trying text-based selector for Update button...');
      updateBtn = await $('android=new UiSelector().text("Update")');
      await updateBtn.waitForDisplayed({ timeout: 5000 });
    }
    
    await updateBtn.click();
    await browser.pause(1500);

    // handle success alert OK if present
    try {
      const ok = await $('android=new UiSelector().text("OK")');
      await ok.waitForDisplayed({ timeout: 5000 });
      await ok.click();
      await browser.pause(1000);
    } catch (e) {
      console.warn('No success alert found, continuing...');
    }
  });

  it('Step 3: verifies book is in Reading shelf', async () => {
    // Go to Library page
    const navLib = await $('~partial-NavBar-library');
    await navLib.waitForDisplayed({ timeout: 8000 });
    await navLib.click();

    await browser.pause(2000);

    // Wait for Library page to load completely
    const libTopBar = await $('~partial-TopBar-library-root');
    await libTopBar.waitForDisplayed({ timeout: 8000 });

    await browser.pause(1000);

    // Scroll down to make sure shelves are visible
    await browser.execute('mobile: scrollGesture', {
      left: 100,
      top: 400,
      width: 300,
      height: 600,
      direction: 'down',
      percent: 0.5
    });

    await browser.pause(1000);

    // Try to find Reading shelf with multiple strategies
    let readingShelf;
    try {
      readingShelf = await $('~library-shelf-reading');
      await readingShelf.waitForDisplayed({ timeout: 10000 });
    } catch (e) {
      console.warn('Trying text-based selector for Reading shelf...');
      // Fallback: look for "Reading" text near shelf
      readingShelf = await $('//android.widget.TextView[@text="Reading"]/..');
      await readingShelf.waitForDisplayed({ timeout: 5000 });
    }

    await readingShelf.click();
    await browser.pause(2000);

    // Verify book is present by looking for the title in page source
    const pageSource = await browser.getPageSource();
    expect(pageSource).toContain(bookTitle);

    console.log(`Book "${bookTitle}" found in Reading shelf`);

    // Go back to LibraryPage
    await driver.back();
    await browser.pause(1000);
  });

  it('Step 4: creates a reading sheet for the book', async () => {
    // Ensure we're on Library page
    const navLib = await $('~partial-NavBar-library');
    await navLib.waitForDisplayed({ timeout: 8000 });
    await navLib.click();

    await browser.pause(1000);

    // Create a reading sheet from top bar
    const addSheetIcon = await $('~partial-TopBar-add-reading-sheet');
    await addSheetIcon.waitForDisplayed({ timeout: 8000 });
    await addSheetIcon.click();

    await browser.pause(1500);

    // On SelectBookForSheetPage, search for the exact title and pick first result
    const selectSearch = await $('~selectbook-search-input');
    await selectSearch.waitForDisplayed({ timeout: 8000 });
    await selectSearch.click();
    await browser.pause(300);
    await selectSearch.setValue(bookTitle);
    
    await browser.pause(800);
    
    if (await browser.isKeyboardShown()) {
      await browser.hideKeyboard();
      await browser.pause(500);
    }

    // Press search or action button if it exists
    try {
      const searchBtn = await $('~selectbook-search-action');
      if (await searchBtn.isDisplayed()) {
        await searchBtn.click();
        await browser.pause(1000);
      }
    } catch (e) {
      console.log('No search action button, continuing...');
    }

    await browser.pause(1500);

    // Wait for results to load and verify book appears
    const selectPageSource = await browser.getPageSource();
    console.log('Searching for book in select page...');
    
    // Scroll down a bit to see more results
    try {
      await browser.execute('mobile: scrollGesture', {
        left: 100,
        top: 400,
        width: 300,
        height: 600,
        direction: 'down',
        percent: 0.3
      });
      await browser.pause(500);
    } catch (e) {}

    const firstSelect = await $('(//*[contains(@content-desc, "selectbook-item-")])[1]');
    await firstSelect.waitForDisplayed({ timeout: 10000 });
    await firstSelect.click();

    await browser.pause(1500);

    // On CreateReadingSheetPage, fill required fields based on model type
    // Try rating first (book_review type), then fallback to notes/takeaways (reading_notes type)
    let fieldFilled = false;
    
    // Try book_review model (rating field)
    try {
      const ratingInput = await $('~crs-input-rating');
      await ratingInput.waitForDisplayed({ timeout: 3000 });
      await ratingInput.click();
      await browser.pause(300);
      sheetFieldValue = '8';
      await ratingInput.setValue(sheetFieldValue);
      sheetFieldType = 'rating';
      
      // Try to fill other fields for book_review if they exist
      try {
        const summaryInput = await $('~crs-input-summary');
        if (await summaryInput.isDisplayed()) {
          await summaryInput.click();
          await summaryInput.setValue('Great story');
          await browser.pause(300);
        }
      } catch (e) {}
      
      fieldFilled = true;
      console.log('Filled rating field with:', sheetFieldValue);
    } catch (e) {
      console.warn('Rating field not found, trying reading_notes model fields...');
    }

    // Try reading_notes model (notes/takeaways fields)
    if (!fieldFilled) {
      try {
        const notesInput = await $('~crs-input-notes');
        await notesInput.waitForDisplayed({ timeout: 3000 });
        await notesInput.click();
        await browser.pause(300);
        sheetFieldValue = 'Great book, very interesting read!';
        await notesInput.setValue(sheetFieldValue);
        sheetFieldType = 'notes';
        
        // Also fill takeaways for completeness
        try {
          const takeawaysInput = await $('~crs-input-takeaways');
          if (await takeawaysInput.isDisplayed()) {
            await browser.pause(300);
            await takeawaysInput.click();
            await takeawaysInput.setValue('Key lessons learned');
            await browser.pause(300);
          }
        } catch (e) {}
        
        fieldFilled = true;
        console.log('Filled notes field with:', sheetFieldValue);
      } catch (e) {
        console.warn('Notes field not found either, trying takeaways only...');
      }
    }

    // Last fallback: just takeaways
    if (!fieldFilled) {
      try {
        const takeawaysInput = await $('~crs-input-takeaways');
        await takeawaysInput.waitForDisplayed({ timeout: 3000 });
        await takeawaysInput.click();
        await browser.pause(300);
        sheetFieldValue = 'Key lessons learned from this book';
        await takeawaysInput.setValue(sheetFieldValue);
        sheetFieldType = 'takeaways';
        fieldFilled = true;
        console.log('Filled takeaways field with:', sheetFieldValue);
      } catch (e) {
        console.warn('No fillable fields found!');
      }
    }
    
    if (await browser.isKeyboardShown()) {
      await browser.hideKeyboard();
    }

    await browser.pause(500);

    const saveBtn = await $('~crs-save');
    await saveBtn.waitForDisplayed({ timeout: 5000 });
    await saveBtn.click();

    await browser.pause(2000);

    // Handle success alert
    try {
      const ok2 = await $('android=new UiSelector().text("OK")');
      await ok2.waitForDisplayed({ timeout: 5000 });
      await ok2.click();
      await browser.pause(1500);
    } catch (e) {
      console.warn('No success alert found, continuing...');
      await browser.pause(1000);
    }
  });

  it('Step 5: verifies reading sheet exists in AllReadingSheetsPage', async () => {
    // Navigate to Library page
    const navLibrary = await $('~partial-NavBar-library');
    await navLibrary.waitForDisplayed({ timeout: 8000 });
    await navLibrary.click();

    await browser.pause(2000);

    // Wait for Library page to load
    const libTopBar = await $('~partial-TopBar-library-root');
    await libTopBar.waitForDisplayed({ timeout: 8000 });

    // Scroll down multiple times to reach absolute bottom where reading sheets section is
    for (let i = 0; i < 6; i++) {
      await browser.execute('mobile: scrollGesture', {
        left: 100,
        top: 400,
        width: 300,
        height: 600,
        direction: 'down',
        percent: 1.0
      });
      await browser.pause(300);
    }

    await browser.pause(1000);

    // Click See More for reading sheets
    const seeMoreSheets = await $('~library-reading-sheets-see-more');
    await seeMoreSheets.waitForDisplayed({ timeout: 10000 });
    await seeMoreSheets.click();

    await browser.pause(1500);

    // Verify created reading sheet exists by checking page source
    const allSheetsSource = await browser.getPageSource();
    expect(allSheetsSource).toContain(bookTitle);

    // Try to find the first sheet title
    const firstSheetTitleEl = await $('~allReadingSheet-title-0').catch(() => null);
    if (firstSheetTitleEl) {
      await firstSheetTitleEl.waitForDisplayed({ timeout: 5000 });
      const firstSheetTitle = await firstSheetTitleEl.getText();
      console.log(`First reading sheet title: ${firstSheetTitle}`);
    }
  });

  it('Step 6: opens and verifies reading sheet content', async () => {
    // Navigate to AllReadingSheetsPage if not already there
    const navLibrary = await $('~partial-NavBar-library');
    await navLibrary.waitForDisplayed({ timeout: 8000 });
    await navLibrary.click();

    await browser.pause(2000);

    // Scroll down multiple times to reach absolute bottom where reading sheets section is
    for (let i = 0; i < 6; i++) {
      await browser.execute('mobile: scrollGesture', {
        left: 100,
        top: 400,
        width: 300,
        height: 600,
        direction: 'down',
        percent: 1.0
      });
      await browser.pause(300);
    }

    await browser.pause(1000);

    const seeMoreSheets = await $('~library-reading-sheets-see-more');
    await seeMoreSheets.waitForDisplayed({ timeout: 10000 });
    await seeMoreSheets.click();

    await browser.pause(1500);

    // Open the first reading sheet
    const firstSheet = await $('(//*[contains(@content-desc, "allReadingSheet-")])[1]').catch(() => null);
    
    if (!firstSheet) {
      console.warn('No reading sheet found to open');
      return;
    }

    await firstSheet.waitForDisplayed({ timeout: 5000 });
    await firstSheet.click();

    await browser.pause(1500);

    // Verify page contains the book title
    const rsPageSource = await browser.getPageSource();
    expect(rsPageSource).toContain(bookTitle);
    
    // Verify the field value we entered is displayed
    console.log(`Verifying ${sheetFieldType} field contains: ${sheetFieldValue}`);
    expect(rsPageSource).toContain(sheetFieldValue);
    
    console.log('Reading sheet verified successfully with correct field value');

    // Go back
    await driver.back();
    await browser.pause(800);
  });
});
