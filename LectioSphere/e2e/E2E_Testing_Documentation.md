# End-to-End Testing Documentation

## Test Plan

### Scope
This document outlines the end-to-end testing strategy for the application. The tests are designed to validate critical user workflows, ensuring the application functions correctly in real-world scenarios.

### Test Environment
- **Framework**: WebdriverIO + Appium
- **Platform**: Android (UiAutomator2)
- **Reporting**: Allure Reports
- **Device**: Physical Android device

### Test Artifacts
The following artifacts are created and maintained:
- Test specifications (`.e2e.js` files)
- Test reports (Allure HTML reports)
- Screenshots on failure
- Test execution logs

---

## Testing Objectives

### Testing Levels
- **System Testing**: All tests validate complete user workflows across multiple components and backend integration
- **Integration Testing**: Tests verify frontend-backend communication, data persistence, and navigation flows
- **UI Testing**: Tests ensure UI elements are accessible and respond correctly to user interactions

---

## Testing Process

### When Tests are Applied in SDLC

#### 1. **During Development** (Continuous)
- Tests should be written alongside feature implementation
- Tests run locally before committing code

#### 2. **Pre-Commit** 
```bash
npm run test-and-report
```
- Developers have to run E2E tests locally to catch regressions early
- Validates that new changes don't break existing workflows

#### 3. **Post-Deployment** (Regression Testing)
- Full E2E test suite runs after deployment to ensure:
  - All critical paths still work
  - Backend API changes are compatible
  - UI changes haven't broken accessibility selectors

#### 4. **Release Testing**
- Complete test suite execution before major releases
- Validation of cross-feature integration
- Performance observation during extended test runs

---

## Testing Methods

### 1. **End-to-End Testing**
**Description**: Testing complete user workflows from login to logout, validating the system as a whole.

**Implementation**:
- Tests interact with the app through the UI (accessibility labels)
- Backend state is modified and verified through UI actions

**Justification**: 
- Validates that all components work together correctly
- Catches integration issues between frontend and backend
- Ensures user experience is smooth and functional



### 2. **Regression Testing**
**Description**: Tests that run to ensure new changes don't break existing functionality.

**Implementation**:
- All E2E tests serve as regression tests
- Tests can be run before each commit or deployment

**Justification**:
- Rapid feature development requires confidence that old features still work
- Manual regression testing is time-consuming

### 3. **Positive Testing**
**Description**: Testing expected user behaviors with valid inputs.

**Implementation**:
```javascript
// Valid login credentials
await email.setValue('andreeadumitru.alex20@gmail.com');
await password.setValue('Qwert1234$');

// Valid book rating
await ratingInput.setValue('8');
```

**Justification**:
- Ensures happy paths work correctly
- Validates core functionality users will use most often

### 4. **Negative Testing** (Partial)
**Description**: Testing how the system handles invalid inputs or unexpected conditions.

**Implementation**:
```javascript
// Graceful handling when no content exists
if (!bookExists) {
  console.log('No books in "You May Like" section — skipping test');
  return;
}
```

**Justification**:
- Ensures app doesn't crash with empty states
- Validates error handling and edge cases

### 5. **State-Based Testing**
**Description**: Tests that verify state changes across multiple interactions.

**Justification**:
- Social features depend on state management
- Ensures UI reflects backend state changes correctly

### 6. **Data-Driven Testing**
**Description**: Tests that work with dynamic data.

**Implementation**:
```javascript
// Random search query generation
const randomLower = (len = 3) => {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < len; i++) 
    s += letters.charAt(Math.floor(Math.random() * letters.length));
  return s;
};
```

**Justification**:
- Each test run searches for different books
- Validates search functionality works with various inputs
- Reduces test data dependency

### 7. **Exploratory Testing Support**
**Description**: Tests that adapt to different app states.

**Justification**:
- UI can vary based on user preferences (reading sheet models)
- Tests discover and adapt to different configurations

### 8. **Cross-Feature Integration Testing**
**Description**: Tests that span multiple features/pages.

**Justification**:
- Real users perform workflows that span multiple features
- Validates data flows correctly between components
- Catches issues in feature boundaries

---

## Test Results and Observations

### Key Findings

#### 1. **Keyboard Handling Issues**
**Problem**: On Android, the on-screen keyboard often covers action buttons, causing tests to fail.


**Lesson**: Mobile E2E tests must account for keyboard visibility and implement multiple dismissal strategies.

#### 2. **Selector Robustness**
**Problem**: Initial tests used `testID` which wasn't accessible to Appium on Android.

**Solution**: Converted all selectors to use `accessibilityLabel`

**Lesson**: Use platform-appropriate accessibility selectors from the start.

#### 3. **Reading Sheet Model Variability**
**Problem**: Different users have different preferred reading sheet models.

**Solution**: Implemented fallback chain

**Lesson**: Tests must account for user preferences and configuration variability.

### Recommendations for Improvement

####

1. **Expand Test Coverage**:
   - Add negative test cases (invalid login, API errors)

2. **Improve Test Reliability**:
   - Implement custom wait functions for dynamic content


3. **Performance Testing**:
   - Add timing assertions for critical operations
   - Test with large data sets (many books, many posts)

---

## Conclusion

The E2E testing implementation for LectioSphere successfully validates critical user workflows and has already caught several integration issues during development. The tests provide confidence in deployment and serve as living documentation of expected application behavior.